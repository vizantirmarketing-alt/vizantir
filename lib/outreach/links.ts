/**
 * Where a draft's lead name links. Pure; safe for client components.
 * A prospect has its own page. A business has no page of its own, so the
 * link opens New Businesses on accepted businesses, at the business's row.
 */

import type { OutreachDraft } from '@/lib/outreach/types'

export function leadHref(draft: Pick<OutreachDraft, 'subjectType' | 'leadId'>): string {
  return draft.subjectType === 'prospect'
    ? `/intel/prospects/${encodeURIComponent(draft.leadId)}`
    : `/intel/new-businesses?review=accepted#business-${encodeURIComponent(draft.leadId)}`
}

/** The compose page for "Write it yourself": an email the owner writes by hand, with no model call. */
export function writeItYourselfHref(lead: Pick<OutreachDraft, 'subjectType' | 'leadId'>): string {
  return `/intel/outreach/write?type=${encodeURIComponent(lead.subjectType)}&lead=${encodeURIComponent(lead.leadId)}`
}

/** Marks the draft page as opened by a save, so its notice starts with "Saved." */
export const SAVED_PARAM = 'saved'

/** The draft page after the first save of a hand-written draft. */
export function savedDraftHref(draftId: string): string {
  return `/intel/outreach/${encodeURIComponent(draftId)}?${SAVED_PARAM}=1`
}
