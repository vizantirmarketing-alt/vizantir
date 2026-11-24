/**
 * Research requests from the Assistant page: find_prospects (an ordinary
 * run) and research_prospect (a targeted run that researches one saved
 * prospect again). Pure; the queue and the signer are injected
 * (research-store.ts in production).
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
 * A find run is a one-off prospect_runs row of the same shape the Prospect
 * Research form queues (state requested, config market, industry,
 * targetCount, no exclusions), marked source "assistant". A targeted run is
 * the same with targetCount 1 and config.targetDomain set to the domain on
 * the stored prospect record, never to typed text or model output. No
 * campaign is created or touched.
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
export type ResearchCommand = Extract<Command, { command: 'research_prospect' }>
export type FindRequest = { market: string; industry: string; targetCount: number }
/** A targeted request, read from the stored prospect record. */
export type TargetRequest = { prospectId: string; name: string; domain: string; market: string; industry: string }

function isTarget(request: FindRequest | TargetRequest): request is TargetRequest {
  return 'domain' in request
}

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
  /** Inserts one requested ordinary run. One of the two writes. */
  queueRun: (request: FindRequest, requestedBy: string) => Promise<{ id: string } | null>
  /** Inserts one requested targeted run (targetCount 1, config.targetDomain). The other write. */
  queueTargetedRun: (request: TargetRequest, requestedBy: string) => Promise<{ id: string } | null>
  /** The newest runs from this page. */
  listAssistantRuns: (limit: number) => Promise<ResearchRunRecord[] | null>
  /** Saved prospects by domain, for naming and linking targeted runs. */
  prospectsByDomain: (domains: readonly string[]) => Promise<Map<string, { id: string; name: string }> | null>
}

export type ConfirmationSigner = { sign: (payload: string) => string; verify: (payload: string, signature: string) => boolean }

/** The command's parameters through the existing run request rules (market, industry, count and their caps). Null when they fail. */
export function findRequest(command: FindCommand): FindRequest | null {
  const parsed = runRequestSchema.safeParse({ market: command.params.market, industry: command.params.industry, targetCount: command.params.count })
  if (!parsed.success) return null
  return { market: parsed.data.market, industry: parsed.data.industry, targetCount: parsed.data.targetCount }
}

/**
 * What is signed: the user, the exact parameters and when the confirmation
 * was issued. For a targeted request, the prospect id and the domain on its
 * stored record, so a confirmation fails if the record's domain changes.
 */
export function confirmationPayload(userId: string, request: FindRequest | TargetRequest, issuedAt: string): string {
  if (isTarget(request)) return JSON.stringify(['research_prospect', userId, request.prospectId, request.domain, issuedAt])
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

/** The same market, industry and count, ignoring case and spacing. A targeted run is never the same as a find request. */
export function sameRequest(config: RunConfig | null, request: FindRequest): boolean {
  return (
    config !== null &&
    config.targetDomain === undefined &&
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

export function describeTarget(request: Pick<TargetRequest, 'name' | 'domain'>): string {
  return `${request.name} (${request.domain})`
}

export const RE_RESEARCH_EFFECT =
  'Its ratings and scores are replaced with what the new research finds and new evidence is added; earlier evidence, your review status and your note are kept.'

export function targetConfirmMessage(request: TargetRequest): string {
  return `This will queue one research run to research ${describeTarget(request)} again. ${RE_RESEARCH_EFFECT} ${PICKUP_NOTE} Nothing is queued until you confirm.`
}

export function targetQueuedMessage(request: TargetRequest): string {
  return `Queued one research run to research ${describeTarget(request)} again. ${PICKUP_NOTE} Its progress is under Research requests.`
}

export function dailyLimitMessage(): string {
  return `You have made ${RESEARCH_REQUESTS_PER_DAY} research requests from this page today, the daily limit. Nothing was queued. Try again tomorrow, or use Prospect Research.`
}

export function duplicateMessage(run: ResearchRunRecord, request: FindRequest | TargetRequest): string {
  const where = run.state === 'claimed' ? 'is being researched now' : 'is already queued'
  if (isTarget(request)) return `A research run for ${describeTarget(request)} ${where}. Nothing new was queued.`
  return `An identical request, ${describeRequest(request)}, ${where}. Nothing new was queued.`
}

export type LimitCheck = { ok: true } | { ok: false; kind: 'daily_limit' | 'duplicate'; message: string } | { ok: false; kind: 'error' }

/** The daily limit and the duplicate check, read-only. Run before showing a confirmation and again before queuing. */
export async function checkResearchLimits(queue: ResearchQueue, requestedBy: string, request: FindRequest | TargetRequest, now: Date): Promise<LimitCheck> {
  const [count, open] = await Promise.all([queue.countRequestedSince(requestedBy, localDayStartIso(now)), queue.openRuns()])
  if (count === null || open === null) return { ok: false, kind: 'error' }
  if (count >= RESEARCH_REQUESTS_PER_DAY) return { ok: false, kind: 'daily_limit', message: dailyLimitMessage() }
  // Find requests match on market, industry and count; targeted requests on the target domain.
  const duplicate = open.find(
    (run) => OPEN_RUN_STATES.includes(run.state) && (isTarget(request) ? run.config?.targetDomain === request.domain : sameRequest(run.config, request)),
  )
  if (duplicate !== undefined) return { ok: false, kind: 'duplicate', message: duplicateMessage(duplicate, request) }
  return { ok: true }
}

/* ---------- The Research requests panel ---------- */

export type ResearchRequestView = {
  id: string
  asked: string
  requestedAt: string
  stateLabel: 'Queued' | 'Being researched' | 'Finished' | 'Finished with problems' | 'Finished and updated' | 'Finished with nothing saved' | 'Failed' | 'Cancelled'
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

/** The first recorded error, else the first note (a targeted run with nothing saved often says why in a note). */
function firstReasonOrNote(run: ResearchRunRecord): string | null {
  const summary = splitRunSummary(run.errorSummary)
  const reason = summary.errors[0] ?? summary.notes[0]
  return reason === undefined ? null : plain(reason)
}

const QUEUED_DETAIL = 'Waiting for the next scheduled research pass, or for the research runner to be started by hand.'
const CLAIMED_DETAIL = 'The research runner has picked it up.'

/** A targeted run in plain words, named and linked from its saved prospect when it can be found. */
function describeTargetedRun(run: ResearchRunRecord, domain: string, prospect: { id: string; name: string } | undefined): ResearchRequestView {
  const name = prospect?.name ?? domain
  const link: RecordLink = prospect === undefined ? RECENT_RUNS_LINK : { label: name, href: `/intel/prospects/${encodeURIComponent(prospect.id)}` }
  const base = { id: run.id, asked: `Research ${name} again`, requestedAt: formatLocalTimestamp(run.requestedAt), link }
  switch (run.state) {
    case 'requested':
      return { ...base, stateLabel: 'Queued', detail: QUEUED_DETAIL }
    case 'claimed':
      return { ...base, stateLabel: 'Being researched', detail: CLAIMED_DETAIL }
    case 'completed':
    case 'partial': {
      if (run.counts.saved > 0) return { ...base, stateLabel: 'Finished and updated', detail: 'Finished. The prospect was updated from the new research.' }
      const reason = firstReasonOrNote(run)
      return { ...base, stateLabel: 'Finished with nothing saved', detail: reason === null ? 'Finished with nothing saved. No reason was recorded.' : `Finished with nothing saved: ${reason}` }
    }
    case 'failed': {
      const reason = firstReason(run)
      return { ...base, stateLabel: 'Failed', detail: reason === null ? 'Failed. No reason was recorded.' : `Failed: ${reason}` }
    }
    case 'cancelled':
      return { ...base, stateLabel: 'Cancelled', detail: 'Cancelled before it finished.' }
  }
}

/** One stored run in plain words, with a link to its results or to the runs list. */
export function describeRun(run: ResearchRunRecord, prospects: ReadonlyMap<string, { id: string; name: string }> = new Map()): ResearchRequestView {
  const targetDomain = run.config?.targetDomain
  if (targetDomain !== undefined) return describeTargetedRun(run, targetDomain, prospects.get(targetDomain))
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
      return { ...base, stateLabel: 'Queued', detail: QUEUED_DETAIL, link: RECENT_RUNS_LINK }
    case 'claimed':
      return { ...base, stateLabel: 'Being researched', detail: CLAIMED_DETAIL, link: RECENT_RUNS_LINK }
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
  if (runs === null) return { ok: false }
  const domains = [...new Set(runs.flatMap((run) => (run.config?.targetDomain === undefined ? [] : [run.config.targetDomain])))]
  // Without names the rows still read correctly, by domain.
  const prospects = (domains.length === 0 ? null : await queue.prospectsByDomain(domains)) ?? new Map<string, { id: string; name: string }>()
  return { ok: true, requests: runs.map((run) => describeRun(run, prospects)) }
}
