/**
 * Writing a draft: one server-side model call, the same approach as the
 * briefing. No direct I/O: the store, the model call and the clock are
 * injected (lib/outreach/deps.ts in production, fakes in tests).
 *
 * Order of checks, each refusing with a plain message before any model call:
 *   1. the lead is accepted
 *   2. the settings are complete (a postal address is required)
 *   3. the lead has no approved draft (an unapproved one is replaced)
 *   4. fewer than DAILY_DRAFT_CAP drafts were written today (local time)
 *   5. the model is configured
 * Then the reply must parse and pass every voice check. Any failure gets one
 * retry that lists what was wrong; a second failure refuses. The footer is
 * appended by code, from the settings, never by the model.
 */

import { buildOutreachContext, isDraftable, subjectOf, type OutreachLead } from '@/lib/outreach/context'
import { localDayStartIso } from '@/lib/outreach/dates'
import { DAILY_DRAFT_CAP, OUTREACH_PROMPT_VERSION } from '@/lib/outreach/params'
import { outreachSystemPrompt, outreachUserMessage, parseDraftReply, retryInstruction, type DraftReply } from '@/lib/outreach/prompt'
import { buildFooter, missingSettings, missingSettingsMessage } from '@/lib/outreach/settings'
import type { OutreachStore } from '@/lib/outreach/types'
import { checkVoice, refusalReasons, voiceContextFor, type VoiceViolation } from '@/lib/outreach/voice'
import type { CallModel } from '@/lib/briefing/narrative'

export type DraftDeps = {
  store: OutreachStore
  /** Null when the model is not configured. */
  callModel: CallModel | null
  /** Recorded on the draft. */
  modelName: string
  now(): Date
}

export type WriteDraftRefusal =
  | 'not_accepted'
  | 'settings_incomplete'
  | 'approved_exists'
  | 'daily_cap'
  | 'model_not_configured'
  | 'model_failed'
  | 'rules_not_met'
  | 'conflict'

export type WriteDraftResult =
  | { ok: true; draftId: string; attempts: 1 | 2 }
  | { ok: false; reason: WriteDraftRefusal; message: string }

const MESSAGES: Record<Exclude<WriteDraftRefusal, 'settings_incomplete' | 'rules_not_met'>, string> = {
  not_accepted: 'Accept this lead before drafting an email.',
  approved_exists: 'This lead already has an approved email. Choose Edit again on it before drafting a new one.',
  daily_cap: `${DAILY_DRAFT_CAP} drafts have been written today, the daily limit. Try again tomorrow.`,
  model_not_configured: 'Drafting is not set up on this server.',
  model_failed: 'The draft could not be written. Try again shortly.',
  conflict: 'Another draft for this lead was saved at the same time. Open it from Outreach.',
}

function refuse(reason: Exclude<WriteDraftRefusal, 'settings_incomplete' | 'rules_not_met'>): WriteDraftResult {
  return { ok: false, reason, message: MESSAGES[reason] }
}

type Attempt = { ok: true; reply: DraftReply } | { ok: false; failed: 'model'; reason: string } | { ok: false; failed: 'rules'; violations: VoiceViolation[] }

async function attempt(
  callModel: CallModel,
  system: string,
  user: string,
  check: (reply: DraftReply) => VoiceViolation[],
): Promise<Attempt> {
  let result: Awaited<ReturnType<CallModel>>
  try {
    result = await callModel({ system, user })
  } catch {
    return { ok: false, failed: 'model', reason: 'model_call_failed' }
  }
  if (!result.ok) return { ok: false, failed: 'model', reason: result.reason }
  const parsed = parseDraftReply(result.text)
  if (!parsed.ok) return { ok: false, failed: 'rules', violations: [{ rule: 'reply_format', message: parsed.message }] }
  const violations = check(parsed.reply)
  return violations.length === 0 ? { ok: true, reply: parsed.reply } : { ok: false, failed: 'rules', violations }
}

export async function writeDraft(deps: DraftDeps, lead: OutreachLead): Promise<WriteDraftResult> {
  if (!isDraftable(lead)) return refuse('not_accepted')

  const settings = await deps.store.getSettings()
  const missing = missingSettings(settings)
  if (settings === null || missing.length > 0) {
    return { ok: false, reason: 'settings_incomplete', message: missingSettingsMessage(missing) }
  }

  const { subjectType, subjectRef } = subjectOf(lead)
  const active = await deps.store.findActiveDraft(subjectType, subjectRef)
  if (active?.status === 'approved') return refuse('approved_exists')

  const now = deps.now()
  if ((await deps.store.countCreatedSince(localDayStartIso(now))) >= DAILY_DRAFT_CAP) return refuse('daily_cap')

  if (deps.callModel === null) return refuse('model_not_configured')

  const context = buildOutreachContext(lead)
  const system = outreachSystemPrompt(settings, context)
  const user = outreachUserMessage(context)
  const voiceContext = voiceContextFor(context, settings.studioName)
  const check = (reply: DraftReply) => checkVoice(reply, voiceContext)

  let attempts: 1 | 2 = 1
  let result = await attempt(deps.callModel, system, user, check)
  if (!result.ok) {
    // One retry. A rules failure is told what was wrong; a failed call is simply repeated.
    attempts = 2
    const retrySystem = result.failed === 'rules' ? system + retryInstruction(result.violations) : system
    result = await attempt(deps.callModel, retrySystem, user, check)
  }
  if (!result.ok && result.failed === 'model') return refuse('model_failed')
  if (!result.ok) {
    // Say which rules the last attempt broke, in plain words. Nothing is saved;
    // an existing draft for the lead stays as it was.
    const reasons = refusalReasons(result.violations)
    return {
      ok: false,
      reason: 'rules_not_met',
      message: `The draft did not meet the writing rules after two attempts. On the last attempt: ${reasons.join(' ')} Try again, or write it by hand later.`,
    }
  }

  const saved = await deps.store.insertDraft(
    {
      subjectType,
      subjectRef,
      leadId: lead.id,
      leadName: lead.name.trim(),
      toEmail: null,
      subject: result.reply.subject.trim(),
      body: result.reply.body.trim(),
      footer: buildFooter(settings),
      model: deps.modelName,
      promptVersion: OUTREACH_PROMPT_VERSION,
    },
    active?.status === 'draft' ? active.id : null,
    now.toISOString(),
  )
  if (!saved.ok) return refuse('conflict')
  return { ok: true, draftId: saved.id, attempts }
}
