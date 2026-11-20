/**
 * The command center's one entry point: an instruction in, a reply out.
 * Pure; every dependency is injected (deps.ts in production). Read-only: the
 * only write anywhere on this path is the rate limit helper's own row.
 *
 *   0. authorize (requireIntelUser in production; signed out never gets past it)
 *   1. validate the request (length and shape), then the hourly cap
 *   2. interpret: one model call to one catalog command, or unsupported
 *   3. find_prospects and research_prospect: a plain "not available yet"
 *      reply, with nothing loaded, resolved or queued
 *   4. resolve prospect references in code; none says so, several are choices
 *   5. load the command's data through read-only sources, bounded
 *   6. answer: a second model call from that data only
 * Any model or loader failure returns a plain error and no answer.
 */

import { z } from 'zod'

import type { CallModel } from '@/lib/briefing/narrative'
import { isUuid } from '@/lib/prospects/params'

import { writeAnswer } from '@/lib/assistant/answer'
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

export type AssistantDeps = {
  /** Returns the signed-in Intel user, or throws (requireIntelUser redirects to the login page). */
  authorize: () => Promise<{ id: string }>
  /** One instruction against the hourly cap: true when allowed. */
  allow: (userId: string) => Promise<boolean>
  /** Null when the model is not configured. */
  callModel: CallModel | null
  sources: AssistantSources
  now: () => Date
}

/** A command waiting for the owner to pick a prospect: sent back with the pick, validated again. */
export type PendingCommand = { instruction: string; command: Command; selections: Record<string, string> }

export type AssistantReply =
  | { ok: true; kind: 'answer'; command: CommandName; understoodAs: string; answer: string; links: RecordLink[] }
  | { ok: true; kind: 'reply'; command: CommandName | 'unsupported'; understoodAs: string | null; message: string; links: RecordLink[] }
  | { ok: true; kind: 'choose'; command: CommandName; understoodAs: string; message: string; ref: string; candidates: ProspectCandidate[]; pending: PendingCommand }
  | { ok: false; error: string }

const instruction = z.string().trim().min(1).max(INSTRUCTION_MAX)
const requestSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('instruction'), instruction }),
  z.strictObject({
    kind: z.literal('continue'),
    instruction,
    command: z.unknown(),
    selections: z.record(z.string().max(500), z.string().refine(isUuid)).refine((value) => Object.keys(value).length <= COMPARE_MAX),
  }),
])
export type AssistantRequest = z.input<typeof requestSchema>

export const INVALID_REQUEST = `Type an instruction of up to ${INSTRUCTION_MAX} characters.`
export const RATE_LIMITED = `You have reached the limit of ${ASSISTANT_MAX_PER_HOUR} instructions an hour. Try again later.`
export const NOT_SET_UP = 'The assistant is not set up on this server.'
export const MODEL_FAILED = 'The assistant could not answer just now, so nothing was answered. Try again shortly.'
export const LOAD_FAILED = 'The data for this could not be loaded, so nothing was answered. Try again shortly.'
export const TOO_LARGE = 'The data for this is too large to answer from in one go, so nothing was answered. Ask about fewer records.'
export const PROSPECT_GONE = 'That prospect could not be found. It may have been removed.'
export const NO_BRIEFING = 'There is no stored briefing yet. One is written each morning, or from the Briefing page.'
export const SAME_PROSPECT = 'Those name the same prospect. Name at least two different prospects to compare.'
const RESOLVE_FAILED = 'Prospects could not be looked up just now, so nothing was answered. Try again shortly.'

export const NOT_AVAILABLE: Record<'find_prospects' | 'research_prospect', string> = {
  find_prospects: 'Starting new research from this page is not available yet. To find new prospects, queue a research run on Prospect Research.',
  research_prospect: 'Starting new research from this page is not available yet. To research a prospect further, open it on Prospect Research.',
}

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

function prospectRefs(command: Command): string[] {
  if (command.command === 'explain_score') return [command.params.prospect]
  if (command.command === 'compare_prospects') return command.params.prospects
  return []
}

function loadFailure(reason: Exclude<Loaded, { ok: true }>['reason'], command: Command): AssistantReply {
  if (reason === 'empty') return { ok: true, kind: 'reply', command: command.command, understoodAs: understoodAs(command), message: NO_BRIEFING, links: [{ label: 'Briefing', href: '/intel/briefing' }] }
  if (reason === 'not_found') return { ok: false, error: PROSPECT_GONE }
  if (reason === 'too_large') return { ok: false, error: TOO_LARGE }
  return { ok: false, error: LOAD_FAILED }
}

export async function handleAssistantRequest(deps: AssistantDeps, raw: unknown): Promise<AssistantReply> {
  // Outside any try: a signed-out caller is refused before anything else runs.
  const user = await deps.authorize()

  const request = requestSchema.safeParse(raw)
  if (!request.success) return { ok: false, error: INVALID_REQUEST }
  if (!(await deps.allow(user.id))) return { ok: false, error: RATE_LIMITED }
  const callModel = deps.callModel
  if (callModel === null) return { ok: false, error: NOT_SET_UP }

  try {
    let command: Command
    let selections: Record<string, string> = {}
    if (request.data.kind === 'instruction') {
      const interpreted = await interpretInstruction(callModel, request.data.instruction)
      if (!interpreted.ok) return { ok: false, error: MODEL_FAILED }
      if (interpreted.interpretation.command === 'unsupported') {
        return { ok: true, kind: 'reply', command: 'unsupported', understoodAs: null, message: UNSUPPORTED_MESSAGE, links: [] }
      }
      command = interpreted.interpretation
    } else {
      // A pick sent back from the page: the command is validated again, never trusted.
      const parsed = commandSchema.safeParse(request.data.command)
      if (!parsed.success) return { ok: false, error: INVALID_REQUEST }
      command = parsed.data
      selections = request.data.selections
    }
    const label = understoodAs(command)

    if (command.command === 'find_prospects' || command.command === 'research_prospect') {
      return { ok: true, kind: 'reply', command: command.command, understoodAs: label, message: NOT_AVAILABLE[command.command], links: [PROSPECT_RESEARCH_LINK] }
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
      if (resolution.kind === 'failed') return { ok: false, error: RESOLVE_FAILED }
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
        if (unique.length < 2) return { ok: false, error: SAME_PROSPECT }
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
    if (!loaded.ok) return loadFailure(loaded.reason, command)

    const answer = await writeAnswer(callModel, command.command, request.data.instruction, loaded.data)
    if (answer === null) return { ok: false, error: MODEL_FAILED }
    return { ok: true, kind: 'answer', command: command.command, understoodAs: label, answer, links: loaded.links }
  } catch {
    return { ok: false, error: LOAD_FAILED }
  }
}
