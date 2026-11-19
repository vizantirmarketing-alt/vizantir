'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireIntelUser } from '@/lib/auth/allowlist'
import { MAX_WAITING_CONTACT_RUNS, queueLeadContactCheck } from '@/lib/outreach/contacts/runs'
import { createContactStore } from '@/lib/outreach/contacts/store'
import { MAX_WAITING_SITE_REVIEW_RUNS, queueLeadSiteReview } from '@/lib/outreach/site-reviews/runs'
import { createSiteReviewStore } from '@/lib/outreach/site-reviews/store'
import { createDraftDeps, createOutreachStore } from '@/lib/outreach/deps'
import { writeDraft, writeManualDraft } from '@/lib/outreach/draft'
import { callInputSchema, logCall, readClosedBy } from '@/lib/outreach/calls'
import { createCallStore } from '@/lib/outreach/calls-store'
import { disconnect } from '@/lib/outreach/gmail/connect'
import { checkDraftRules, createGmailConnectionStore, createSendDeps, readGmailConfig } from '@/lib/outreach/gmail/deps'
import { OUTREACH_SETTINGS_PATH } from '@/lib/outreach/gmail/flash'
import { approveAndSend as approveAndSendDraft } from '@/lib/outreach/gmail/send'
import { loadBusinessLead, loadProspectLead } from '@/lib/outreach/leads'
import {
  addSuppressionByHand,
  approveDraft,
  discardDraft,
  doNotContact,
  editAgain,
  editDraft,
  markSent,
  removeSuppression,
  type ApproveGuards,
  type LifecycleResult,
} from '@/lib/outreach/lifecycle'
import {
  OUTREACH_BODY_MAX,
  OUTREACH_EMAIL_MAX,
  OUTREACH_SUBJECT_MAX,
  OUTREACH_SUBJECT_TYPES,
  type OutreachSubjectType,
} from '@/lib/outreach/params'
import { settingsInputSchema } from '@/lib/outreach/settings'
import type { OutreachDraft } from '@/lib/outreach/types'
import type { RulesFinding } from '@/lib/outreach/rules-check'
import { isUuid } from '@/lib/prospects/params'

export type OutreachActionResult = { ok: true } | { ok: false; error: string }
/** A saved edit, with what the hard writing rules found in the saved text. */
export type SaveDraftActionResult = { ok: true; rules: RulesFinding } | { ok: false; error: string }
export type WriteDraftActionResult = { ok: true; draftId: string } | { ok: false; error: string }

const GENERIC_ERROR = 'Unable to save. Try again shortly.'

function revalidateDraft(draft?: Pick<OutreachDraft, 'id' | 'subjectType' | 'leadId'>): void {
  revalidatePath('/intel/outreach')
  if (draft === undefined) return
  revalidatePath(`/intel/outreach/${draft.id}`)
  if (draft.subjectType === 'prospect') revalidatePath(`/intel/prospects/${draft.leadId}`)
  else revalidatePath('/intel/new-businesses')
}

/** The Outreach page and its settings page: settings, the do-not-contact list and the Google connection show on both. */
function revalidateSettings(): void {
  revalidatePath('/intel/outreach')
  revalidatePath(OUTREACH_SETTINGS_PATH)
}

const writeSchema = z.object({ subjectType: z.enum(OUTREACH_SUBJECT_TYPES), leadId: z.string().refine(isUuid) })

/**
 * Writes a first-contact draft for an accepted lead, replacing one that has
 * not been approved. One model call, retried once.
 */
export async function writeOutreachDraft(subjectType: OutreachSubjectType, leadId: string): Promise<WriteDraftActionResult> {
  await requireIntelUser()
  const parsed = writeSchema.safeParse({ subjectType, leadId })
  if (!parsed.success) return { ok: false, error: 'Lead not found.' }
  try {
    const lead =
      parsed.data.subjectType === 'prospect' ? await loadProspectLead(parsed.data.leadId) : await loadBusinessLead(parsed.data.leadId)
    if (!lead.ok) {
      return { ok: false, error: lead.reason === 'not_found' ? 'Lead not found.' : 'Unable to load this lead. Try again shortly.' }
    }
    const result = await writeDraft(createDraftDeps(), lead.lead)
    if (!result.ok) return { ok: false, error: result.message }
    revalidatePath('/intel/outreach')
    if (parsed.data.subjectType === 'prospect') revalidatePath(`/intel/prospects/${parsed.data.leadId}`)
    else revalidatePath('/intel/new-businesses')
    return { ok: true, draftId: result.draftId }
  } catch {
    console.error('Outreach draft failed')
    return { ok: false, error: 'The draft could not be written. Try again shortly.' }
  }
}

/**
 * "Find contact email" for one accepted lead: queues a one-lead run for the
 * research runner, or records "no page to check" at once when the lead has no
 * website or listing page. Never sends anything and never changes a draft.
 */
export async function findContactEmail(subjectType: OutreachSubjectType, leadId: string): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  await requireIntelUser()
  const parsed = writeSchema.safeParse({ subjectType, leadId })
  if (!parsed.success) return { ok: false, error: 'Lead not found.' }
  try {
    const result = await queueLeadContactCheck(createContactStore(), parsed.data, new Date())
    revalidatePath('/intel/outreach', 'layout')
    if (parsed.data.subjectType === 'prospect') revalidatePath(`/intel/prospects/${parsed.data.leadId}`)
    else revalidatePath('/intel/new-businesses')
    switch (result.outcome) {
      case 'queued':
        return { ok: true, message: 'Queued. It runs with the next scheduled research.' }
      case 'no_page':
        return { ok: true, message: 'There is no website or listing page to check for this lead.' }
      case 'waiting_for_website_check':
        return { ok: false, error: 'The website check has not run for this business yet. Try again after it has.' }
      case 'not_accepted':
        return { ok: false, error: 'Accept this lead before looking for a contact address.' }
      case 'already_waiting':
        return { ok: false, error: 'This lead is already waiting to be checked.' }
      case 'limit_reached':
        return { ok: false, error: `${MAX_WAITING_CONTACT_RUNS} contact checks are already waiting. Try again after the next scheduled research.` }
    }
  } catch {
    console.error('Contact check queuing failed')
    return { ok: false, error: 'Unable to queue the check. If this is the first use since the update, migration 0034 may not be applied yet.' }
  }
}

/**
 * "Review this site" and "Review again" for one accepted business with its
 * own website: queues a one-lead run for the research runner. Never sends
 * anything and never changes a draft.
 */
export async function reviewBusinessSite(leadId: string): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  await requireIntelUser()
  if (typeof leadId !== 'string' || !isUuid(leadId)) return { ok: false, error: 'Lead not found.' }
  try {
    const result = await queueLeadSiteReview(createSiteReviewStore(), { leadId }, new Date())
    revalidatePath('/intel/outreach')
    revalidatePath('/intel/new-businesses')
    switch (result.outcome) {
      case 'queued':
        return { ok: true, message: 'Queued. It runs with the next scheduled research.' }
      case 'no_site':
        return { ok: false, error: 'Only a business whose own website was found can have its site reviewed.' }
      case 'not_accepted':
        return { ok: false, error: 'Accept this business before reviewing its site.' }
      case 'already_reviewed':
        return { ok: false, error: 'This site has already been reviewed.' }
      case 'already_waiting':
        return { ok: false, error: 'This site is already waiting to be reviewed.' }
      case 'limit_reached':
        return { ok: false, error: `${MAX_WAITING_SITE_REVIEW_RUNS} site reviews are already waiting. Try again after the next scheduled research.` }
    }
  } catch {
    console.error('Site review queuing failed')
    return { ok: false, error: 'Unable to queue the review. If this is the first use since the update, migration 0036 may not be applied yet.' }
  }
}

/** Drafts again for the same lead, replacing this draft while it still needs review. */
export async function writeOutreachDraftAgain(draftId: string): Promise<WriteDraftActionResult> {
  await requireIntelUser()
  if (!isUuid(draftId)) return { ok: false, error: 'Draft not found.' }
  try {
    const draft = await createOutreachStore().getDraft(draftId)
    if (draft === null) return { ok: false, error: 'Draft not found.' }
    if (draft.status !== 'draft') return { ok: false, error: 'Only a draft that needs review can be drafted again.' }
    return await writeOutreachDraft(draft.subjectType, draft.leadId)
  } catch {
    console.error('Outreach draft failed')
    return { ok: false, error: 'The draft could not be written. Try again shortly.' }
  }
}

async function lifecycle(id: string, run: (nowIso: string) => Promise<LifecycleResult>): Promise<OutreachActionResult> {
  await requireIntelUser()
  if (!isUuid(id)) return { ok: false, error: 'Draft not found.' }
  try {
    const result = await run(new Date().toISOString())
    if (!result.ok) return { ok: false, error: result.error }
    revalidateDraft(result.draft)
    return { ok: true }
  } catch {
    console.error('Outreach draft update failed')
    return { ok: false, error: GENERIC_ERROR }
  }
}

const editSchema = z.object({
  toEmail: z.string().max(OUTREACH_EMAIL_MAX + 10, 'Enter a valid recipient email.'),
  subject: z.string().max(OUTREACH_SUBJECT_MAX + 10, `Keep the subject under ${OUTREACH_SUBJECT_MAX} characters.`),
  body: z.string().max(OUTREACH_BODY_MAX + 10, `Keep the message under ${OUTREACH_BODY_MAX} characters.`),
})

/**
 * Saves an edit. The hard writing rules never refuse the save; what they find
 * in the saved text comes back with it, for the notice on the draft page.
 */
export async function saveOutreachDraft(id: string, edit: { toEmail: string; subject: string; body: string }): Promise<SaveDraftActionResult> {
  await requireIntelUser()
  const parsed = editSchema.safeParse(edit)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the draft.' }
  if (!isUuid(id)) return { ok: false, error: 'Draft not found.' }
  try {
    const store = createOutreachStore()
    const result = await editDraft(store, id, parsed.data, new Date().toISOString(), draftGuards(store, createCallStore()))
    if (!result.ok) return { ok: false, error: result.error }
    revalidateDraft(result.draft)
    return { ok: true, rules: result.rules }
  } catch {
    console.error('Outreach draft update failed')
    return { ok: false, error: GENERIC_ERROR }
  }
}

/** The call history and the hard writing rules: the call history refuses a save or an approval; the rules refuse an approval and are reported after a save. */
function draftGuards(store: ReturnType<typeof createOutreachStore>, calls: ReturnType<typeof createCallStore>): ApproveGuards {
  return {
    closedBy: (draft) => readClosedBy(calls, draft),
    checkRules: async (draft) => checkDraftRules(draft, (await store.getSettings())?.studioName ?? ''),
  }
}

export async function approveOutreachDraft(id: string): Promise<OutreachActionResult> {
  return lifecycle(id, async (now) => {
    const store = createOutreachStore()
    const calls = createCallStore()
    return approveDraft(store, id, now, draftGuards(store, calls))
  })
}

const manualSchema = z.object({
  toEmail: z.string().max(OUTREACH_EMAIL_MAX + 10, 'Enter a valid recipient email.'),
  subject: z.string().max(OUTREACH_SUBJECT_MAX + 10, `Keep the subject under ${OUTREACH_SUBJECT_MAX} characters.`),
  body: z.string().max(OUTREACH_BODY_MAX + 10, `Keep the message under ${OUTREACH_BODY_MAX} characters.`),
})

/**
 * Saves an email the owner wrote by hand as a new draft. No model call. The
 * hard writing rules never refuse it; the draft page shows what they find.
 */
export async function createManualDraft(
  subjectType: OutreachSubjectType,
  leadId: string,
  input: { toEmail: string; subject: string; body: string },
): Promise<WriteDraftActionResult> {
  await requireIntelUser()
  const parsedLead = writeSchema.safeParse({ subjectType, leadId })
  if (!parsedLead.success) return { ok: false, error: 'Lead not found.' }
  const parsed = manualSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the email.' }
  try {
    const lead =
      parsedLead.data.subjectType === 'prospect' ? await loadProspectLead(parsedLead.data.leadId) : await loadBusinessLead(parsedLead.data.leadId)
    if (!lead.ok) return { ok: false, error: lead.reason === 'not_found' ? 'Lead not found.' : 'Unable to load this lead. Try again shortly.' }
    const result = await writeManualDraft({ store: createOutreachStore(), now: () => new Date(), calls: createCallStore() }, lead.lead, parsed.data)
    if (!result.ok) return { ok: false, error: result.message }
    revalidatePath('/intel/outreach')
    if (parsedLead.data.subjectType === 'prospect') revalidatePath(`/intel/prospects/${parsedLead.data.leadId}`)
    else revalidatePath('/intel/new-businesses')
    return { ok: true, draftId: result.draftId }
  } catch {
    console.error('Outreach manual draft failed')
    return { ok: false, error: GENERIC_ERROR }
  }
}

const callSchema = z.object({ subjectType: z.enum(OUTREACH_SUBJECT_TYPES), subjectRef: z.string().min(1).max(500) })

/**
 * Records a call the owner made. Nothing is dialled or sent. After "Asked not
 * to be contacted", the lead's found email address goes on the
 * do-not-contact list.
 */
export async function logOutreachCall(
  subjectType: OutreachSubjectType,
  subjectRef: string,
  input: { outcome: string; note: string },
): Promise<OutreachActionResult> {
  const user = await requireIntelUser()
  const subject = callSchema.safeParse({ subjectType, subjectRef })
  const parsed = callInputSchema.safeParse(input)
  if (!subject.success) return { ok: false, error: 'Lead not found.' }
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Choose how the call went.' }
  try {
    const contactStore = createContactStore()
    const lead = (await contactStore.listAcceptedLeads()).find(
      (candidate) => candidate.subjectType === subject.data.subjectType && candidate.subjectRef === subject.data.subjectRef,
    )
    if (lead === undefined) return { ok: false, error: 'Accept this lead before logging a call.' }
    const now = new Date().toISOString()
    const store = createOutreachStore()
    const result = await logCall(
      {
        calls: createCallStore(),
        foundEmail: async () => {
          const contact = await contactStore.getContact(lead)
          return contact?.status === 'found' && contact.email !== null ? contact.email : null
        },
        suppress: async (email) => {
          await addSuppressionByHand(store, { email, wholeDomain: false }, now, 'do_not_contact')
        },
      },
      { subject: { subjectType: lead.subjectType, subjectRef: lead.subjectRef }, leadId: lead.leadId, outcome: parsed.data.outcome, note: parsed.data.note, createdBy: user.email },
      now,
    )
    if (!result.ok) return result
    revalidatePath('/intel/outreach')
    revalidatePath(OUTREACH_SETTINGS_PATH)
    return { ok: true }
  } catch {
    console.error('Outreach call log failed')
    return { ok: false, error: 'Unable to save the call. If this is the first use since the update, migration 0035 may not be applied yet.' }
  }
}

export async function editOutreachDraftAgain(id: string): Promise<OutreachActionResult> {
  return lifecycle(id, (now) => editAgain(createOutreachStore(), id, now))
}

export async function markOutreachDraftSent(id: string): Promise<OutreachActionResult> {
  return lifecycle(id, (now) => markSent(createOutreachStore(), id, now))
}

export async function discardOutreachDraft(id: string): Promise<OutreachActionResult> {
  return lifecycle(id, (now) => discardDraft(createOutreachStore(), id, now))
}

export async function doNotContactOutreachDraft(id: string): Promise<OutreachActionResult> {
  return lifecycle(id, (now) => doNotContact(createOutreachStore(), id, now))
}

export async function saveOutreachSettings(input: {
  senderName: string
  studioName: string
  replyToEmail: string
  postalAddress: string
}): Promise<OutreachActionResult> {
  await requireIntelUser()
  const parsed = settingsInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the settings.' }
  try {
    await createOutreachStore().saveSettings(parsed.data, new Date().toISOString())
    revalidateSettings()
    return { ok: true }
  } catch {
    console.error('Outreach settings save failed')
    return { ok: false, error: GENERIC_ERROR }
  }
}

const suppressionSchema = z.object({ email: z.string().max(OUTREACH_EMAIL_MAX + 10), wholeDomain: z.boolean() })

export async function addOutreachSuppression(email: string, wholeDomain: boolean): Promise<OutreachActionResult & { message?: string }> {
  await requireIntelUser()
  const parsed = suppressionSchema.safeParse({ email, wholeDomain })
  if (!parsed.success) return { ok: false, error: 'Enter a valid email address.' }
  try {
    const result = await addSuppressionByHand(createOutreachStore(), parsed.data, new Date().toISOString())
    if (!result.ok) return { ok: false, error: result.error }
    revalidateSettings()
    return { ok: true, message: result.outcome === 'exists' ? 'Already on the list.' : 'Added.' }
  } catch {
    console.error('Outreach suppression add failed')
    return { ok: false, error: GENERIC_ERROR }
  }
}

/** Removal needs confirmed: true, sent only by the page's confirm step. */
export async function removeOutreachSuppression(id: string, confirmed: boolean): Promise<OutreachActionResult> {
  await requireIntelUser()
  if (!isUuid(id) || typeof confirmed !== 'boolean') return { ok: false, error: 'Entry not found.' }
  try {
    const result = await removeSuppression(createOutreachStore(), id, confirmed)
    if (!result.ok) return result
    revalidateSettings()
    return { ok: true }
  } catch {
    console.error('Outreach suppression remove failed')
    return { ok: false, error: GENERIC_ERROR }
  }
}

/**
 * Approves (if it still needs review) and sends one draft through the
 * connected Google mailbox. One email per call; never called by cron or the
 * runner. Every check runs here, on the server. anotherEmail is the owner's
 * "Send another email to this business", required when the business already
 * has a sent email.
 */
export async function approveAndSend(draftId: string, options?: { anotherEmail?: boolean }): Promise<OutreachActionResult> {
  await requireIntelUser()
  if (!isUuid(draftId)) return { ok: false, error: 'Draft not found.' }
  const anotherEmail = options !== null && typeof options === 'object' && options.anotherEmail === true
  try {
    const result = await approveAndSendDraft(createSendDeps(), draftId, { anotherEmail })
    if (result.ok) {
      revalidateDraft(result.draft)
      return { ok: true }
    }
    // A rejection or an unknown outcome changed the draft's state.
    if (result.outcome !== 'refused') revalidatePath(`/intel/outreach/${draftId}`)
    revalidatePath('/intel/outreach')
    return { ok: false, error: result.error }
  } catch {
    console.error('Outreach send failed')
    revalidatePath(`/intel/outreach/${draftId}`)
    return { ok: false, error: 'The email could not be sent. Reload the page to see where it stands before trying again.' }
  }
}

/** Revokes the Google permission, then removes the connection even if Google did not confirm. */
export async function disconnectGoogle(): Promise<OutreachActionResult & { message?: string }> {
  await requireIntelUser()
  try {
    const { revoked } = await disconnect({ config: readGmailConfig(), connections: createGmailConnectionStore(), fetch: (input, init) => fetch(input, init) })
    revalidateSettings()
    return {
      ok: true,
      message: revoked
        ? 'Disconnected. Google has withdrawn the sending permission.'
        : 'Disconnected here. Google did not confirm the withdrawal, so you can also remove access in your Google account settings.',
    }
  } catch {
    console.error('Outreach Google disconnect failed')
    return { ok: false, error: GENERIC_ERROR }
  }
}
