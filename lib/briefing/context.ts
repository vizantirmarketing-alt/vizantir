/**
 * Daily briefing context. Pure; no I/O.
 *
 * assembleBriefingContent() turns raw read-only loader results into the
 * structured content that is both saved and (as JSON) sent to the model. It
 * applies every briefing rule, so anything a rule excludes never reaches the
 * model and cannot drive a suggested action:
 *   - new prospects: added in the prospect window, ordered by priority
 *   - per prospect: one performance line and one highlight evidence item
 *   - inquiries: at most 5 from the last 30 days; older ones are only a count
 *   - runs: finished in the run window; a failed run is dropped when a later
 *     run for the same market and industry saved at least one prospect,
 *     whatever that later run's final state
 *   - findings: at most 5, with the total
 *   - unreviewed prospects: never repeats one already listed as new
 *
 * It is also the data minimisation boundary: inbound inquiries are reduced to
 * id, status, company and age, so no names, emails, phone numbers or message
 * bodies can reach the model or the stored briefing.
 */

import { localAgeDays, localDateString } from '@/lib/briefing/dates'
import {
  PERFORMANCE_FACTOR,
  formatPerformanceSummary,
  parseMeasurementClaim,
} from '@/lib/prospects/measure'
import { priorityScore } from '@/lib/prospects/params'
import {
  FACTOR_DEFINITIONS,
  isProspectFactor,
  type FactorRatings,
} from '@/lib/prospects/rubric'

export const BRIEFING_CONTENT_VERSION = 2

/** New prospects stored per briefing; the page shows NEW_PROSPECTS_SHOWN by default. */
export const NEW_PROSPECTS_LIMIT = 50
export const NEW_PROSPECTS_SHOWN = 5
export const INQUIRIES_SHOWN = 5
export const INQUIRY_RECENT_DAYS = 30
export const FINDINGS_SHOWN = 5

/** Windows when there is no previous briefing. */
export const FIRST_PROSPECT_WINDOW_DAYS = 7
export const FIRST_RUN_WINDOW_HOURS = 24

const DAY_MS = 24 * 60 * 60 * 1000

export type BriefingWindows = {
  /** New prospects added after this time. */
  prospectsSince: string
  /** Research runs finished after this time. */
  runsSince: string
  /** Inquiries created after this time are listed; older ones are counted. */
  inquiriesSince: string
}

/** Since the previous briefing, or the first-briefing fallbacks. */
export function briefingWindows(now: Date, previousGeneratedAt: string | null): BriefingWindows {
  const fallback = (ms: number) => new Date(now.getTime() - ms).toISOString()
  return {
    prospectsSince: previousGeneratedAt ?? fallback(FIRST_PROSPECT_WINDOW_DAYS * DAY_MS),
    runsSince: previousGeneratedAt ?? fallback(FIRST_RUN_WINDOW_HOURS * 60 * 60 * 1000),
    inquiriesSince: fallback(INQUIRY_RECENT_DAYS * DAY_MS),
  }
}

/* ---------- Raw inputs (shapes returned by the loaders) ---------- */

export type RawEvidence = {
  factorKey: string
  kind: string
  claim: string
  sourceUrl: string
}

export type RawNewProspect = {
  id: string
  name: string
  domain: string
  fitScore: number | null
  opportunityScore: number | null
  confidence: string
  factorRatings: FactorRatings
  createdAt: string
  evidence: RawEvidence[]
}

export type RawUnreviewedProspect = {
  id: string
  name: string
  domain: string
  fitScore: number | null
  opportunityScore: number | null
}

/**
 * Inquiry rows as the leads loader returns them, newest first. They carry the
 * submitter's name; assembleBriefingContent drops it.
 */
export type RawInquiry = {
  id: string
  name?: string
  company: string | null
  status: string
  created_at: string
  [key: string]: unknown
}

export type RawInquiryStats = {
  newCount: number | null
  deliveryIssues: number | null
}

export type RawFinding = {
  findingKey: string
  title: string
  category: string
  confidence: string
  status: string
}

export type RawRun = {
  id: string
  state: string
  market: string | null
  industry: string | null
  saved: number
  requested: number | null
  errors: string[]
  notes: string[]
  requestedAt: string
  finishedAt: string | null
}

export type RawSource = {
  provider: string
  label: string
  lastRun: null | { status: string; startedAt: string; administratorMessage: string | null }
  stale: boolean
}

export type LoaderResult<T> = { ok: true; value: T } | { ok: false }

export type RawBriefingInputs = {
  newProspects: LoaderResult<{ rows: RawNewProspect[]; total: number }>
  topUnreviewed: LoaderResult<RawUnreviewedProspect[]>
  /** rows: status new, newest first. olderCount: status new created before the inquiry window. */
  inquiries: LoaderResult<{ rows: RawInquiry[]; total: number; olderCount: number }>
  inquiryStats: LoaderResult<RawInquiryStats>
  findings: LoaderResult<{ items: RawFinding[]; total: number }>
  runs: LoaderResult<RawRun[]>
  sources: LoaderResult<RawSource[]>
}

/* ---------- Saved content ---------- */

export type SourceFreshness = {
  provider: string
  label: string
  state: 'ok' | 'stale' | 'failed' | 'partial' | 'never'
  lastRunAt: string | null
  message: string | null
}

export type BriefingProspect = {
  id: string
  name: string
  domain: string
  priority: number | null
  fitScore: number | null
  opportunityScore: number | null
  confidence: string
  /** e.g. "Mobile performance 33/100, LCP 16.2 s", or null when not measured. */
  performance: string | null
  /** The single most useful non-performance evidence item. */
  highlight: { factorKey: string; claim: string; sourceUrl: string } | null
}

export type BriefingContent = {
  version: typeof BRIEFING_CONTENT_VERSION
  briefingDate: string
  generatedAt: string
  windows: BriefingWindows
  /** Ordered by priority, highest first. */
  newProspects: BriefingProspect[]
  newProspectsTotal: number
  topUnreviewed: {
    id: string
    name: string
    domain: string
    priority: number | null
    fitScore: number | null
    opportunityScore: number | null
  }[]
  inquiries: {
    newCount: number | null
    deliveryIssues: number | null
    /** New inquiries from the last 30 days. */
    recentTotal: number
    /** At most INQUIRIES_SHOWN, newest first, from the last 30 days only. */
    recent: { id: string; status: string; company: string | null; ageDays: number | null }[]
    /** New inquiries older than 30 days. A count only: no ids, so no actions. */
    olderCount: number
  }
  findings: {
    openCount: number
    items: RawFinding[]
  }
  runs: {
    id: string
    state: string
    market: string | null
    industry: string | null
    saved: number
    requested: number | null
    finishedAt: string | null
    errors: string[]
    notes: string[]
  }[]
  sources: SourceFreshness[]
  /** Sections whose loader failed. Rendered as unavailable, never as empty. */
  unavailable: string[]
  /** True when nothing needs attention. */
  quiet: boolean
  /** Validated model suggestions, or null when there is no narrative. */
  suggestedActions: SuggestedAction[] | null
}

export type SuggestedAction = {
  recordId: string
  text: string
}

/* ---------- Rules ---------- */

function roundedPriority(fit: number | null, opportunity: number | null): number | null {
  const value = priorityScore(fit, opportunity)
  return value === null ? null : Math.round(value)
}

/** Highest priority first; prospects missing either score last; then by name. */
function byPriority<T extends { priority: number | null; name: string }>(a: T, b: T): number {
  if (a.priority === null && b.priority !== null) return 1
  if (a.priority !== null && b.priority === null) return -1
  if (a.priority !== null && b.priority !== null && a.priority !== b.priority) {
    return b.priority - a.priority
  }
  return a.name.localeCompare(b.name)
}

/** Performance line from the prospect's measurement evidence, if measured. */
export function performanceLine(evidence: readonly RawEvidence[]): string | null {
  for (const item of evidence) {
    if (item.factorKey !== PERFORMANCE_FACTOR || item.kind !== 'measurement') continue
    const parsed = parseMeasurementClaim(item.claim)
    if (parsed !== null) {
      return formatPerformanceSummary(parsed)
    }
  }
  return null
}

/**
 * The single most useful non-performance evidence item. Tiers, best first:
 * opportunity factors rated strong, opportunity rated weak, fit rated strong,
 * fit rated weak, then anything else. Within a tier, higher factor weight
 * wins, then the most recently observed (input order).
 */
export function pickHighlight(
  ratings: FactorRatings,
  evidence: readonly RawEvidence[],
): RawEvidence | null {
  let best: { item: RawEvidence; tier: number; weight: number; index: number } | null = null
  evidence.forEach((item, index) => {
    if (item.factorKey === PERFORMANCE_FACTOR || !isProspectFactor(item.factorKey)) return
    const definition = FACTOR_DEFINITIONS[item.factorKey]
    const rating = ratings[item.factorKey]
    const base = definition.score === 'opportunity' ? 0 : 2
    const tier = rating === 'strong' ? base : rating === 'weak' ? base + 1 : 4
    const candidate = { item, tier, weight: definition.weight, index }
    if (
      best === null ||
      candidate.tier < best.tier ||
      (candidate.tier === best.tier && candidate.weight > best.weight) ||
      (candidate.tier === best.tier && candidate.weight === best.weight && candidate.index < best.index)
    ) {
      best = candidate
    }
  })
  return best === null ? null : (best as { item: RawEvidence }).item
}

function runKey(run: { market: string | null; industry: string | null }): string {
  return `${(run.market ?? '').trim().toLowerCase()}|${(run.industry ?? '').trim().toLowerCase()}`
}

function finishedTime(run: { finishedAt: string | null }): number | null {
  if (run.finishedAt === null) return null
  const t = Date.parse(run.finishedAt)
  return Number.isNaN(t) ? null : t
}

/**
 * Runs finished after runsSince, minus failed runs superseded by a later
 * finished run for the same market and industry that saved at least one
 * prospect, whatever that later run's final state. Newest first.
 */
export function selectRuns(runs: readonly RawRun[], runsSince: string): RawRun[] {
  const since = Date.parse(runsSince)
  const inWindow = runs.filter((run) => {
    const t = finishedTime(run)
    return t !== null && t > since
  })
  return inWindow
    .filter((run) => {
      if (run.state !== 'failed') return true
      const failedAt = finishedTime(run) ?? 0
      return !runs.some(
        (other) =>
          other.id !== run.id &&
          other.saved >= 1 &&
          runKey(other) === runKey(run) &&
          (finishedTime(other) ?? 0) > failedAt,
      )
    })
    .sort((a, b) => (finishedTime(b) ?? 0) - (finishedTime(a) ?? 0))
}

function sourceState(source: RawSource): SourceFreshness['state'] {
  if (source.lastRun === null) return 'never'
  if (source.lastRun.status === 'failed') return 'failed'
  if (source.lastRun.status === 'partial') return 'partial'
  if (source.stale) return 'stale'
  return 'ok'
}

export function toSourceFreshness(sources: RawSource[]): SourceFreshness[] {
  return sources.map((source) => ({
    provider: source.provider,
    label: source.label,
    state: sourceState(source),
    lastRunAt: source.lastRun?.startedAt ?? null,
    message: source.lastRun?.administratorMessage ?? null,
  }))
}

export function assembleBriefingContent(
  inputs: RawBriefingInputs,
  options: { now: Date; windows: BriefingWindows },
): BriefingContent {
  const { now, windows } = options
  const unavailable: string[] = []
  const take = <T,>(name: string, result: LoaderResult<T>, empty: T): T => {
    if (result.ok) return result.value
    unavailable.push(name)
    return empty
  }

  const added = take('newProspects', inputs.newProspects, { rows: [], total: 0 })
  const newProspects: BriefingProspect[] = added.rows
    .slice(0, NEW_PROSPECTS_LIMIT)
    .map((p) => {
      const highlight = pickHighlight(p.factorRatings, p.evidence)
      return {
        id: p.id,
        name: p.name,
        domain: p.domain,
        priority: roundedPriority(p.fitScore, p.opportunityScore),
        fitScore: p.fitScore,
        opportunityScore: p.opportunityScore,
        confidence: p.confidence,
        performance: performanceLine(p.evidence),
        highlight:
          highlight === null
            ? null
            : { factorKey: highlight.factorKey, claim: highlight.claim, sourceUrl: highlight.sourceUrl },
      }
    })
    .sort(byPriority)

  // A prospect already listed under New prospects is not repeated here.
  const listedAsNew = new Set(newProspects.map((p) => p.id))
  const topUnreviewed = take('topUnreviewed', inputs.topUnreviewed, [])
    .filter((p) => !listedAsNew.has(p.id))
    .slice(0, NEW_PROSPECTS_SHOWN)
    .map((p) => ({
      id: p.id,
      name: p.name,
      domain: p.domain,
      priority: roundedPriority(p.fitScore, p.opportunityScore),
      fitScore: p.fitScore,
      opportunityScore: p.opportunityScore,
    }))

  const inquiryData = take('inquiries', inputs.inquiries, { rows: [], total: 0, olderCount: 0 })
  const stats = take('inquiryStats', inputs.inquiryStats, { newCount: null, deliveryIssues: null })
  const inquiryCutoff = Date.parse(windows.inquiriesSince)
  // Data minimisation: explicit field picks only. Never spread a lead row.
  const recent = inquiryData.rows
    .filter((row) => {
      const t = Date.parse(row.created_at)
      return !Number.isNaN(t) && t >= inquiryCutoff
    })
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .slice(0, INQUIRIES_SHOWN)
    .map((row) => ({
      id: row.id,
      status: row.status,
      company: row.company,
      ageDays: localAgeDays(row.created_at, now),
    }))
  const olderCount = Math.max(0, inquiryData.olderCount)
  const recentTotal = Math.max(recent.length, inquiryData.total - olderCount)

  const findings = take('findings', inputs.findings, { items: [], total: 0 })
  const runs = selectRuns(take('runs', inputs.runs, []), windows.runsSince).map((run) => ({
    id: run.id,
    state: run.state,
    market: run.market,
    industry: run.industry,
    saved: run.saved,
    requested: run.requested,
    finishedAt: run.finishedAt,
    errors: run.errors,
    notes: run.notes,
  }))
  const sources = toSourceFreshness(take('sources', inputs.sources, []))
  const unhealthySources = sources.filter((s) => s.state !== 'ok')

  const quiet =
    newProspects.length === 0 &&
    recent.length === 0 &&
    findings.items.length === 0 &&
    runs.length === 0 &&
    unhealthySources.length === 0 &&
    unavailable.length === 0

  return {
    version: BRIEFING_CONTENT_VERSION,
    briefingDate: localDateString(now),
    generatedAt: now.toISOString(),
    windows,
    newProspects,
    newProspectsTotal: Math.max(added.total, newProspects.length),
    topUnreviewed,
    inquiries: {
      newCount: stats.newCount,
      deliveryIssues: stats.deliveryIssues,
      recentTotal,
      recent,
      olderCount,
    },
    findings: {
      openCount: findings.total,
      items: findings.items.slice(0, FINDINGS_SHOWN).map((f) => ({
        findingKey: f.findingKey,
        title: f.title,
        category: f.category,
        confidence: f.confidence,
        status: f.status,
      })),
    },
    runs,
    sources,
    unavailable,
    quiet,
    suggestedActions: null,
  }
}

/** Every record id a suggested action may reference. */
export function contextRecordIds(content: BriefingContent): Set<string> {
  const ids = new Set<string>()
  for (const p of content.newProspects) ids.add(p.id)
  for (const p of content.topUnreviewed) ids.add(p.id)
  for (const i of content.inquiries.recent) ids.add(i.id)
  for (const f of content.findings.items) ids.add(f.findingKey)
  for (const r of content.runs) ids.add(r.id)
  for (const s of content.sources) ids.add(s.provider)
  return ids
}

export type BriefingRecordLink = { href: string; kind: string }

/** Where a record id links in the dashboard, or null if it is not in the content. */
export function recordLink(content: BriefingContent, recordId: string): BriefingRecordLink | null {
  if (content.newProspects.some((p) => p.id === recordId) || content.topUnreviewed.some((p) => p.id === recordId)) {
    return { href: `/intel/prospects/${recordId}`, kind: 'Prospect' }
  }
  if (content.inquiries.recent.some((i) => i.id === recordId)) {
    return { href: `/intel/leads/${recordId}`, kind: 'Inquiry' }
  }
  if (content.findings.items.some((f) => f.findingKey === recordId)) {
    return { href: '/intel', kind: 'Finding' }
  }
  if (content.runs.some((r) => r.id === recordId)) {
    return { href: '/intel/prospects', kind: 'Research run' }
  }
  if (content.sources.some((s) => s.provider === recordId)) {
    return { href: '/intel', kind: 'Data source' }
  }
  return null
}
