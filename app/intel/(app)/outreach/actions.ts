'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireIntelUser } from '@/lib/auth/allowlist'
import { createDraftDeps, createOutreachStore } from '@/lib/outreach/deps'
import { writeDraft } from '@/lib/outreach/draft'
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
