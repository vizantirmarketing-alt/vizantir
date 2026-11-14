'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireIntelUser } from '@/lib/auth/allowlist'
import { MAX_WAITING_CONTACT_RUNS, queueLeadContactCheck } from '@/lib/outreach/contacts/runs'
import { createContactStore } from '@/lib/outreach/contacts/store'
import { createDraftDeps, createOutreachStore } from '@/lib/outreach/deps'
import { writeDraft } from '@/lib/outreach/draft'
import { disconnect } from '@/lib/outreach/gmail/connect'
import { createGmailConnectionStore, createSendDeps, readGmailConfig } from '@/lib/outreach/gmail/deps'
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
import { isUuid } from '@/lib/prospects/params'

export type OutreachActionResult = { ok: true } | { ok: false; error: string }
export type WriteDraftActionResult = { ok: true; draftId: string } | { ok: false; error: string }

const GENERIC_ERROR = 'Unable to save. Try again shortly.'

function revalidateDraft(draft?: Pick<OutreachDraft, 'id' | 'subjectType' | 'leadId'>): void {
  revalidatePath('/intel/outreach')
  if (draft === undefined) return
  revalidatePath(`/intel/outreach/${draft.id}`)
  if (draft.subjectType === 'prospect') revalidatePath(`/intel/prospects/${draft.leadId}`)
  else revalidatePath('/intel/new-businesses')
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

export async function saveOutreachDraft(id: string, edit: { toEmail: string; subject: string; body: string }): Promise<OutreachActionResult> {
  const parsed = editSchema.safeParse(edit)
  if (!parsed.success) {
    await requireIntelUser()
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the draft.' }
  }
  return lifecycle(id, (now) => editDraft(createOutreachStore(), id, parsed.data, now))
}

export async function approveOutreachDraft(id: string): Promise<OutreachActionResult> {
  return lifecycle(id, (now) => approveDraft(createOutreachStore(), id, now))
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
    revalidatePath('/intel/outreach')
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
    revalidatePath('/intel/outreach')
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
    revalidatePath('/intel/outreach')
    return { ok: true }
  } catch {
    console.error('Outreach suppression remove failed')
    return { ok: false, error: GENERIC_ERROR }
  }
}

/**
 * Approves (if it still needs review) and sends one draft through the
 * connected Google mailbox. One email per call; never called by cron or the
 * runner. Every check runs here, on the server.
 */
export async function approveAndSend(draftId: string): Promise<OutreachActionResult> {
  await requireIntelUser()
  if (!isUuid(draftId)) return { ok: false, error: 'Draft not found.' }
  try {
    const result = await approveAndSendDraft(createSendDeps(), draftId)
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
    revalidatePath('/intel/outreach')
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
