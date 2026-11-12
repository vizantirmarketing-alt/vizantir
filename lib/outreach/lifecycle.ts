/**
 * What the owner can do to a draft, and the do-not-contact list. Pure; the
 * store is injected.
 *
 *   draft     edit (recipient, subject, body), approve, discard, do not contact
 *   approved  text locked; edit again (back to draft), mark as sent, discard,
 *             do not contact
 *   sent      do not contact (the record stays sent)
 *   discarded nothing
 *
 * Every write is conditional on the status it starts from, so two tabs cannot
 * both act on the same draft: the second finds the status changed and is
 * refused.
 */

import { singleLine } from '@/lib/outreach/mailto'
import {
  OUTREACH_BODY_MAX,
  OUTREACH_SUBJECT_MAX,
  SHARED_MAIL_DOMAINS,
  emailDomain,
  isValidEmail,
  normalizeEmail,
  type SuppressionReason,
} from '@/lib/outreach/params'
import type { OutreachDraft, OutreachStore, Suppression } from '@/lib/outreach/types'

export type LifecycleResult = { ok: true; draft: OutreachDraft } | { ok: false; error: string }

const CHANGED = 'This draft has changed since the page loaded. Reload and try again.'

async function load(store: OutreachStore, id: string): Promise<OutreachDraft | { error: string }> {
  const draft = await store.getDraft(id)
  return draft === null ? { error: 'Draft not found.' } : draft
}

function done(draft: OutreachDraft | null): LifecycleResult {
  return draft === null ? { ok: false, error: CHANGED } : { ok: true, draft }
}

/** Whether an address is suppressed by an exact entry or by a domain entry. */
export function isSuppressed(email: string, entries: readonly Pick<Suppression, 'email' | 'domain'>[]): boolean {
  const address = normalizeEmail(email)
  const domain = emailDomain(address)
  return entries.some((entry) => entry.email === address || (entry.domain !== null && entry.domain === domain))
}

export type DraftEdit = { toEmail: string; subject: string; body: string }

export async function editDraft(store: OutreachStore, id: string, edit: DraftEdit, nowIso: string): Promise<LifecycleResult> {
  const current = await load(store, id)
  if ('error' in current) return { ok: false, error: current.error }
  if (current.status !== 'draft') {
    return { ok: false, error: 'Approved emails are locked. Choose Edit again to change the text.' }
  }
  const toEmail = normalizeEmail(edit.toEmail.replace(/[\r\n]+/g, ''))
  if (toEmail.length > 0 && !isValidEmail(toEmail)) return { ok: false, error: 'Enter a valid recipient email.' }
  const subject = singleLine(edit.subject)
  if (subject.length === 0) return { ok: false, error: 'Add a subject.' }
  if (subject.length > OUTREACH_SUBJECT_MAX) return { ok: false, error: `Keep the subject under ${OUTREACH_SUBJECT_MAX} characters.` }
  const body = edit.body.replace(/\r\n?/g, '\n').trim()
  if (body.length === 0) return { ok: false, error: 'Add a message.' }
  if (body.length > OUTREACH_BODY_MAX) return { ok: false, error: `Keep the message under ${OUTREACH_BODY_MAX} characters.` }
  return done(await store.updateDraft(id, ['draft'], { toEmail: toEmail || null, subject, body, updatedAt: nowIso }))
}

export async function approveDraft(store: OutreachStore, id: string, nowIso: string): Promise<LifecycleResult> {
  const current = await load(store, id)
  if ('error' in current) return { ok: false, error: current.error }
  if (current.status !== 'draft') return { ok: false, error: 'Only a draft that needs review can be approved.' }
  const to = current.toEmail === null ? '' : normalizeEmail(current.toEmail)
  if (!isValidEmail(to)) return { ok: false, error: 'Add a valid recipient email before approving.' }
  const matches = await store.findSuppressions(to, emailDomain(to))
  if (isSuppressed(to, matches)) {
    return { ok: false, error: 'This address is on the do-not-contact list, by address or by domain. It cannot be approved.' }
  }
  return done(await store.updateDraft(id, ['draft'], { status: 'approved', approvedAt: nowIso, updatedAt: nowIso }))
}

export async function editAgain(store: OutreachStore, id: string, nowIso: string): Promise<LifecycleResult> {
  return done(await store.updateDraft(id, ['approved'], { status: 'draft', approvedAt: null, updatedAt: nowIso }))
}

export async function markSent(store: OutreachStore, id: string, nowIso: string): Promise<LifecycleResult> {
  return done(await store.updateDraft(id, ['approved'], { status: 'sent', sentAt: nowIso, updatedAt: nowIso }))
}

export async function discardDraft(store: OutreachStore, id: string, nowIso: string): Promise<LifecycleResult> {
  return done(await store.updateDraft(id, ['draft', 'approved'], { status: 'discarded', updatedAt: nowIso }))
}

/**
 * Adds the draft's recipient to the do-not-contact list, then discards the
 * draft. A sent email stays recorded as sent; its recipient is still added.
 */
export async function doNotContact(store: OutreachStore, id: string, nowIso: string): Promise<LifecycleResult> {
  const current = await load(store, id)
  if ('error' in current) return { ok: false, error: current.error }
  if (current.status === 'discarded') return { ok: false, error: 'This draft was discarded.' }
  const to = current.toEmail === null ? '' : normalizeEmail(current.toEmail)
  if (!isValidEmail(to)) return { ok: false, error: 'Add the recipient email first, so it can be added to the do-not-contact list.' }
  await store.addSuppression({ email: to, domain: null, reason: 'do_not_contact' }, nowIso)
  if (current.status === 'sent') return { ok: true, draft: current }
  return done(await store.updateDraft(id, ['draft', 'approved'], { status: 'discarded', updatedAt: nowIso }))
}

export type AddSuppressionResult = { ok: true; outcome: 'added' | 'exists' } | { ok: false; error: string }

export async function addSuppressionByHand(
  store: OutreachStore,
  input: { email: string; wholeDomain: boolean },
  nowIso: string,
  reason: SuppressionReason = 'manual',
): Promise<AddSuppressionResult> {
  const email = normalizeEmail(input.email.replace(/[\r\n]+/g, ''))
  if (!isValidEmail(email)) return { ok: false, error: 'Enter a valid email address.' }
  const domain = emailDomain(email)
  if (input.wholeDomain && domain !== null && SHARED_MAIL_DOMAINS.has(domain)) {
    return { ok: false, error: `${domain} is a shared mail provider. Block the address only, not the whole domain.` }
  }
  const outcome = await store.addSuppression({ email, domain: input.wholeDomain ? domain : null, reason }, nowIso)
  return { ok: true, outcome }
}

/** Removing an entry needs an explicit confirmation from the page. */
export async function removeSuppression(store: OutreachStore, id: string, confirmed: boolean): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!confirmed) return { ok: false, error: 'Confirm the removal first.' }
  return (await store.removeSuppression(id)) ? { ok: true } : { ok: false, error: 'Entry not found.' }
}
