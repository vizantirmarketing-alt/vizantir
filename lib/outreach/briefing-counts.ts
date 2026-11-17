/**
 * Outreach counts for the daily briefing. Pure and deterministic: counts
 * only, no names and no model text. The rows are the Outreach page's own
 * Accepted leads rows (acceptedLeadRows), so the numbers match that page.
 *
 *   acceptedWaiting  accepted leads with no open draft and no sent email
 *   needsReview      drafts that need review
 *   approvedNotSent  approved drafts not sent yet
 *   toCall           accepted leads whose next step is Log a call
 *   sentYesterday    emails marked sent during the previous local day
 */

import { localDayStartIso } from '@/lib/outreach/dates'
import type { OutreachDraft } from '@/lib/outreach/types'
import type { WorklistRow } from '@/lib/outreach/worklist'

export type OutreachBriefingCounts = {
  acceptedWaiting: number
  needsReview: number
  approvedNotSent: number
  toCall: number
  sentYesterday: number
}

/** The previous local day, as [start, end) ISO instants. */
export function yesterdayWindow(now: Date): { start: string; end: string } {
  const end = localDayStartIso(now)
  // One millisecond before today's start is in yesterday, whatever its length.
  const start = localDayStartIso(new Date(Date.parse(end) - 1))
  return { start, end }
}

export function outreachBriefingCounts(input: {
  rows: readonly Pick<WorklistRow, 'action'>[]
  drafts: readonly Pick<OutreachDraft, 'status'>[]
  sent: readonly Pick<OutreachDraft, 'status' | 'sentAt'>[]
  now: Date
}): OutreachBriefingCounts {
  const { start, end } = yesterdayWindow(input.now)
  const startMs = Date.parse(start)
  const endMs = Date.parse(end)
  return {
    acceptedWaiting: input.rows.length,
    needsReview: input.drafts.filter((draft) => draft.status === 'draft').length,
    approvedNotSent: input.drafts.filter((draft) => draft.status === 'approved').length,
    toCall: input.rows.filter((row) => row.action === 'log_call').length,
    sentYesterday: input.sent.filter((draft) => {
      if (draft.status !== 'sent' || draft.sentAt === null) return false
      const at = Date.parse(draft.sentAt)
      return !Number.isNaN(at) && at >= startMs && at < endMs
    }).length,
  }
}
