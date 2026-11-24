/**
 * The command center's one entry point: an instruction in, a reply out.
 * Pure; every dependency is injected (deps.ts in production). The only writes
 * on this path are the rate limit helper's own row and, after the owner
 * confirms a research request, one queued prospect run.
 *
 *   0. authorize (requireIntelUser in production; signed out never gets past it)
 *   1. validate the request (length and shape), then the hourly cap
 *   2. interpret: one model call to one catalog command, or unsupported
 *   3. find_prospects: a confirmation showing exactly what would be queued,
 *      with nothing queued (research.ts); the owner's click comes back as a
 *      separate "confirm" request, validated again, and only that queues one
 *      run
 *   4. resolve prospect references in code; none says so, several are choices.
 *      research_prospect then gets the same confirmation, for a targeted run
 *      whose domain comes from the stored prospect record
 *   5. load the command's data through read-only sources, bounded
 *   6. answer: a second model call from that data only
 * Any model or loader failure returns a plain error and no answer. Every
 * failure path logs one line with a stable reason code and the command name,
 * never the instruction, the answer or any record (see AssistantLog).
 */

import { z } from 'zod'

import type { CallModel } from '@/lib/briefing/narrative'
import { normalizeDomain } from '@/lib/prospects/domain'
import { isUuid } from '@/lib/prospects/params'

import { writeAnswer, type AnswerFailure } from '@/lib/assistant/answer'
import {
  ASSISTANT_MAX_PER_HOUR,
  ASSISTANT_RATE_LIMIT_KEY,
  COMPARE_MAX,
  FINDINGS_LIMIT_DEFAULT,
  INSTRUCTION_MAX,
  UNSUPPORTED_MESSAGE,
  commandSchema,
  understoodAs,
  type Command,
  type CommandName,
} from '@/lib/assistant/catalog'
import {
  PROSPECT_RESEARCH_LINK,
  loadBriefing,
  loadCompare,
  loadExplain,
  loadFindings,
  loadInquiries,
  type AssistantSources,
  type Loaded,
  type RecordLink,
} from '@/lib/assistant/context'
import { interpretInstruction } from '@/lib/assistant/interpret'
import { resolveProspect, type ProspectCandidate } from '@/lib/assistant/resolve'
import {
  checkResearchLimits,
  confirmMessage,
  confirmationFresh,
  confirmationPayload,
  findRequest,
  queuedMessage,
  targetConfirmMessage,
  targetQueuedMessage,
  type ConfirmationSigner,
  type FindCommand,
  type FindRequest,
  type ResearchCommand,
  type ResearchQueue,
  type TargetRequest,
} from '@/lib/assistant/research'

/**
 * Stable reason codes for every failure path, logged server-side only. The
 * owner sees a plain message instead (messageFor).
 */
export const FAILURE_REASONS = [
  'invalid_request',
  'rate_limited',
  'not_configured',
  'model_error',
  'interpret_invalid',
  'resolve_error',
  'same_prospect',
  'prospect_not_found',
  'load_error',
  'context_too_large',
  'answer_invalid_shape',
  'answer_too_long',
  'answer_invalid_url',
  'answer_unsupported_absolute',
  'research_check_error',
  'research_daily_limit',
  'research_duplicate',
  'confirmation_invalid',
  'queue_error',
  'target_unusable',
  'unexpected_error',
] as const satisfies readonly (string | AnswerFailure)[]
export type FailureReason = (typeof FAILURE_REASONS)[number]

/** One log line: a reason code, the command (or none before one is known), and where useful the step and attempts. No text from the owner, the model or any record. */
export type AssistantLog = { reason: FailureReason; command: CommandName | 'unsupported' | 'none'; stage?: 'interpret' | 'answer'; attempts?: number }

/** The production log line, e.g. "[assistant] reason=answer_too_long command=explain_score stage=answer attempts=2". */
export function formatAssistantLog(entry: AssistantLog): string {
  const parts = [`reason=${entry.reason}`, `command=${entry.command}`]
  if (entry.stage !== undefined) parts.push(`stage=${entry.stage}`)
  if (entry.attempts !== undefined) parts.push(`attempts=${entry.attempts}`)
  return `[assistant] ${parts.join(' ')}`
}

export type AssistantDeps = {
  /** Returns the signed-in Intel user, or throws (requireIntelUser redirects to the login page). */
  authorize: () => Promise<{ id: string; email: string }>
  /** One instruction against the hourly cap: true when allowed. */
  allow: (userId: string) => Promise<boolean>
  /** Null when the model is not configured. */
  callModel: CallModel | null
  sources: AssistantSources
  /** Research requests: limits, duplicates, the one queue write and the progress panel. */
  research: ResearchQueue
  /** Signs and checks confirmations. Null when not configured: no confirmation is issued or accepted. */
  signer: ConfirmationSigner | null
  now: () => Date
  /** One server-side line per failure. */
  log: (entry: AssistantLog) => void
}

/** A command waiting for the owner to pick a prospect: sent back with the pick, validated again. */
export type PendingCommand = { instruction: string; command: Command; selections: Record<string, string> }

export type AssistantReply =
  | { ok: true; kind: 'answer'; command: CommandName; understoodAs: string; answer: string; links: RecordLink[] }
  | { ok: true; kind: 'reply'; command: CommandName | 'unsupported'; understoodAs: string | null; message: string; links: RecordLink[] }
  | { ok: true; kind: 'choose'; command: CommandName; understoodAs: string; message: string; ref: string; candidates: ProspectCandidate[]; pending: PendingCommand }
  | {
      ok: true
      kind: 'confirm'
      command: 'find_prospects' | 'research_prospect'
      understoodAs: string
      message: string
      /** Sent back unchanged by the owner's click. The server validates all of it again. */
      confirmation: Confirmation
    }
  | { ok: true; kind: 'queued'; command: 'find_prospects' | 'research_prospect'; understoodAs: string; message: string; runId: string; links: RecordLink[] }
  | { ok: false; error: string; understoodAs: string | null }

/**
 * What a confirm click sends back: the validated command, when it was shown,
 * and the server's signature over both. A targeted request also carries the
 * prospect id; the server re-reads that prospect's stored domain on confirm.
 */
export type Confirmation = { command: FindCommand; issuedAt: string; token: string } | { command: ResearchCommand; prospectId: string; issuedAt: string; token: string }

const instruction = z.string().trim().min(1).max(INSTRUCTION_MAX)
const requestSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('instruction'), instruction }),
  z.strictObject({
    kind: z.literal('continue'),
    instruction,
    command: z.unknown(),
    selections: z.record(z.string().max(500), z.string().refine(isUuid)).refine((value) => Object.keys(value).length <= COMPARE_MAX),
  }),
  z.strictObject({
    kind: z.literal('confirm'),
    command: z.unknown(),
    prospectId: z.string().refine(isUuid).optional(),
    issuedAt: z.string().max(40),
    token: z.string().min(1).max(200),
  }),
])
export type AssistantRequest = z.input<typeof requestSchema>

export const INVALID_REQUEST = `Type an instruction of up to ${INSTRUCTION_MAX} characters.`
export const RATE_LIMITED = `You have reached the limit of ${ASSISTANT_MAX_PER_HOUR} instructions an hour. Try again later.`
export const NOT_SET_UP = 'The assistant is not set up on this server.'
export const MODEL_FAILED = 'The assistant could not answer just now, so nothing was answered. Try again shortly.'
export const ANSWER_REFUSED =
  'The assistant could not produce an answer that met its rules, so nothing was shown. Try asking a narrower question, or ask again.'
export const LOAD_FAILED = 'The data for this could not be loaded, so nothing was answered. Try again shortly.'
export const TOO_LARGE = 'The data for this is too large to answer from in one go, so nothing was answered. Ask about fewer records.'
export const PROSPECT_GONE = 'That prospect could not be found. It may have been removed.'
export const NO_BRIEFING = 'There is no stored briefing yet. One is written each morning, or from the Briefing page.'
export const SAME_PROSPECT = 'Those name the same prospect. Name at least two different prospects to compare.'
export const RESOLVE_FAILED = 'Prospects could not be looked up just now, so nothing was answered. Try again shortly.'

export const TARGET_UNUSABLE =
  "This prospect's saved record has no valid domain, market or industry, so it cannot be researched again from here. Nothing was queued. Use Prospect Research."
export const RESEARCH_CHECK_FAILED = 'The research limits could not be checked just now, so nothing was queued. Try again shortly.'
export const CONFIRMATION_INVALID = 'That confirmation is no longer valid, so nothing was queued. Ask again to get a new confirmation.'
export const QUEUE_FAILED = 'The research request could not be queued just now, so nothing was queued. Try again shortly.'

export function noMatchMessage(ref: string): string {
  return `No prospect matches "${ref}". Check the name or domain, or look it up on Prospect Research.`
}

export function chooseMessage(ref: string): string {
  return `Several prospects match "${ref}". Choose one to continue. Nothing has run yet.`
}

/** The hourly cap through the existing rate limit helper (lib/forms/rate-limit.ts), keyed by the signed-in user. Fails closed. */
export type RateCheck = (opts: { ip: string; formKey: string; windowMinutes: number; maxAttempts: number }) => Promise<{ allowed: boolean }>

export function assistantRateLimit(check: RateCheck): AssistantDeps['allow'] {
  return async (userId) => {
    try {
      // The helper hashes this value with its salt before storing it, as it does an IP.
      return (await check({ ip: `user:${userId}`, formKey: ASSISTANT_RATE_LIMIT_KEY, windowMinutes: 60, maxAttempts: ASSISTANT_MAX_PER_HOUR })).allowed
    } catch {
      return false
    }
  }
}

/** The plain message the owner sees for a failure. Internal codes are never shown. */
export function messageFor(reason: FailureReason): string {
  switch (reason) {
    case 'invalid_request':
      return INVALID_REQUEST
    case 'rate_limited':
      return RATE_LIMITED
    case 'not_configured':
      return NOT_SET_UP
    case 'resolve_error':
      return RESOLVE_FAILED
    case 'same_prospect':
      return SAME_PROSPECT
    case 'prospect_not_found':
      return PROSPECT_GONE
    case 'context_too_large':
      return TOO_LARGE
    case 'answer_invalid_shape':
    case 'answer_too_long':
    case 'answer_invalid_url':
    case 'answer_unsupported_absolute':
      return ANSWER_REFUSED
    case 'research_check_error':
      return RESEARCH_CHECK_FAILED
    case 'confirmation_invalid':
      return CONFIRMATION_INVALID
    case 'queue_error':
      return QUEUE_FAILED
    case 'target_unusable':
      return TARGET_UNUSABLE
    case 'research_daily_limit':
    case 'research_duplicate':
      // Refusals are replies with their own message; this is never shown.
      return QUEUE_FAILED
    case 'load_error':
    case 'unexpected_error':
      return LOAD_FAILED
    case 'model_error':
    case 'interpret_invalid':
      return MODEL_FAILED
  }
}

function prospectRefs(command: Command): string[] {
  if (command.command === 'explain_score') return [command.params.prospect]
  if (command.command === 'compare_prospects') return command.params.prospects
  if (command.command === 'research_prospect') return [command.params.prospect]
  return []
}

export async function handleAssistantRequest(deps: AssistantDeps, raw: unknown): Promise<AssistantReply> {
  // Outside any try: a signed-out caller is refused before anything else runs.
  const user = await deps.authorize()

  let commandName: CommandName | 'none' = 'none'
  let label: string | null = null
  const fail = (reason: FailureReason, extra: Pick<AssistantLog, 'stage' | 'attempts'> = {}): AssistantReply => {
    deps.log({ reason, command: commandName, ...extra })
    return { ok: false, error: messageFor(reason), understoodAs: label }
  }

  const request = requestSchema.safeParse(raw)
  if (!request.success) return fail('invalid_request')
  if (!(await deps.allow(user.id))) return fail('rate_limited')
  if (request.data.kind === 'confirm') {
    try {
      return await confirmResearch(deps, user, request.data, fail, (name, value) => {
        commandName = name
        label = value
      })
    } catch {
      return fail('unexpected_error')
    }
  }

  const callModel = deps.callModel
  if (callModel === null) return fail('not_configured')

  try {
    let command: Command
    let selections: Record<string, string> = {}
    if (request.data.kind === 'instruction') {
      const interpreted = await interpretInstruction(callModel, request.data.instruction)
      if (!interpreted.ok) return fail('model_error', { stage: 'interpret' })
      if (interpreted.interpretation.command === 'unsupported') {
        // A malformed reply is still answered as unsupported, but logged so it can be told apart.
        if (interpreted.malformed) deps.log({ reason: 'interpret_invalid', command: 'unsupported', stage: 'interpret' })
        return { ok: true, kind: 'reply', command: 'unsupported', understoodAs: null, message: UNSUPPORTED_MESSAGE, links: [] }
      }
      command = interpreted.interpretation
    } else {
      // A pick sent back from the page: the command is validated again, never trusted.
      const parsed = commandSchema.safeParse(request.data.command)
      if (!parsed.success) return fail('invalid_request')
      command = parsed.data
      selections = request.data.selections
    }
    commandName = command.command
    label = understoodAs(command)

    if (command.command === 'find_prospects') {
      // Nothing is queued here: the owner sees exactly what would be, and confirms or cancels.
      const findCommand: FindCommand = command
      const research = findRequest(findCommand)
      if (research === null) return fail('invalid_request')
      const limits = await checkResearchLimits(deps.research, user.email, research, deps.now())
      if (!limits.ok) return limitRefusal(deps, limits, label)
      if (deps.signer === null) return fail('not_configured')
      const issuedAt = deps.now().toISOString()
      const confirmed: FindCommand = canonicalFind(research)
      return {
        ok: true,
        kind: 'confirm',
        command: 'find_prospects',
        understoodAs: label,
        message: confirmMessage(research),
        confirmation: { command: confirmed, issuedAt, token: deps.signer.sign(confirmationPayload(user.id, research, issuedAt)) },
      }
    }

    // Prospect references, in code. A pick from the page stands for its reference.
    const ids: string[] = []
    for (const ref of prospectRefs(command)) {
      const picked = selections[ref]
      if (picked !== undefined) {
        ids.push(picked)
        continue
      }
      const resolution = await resolveProspect(deps.sources.searchProspects, ref)
      if (resolution.kind === 'failed') return fail('resolve_error')
      if (resolution.kind === 'none') return { ok: true, kind: 'reply', command: command.command, understoodAs: label, message: noMatchMessage(ref), links: [PROSPECT_RESEARCH_LINK] }
      if (resolution.kind === 'many') {
        return {
          ok: true,
          kind: 'choose',
          command: command.command,
          understoodAs: label,
          message: chooseMessage(ref),
          ref,
          candidates: resolution.candidates,
          pending: { instruction: request.data.instruction, command, selections },
        }
      }
      ids.push(resolution.prospect.id)
    }

    if (command.command === 'research_prospect') {
      // The target domain comes from the stored record, never from typed text or model output.
      const target = await loadTarget(deps.sources, ids[0]!)
      if (!target.ok) return fail(target.reason)
      const limits = await checkResearchLimits(deps.research, user.email, target.target, deps.now())
      if (!limits.ok) return limitRefusal(deps, limits, label, 'research_prospect')
      if (deps.signer === null) return fail('not_configured')
      const issuedAt = deps.now().toISOString()
      return {
        ok: true,
        kind: 'confirm',
        command: 'research_prospect',
        understoodAs: label,
        message: targetConfirmMessage(target.target),
        confirmation: {
          command,
          prospectId: target.target.prospectId,
          issuedAt,
          token: deps.signer.sign(confirmationPayload(user.id, target.target, issuedAt)),
        },
      }
    }

    let loaded: Loaded
    switch (command.command) {
      case 'summarize_briefing':
        loaded = await loadBriefing(deps.sources)
        break
      case 'explain_score':
        loaded = await loadExplain(deps.sources, ids[0]!)
        break
      case 'compare_prospects': {
        const unique = [...new Set(ids)]
        if (unique.length < 2) return fail('same_prospect')
        loaded = await loadCompare(deps.sources, unique)
        break
      }
      case 'review_inquiries':
        loaded = await loadInquiries(deps.sources, deps.now())
        break
      case 'summarize_findings':
        loaded = await loadFindings(deps.sources, command.params.limit ?? FINDINGS_LIMIT_DEFAULT)
        break
    }
    if (!loaded.ok) {
      if (loaded.reason === 'empty') {
        return { ok: true, kind: 'reply', command: command.command, understoodAs: label, message: NO_BRIEFING, links: [{ label: 'Briefing', href: '/intel/briefing' }] }
      }
      return fail(loaded.reason === 'not_found' ? 'prospect_not_found' : loaded.reason === 'too_large' ? 'context_too_large' : 'load_error')
    }

    const answer = await writeAnswer(callModel, command.command, request.data.instruction, loaded.data, loaded.claims)
    if (!answer.ok) return fail(answer.reason, { stage: 'answer', attempts: answer.attempts })
    return { ok: true, kind: 'answer', command: command.command, understoodAs: label, answer: answer.answer, links: loaded.links }
  } catch {
    return fail('unexpected_error')
  }
}

/** The command as it is shown and signed: the parameters after the run request rules. */
function canonicalFind(request: FindRequest): FindCommand {
  return { command: 'find_prospects', params: { market: request.market, industry: request.industry, count: request.targetCount } }
}

/**
 * A saved prospect as a research target, read from its stored record. Refused
 * when the record is gone or has no valid domain, market or industry.
 */
async function loadTarget(
  sources: AssistantSources,
  prospectId: string,
): Promise<{ ok: true; target: TargetRequest } | { ok: false; reason: 'prospect_not_found' | 'load_error' | 'target_unusable' }> {
  const read = await sources.prospectDetail(prospectId)
  if (!read.ok) return { ok: false, reason: read.reason === 'not_found' ? 'prospect_not_found' : 'load_error' }
  const { prospect } = read
  const market = prospect.market?.trim() ?? ''
  const industry = prospect.industry?.trim() ?? ''
  if (normalizeDomain(prospect.domain) !== prospect.domain || market.length === 0 || industry.length === 0) return { ok: false, reason: 'target_unusable' }
  return { ok: true, target: { prospectId: prospect.id, name: prospect.name, domain: prospect.domain, market, industry } }
}

function limitRefusal(
  deps: AssistantDeps,
  limits: Exclude<Awaited<ReturnType<typeof checkResearchLimits>>, { ok: true }>,
  label: string,
  command: 'find_prospects' | 'research_prospect' = 'find_prospects',
): AssistantReply {
  if (limits.kind === 'error') {
    deps.log({ reason: 'research_check_error', command })
    return { ok: false, error: RESEARCH_CHECK_FAILED, understoodAs: label }
  }
  deps.log({ reason: limits.kind === 'daily_limit' ? 'research_daily_limit' : 'research_duplicate', command })
  return { ok: true, kind: 'reply', command, understoodAs: label, message: limits.message, links: [PROSPECT_RESEARCH_LINK] }
}

/**
 * The owner's confirm click. Never re-interprets text: the command is
 * validated again against the catalog (and, for find_prospects, the run
 * request rules); for research_prospect the prospect is read again by id and
 * its stored domain is what is checked and queued. Then the signature and its
 * age, the daily limit and duplicates; only then is one run queued.
 */
async function confirmResearch(
  deps: AssistantDeps,
  user: { id: string; email: string },
  data: { command: unknown; prospectId?: string; issuedAt: string; token: string },
  fail: (reason: FailureReason) => AssistantReply,
  setCommand: (name: CommandName, label: string) => void,
): Promise<AssistantReply> {
  const parsed = commandSchema.safeParse(data.command)
  if (!parsed.success) return fail('invalid_request')
  const command = parsed.data
  if (command.command !== 'find_prospects' && command.command !== 'research_prospect') return fail('invalid_request')
  // A find confirmation carries no prospect; a targeted one must.
  if ((command.command === 'find_prospects') !== (data.prospectId === undefined)) return fail('invalid_request')
  const label = understoodAs(command)
  setCommand(command.command, label)

  let request: FindRequest | TargetRequest
  if (command.command === 'find_prospects') {
    const research = findRequest(command)
    if (research === null) return fail('invalid_request')
    request = research
  } else {
    const target = await loadTarget(deps.sources, data.prospectId!)
    if (!target.ok) return fail(target.reason)
    request = target.target
  }

  if (deps.signer === null) return fail('not_configured')
  const now = deps.now()
  if (!confirmationFresh(data.issuedAt, now) || !deps.signer.verify(confirmationPayload(user.id, request, data.issuedAt), data.token)) {
    return fail('confirmation_invalid')
  }
  const limits = await checkResearchLimits(deps.research, user.email, request, now)
  if (!limits.ok) return limitRefusal(deps, limits, label, command.command)

  if ('domain' in request) {
    const queued = await deps.research.queueTargetedRun(request, user.email)
    if (queued === null) return fail('queue_error')
    return {
      ok: true,
      kind: 'queued',
      command: 'research_prospect',
      understoodAs: label,
      message: targetQueuedMessage(request),
      runId: queued.id,
      links: [{ label: request.name, href: `/intel/prospects/${encodeURIComponent(request.prospectId)}` }],
    }
  }
  const queued = await deps.research.queueRun(request, user.email)
  if (queued === null) return fail('queue_error')
  return {
    ok: true,
    kind: 'queued',
    command: 'find_prospects',
    understoodAs: label,
    message: queuedMessage(request),
    runId: queued.id,
    links: [{ label: 'Recent runs on Prospect Research', href: '/intel/prospects' }],
  }
}
