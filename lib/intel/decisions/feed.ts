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

const EMISSION_COLUMNS = [
  'finding_key',
  'detector',
  'category',
  'title',
  'description',
  'evidence_json',
  'related_url',
  'recommended_action',
  'confidence',
  'score',
  'period_start',
  'period_end',
  'created_at',
].join(', ')

const STATE_COLUMNS = [
  'finding_key',
  'status',
  'result_note',
  'completed_at',
].join(', ')

export type DecisionFeedItem = {
  findingKey: string
  detector: string
  category: DecisionCategory
  title: string
  description: string
  evidence: Record<string, unknown>
  relatedUrl: string | null
  recommendedAction: string | null
  confidence: DecisionConfidence
  status: DecisionStatus
  resultNote: string | null
  completedAt: string | null
  periodStart: string
  periodEnd: string
  createdAt: string
}

export type DecisionFeedSection = {
  category: DecisionCategory
  items: DecisionFeedItem[]
}

export type FetchDecisionFeedResult =
  | {
      ok: true
      sections: DecisionFeedSection[]
      total: number
      hiddenCount: number
    }
  | { ok: false }

function readField(value: object, key: string): unknown {
  return Reflect.get(value, key)
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

type ParsedEmission = {
  findingKey: string
  detector: string
  category: DecisionCategory
  title: string
  description: string
  evidence: Record<string, unknown>
  relatedUrl: string | null
  recommendedAction: string | null
  confidence: DecisionConfidence
  score: number
  periodStart: string
  periodEnd: string
  createdAt: string
}

type RankedItem = {
  item: DecisionFeedItem
  effectiveScore: number
}

function toEmission(value: unknown): ParsedEmission | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const findingKey = readField(value, 'finding_key')
  const detector = readField(value, 'detector')
  const category = readField(value, 'category')
  const title = readField(value, 'title')
  const description = readField(value, 'description')
  const confidence = readField(value, 'confidence')
  const score = asFiniteNumber(readField(value, 'score'))
  const periodStart = asIsoDateValue(readField(value, 'period_start'))
  const periodEnd = asIsoDateValue(readField(value, 'period_end'))
  const createdAt = asIsoTimestamp(readField(value, 'created_at'))

  if (typeof findingKey !== 'string' || findingKey.length === 0) {
    return null
  }
  if (typeof detector !== 'string' || detector.length === 0) {
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
  if (score === null || periodStart === null || periodEnd === null) {
    return null
  }
  if (createdAt === null) {
    return null
  }

  return {
    findingKey,
    detector,
    category,
    title,
    description,
    evidence: asEvidence(readField(value, 'evidence_json')),
    relatedUrl: asOptionalText(readField(value, 'related_url')),
    recommendedAction: asOptionalText(readField(value, 'recommended_action')),
    confidence,
    score,
    periodStart,
    periodEnd,
    createdAt,
  }
}

type FindingStateRow = {
  findingKey: string
  status: DecisionStatus
  resultNote: string | null
  completedAt: string | null
}

function toFindingState(value: unknown): FindingStateRow | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const findingKey = readField(value, 'finding_key')
  const status = readField(value, 'status')
  if (typeof findingKey !== 'string' || findingKey.length === 0) {
    return null
  }
  if (typeof status !== 'string' || !isDecisionStatus(status)) {
    return null
  }

  return {
    findingKey,
    status,
    resultNote: asOptionalText(readField(value, 'result_note')),
    completedAt: asIsoTimestamp(readField(value, 'completed_at')),
  }
}

function latestEmissionPerFinding(
  emissions: readonly ParsedEmission[],
): ParsedEmission[] {
  const sorted = [...emissions].sort((left, right) => {
    if (right.periodEnd !== left.periodEnd) {
      return right.periodEnd.localeCompare(left.periodEnd)
    }
    return right.createdAt.localeCompare(left.createdAt)
  })

  const latest: ParsedEmission[] = []
  const seen = new Set<string>()
  for (const emission of sorted) {
    if (seen.has(emission.findingKey)) {
      continue
    }
    seen.add(emission.findingKey)
    latest.push(emission)
  }
  return latest
}

function toRankedItem(
  emission: ParsedEmission,
  state: FindingStateRow,
): RankedItem | null {
  const createdMs = Date.parse(emission.createdAt)
  if (Number.isNaN(createdMs)) {
    return null
  }

  const daysSinceCreated = Math.max(0, (Date.now() - createdMs) / 86_400_000)
  const effectiveScore =
    emission.score * Math.exp(-daysSinceCreated / DECISION_NOVELTY_TAU_DAYS)

  return {
    effectiveScore,
    item: {
      findingKey: emission.findingKey,
      detector: emission.detector,
      category: emission.category,
      title: emission.title,
      description: emission.description,
      evidence: emission.evidence,
      relatedUrl: emission.relatedUrl,
      recommendedAction: emission.recommendedAction,
      confidence: emission.confidence,
      status: state.status,
      resultNote: state.resultNote,
      completedAt: state.completedAt,
      periodStart: emission.periodStart,
      periodEnd: emission.periodEnd,
      createdAt: emission.createdAt,
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

export type FetchDecisionFeedOptions = {
  includeHidden?: boolean
}

export async function fetchDecisionFeed(
  options: FetchDecisionFeedOptions = {},
): Promise<FetchDecisionFeedResult> {
  const includeHidden = options.includeHidden === true
  try {
    const supabase = createSupabaseServiceRole()
    const [emissionsResult, statesResult] = await Promise.all([
      supabase
        .from('decision_items')
        .select(EMISSION_COLUMNS)
        .order('period_end', { ascending: false }),
      supabase.from('finding_state').select(STATE_COLUMNS),
    ])

    if (emissionsResult.error || statesResult.error) {
      console.error('Intel decision feed query failed')
      return { ok: false }
    }

    if (!Array.isArray(emissionsResult.data) || !Array.isArray(statesResult.data)) {
      return { ok: false }
    }

    const emissions: ParsedEmission[] = []
    for (const row of emissionsResult.data) {
      const parsed = toEmission(row)
      if (parsed) {
        emissions.push(parsed)
      }
    }

    const stateByKey = new Map<string, FindingStateRow>()
    for (const row of statesResult.data) {
      const parsed = toFindingState(row)
      if (parsed) {
        stateByKey.set(parsed.findingKey, parsed)
      }
    }

    const ranked: RankedItem[] = []
    let hiddenCount = 0
    let missingState = 0
    const latest = latestEmissionPerFinding(emissions)
    for (const emission of latest) {
      const state = stateByKey.get(emission.findingKey)
      if (state === undefined) {
        missingState += 1
        continue
      }
      if (isHiddenDecisionStatus(state.status)) {
        hiddenCount += 1
        if (!includeHidden) {
          continue
        }
      }
      const rankedItem = toRankedItem(emission, state)
      if (rankedItem) {
        ranked.push(rankedItem)
      }
    }

    if (missingState > 0) {
      console.error('Intel decision feed missing finding_state rows')
    }
    if (latest.length > 0 && missingState === latest.length) {
      return { ok: false }
    }

    const sections = groupSections(ranked)
    return {
      ok: true,
      sections,
      total: ranked.length,
      hiddenCount,
    }
  } catch {
    console.error('Intel decision feed query failed')
    return { ok: false }
  }
}
