/**
 * Measured performance for an existing prospect. No direct I/O: the store and
 * the PageSpeed call are injected, so this is testable without a database or
 * network (lib/prospects/measure.test.ts).
 *
 * The caller supplies only a domain. The domain must already belong to a
 * prospect; arbitrary URLs are never measured. The rating for the performance
 * factor is derived here from the PageSpeed score, and fit, opportunity and
 * confidence are recomputed with the rubric. Nothing about the rating or the
 * scores is accepted from the caller.
 *
 * Measuring is not re-research: the prospect keeps its stored rubric
 * version. Weights and the rating map are identical across versions, so the
 * recomputed scores are valid under the stored version.
 *
 * Evidence rows require a run id. The measurement is attached to the
 * prospect's latest run, so a later re-ingest of that run replaces it along
 * with the rest of that run's evidence and resets the factor to whatever the
 * runner submits.
 */

import { z } from 'zod'

import { normalizeDomain } from '@/lib/prospects/domain'
import { isUuid } from '@/lib/prospects/params'
import type { EvidenceWrite } from '@/lib/prospects/ingest'
import {
  scoreProspect,
  type FactorRatings,
  type ProspectConfidence,
  type ProspectFactor,
  type ProspectRating,
} from '@/lib/prospects/rubric'

export const PERFORMANCE_FACTOR: ProspectFactor = 'performance_technical_issues'

/** Below this mobile performance score the issues are strong. */
export const PERFORMANCE_STRONG_BELOW = 50
/** At or above this score there is no performance opportunity. */
export const PERFORMANCE_NONE_FROM = 90

/**
 * Maps a 0-100 mobile performance score to the performance factor rating.
 * A low score means a large opportunity: below 50 is strong, 50 to 89 is weak,
 * 90 and above is none.
 */
export function ratingFromPerformanceScore(score: number): ProspectRating {
  if (score < PERFORMANCE_STRONG_BELOW) {
    return 'strong'
  }
  if (score < PERFORMANCE_NONE_FROM) {
    return 'weak'
  }
  return 'none'
}

export const measureRequestSchema = z.strictObject({
  domain: z.string().trim().min(1).max(2048),
})

export const MEASURE_MAX_BODY_CHARS = 4096

export type ParseMeasureBodyResult =
  | { ok: true; domain: string }
  | { ok: false; status: 400 | 413; error: string }

export function parseMeasureBody(raw: string): ParseMeasureBodyResult {
  if (raw.length > MEASURE_MAX_BODY_CHARS) {
    return { ok: false, status: 413, error: 'Payload too large' }
  }
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return { ok: false, status: 400, error: 'Invalid JSON' }
  }
  const parsed = measureRequestSchema.safeParse(json)
  if (!parsed.success) {
    return { ok: false, status: 400, error: 'Invalid payload' }
  }
  return { ok: true, domain: parsed.data.domain }
}

export type PerformanceMeasurement = {
  performanceScore: number
  lcpMs: number
  tbtMs: number
  cls: number
  fetchedAt: string
}

export type FetchMeasurementResult =
  | { ok: true; data: PerformanceMeasurement }
  | { ok: false; reason: string; status?: number }

export type MeasureProspectRecord = {
  id: string
  domain: string
  factorRatings: FactorRatings
  latestRunId: string | null
  rubricVersion: string
}

export type MeasurementWrite = {
  prospectId: string
  runId: string
  factorRatings: FactorRatings
  fitScore: number | null
  opportunityScore: number | null
  confidence: ProspectConfidence
  rubricVersion: string
  evidence: EvidenceWrite
  updatedAt: string
}

export interface ProspectMeasureStore {
  findProspectByDomain(domain: string): Promise<MeasureProspectRecord | null>
  /**
   * Replaces any earlier measurement evidence for this factor on this
   * prospect and run, inserts the new one, and updates ratings and scores.
   */
  saveMeasurement(write: MeasurementWrite): Promise<void>
}

export type MeasureDeps = {
  store: ProspectMeasureStore
  /** Whether the PageSpeed API key is configured. */
  pageSpeedConfigured: boolean
  fetchMeasurement(url: string): Promise<FetchMeasurementResult>
  now(): Date
}

export type MeasureResult =
  | {
      ok: true
      domain: string
      prospectId: string
      measuredUrl: string
      performanceScore: number
      rating: ProspectRating
      fitScore: number | null
      opportunityScore: number | null
      confidence: ProspectConfidence
    }
  | {
      ok: false
      status: 400 | 404 | 409 | 502 | 503
      error: string
      reason?: string
    }

function formatMs(value: number): string {
  return `${Math.round(value).toLocaleString('en-US')} ms`
}

export function measurementClaim(url: string, data: PerformanceMeasurement): string {
  return (
    `Mobile PageSpeed Insights measurement of ${url}: performance score ` +
    `${data.performanceScore}/100, LCP ${formatMs(data.lcpMs)}, ` +
    `TBT ${formatMs(data.tbtMs)}, CLS ${data.cls.toFixed(2)}. ` +
    'Lab data from a single simulated mobile load, not field data from real visitors.'
  )
}

function observedAt(fetchedAt: string, now: Date): string {
  const parsed = Date.parse(fetchedAt)
  return Number.isNaN(parsed) ? now.toISOString() : new Date(parsed).toISOString()
}

export async function measureProspect(
  rawDomain: string,
  deps: MeasureDeps,
): Promise<MeasureResult> {
  const domain = normalizeDomain(rawDomain)
  if (domain === null) {
    return { ok: false, status: 400, error: 'Invalid domain' }
  }

  const prospect = await deps.store.findProspectByDomain(domain)
  if (prospect === null) {
    return { ok: false, status: 404, error: 'No prospect with this domain' }
  }
  if (prospect.latestRunId === null) {
    return {
      ok: false,
      status: 409,
      error: 'Prospect has no research run to attach the measurement to',
    }
  }

  if (!deps.pageSpeedConfigured) {
    return {
      ok: false,
      status: 503,
      error: 'PageSpeed Insights is not configured. The performance factor was left unchanged.',
      reason: 'not_configured',
    }
  }

  const measuredUrl = `https://${prospect.domain}/`
  const result = await deps.fetchMeasurement(measuredUrl)
  if (!result.ok) {
    return {
      ok: false,
      status: result.reason === 'not_configured' ? 503 : 502,
      error: 'PageSpeed Insights measurement failed. The performance factor was left unchanged.',
      reason: result.status === undefined ? result.reason : `${result.reason} (HTTP ${result.status})`,
    }
  }

  const rating = ratingFromPerformanceScore(result.data.performanceScore)
  const factorRatings: FactorRatings = {
    ...prospect.factorRatings,
    [PERFORMANCE_FACTOR]: rating,
  }
  const scores = scoreProspect(factorRatings)
  const now = deps.now()

  await deps.store.saveMeasurement({
    prospectId: prospect.id,
    runId: prospect.latestRunId,
    factorRatings,
    fitScore: scores.fit.score,
    opportunityScore: scores.opportunity.score,
    confidence: scores.confidence,
    rubricVersion: prospect.rubricVersion,
    evidence: {
      factorKey: PERFORMANCE_FACTOR,
      kind: 'measurement',
      claim: measurementClaim(measuredUrl, result.data),
      sourceUrl: measuredUrl,
      observedAt: observedAt(result.data.fetchedAt, now),
    },
    updatedAt: now.toISOString(),
  })

  return {
    ok: true,
    domain: prospect.domain,
    prospectId: prospect.id,
    measuredUrl,
    performanceScore: result.data.performanceScore,
    rating,
    fitScore: scores.fit.score,
    opportunityScore: scores.opportunity.score,
    confidence: scores.confidence,
  }
}

export type MeasureByIdDeps = MeasureDeps & {
  findDomainById(prospectId: string): Promise<string | null>
}

/** The owner-side entry point: measures a prospect by id. */
export async function measureProspectById(
  prospectId: string,
  deps: MeasureByIdDeps,
): Promise<MeasureResult> {
  if (!isUuid(prospectId)) {
    return { ok: false, status: 400, error: 'Invalid prospect' }
  }
  const domain = await deps.findDomainById(prospectId)
  if (domain === null) {
    return { ok: false, status: 404, error: 'No prospect with this id' }
  }
  return measureProspect(domain, deps)
}
