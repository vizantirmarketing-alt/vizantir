/**
 * Research requests from the Assistant page (find_prospects). Pure; the queue
 * and the signer are injected (research-store.ts in production).
 *
 * A request is queued only after the owner confirms it:
 *   1. the interpreted, validated command is shown back as a confirmation,
 *      carrying a signature over the signed-in user, the exact parameters and
 *      the time it was issued; nothing is queued
 *   2. the owner's click sends the command back; the server validates it
 *      again against the catalog and the existing run request rules
 *      (runRequestSchema), checks the signature and its age, the daily limit
 *      and duplicates, and only then queues one run
 * A changed parameter breaks the signature, so a confirmation cannot be
 * altered on the way back, and model output can never produce one: only the
 * owner's click sends it.
 *
 * The run is a one-off prospect_runs row of the same shape the Prospect
 * Research form queues (state requested, config market, industry,
 * targetCount, no exclusions), marked source "assistant". No campaign is
 * created or touched.
 */

import { localDayStartIso } from '@/lib/outreach/dates'
import { formatLocalTimestamp } from '@/lib/briefing/dates'
import type { RunConfig, RunCounts } from '@/lib/prospects/ingest'
import { splitRunSummary } from '@/lib/prospects/ingest'
import type { ProspectRunState } from '@/lib/prospects/params'
import { runRequestSchema } from '@/lib/prospects/run-config'

import type { Command } from '@/lib/assistant/catalog'
import type { RecordLink } from '@/lib/assistant/context'

/** prospect_runs.source for runs queued from the Assistant page. The column is free text and nothing reads it. */
export const ASSISTANT_RUN_SOURCE = 'assistant'
/** Research requests from this page per signed-in user per Los Angeles calendar day. */
export const RESEARCH_REQUESTS_PER_DAY = 3
/** How long a confirmation stays valid. */
export const CONFIRMATION_TTL_MINUTES = 30
/** Requests shown in the Research requests panel. */
export const RESEARCH_REQUESTS_LISTED = 10
/** Run states that count as queued or in progress for the duplicate check. */
export const OPEN_RUN_STATES: readonly ProspectRunState[] = ['requested', 'claimed']

export const PICKUP_NOTE =
  'A queued request is researched at the next scheduled research pass, or sooner if the research runner is started by hand. It does not start immediately.'

export type FindCommand = Extract<Command, { command: 'find_prospects' }>
export type FindRequest = { market: string; industry: string; targetCount: number }

/** A stored run as this page reads it. */
export type ResearchRunRecord = {
  id: string
  state: ProspectRunState
  config: RunConfig | null
  counts: RunCounts
  errorSummary: string | null
  requestedAt: string
  claimedAt: string | null
  finishedAt: string | null
}

/** Every read and the one write research requests make. Reads return null when they fail. */
export type ResearchQueue = {
  /** Runs from this page by this user requested at or after sinceIso, any state. */
  countRequestedSince: (requestedBy: string, sinceIso: string) => Promise<number | null>
  /** Runs from any source that are requested or claimed. */
  openRuns: () => Promise<ResearchRunRecord[] | null>
  /** Inserts one requested run. The only write. */
  queueRun: (request: FindRequest, requestedBy: string) => Promise<{ id: string } | null>
  /** The newest runs from this page. */
  listAssistantRuns: (limit: number) => Promise<ResearchRunRecord[] | null>
}

export type ConfirmationSigner = { sign: (payload: string) => string; verify: (payload: string, signature: string) => boolean }

/** The command's parameters through the existing run request rules (market, industry, count and their caps). Null when they fail. */
export function findRequest(command: FindCommand): FindRequest | null {
  const parsed = runRequestSchema.safeParse({ market: command.params.market, industry: command.params.industry, targetCount: command.params.count })
  if (!parsed.success) return null
  return { market: parsed.data.market, industry: parsed.data.industry, targetCount: parsed.data.targetCount }
}

/** What is signed: the user, the exact parameters and when the confirmation was issued. */
export function confirmationPayload(userId: string, request: FindRequest, issuedAt: string): string {
  return JSON.stringify(['find_prospects', userId, request.market, request.industry, request.targetCount, issuedAt])
}

/** A confirmation's age is valid: issued in the last CONFIRMATION_TTL_MINUTES, and not in the future. */
export function confirmationFresh(issuedAt: string, now: Date): boolean {
  const at = Date.parse(issuedAt)
  if (Number.isNaN(at) || new Date(at).toISOString() !== issuedAt) return false
  const age = now.getTime() - at
  return age >= -60_000 && age <= CONFIRMATION_TTL_MINUTES * 60_000
}

function normalized(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase()
}

/** The same market, industry and count, ignoring case and spacing. */
export function sameRequest(config: RunConfig | null, request: FindRequest): boolean {
  return (
    config !== null &&
    normalized(config.market) === normalized(request.market) &&
    normalized(config.industry) === normalized(request.industry) &&
    config.targetCount === request.targetCount
  )
}

export function describeRequest(request: FindRequest): string {
  return `${request.targetCount} ${request.targetCount === 1 ? 'company' : 'companies'} in the ${request.industry} industry in ${request.market}`
}

export function confirmMessage(request: FindRequest): string {
  return `This will queue one research run to find ${describeRequest(request)}. ${PICKUP_NOTE} Nothing is queued until you confirm.`
}

export function queuedMessage(request: FindRequest): string {
  return `Queued one research run to find ${describeRequest(request)}. ${PICKUP_NOTE} Its progress is under Research requests.`
}

export function dailyLimitMessage(): string {
  return `You have made ${RESEARCH_REQUESTS_PER_DAY} research requests from this page today, the daily limit. Nothing was queued. Try again tomorrow, or use Prospect Research.`
}

export function duplicateMessage(run: ResearchRunRecord, request: FindRequest): string {
  const where = run.state === 'claimed' ? 'is being researched now' : 'is already queued'
  return `An identical request, ${describeRequest(request)}, ${where}. Nothing new was queued.`
}

export type LimitCheck = { ok: true } | { ok: false; kind: 'daily_limit' | 'duplicate'; message: string } | { ok: false; kind: 'error' }

/** The daily limit and the duplicate check, read-only. Run before showing a confirmation and again before queuing. */
export async function checkResearchLimits(queue: ResearchQueue, requestedBy: string, request: FindRequest, now: Date): Promise<LimitCheck> {
  const [count, open] = await Promise.all([queue.countRequestedSince(requestedBy, localDayStartIso(now)), queue.openRuns()])
  if (count === null || open === null) return { ok: false, kind: 'error' }
  if (count >= RESEARCH_REQUESTS_PER_DAY) return { ok: false, kind: 'daily_limit', message: dailyLimitMessage() }
  const duplicate = open.find((run) => OPEN_RUN_STATES.includes(run.state) && sameRequest(run.config, request))
  if (duplicate !== undefined) return { ok: false, kind: 'duplicate', message: duplicateMessage(duplicate, request) }
  return { ok: true }
}

/* ---------- The Research requests panel ---------- */

export type ResearchRequestView = {
  id: string
  asked: string
  requestedAt: string
  stateLabel: 'Queued' | 'Being researched' | 'Finished' | 'Finished with problems' | 'Failed' | 'Cancelled'
  detail: string
  link: RecordLink
}

const RECENT_RUNS_LINK: RecordLink = { label: 'Recent runs on Prospect Research', href: '/intel/prospects' }

const ISO_IN_TEXT = /\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})/g

/** A stored reason for display: no em dashes, any timestamp in Los Angeles time, at most 200 characters. */
function plain(text: string): string {
  const line = text
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(ISO_IN_TEXT, (iso) => formatLocalTimestamp(iso))
    .trim()
  return line.length <= 200 ? line : `${line.slice(0, 199).trimEnd()}…`
}

function savedOf(run: ResearchRunRecord): string {
  return run.config === null ? `${run.counts.saved} saved` : `${run.counts.saved} of ${run.config.targetCount} saved`
}

function firstReason(run: ResearchRunRecord): string | null {
  const reason = splitRunSummary(run.errorSummary).errors[0]
  return reason === undefined ? null : plain(reason)
}

/** One stored run in plain words, with a link to its results or to the runs list. */
export function describeRun(run: ResearchRunRecord): ResearchRequestView {
  const asked = run.config === null ? 'A research request whose details could not be read' : `Find ${describeRequest(run.config)}`
  const requestedAt = formatLocalTimestamp(run.requestedAt)
  const results: RecordLink =
    run.config !== null && run.counts.saved > 0
      ? {
          label: 'Prospects in this market and industry',
          href: `/intel/prospects?market=${encodeURIComponent(run.config.market)}&industry=${encodeURIComponent(run.config.industry)}`,
        }
      : RECENT_RUNS_LINK
  const base = { id: run.id, asked, requestedAt }
  switch (run.state) {
    case 'requested':
      return { ...base, stateLabel: 'Queued', detail: 'Waiting for the next scheduled research pass, or for the research runner to be started by hand.', link: RECENT_RUNS_LINK }
    case 'claimed':
      return { ...base, stateLabel: 'Being researched', detail: 'The research runner has picked it up.', link: RECENT_RUNS_LINK }
    case 'completed':
      return { ...base, stateLabel: 'Finished', detail: `Finished with ${savedOf(run)}.`, link: results }
    case 'partial': {
      const reason = firstReason(run)
      return { ...base, stateLabel: 'Finished with problems', detail: `Finished with ${savedOf(run)}.${reason === null ? '' : ` Recorded problem: ${reason}`}`, link: results }
    }
    case 'failed': {
      const reason = firstReason(run)
      return { ...base, stateLabel: 'Failed', detail: reason === null ? 'Failed. No reason was recorded.' : `Failed: ${reason}`, link: RECENT_RUNS_LINK }
    }
    case 'cancelled':
      return { ...base, stateLabel: 'Cancelled', detail: 'Cancelled before it finished.', link: RECENT_RUNS_LINK }
  }
}

export type ResearchRequestsResult = { ok: true; requests: ResearchRequestView[] } | { ok: false }

/** The panel's rows, newest first, read from the stored runs so they survive a reload. */
export async function listResearchRequests(queue: ResearchQueue): Promise<ResearchRequestsResult> {
  const runs = await queue.listAssistantRuns(RESEARCH_REQUESTS_LISTED)
  return runs === null ? { ok: false } : { ok: true, requests: runs.map(describeRun) }
}
