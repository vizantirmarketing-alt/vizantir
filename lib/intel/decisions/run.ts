import 'server-only'

import { DETECTORS } from '@/lib/intel/decisions/detectors'
import { loadGroupingForSpan } from '@/lib/intel/decisions/grouping'
import {
  findingKeyFor,
  type DetectorInput,
  type Finding,
} from '@/lib/intel/decisions/types'
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

async function ensureFindingState(
  supabase: ServiceClient,
  findingKeys: readonly string[],
): Promise<boolean> {
  if (findingKeys.length === 0) {
    return true
  }

  const unique = [...new Set(findingKeys)]
  const upserted = await supabase.from('finding_state').upsert(
    unique.map((finding_key) => ({ finding_key })),
    { onConflict: 'finding_key', ignoreDuplicates: true },
  )

  return upserted.error === null
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

  const keyed = findings.map((finding) => ({
    finding,
    findingKey: findingKeyFor(detector, finding.emissionKey),
  }))

  const parentsReady = await ensureFindingState(
    supabase,
    keyed.map((row) => row.findingKey),
  )
  if (!parentsReady) {
    return null
  }

  const emissionKeys = keyed.map((row) => row.finding.emissionKey)
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
  const toUpdate: Array<{ finding: Finding; findingKey: string }> = []

  for (const row of keyed) {
    if (existing.has(pairKey(detector, row.finding.emissionKey))) {
      toUpdate.push(row)
    } else {
      toInsert.push({
        detector,
        emission_key: row.finding.emissionKey,
        finding_key: row.findingKey,
        category: row.finding.category,
        title: row.finding.title,
        description: row.finding.description,
        evidence_json: row.finding.evidence,
        related_url: row.finding.relatedUrl ?? null,
        recommended_action: row.finding.recommendedAction ?? null,
        confidence: row.finding.confidence,
        score: row.finding.score,
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

  for (const row of toUpdate) {
    const updated = await supabase
      .from('decision_items')
      .update({
        finding_key: row.findingKey,
        score: row.finding.score,
        evidence_json: row.finding.evidence,
        description: row.finding.description,
        updated_at: now,
      })
      .eq('detector', detector)
      .eq('emission_key', row.finding.emissionKey)

    if (updated.error) {
      return null
    }
    saved += 1
  }

  return saved
}

type DetectorFailure = {
  reason: 'upsert_error' | 'exception'
  status?: number
}

export async function runDecisionDetectors(): Promise<RunDecisionDetectorsResult> {
  let runId: number | null = null
  let findings = 0
  let dataThroughDate: string | null = null

  try {
    const supabase = createSupabaseServiceRole()

    const inserted = await supabase
      .from('sync_runs')
      .insert({ provider: 'decisions', status: 'running' })
      .select('id')
      .single()

    runId = readNumericId(inserted.data)
    if (inserted.error || runId === null) {
      return {
        status: 'failed',
        findings: 0,
        message: 'Failed to record sync run',
      }
    }

    const [latestDate, coverageStartedOn] = await Promise.all([
      fetchLatestSiteDate(supabase),
      fetchCoverageStartedOn(supabase),
    ])

    if (latestDate === 'error' || coverageStartedOn === 'error') {
      console.error('Decision detectors failed')
      const message = 'Unable to load GSC coverage.'
      await finishRun(supabase, runId, {
        status: 'failed',
        recordsProcessed: 0,
        dataThroughDate,
        message,
      })
      return { status: 'failed', findings: 0, message }
    }

    if (latestDate === null) {
      const message = 'No completed GSC days available.'
      await finishRun(supabase, runId, {
        status: 'success',
        recordsProcessed: 0,
        dataThroughDate,
        message,
      })
      return {
        status: 'success',
        findings: 0,
        message,
      }
    }

    const periodEnd = completedPeriodEnd(latestDate)
    dataThroughDate = periodEnd
    const span = spanEndingOn(periodEnd, WINDOW_DAYS)
    const prior = priorSpan(span)
    const comparisonAvailable =
      coverageStartedOn !== null && prior.start >= coverageStartedOn

    const grouping = await loadGroupingForSpan(span)
    if (grouping === null) {
      console.error('Decision detectors failed')
      const message = 'Unable to load GSC rows.'
      await finishRun(supabase, runId, {
        status: 'failed',
        recordsProcessed: 0,
        dataThroughDate,
        message,
      })
      return { status: 'failed', findings: 0, message }
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

    const failedSets: string[] = []
    let attempted = 0

    for (const detector of DETECTORS) {
      if (detector.needsComparison && !comparisonAvailable) {
        continue
      }

      attempted += 1

      try {
        const detected = detector.detect(input)
        const saved = await persistFindings(
          supabase,
          detector.name,
          detected,
          span.start,
          span.end,
        )
        if (saved === null) {
          failedSets.push(
            formatFailedDetector(detector.name, { reason: 'upsert_error' }),
          )
          continue
        }
        findings += saved
      } catch {
        failedSets.push(
          formatFailedDetector(detector.name, { reason: 'exception' }),
        )
      }
    }

    const status: RunDecisionDetectorsResult['status'] =
      failedSets.length === 0
        ? 'success'
        : failedSets.length === attempted
          ? 'failed'
          : 'partial'

    if (status === 'failed') {
      console.error('Decision detectors failed')
    }

    const message =
      failedSets.length > 0
        ? `Failed detectors: ${failedSets.join('; ')}`
        : undefined

    await finishRun(supabase, runId, {
      status,
      recordsProcessed: findings,
      dataThroughDate,
      message,
    })

    return { status, findings, message }
  } catch {
    console.error('Decision detectors failed')
    if (runId !== null) {
      try {
        const supabase = createSupabaseServiceRole()
        await finishRun(supabase, runId, {
          status: 'failed',
          recordsProcessed: findings,
          dataThroughDate,
          message: 'Decision run failed.',
        })
      } catch {
        // Swallow so the function never throws.
      }
    }

    return { status: 'failed', findings: 0, message: 'Decision run failed.' }
  }
}

async function finishRun(
  supabase: ServiceClient,
  runId: number,
  result: {
    status: RunDecisionDetectorsResult['status']
    recordsProcessed: number
    dataThroughDate: string | null
    message?: string
  },
): Promise<void> {
  await supabase
    .from('sync_runs')
    .update({
      status: result.status,
      completed_at: new Date().toISOString(),
      records_processed: result.recordsProcessed,
      data_through_date: result.dataThroughDate,
      administrator_message: result.message ?? null,
      error_code: result.status === 'success' ? null : result.status,
    })
    .eq('id', runId)
}

function formatFailedDetector(
  label: string,
  failure: Pick<DetectorFailure, 'reason' | 'status'>,
): string {
  if (failure.status === undefined) {
    return `${label} (${failure.reason})`
  }
  return `${label} (${failure.reason} ${failure.status})`
}

function readNumericId(value: unknown): number | null {
  if (typeof value !== 'object' || value === null || !('id' in value)) {
    return null
  }
  const id = value.id
  if (typeof id === 'number' && Number.isFinite(id)) {
    return id
  }
  if (typeof id === 'string' && /^\d+$/.test(id)) {
    return Number(id)
  }
  return null
}
