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
