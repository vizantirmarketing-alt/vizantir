/**
 * Website-check runs: queueing, claiming and ingesting. No direct I/O: the
 * store is injected (Supabase in lib/new-businesses/website-store.ts, memory
 * in tests).
 *
 * Untrusted research never chooses which rows are written: a result is
 * accepted only for a business the server put in the claimed run, and the
 * server finds that business's license rows itself. The server decides every
 * status and score, and makes no request to any runner-supplied URL.
 *
 * Run summaries use the prospect runs' typed lines ("Note: ", "Runner: ",
 * "System: "), so the page reads them with the same splitRunSummary().
 */

import { ABANDONED_RUN_HOURS, abandonedCutoff } from '@/lib/prospects/claim'
import {
  NOTE_LINE_PREFIX,
  SYSTEM_LINE_PREFIX,
  appendSummaryLine,
  buildErrorSummary,
  type RecordOutcomes,
} from '@/lib/prospects/ingest'
import { decideWebsiteStatus, WEBSITE_RULES_VERSION, type WebsiteDecision, type WebsiteStatus } from '@/lib/new-businesses/website-rules'
import {
  CHECK_EXCERPT_MAX_WORDS,
  CHECK_INGEST_MAX_BUSINESSES,
  CHECK_INGEST_MAX_CANDIDATES,
  CHECK_INGEST_MAX_SEARCHES,
  type CheckBatch,
} from '@/lib/new-businesses/website-schema'

export const CHECK_RUN_SIZE = 30
export const MAX_WAITING_CHECK_RUNS = 3
export const STALE_CHECK_RUN_HOURS = ABANDONED_RUN_HOURS
export const CHECK_RUN_STATES = ['requested', 'claimed', 'completed', 'failed', 'cancelled'] as const
export type CheckRunState = (typeof CHECK_RUN_STATES)[number]
export type CheckRunSource = 'dashboard' | 'schedule'

/** What the runner receives per business. Nothing else about the business is sent. */
export type CheckBusiness = {
  /** Opaque id: the business's primary license row. */
  id: string
  name: string
  licenses: string[]
  address: string | null
  suite: string | null
  city: string | null
  state: string | null
  zip: string | null
  phone: string | null
}

export type ClaimedCheckRun = { id: string; requestedAt: string; claimedAt: string }

export type StoredCheckRun = {
  id: string
  state: CheckRunState
  businessIds: string[]
  recordOutcomes: RecordOutcomes
  errorSummary: string | null
}

export type CheckRunCounts = { checked: number; rejected: number }

export type CheckRunUpdate = {
  recordOutcomes: RecordOutcomes
  counts: CheckRunCounts
  errorSummary: string | null
  updatedAt: string
  finish?: { state: 'completed' | 'failed'; finishedAt: string }
}

export interface WebsiteCheckStore {
  /**
   * Marks runs claimed before the cutoff as failed, appending
   * abandonedReasonLine(claimedAt), and releases their businesses that have
   * no result so they can be claimed again. Returns runs failed.
   */
  failStaleRuns(cutoffIso: string, nowIso: string): Promise<number>
  claimOldestRequestedRun(nowIso: string): Promise<ClaimedCheckRun | null>
  /**
   * Primary rows with no website result and not held by another run, review
   * status unreviewed or accepted, ordered by lead score (unscored last) then
   * name. The score only orders; nothing is excluded for scoring low.
   */
  selectBusinessesForCheck(limit: number): Promise<CheckBusiness[]>
  /** Records the run's businesses and links every license row of each to the run. */
  attachBusinesses(runId: string, businessIds: string[], nowIso: string): Promise<void>
  /** Closes a claimed run that found nothing to check, with a note line. */
  closeEmptyRun(runId: string, summary: string, nowIso: string): Promise<void>
  getRun(runId: string): Promise<StoredCheckRun | null>
  /** Writes the result to every license row of the business. Never review status or notes. */
  saveWebsiteResult(businessId: string, runId: string, decision: WebsiteDecision, nowIso: string): Promise<void>
  /** Applies only while the run is still claimed. Returns false otherwise. */
  updateRun(runId: string, update: CheckRunUpdate): Promise<boolean>
  /** Unlinks the run's businesses that got no result, so a later run can take them. */
  releaseUnchecked(runId: string): Promise<void>
  countRuns(states: readonly CheckRunState[]): Promise<number>
  /** Eligible businesses (as selectBusinessesForCheck) with no result and no open run. */
  countUncheckedBusinesses(): Promise<number>
  requestRun(source: CheckRunSource, nowIso: string): Promise<{ id: string }>
}

// --- Resolved failures.

/**
 * A failed website-check run is resolved once any later check run has
 * completed with at least one business checked: that run proves checking
 * works again. Decided from state, finish times and counts only, never from
 * error wording.
 */
export function resolvedCheckRunIds(
  runs: readonly { id: string; state: CheckRunState; checked: number; finishedAt: string | null }[],
): Set<string> {
  const time = (iso: string | null) => (iso === null ? null : Date.parse(iso))
  const resolved = new Set<string>()
  for (const run of runs) {
    const failedAt = time(run.finishedAt)
    if (run.state !== 'failed' || failedAt === null || Number.isNaN(failedAt)) continue
    const later = runs.some((other) => {
      const t = time(other.finishedAt)
      return other.id !== run.id && other.state === 'completed' && other.checked >= 1 && t !== null && t > failedAt
    })
    if (later) resolved.add(run.id)
  }
  return resolved
}

// --- Queueing.

export type QueueCheckResult =
  | { outcome: 'queued'; runId: string }
  | { outcome: 'nothing_to_check' }
  | { outcome: 'run_open' }
  | { outcome: 'limit_reached' }

/**
 * The daily cron queues one run when unchecked businesses remain and no
 * check run is requested or claimed. The page may queue up to
 * MAX_WAITING_CHECK_RUNS waiting runs.
 */
export async function queueCheckRun(store: WebsiteCheckStore, source: CheckRunSource, now: Date): Promise<QueueCheckResult> {
  if (source === 'schedule') {
    if ((await store.countRuns(['requested', 'claimed'])) > 0) return { outcome: 'run_open' }
  } else if ((await store.countRuns(['requested'])) >= MAX_WAITING_CHECK_RUNS) {
    return { outcome: 'limit_reached' }
  }
  if ((await store.countUncheckedBusinesses()) === 0) return { outcome: 'nothing_to_check' }
  const { id } = await store.requestRun(source, now.toISOString())
  return { outcome: 'queued', runId: id }
}

// --- Claim.

export const CHECK_RULES_FOR_RUNNER = {
  rulesVersion: WEBSITE_RULES_VERSION,
  maxSearchesPerBusiness: CHECK_INGEST_MAX_SEARCHES,
  maxPageReadsPerBusiness: 2,
  maxCandidatesPerBusiness: CHECK_INGEST_MAX_CANDIDATES,
  maxBusinessesPerBatch: CHECK_INGEST_MAX_BUSINESSES,
  excerptMaxWords: CHECK_EXCERPT_MAX_WORDS,
  searchOrder: [
    'The business name with the city.',
    'The business name with the phone number or the street address.',
  ],
  identityRule:
    'A page counts as this business only if the name matches and at least one of the street address, the phone number, or the city together with the business type also matches.',
  noneFound:
    'Report none_found only after at least two different searches found nothing that passes the identity rule. When in doubt report unclear.',
  placeholder:
    "Set placeholder to true when the business's own domain is parked, under construction or says coming soon.",
  privacy:
    "Record business pages only. Never record people's names, personal profiles, personal email addresses or anything about an individual. If the only result is an individual's personal profile, do not record it.",
  submitEveryBusiness:
    "Submit every business in the run. When a business's name is a person's name, do not search for it: submit it with no searches, no candidates, outcome_claimed unclear and the note \"Licensed under a person's name; not searched.\" Submit any other business you cannot check the same way, with a short factual note.",
  kindClaimed:
    'Set kind_claimed to own_site only for the business\'s own website, builder_page for its page on a website builder, social or directory for listings, and other for anything else, such as a news article that mentions the business.',
} as const

export type CheckClaimResponse =
  | { run: null }
  | { run: ClaimedCheckRun; businesses: CheckBusiness[]; rules: typeof CHECK_RULES_FOR_RUNNER }

export async function buildCheckClaimResponse(store: WebsiteCheckStore, now: Date): Promise<CheckClaimResponse> {
  const nowIso = now.toISOString()
  await store.failStaleRuns(abandonedCutoff(now).toISOString(), nowIso)
  const run = await store.claimOldestRequestedRun(nowIso)
  if (run === null) return { run: null }

  const businesses = await store.selectBusinessesForCheck(CHECK_RUN_SIZE)
  if (businesses.length === 0) {
    await store.closeEmptyRun(run.id, `${NOTE_LINE_PREFIX}Nothing left to check: every eligible business already has a website result.`, nowIso)
    return { run: null }
  }
  await store.attachBusinesses(run.id, businesses.map((b) => b.id), nowIso)
  return { run, businesses, rules: CHECK_RULES_FOR_RUNNER }
}


// --- Ingest.

export const CHECK_REJECT_REASONS = {
  notInRun: 'not_in_run',
  duplicateInBatch: 'duplicate_in_batch',
} as const

export type CheckIngestResult =
  | {
      ok: true
      runId: string
      runState: CheckRunState
      checked: { id: string; websiteStatus: WebsiteStatus }[]
      rejected: { id: string; reasons: string[] }[]
      counts: CheckRunCounts
    }
  | { ok: false; status: 404 | 409; error: string; runState?: CheckRunState }

export type CheckIngestDeps = {
  store: WebsiteCheckStore
  /** Regroups and rescores every stored business (rank v3 reads the new results). */
  rescore(): Promise<void>
}

function countOutcomes(outcomes: RecordOutcomes): CheckRunCounts {
  let checked = 0
  let rejected = 0
  for (const outcome of Object.values(outcomes)) {
    if (outcome.status === 'saved') checked += 1
    else rejected += 1
  }
  return { checked, rejected }
}

export async function ingestCheckBatch(deps: CheckIngestDeps, batch: CheckBatch, now: Date): Promise<CheckIngestResult> {
  const { store } = deps
  const run = await store.getRun(batch.runId)
  if (run === null) return { ok: false, status: 404, error: 'Run not found' }
  if (run.state !== 'claimed') return { ok: false, status: 409, error: 'Run is not claimed', runState: run.state }

  const nowIso = now.toISOString()
  const inRun = new Set(run.businessIds)
  const seen = new Set<string>()
  const outcomes: RecordOutcomes = { ...run.recordOutcomes }
  const checked: { id: string; websiteStatus: WebsiteStatus }[] = []
  const rejected: { id: string; reasons: string[] }[] = []

  for (const business of batch.businesses) {
    if (!inRun.has(business.id)) {
      rejected.push({ id: business.id, reasons: [CHECK_REJECT_REASONS.notInRun] })
      outcomes[business.id] = { status: 'rejected', reasons: [CHECK_REJECT_REASONS.notInRun] }
      continue
    }
    if (seen.has(business.id)) {
      rejected.push({ id: business.id, reasons: [CHECK_REJECT_REASONS.duplicateInBatch] })
      continue
    }
    seen.add(business.id)
    const decision = decideWebsiteStatus(business)
    await store.saveWebsiteResult(business.id, run.id, decision, nowIso)
    outcomes[business.id] = { status: 'saved', reasons: [] }
    checked.push({ id: business.id, websiteStatus: decision.status })
  }

  let { summary } = buildErrorSummary(run.errorSummary, outcomes, batch.runErrors ?? [], batch.runNotes ?? [])
  if (checked.length > 0) {
    try {
      await deps.rescore()
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message.slice(0, 200) : 'unknown error'
      summary = appendSummaryLine(summary, `${SYSTEM_LINE_PREFIX}Lead scores were not updated after this batch: ${message}`)
    }
  }

  const counts = countOutcomes(outcomes)
  const finishState = batch.finish
  const applied = await store.updateRun(run.id, {
    recordOutcomes: outcomes,
    counts,
    errorSummary: summary,
    updatedAt: nowIso,
    finish: finishState === undefined ? undefined : { state: finishState, finishedAt: nowIso },
  })
  if (!applied) return { ok: false, status: 409, error: 'Run is no longer claimed' }
  if (finishState !== undefined) await store.releaseUnchecked(run.id)

  return { ok: true, runId: run.id, runState: finishState ?? 'claimed', checked, rejected, counts }
}
