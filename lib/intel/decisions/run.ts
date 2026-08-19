import 'server-only'

import { DETECTORS } from '@/lib/intel/decisions/detectors'
import { loadGroupingForSpan } from '@/lib/intel/decisions/grouping'
import type { DetectorInput, Finding } from '@/lib/intel/decisions/types'
import {
  addUtcDays,
  isIsoDate,
  priorSpan,
  SEARCH_RANGE_DAYS,
  spanEndingOn,
} from '@/lib/intel/search-params'
import { createSupabaseServiceRole } from '@/lib/supabase/service'

const WINDOW_DAYS = SEARCH_RANGE_DAYS['28d']

export type RunDecisionDetectorsResult = {
  status: 'success' | 'partial' | 'failed'
  findings: number
  message?: string
}

type ServiceClient = ReturnType<typeof createSupabaseServiceRole>

type ExistingKey = {
  detector: string
  emissionKey: string
}

function readField(value: object, key: string): unknown {
  return Reflect.get(value, key)
}

function asIsoDate(value: unknown): string | null {
  if (typeof value !== 'string' || !isIsoDate(value)) {
    return null
  }
  return value
}

function utcToday(): string {
  return new Date().toISOString().slice(0, 10)
}

function completedPeriodEnd(latest: string): string {
  const today = utcToday()
  if (latest >= today) {
    return addUtcDays(today, -1)
  }
  return latest
}

async function fetchLatestSiteDate(
  supabase: ServiceClient,
): Promise<string | null | 'error'> {
  const { data, error } = await supabase
    .from('gsc_site_daily')
    .select('date')
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return 'error'
  }
  if (data === null) {
    return null
  }
  return asIsoDate(readField(data, 'date')) ?? 'error'
}

async function fetchCoverageStartedOn(
  supabase: ServiceClient,
): Promise<string | null | 'error'> {
  const { data, error } = await supabase
    .from('provider_coverage')
    .select('started_on')
    .eq('provider', 'gsc')
    .limit(1)
    .maybeSingle()

  if (error) {
    return 'error'
  }
  if (data === null) {
    return null
  }
  return asIsoDate(readField(data, 'started_on'))
}

function toExistingKey(value: unknown): ExistingKey | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }
  const detector = readField(value, 'detector')
  const emissionKey = readField(value, 'emission_key')
  if (typeof detector !== 'string' || detector.length === 0) {
    return null
  }
  if (typeof emissionKey !== 'string' || emissionKey.length === 0) {
    return null
  }
  return { detector, emissionKey }
}

function existingKeySet(data: unknown): Set<string> | null {
  if (data === null || data === undefined) {
    return new Set()
  }
  if (!Array.isArray(data)) {
    return null
  }
  const keys = new Set<string>()
  for (const row of data) {
    const parsed = toExistingKey(row)
    if (parsed === null) {
      return null
    }
    keys.add(`${parsed.detector}\t${parsed.emissionKey}`)
  }
  return keys
}

function pairKey(detector: string, emissionKey: string): string {
  return `${detector}\t${emissionKey}`
}

async function persistFindings(
  supabase: ServiceClient,
  detector: string,
  findings: readonly Finding[],
  periodStart: string,
  periodEnd: string,
): Promise<number | null> {
  if (findings.length === 0) {
    return 0
  }

  const emissionKeys = findings.map((finding) => finding.emissionKey)
  const existingResult = await supabase
    .from('decision_items')
    .select('detector, emission_key')
    .eq('detector', detector)
    .in('emission_key', emissionKeys)

  if (existingResult.error) {
    return null
  }

  const existing = existingKeySet(existingResult.data)
  if (existing === null) {
    return null
  }

  const now = new Date().toISOString()
  const toInsert: Array<Record<string, unknown>> = []
  const toUpdate: Finding[] = []

  for (const finding of findings) {
    if (existing.has(pairKey(detector, finding.emissionKey))) {
      toUpdate.push(finding)
    } else {
      toInsert.push({
        detector,
        emission_key: finding.emissionKey,
        category: finding.category,
        title: finding.title,
        description: finding.description,
        evidence_json: finding.evidence,
        related_url: finding.relatedUrl ?? null,
        recommended_action: finding.recommendedAction ?? null,
        confidence: finding.confidence,
        score: finding.score,
        period_start: periodStart,
        period_end: periodEnd,
        updated_at: now,
      })
    }
  }

  let saved = 0

  if (toInsert.length > 0) {
    const inserted = await supabase.from('decision_items').insert(toInsert)
    if (inserted.error) {
      return null
    }
    saved += toInsert.length
  }

  for (const finding of toUpdate) {
    const updated = await supabase
      .from('decision_items')
      .update({
        score: finding.score,
        evidence_json: finding.evidence,
        description: finding.description,
        updated_at: now,
      })
      .eq('detector', detector)
      .eq('emission_key', finding.emissionKey)

    if (updated.error) {
      return null
    }
    saved += 1
  }

  return saved
}

export async function runDecisionDetectors(): Promise<RunDecisionDetectorsResult> {
  try {
    const supabase = createSupabaseServiceRole()

    const [latestDate, coverageStartedOn] = await Promise.all([
      fetchLatestSiteDate(supabase),
      fetchCoverageStartedOn(supabase),
    ])

    if (latestDate === 'error' || coverageStartedOn === 'error') {
      console.error('Decision detectors failed')
      return { status: 'failed', findings: 0, message: 'Unable to load GSC coverage.' }
    }

    if (latestDate === null) {
      return {
        status: 'success',
        findings: 0,
        message: 'No completed GSC days available.',
      }
    }

    const periodEnd = completedPeriodEnd(latestDate)
    const span = spanEndingOn(periodEnd, WINDOW_DAYS)
    const prior = priorSpan(span)
    const comparisonAvailable =
      coverageStartedOn !== null && prior.start >= coverageStartedOn

    const grouping = await loadGroupingForSpan(span)
    if (grouping === null) {
      console.error('Decision detectors failed')
      return { status: 'failed', findings: 0, message: 'Unable to load GSC rows.' }
    }

    const input: DetectorInput = {
      periodStart: span.start,
      periodEnd: span.end,
      priorStart: prior.start,
      priorEnd: prior.end,
      groups: grouping.groups,
      groupedRows: grouping.groupedRows,
      siteDaily: grouping.siteDaily,
      queries: grouping.queries,
      comparisonAvailable,
    }

    let findings = 0
    let detectFailed = false
    let persistFailed = false

    for (const detector of DETECTORS) {
      if (detector.needsComparison && !comparisonAvailable) {
        continue
      }

      let detected: Finding[]
      try {
        detected = detector.detect(input)
      } catch {
        detectFailed = true
        continue
      }

      const saved = await persistFindings(
        supabase,
        detector.name,
        detected,
        span.start,
        span.end,
      )
      if (saved === null) {
        persistFailed = true
        continue
      }
      findings += saved
    }

    if (detectFailed && persistFailed && findings === 0) {
      console.error('Decision detectors failed')
      return { status: 'failed', findings: 0, message: 'Detectors failed to run.' }
    }

    if (detectFailed || persistFailed) {
      return {
        status: 'partial',
        findings,
        message: 'Some detectors or writes did not complete.',
      }
    }

    return { status: 'success', findings }
  } catch {
    console.error('Decision detectors failed')
    return { status: 'failed', findings: 0, message: 'Decision run failed.' }
  }
}
