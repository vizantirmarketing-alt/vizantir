/**
 * Writing a draft: one server-side model call, the same approach as the
 * briefing. No direct I/O: the store, the model call and the clock are
 * injected (lib/outreach/deps.ts in production, fakes in tests).
 *
 * Order of checks, each refusing with a plain message before any model call:
 *   1. the lead is accepted, is not closed by a call (asked not to be
 *      contacted, or a latest call of not interested or wrong number), and has a
 *      specific finding (hasSpecificFinding); a lead without one is never
 *      sent to the model, and the owner can write the email by hand instead
 *      (writeManualDraft)
 *   2. the settings are complete (a postal address is required)
 *   3. the lead has no approved draft (an unapproved one is replaced)
 *   4. fewer than DAILY_DRAFT_CAP drafts were written today (local time)
 *   5. the model is configured
 * Then the reply must parse and pass every voice check. Any failure gets one
 * retry that lists what was wrong; a second failure refuses. The footer is
 * appended by code, from the settings, never by the model.
 *
 * To starts as the lead's found contact address (lib/outreach/contacts/)
 * when there is one and it is not on the do-not-contact list; otherwise it
 * starts empty. The owner can always change it, and nothing is ever sent
 * without the owner's click.
 */

import { ASKED_NOT_TO_CONTACT_REFUSAL, callHistoryUnreadable, closedLeadRefusal, readClosedBy, type CallStore } from '@/lib/outreach/calls'
import { NO_FINDING_TEXT, buildOutreachContext, hasSpecificFinding, isDraftable, subjectOf, type OutreachLead } from '@/lib/outreach/context'
import { singleLine } from '@/lib/outreach/mailto'
import { localDayStartIso } from '@/lib/outreach/dates'
import { DAILY_DRAFT_CAP, OUTREACH_PROMPT_VERSION } from '@/lib/outreach/params'
import { outreachSystemPrompt, outreachUserMessage, parseDraftReply, retryInstruction, type DraftReply } from '@/lib/outreach/prompt'
import { buildFooter, missingSettings, missingSettingsMessage } from '@/lib/outreach/settings'
import type { OutreachStore } from '@/lib/outreach/types'
import type { ContactStore } from '@/lib/outreach/contacts/runs'
import { isSuppressed } from '@/lib/outreach/lifecycle'
import { OUTREACH_BODY_MAX, OUTREACH_SUBJECT_MAX, emailDomain, isValidEmail, normalizeEmail } from '@/lib/outreach/params'
import { checkVoice, refusalReasons, voiceContextFor, type VoiceViolation } from '@/lib/outreach/voice'
import type { CallModel } from '@/lib/briefing/narrative'

export type DraftDeps = {
  store: OutreachStore
  /** Null when the model is not configured. */
  callModel: CallModel | null
  /** Recorded on the draft. */
  modelName: string
  now(): Date
  /** The found contact addresses. Absent or failing: To starts empty. */
  contacts?: Pick<ContactStore, 'getContact'>
  /** The call log. Required: a log that cannot be read refuses drafting. */
  calls: Pick<CallStore, 'callsFor'>
}

/** Recorded as both the model and the prompt version of a draft the owner wrote by hand. */
export const MANUAL_PROMPT_VERSION = 'manual'

/** The lead's found address when it may be used: valid and not on the do-not-contact list. */
export async function prefillRecipient(
  store: Pick<OutreachStore, 'findSuppressions'>,
  contacts: Pick<ContactStore, 'getContact'> | undefined,
  subject: { subjectType: OutreachLead['type']; subjectRef: string },
): Promise<string | null> {
  if (contacts === undefined) return null
  let found: string | null = null
  try {
    const contact = await contacts.getContact(subject)
    found = contact?.status === 'found' && contact.email !== null ? normalizeEmail(contact.email) : null
  } catch {
    // Before migration 0034, or a failed read: drafting goes on with To empty.
    return null
  }
  if (found === null || !isValidEmail(found)) return null
  try {
    const matches = await store.findSuppressions(found, emailDomain(found))
    return isSuppressed(found, matches) ? null : found
  } catch {
    // The do-not-contact list could not be read, so the address is not used.
    return null
  }
}

export type WriteDraftRefusal =
  | 'not_accepted'
  | 'asked_not_to_contact'
  /** Closed by a latest call of "Spoke: not interested" or "Wrong number". */
  | 'closed'
  /** The call history could not be read, so the lead could not be checked. */
  | 'calls_unreadable'
  | 'no_finding'
  | 'draft_exists'
  | 'invalid'
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

const MESSAGES: Record<Exclude<WriteDraftRefusal, 'settings_incomplete' | 'rules_not_met' | 'invalid' | 'closed'>, string> = {
  calls_unreadable: callHistoryUnreadable('drafted'),
  not_accepted: 'Accept this lead before drafting an email.',
  asked_not_to_contact: ASKED_NOT_TO_CONTACT_REFUSAL,
  no_finding: NO_FINDING_TEXT,
  draft_exists: 'This lead already has a draft. Open it from Outreach.',
  approved_exists: 'This lead already has an approved email. Choose Edit again on it before drafting a new one.',
  daily_cap: `${DAILY_DRAFT_CAP} drafts have been written today, the daily limit. Try again tomorrow.`,
  model_not_configured: 'Drafting is not set up on this server.',
  model_failed: 'The draft could not be written. Try again shortly.',
  conflict: 'Another draft for this lead was saved at the same time. Open it from Outreach.',
}

/** A lead closed by a call: asked not to be contacted keeps its own refusal; the other closing outcomes refuse as approving and sending do. */
async function closedRefusal(calls: DraftDeps['calls'], subject: { subjectType: OutreachLead['type']; subjectRef: string }): Promise<WriteDraftResult | null> {
  const read = await readClosedBy(calls, subject)
  if (!read.readable) return refuse('calls_unreadable')
  if (read.closedBy === null) return null
  if (read.closedBy === 'asked_not_to_contact') return refuse('asked_not_to_contact')
  return { ok: false, reason: 'closed', message: closedLeadRefusal(read.closedBy) }
}

function refuse(reason: Exclude<WriteDraftRefusal, 'settings_incomplete' | 'rules_not_met' | 'invalid' | 'closed'>): WriteDraftResult {
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
  const closed = await closedRefusal(deps.calls, subjectOf(lead))
  if (closed !== null) return closed
  // Nothing specific to say: the model is never called, whatever the page sent.
  if (!hasSpecificFinding(lead)) return refuse('no_finding')

  const settings = await deps.store.getSettings()
  const missing = missingSettings(settings)
  if (settings === null || missing.length > 0) {
    return { ok: false, reason: 'settings_incomplete', message: missingSettingsMessage(missing) }
  }

  const { subjectType, subjectRef } = subjectOf(lead)
  const active = await deps.store.findActiveDraft(subjectType, subjectRef)
  // Approved, being sent or not confirmed: the text is locked.
  if (active !== null && active.status !== 'draft') return refuse('approved_exists')

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
      toEmail: await prefillRecipient(deps.store, deps.contacts, { subjectType, subjectRef }),
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

export type ManualDraftInput = { toEmail: string; subject: string; body: string }

/**
 * "Write it yourself": a draft the owner writes by hand, with no model call.
 * The owner fills in the subject and the message on the compose page; the row
 * is created on the first save, because a stored draft always has a subject
 * and a body. To starts as for a written draft, the footer is the normal one,
 * and the model and prompt version are recorded as "manual". The hard voice
 * rules are checked when it is approved and when it is sent.
 */
export async function writeManualDraft(
  deps: Pick<DraftDeps, 'store' | 'now' | 'calls'>,
  lead: OutreachLead,
  input: ManualDraftInput,
): Promise<WriteDraftResult> {
  if (!isDraftable(lead)) return refuse('not_accepted')
  const { subjectType, subjectRef } = subjectOf(lead)
  const closed = await closedRefusal(deps.calls, { subjectType, subjectRef })
  if (closed !== null) return closed

  const settings = await deps.store.getSettings()
  const missing = missingSettings(settings)
  if (settings === null || missing.length > 0) {
    return { ok: false, reason: 'settings_incomplete', message: missingSettingsMessage(missing) }
  }

  const toEmail = normalizeEmail(input.toEmail.replace(/[\r\n]+/g, ''))
  if (toEmail.length > 0 && !isValidEmail(toEmail)) return { ok: false, reason: 'invalid', message: 'Enter a valid recipient email.' }
  const subject = singleLine(input.subject)
  if (subject.length === 0) return { ok: false, reason: 'invalid', message: 'Add a subject.' }
  if (subject.length > OUTREACH_SUBJECT_MAX) return { ok: false, reason: 'invalid', message: `Keep the subject under ${OUTREACH_SUBJECT_MAX} characters.` }
  const body = input.body.replace(/\r\n?/g, '\n').trim()
  if (body.length === 0) return { ok: false, reason: 'invalid', message: 'Add a message.' }
  if (body.length > OUTREACH_BODY_MAX) return { ok: false, reason: 'invalid', message: `Keep the message under ${OUTREACH_BODY_MAX} characters.` }

  if ((await deps.store.findActiveDraft(subjectType, subjectRef)) !== null) return refuse('draft_exists')

  const saved = await deps.store.insertDraft(
    {
      subjectType,
      subjectRef,
      leadId: lead.id,
      leadName: lead.name.trim(),
      toEmail: toEmail.length > 0 ? toEmail : null,
      subject,
      body,
      footer: buildFooter(settings),
      model: MANUAL_PROMPT_VERSION,
      promptVersion: MANUAL_PROMPT_VERSION,
    },
    null,
    deps.now().toISOString(),
  )
  if (!saved.ok) return refuse('conflict')
  return { ok: true, draftId: saved.id, attempts: 1 }
}
