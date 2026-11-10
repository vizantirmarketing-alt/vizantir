/**
 * Prospect ingest logic. No direct I/O: all reads and writes go through the
 * ProspectIngestStore boundary, so the rules here are testable without a
 * database (lib/prospects/ingest.test.ts) and the Supabase implementation
 * (lib/prospects/store.ts) stays a thin adapter.
 *
 * Idempotency: a record is keyed by run id plus normalized domain.
 * Re-ingesting the same batch upserts the same prospect row, replaces that
 * run's evidence for it rather than appending, and overwrites the same
 * per-domain outcome on the run, so counts do not drift. A batch that fails
 * part way can be resent whole.
 */

import { normalizeDomain } from '@/lib/prospects/domain'
import type {
  IngestBatch,
  IngestProspect,
} from '@/lib/prospects/ingest-schema'
import type { EvidenceKind, ProspectRunState } from '@/lib/prospects/params'
import {
  SERVER_RATED_FACTOR,
  factorsMissingDistinctSources,
  factorsMissingEvidence,
  scoreProspect,
  type FactorRatings,
  type ProspectConfidence,
} from '@/lib/prospects/rubric'

export type RunConfig = {
  market: string
  industry: string
  targetCount: number
  exclusions: string[]
}

export type RecordOutcome = {
  status: 'saved' | 'rejected'
  reasons: string[]
}

export type RecordOutcomes = Record<string, RecordOutcome>

export type RunCounts = {
  saved: number
  rejected: number
}

export type StoredRun = {
  id: string
  state: ProspectRunState
  config: RunConfig
  recordOutcomes: RecordOutcomes
  errorSummary: string | null
}

export type ProspectWrite = {
  domain: string
  canonicalName: string
  market: string
  industry: string
  factorRatings: FactorRatings
  fitScore: number | null
  opportunityScore: number | null
  confidence: ProspectConfidence
  rubricVersion: string
  latestRunId: string
  lastResearchedAt: string
}

export type EvidenceWrite = {
  factorKey: string
  kind: EvidenceKind
  claim: string
  sourceUrl: string
  observedAt: string
}

export type RunUpdate = {
  recordOutcomes: RecordOutcomes
  counts: RunCounts
  errorSummary: string | null
  updatedAt: string
  finish?: { state: 'completed' | 'partial' | 'failed'; finishedAt: string }
}

export interface ProspectIngestStore {
  getRun(runId: string): Promise<StoredRun | null>
  /** Upsert by domain. Must not overwrite review_status or owner_note. */
  saveProspect(write: ProspectWrite): Promise<{ id: string }>
  /** Replace this run's evidence for the prospect (delete then insert). */
  replaceRunEvidence(
    prospectId: string,
    runId: string,
    evidence: EvidenceWrite[],
  ): Promise<void>
  /** Applies only while the run is still claimed. Returns false otherwise. */
  updateRun(runId: string, update: RunUpdate): Promise<boolean>
}

export const REJECT_REASONS = {
  invalidDomain: 'invalid_domain',
  excluded: 'excluded_domain',
  duplicateInBatch: 'duplicate_in_batch',
  missingEvidence: 'missing_evidence',
  serverRatedFactor: 'server_rated_factor',
  needsTwoSources: 'needs_two_sources',
} as const

const ERROR_SUMMARY_MAX = 2000

/*
 * prospect_runs.error_summary holds typed lines so notes need no new column:
 *   "Note: ..."    runner notes (skipped sites, shortfall reasons). Not errors.
 *   "Runner: ..."  runner-reported errors.
 *   "System: ..."  server-recorded errors (for example an abandoned run).
 *   "<n> record(s) rejected: ..."  derived from record outcomes. An error.
 * Every line that is not a note is an error. splitRunSummary() is the reader.
 */
export const NOTE_LINE_PREFIX = 'Note: '
export const RUNNER_LINE_PREFIX = 'Runner: '
export const SYSTEM_LINE_PREFIX = 'System: '

export function splitRunSummary(summary: string | null): {
  errors: string[]
  notes: string[]
} {
  const errors: string[] = []
  const notes: string[] = []
  if (summary === null) {
    return { errors, notes }
  }
  for (const line of summary.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.length === 0) {
      continue
    }
    if (trimmed.startsWith(NOTE_LINE_PREFIX)) {
      notes.push(trimmed.slice(NOTE_LINE_PREFIX.length))
    } else if (trimmed.startsWith(RUNNER_LINE_PREFIX)) {
      errors.push(trimmed.slice(RUNNER_LINE_PREFIX.length))
    } else if (trimmed.startsWith(SYSTEM_LINE_PREFIX)) {
      errors.push(trimmed.slice(SYSTEM_LINE_PREFIX.length))
    } else {
      errors.push(trimmed)
    }
  }
  return { errors, notes }
}

/** Appends one line to a stored summary, without duplicating it. */
export function appendSummaryLine(summary: string | null, line: string): string {
  const lines = summary === null ? [] : summary.split('\n').filter((l) => l.trim().length > 0)
  if (!lines.includes(line)) {
    lines.push(line)
  }
  return lines.join('\n')
}

export type PreparedRecord = {
  domain: string
  write: ProspectWrite
  evidence: EvidenceWrite[]
}

export type RejectedRecord = {
  key: string
  reasons: string[]
}

export type PreparedBatch = {
  accepted: PreparedRecord[]
  rejected: RejectedRecord[]
}

function rejectedKeyFor(rawDomain: string): string {
  return `invalid:${rawDomain.trim().toLowerCase().slice(0, 100)}`
}

export function prepareProspect(
  input: IngestProspect,
  runId: string,
  config: RunConfig,
  nowIso: string,
):
  | { ok: true; record: PreparedRecord }
  | { ok: false; rejected: RejectedRecord } {
  const domain = normalizeDomain(input.domain)
  if (domain === null) {
    return {
      ok: false,
      rejected: {
        key: rejectedKeyFor(input.domain),
        reasons: [REJECT_REASONS.invalidDomain],
      },
    }
  }

  const exclusions = new Set(
    config.exclusions
      .map((entry) => normalizeDomain(entry))
      .filter((entry): entry is string => entry !== null),
  )
  if (exclusions.has(domain)) {
    return {
      ok: false,
      rejected: { key: domain, reasons: [REJECT_REASONS.excluded] },
    }
  }

  const ratings: FactorRatings = input.ratings

  // The performance factor is rated only by the server, from a measurement.
  if (
    ratings[SERVER_RATED_FACTOR] !== 'unknown' ||
    input.evidence.some((item) => item.factor === SERVER_RATED_FACTOR)
  ) {
    return {
      ok: false,
      rejected: {
        key: domain,
        reasons: [`${REJECT_REASONS.serverRatedFactor}:${SERVER_RATED_FACTOR}`],
      },
    }
  }

  const missing = factorsMissingEvidence(
    ratings,
    input.evidence.map((item) => item.factor),
  )
  if (missing.length > 0) {
    return {
      ok: false,
      rejected: {
        key: domain,
        reasons: missing.map(
          (factor) => `${REJECT_REASONS.missingEvidence}:${factor}`,
        ),
      },
    }
  }

  const singleSource = factorsMissingDistinctSources(ratings, input.evidence)
  if (singleSource.length > 0) {
    return {
      ok: false,
      rejected: {
        key: domain,
        reasons: singleSource.map(
          (factor) => `${REJECT_REASONS.needsTwoSources}:${factor}`,
        ),
      },
    }
  }

  const scores = scoreProspect(ratings)

  return {
    ok: true,
    record: {
      domain,
      write: {
        domain,
        canonicalName: input.name.trim(),
        market: input.market?.trim() || config.market,
        industry: input.industry?.trim() || config.industry,
        factorRatings: ratings,
        fitScore: scores.fit.score,
        opportunityScore: scores.opportunity.score,
        confidence: scores.confidence,
        rubricVersion: scores.rubricVersion,
        latestRunId: runId,
        lastResearchedAt: nowIso,
      },
      evidence: input.evidence.map((item) => ({
        factorKey: item.factor,
        kind: item.kind,
        claim: item.claim.trim(),
        sourceUrl: item.sourceUrl.trim(),
        observedAt: new Date(item.observedAt).toISOString(),
      })),
    },
  }
}

export function prepareBatch(
  batch: IngestBatch,
  config: RunConfig,
  nowIso: string,
): PreparedBatch {
  const accepted: PreparedRecord[] = []
  const rejected: RejectedRecord[] = []
  const seen = new Set<string>()

  for (const input of batch.prospects) {
    const result = prepareProspect(input, batch.runId, config, nowIso)
    if (!result.ok) {
      rejected.push(result.rejected)
      continue
    }
    if (seen.has(result.record.domain)) {
      rejected.push({
        key: result.record.domain,
        reasons: [REJECT_REASONS.duplicateInBatch],
      })
      continue
    }
    seen.add(result.record.domain)
    accepted.push(result.record)
  }

  return { accepted, rejected }
}

export function mergeOutcomes(
  existing: RecordOutcomes,
  prepared: PreparedBatch,
): RecordOutcomes {
  const merged: RecordOutcomes = { ...existing }
  for (const record of prepared.accepted) {
    merged[record.domain] = { status: 'saved', reasons: [] }
  }
  for (const record of prepared.rejected) {
    // A duplicate inside one batch does not undo the copy that was saved.
    if (
      record.reasons.includes(REJECT_REASONS.duplicateInBatch) &&
      merged[record.key]?.status === 'saved'
    ) {
      continue
    }
    merged[record.key] = { status: 'rejected', reasons: record.reasons }
  }
  return merged
}

export function countOutcomes(outcomes: RecordOutcomes): RunCounts {
  let saved = 0
  let rejected = 0
  for (const outcome of Object.values(outcomes)) {
    if (outcome.status === 'saved') {
      saved += 1
    } else {
      rejected += 1
    }
  }
  return { saved, rejected }
}

export function finalRunState(
  finish: 'completed' | 'failed',
  counts: RunCounts,
  runnerLines: readonly string[],
): 'completed' | 'partial' | 'failed' {
  if (finish === 'failed') {
    return 'failed'
  }
  if (counts.rejected > 0 || runnerLines.length > 0) {
    return 'partial'
  }
  return 'completed'
}

function linesWithPrefix(summary: string | null, prefix: string): string[] {
  if (summary === null) {
    return []
  }
  return summary.split('\n').filter((line) => line.startsWith(prefix))
}

function mergeLines(existing: string[], incoming: readonly string[], prefix: string): string[] {
  const merged = [...existing]
  for (const raw of incoming) {
    const line = `${prefix}${raw.replace(/\s+/g, ' ').trim()}`
    if (!merged.includes(line)) {
      merged.push(line)
    }
  }
  return merged
}

/**
 * Rebuilds the run's summary: one line describing rejected records (derived
 * from outcomes, so it never double counts), then the union of runner and
 * system error lines, then the union of note lines.
 *
 * errorLines counts toward a partial result; noteLines never does.
 */
export function buildErrorSummary(
  previous: string | null,
  outcomes: RecordOutcomes,
  runErrors: readonly string[],
  runNotes: readonly string[] = [],
): { summary: string | null; runnerLines: string[]; noteLines: string[] } {
  const runnerLines = mergeLines(linesWithPrefix(previous, RUNNER_LINE_PREFIX), runErrors, RUNNER_LINE_PREFIX)
  const systemLines = linesWithPrefix(previous, SYSTEM_LINE_PREFIX)
  const noteLines = mergeLines(linesWithPrefix(previous, NOTE_LINE_PREFIX), runNotes, NOTE_LINE_PREFIX)

  const rejected = Object.entries(outcomes).filter(
    ([, outcome]) => outcome.status === 'rejected',
  )
  const lines: string[] = []
  if (rejected.length > 0) {
    const detail = rejected
      .map(([key, outcome]) => `${key} (${outcome.reasons.join(', ')})`)
      .join('; ')
    lines.push(
      `${rejected.length} record${rejected.length === 1 ? '' : 's'} rejected: ${detail}`,
    )
  }
  lines.push(...runnerLines, ...systemLines, ...noteLines)

  if (lines.length === 0) {
    return { summary: null, runnerLines: [...runnerLines, ...systemLines], noteLines }
  }
  const joined = lines.join('\n')
  return {
    summary:
      joined.length > ERROR_SUMMARY_MAX
        ? `${joined.slice(0, ERROR_SUMMARY_MAX - 1)}…`
        : joined,
    runnerLines: [...runnerLines, ...systemLines],
    noteLines,
  }
}

export type IngestSavedRecord = {
  domain: string
  prospectId: string
  fitScore: number | null
  opportunityScore: number | null
  confidence: ProspectConfidence
}

export type IngestResult =
  | {
      ok: true
      runId: string
      runState: ProspectRunState
      saved: IngestSavedRecord[]
      rejected: RejectedRecord[]
      counts: RunCounts
    }
  | {
      ok: false
      status: 404 | 409
      error: string
      runState?: ProspectRunState
    }

export async function ingestBatch(
  store: ProspectIngestStore,
  batch: IngestBatch,
  now: Date,
): Promise<IngestResult> {
  const run = await store.getRun(batch.runId)
  if (run === null) {
    return { ok: false, status: 404, error: 'Run not found' }
  }
  if (run.state !== 'claimed') {
    return {
      ok: false,
      status: 409,
      error: 'Run is not claimed',
      runState: run.state,
    }
  }

  const nowIso = now.toISOString()
  const prepared = prepareBatch(batch, run.config, nowIso)

  const saved: IngestSavedRecord[] = []
  for (const record of prepared.accepted) {
    const { id } = await store.saveProspect(record.write)
    await store.replaceRunEvidence(id, run.id, record.evidence)
    saved.push({
      domain: record.domain,
      prospectId: id,
      fitScore: record.write.fitScore,
      opportunityScore: record.write.opportunityScore,
      confidence: record.write.confidence,
    })
  }

  const outcomes = mergeOutcomes(run.recordOutcomes, prepared)
  const counts = countOutcomes(outcomes)
  const { summary, runnerLines } = buildErrorSummary(
    run.errorSummary,
    outcomes,
    batch.runErrors ?? [],
    batch.runNotes ?? [],
  )

  const finishState =
    batch.finish === undefined
      ? undefined
      : finalRunState(batch.finish, counts, runnerLines)

  const applied = await store.updateRun(run.id, {
    recordOutcomes: outcomes,
    counts,
    errorSummary: summary,
    updatedAt: nowIso,
    finish:
      finishState === undefined
        ? undefined
        : { state: finishState, finishedAt: nowIso },
  })

  if (!applied) {
    return {
      ok: false,
      status: 409,
      error: 'Run is no longer claimed',
    }
  }

  return {
    ok: true,
    runId: run.id,
    runState: finishState ?? 'claimed',
    saved,
    rejected: prepared.rejected,
    counts,
  }
}
