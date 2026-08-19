import 'server-only'

import {
  DECISION_CATEGORIES,
  DECISION_NOVELTY_TAU_DAYS,
  isDecisionCategory,
  isDecisionConfidence,
  isDecisionStatus,
  isHiddenDecisionStatus,
  type DecisionCategory,
  type DecisionConfidence,
  type DecisionStatus,
} from '@/lib/intel/decision-params'
import { isIsoDate } from '@/lib/intel/search-params'
import { createSupabaseServiceRole } from '@/lib/supabase/service'

const FEED_COLUMNS = [
  'id',
  'detector',
  'category',
  'title',
  'description',
  'evidence_json',
  'related_url',
  'recommended_action',
  'confidence',
  'score',
  'status',
  'period_start',
  'period_end',
  'created_at',
].join(', ')

export type DecisionFeedItem = {
  id: string
  detector: string
  category: DecisionCategory
  title: string
  description: string
  evidence: Record<string, unknown>
  relatedUrl: string | null
  recommendedAction: string | null
  confidence: DecisionConfidence
  status: DecisionStatus
  periodStart: string
  periodEnd: string
  createdAt: string
}

export type DecisionFeedSection = {
  category: DecisionCategory
  items: DecisionFeedItem[]
}

export type FetchDecisionFeedResult =
  | { ok: true; sections: DecisionFeedSection[]; total: number }
  | { ok: false }

function readField(value: object, key: string): unknown {
  return Reflect.get(value, key)
}

function asPositiveInt(value: unknown): number | null {
  if (typeof value === 'bigint') {
    if (value < BigInt(1) || value > BigInt(Number.MAX_SAFE_INTEGER)) {
      return null
    }
    return Number(value)
  }
  if (typeof value === 'number' && Number.isFinite(value) && value >= 1) {
    const rounded = Math.round(value)
    if (Number.isSafeInteger(rounded) && Math.abs(value - rounded) < 1e-9) {
      return rounded
    }
    return null
  }
  if (typeof value === 'string' && /^[1-9]\d*$/.test(value)) {
    const parsed = Number(value)
    if (Number.isSafeInteger(parsed)) {
      return parsed
    }
  }
  return null
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return null
}

function asIsoDateValue(value: unknown): string | null {
  if (typeof value !== 'string' || !isIsoDate(value)) {
    return null
  }
  return value
}

function asIsoTimestamp(value: unknown): string | null {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    return null
  }
  return value
}

function asOptionalText(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function asEvidence(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {}
  }
  return { ...value }
}

type RankedItem = {
  item: DecisionFeedItem
  effectiveScore: number
}

function toFeedItem(value: unknown): RankedItem | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const id = asPositiveInt(readField(value, 'id'))
  const detector = readField(value, 'detector')
  const category = readField(value, 'category')
  const title = readField(value, 'title')
  const description = readField(value, 'description')
  const confidence = readField(value, 'confidence')
  const status = readField(value, 'status')
  const score = asFiniteNumber(readField(value, 'score'))
  const periodStart = asIsoDateValue(readField(value, 'period_start'))
  const periodEnd = asIsoDateValue(readField(value, 'period_end'))
  const createdAt = asIsoTimestamp(readField(value, 'created_at'))

  if (id === null || typeof detector !== 'string' || detector.length === 0) {
    return null
  }
  if (typeof category !== 'string' || !isDecisionCategory(category)) {
    return null
  }
  if (typeof title !== 'string' || typeof description !== 'string') {
    return null
  }
  if (typeof confidence !== 'string' || !isDecisionConfidence(confidence)) {
    return null
  }
  if (typeof status !== 'string' || !isDecisionStatus(status)) {
    return null
  }
  if (isHiddenDecisionStatus(status)) {
    return null
  }
  if (score === null || periodStart === null || periodEnd === null) {
    return null
  }
  if (createdAt === null) {
    return null
  }

  const createdMs = Date.parse(createdAt)
  if (Number.isNaN(createdMs)) {
    return null
  }

  const daysSinceCreated = Math.max(0, (Date.now() - createdMs) / 86_400_000)
  const effectiveScore =
    score * Math.exp(-daysSinceCreated / DECISION_NOVELTY_TAU_DAYS)

  return {
    effectiveScore,
    item: {
      id: String(id),
      detector,
      category,
      title,
      description,
      evidence: asEvidence(readField(value, 'evidence_json')),
      relatedUrl: asOptionalText(readField(value, 'related_url')),
      recommendedAction: asOptionalText(readField(value, 'recommended_action')),
      confidence,
      status,
      periodStart,
      periodEnd,
      createdAt,
    },
  }
}

function groupSections(ranked: RankedItem[]): DecisionFeedSection[] {
  const sorted = [...ranked].sort((left, right) => {
    if (right.effectiveScore !== left.effectiveScore) {
      return right.effectiveScore - left.effectiveScore
    }
    return right.item.createdAt.localeCompare(left.item.createdAt)
  })

  return DECISION_CATEGORIES.flatMap((category) => {
    const items = sorted
      .filter((row) => row.item.category === category)
      .map((row) => row.item)
    if (items.length === 0) {
      return []
    }
    return [{ category, items }]
  })
}

export async function fetchDecisionFeed(): Promise<FetchDecisionFeedResult> {
  try {
    const supabase = createSupabaseServiceRole()
    const { data, error } = await supabase
      .from('decision_items')
      .select(FEED_COLUMNS)
      .not('status', 'in', '(completed,dismissed)')

    if (error) {
      console.error('Intel decision feed query failed')
      return { ok: false }
    }

    if (!Array.isArray(data)) {
      return { ok: false }
    }

    const ranked: RankedItem[] = []
    for (const row of data) {
      const parsed = toFeedItem(row)
      if (parsed) {
        ranked.push(parsed)
      }
    }

    const sections = groupSections(ranked)
    return {
      ok: true,
      sections,
      total: ranked.length,
    }
  } catch {
    console.error('Intel decision feed query failed')
    return { ok: false }
  }
}
