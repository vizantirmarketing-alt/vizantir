/**
 * Outreach counts for the daily briefing. Pure and deterministic: counts
 * only, no names and no model text. The rows are the Outreach page's own
 * Accepted leads rows (acceptedLeadRows), so the numbers match that page.
 *
 *   acceptedWaiting  accepted leads with no open draft and no sent email
 *   needsReview      drafts that need review, except those counted in toCall
 *   approvedNotSent  approved drafts not sent yet
 *   toCall           accepted leads whose next step is Log a call, plus
 *                    leads whose draft in review has no recipient and which
 *                    Needs review offers Log a call for (draftCallPhone),
 *                    unless a logged call has closed the lead
 *   sentYesterday    emails marked sent during the previous local day
 *
 * A lead has at most one open draft (the one-active-draft index) and a lead
 * with an open draft is never an Accepted leads row, so each lead counts in
 * needsReview or toCall, never both.
 */

import type { CallSummary } from '@/lib/outreach/calls'
import type { ContactStatus } from '@/lib/outreach/contacts/rules'
import { localDayStartIso } from '@/lib/outreach/dates'
import type { OutreachDraft } from '@/lib/outreach/types'
import { draftCallPhone, type WorklistRow } from '@/lib/outreach/worklist'

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

/**
 * What Needs review reads for a draft's Log a call, keyed by
 * "subjectType:subjectRef": each lead's contact status and license phone,
 * and the call summaries (null when the call log cannot be read).
 */
export type DraftCallFacts = {
  contactStatuses: ReadonlyMap<string, ContactStatus | null>
  phones: ReadonlyMap<string, string | null>
  calls: ReadonlyMap<string, CallSummary> | null
}

type CountedDraft = Pick<OutreachDraft, 'status' | 'subjectType' | 'subjectRef' | 'toEmail'>

/**
 * A draft in review whose next step is a call: Needs review offers Log a call
 * for it (draftCallPhone, the Outreach page's own rule), and no logged call
 * has closed the lead, as Accepted leads leaves closed leads out.
 */
function isDraftToCall(draft: CountedDraft, facts: DraftCallFacts | undefined): boolean {
  if (draft.status !== 'draft' || facts === undefined) return false
  const key = `${draft.subjectType}:${draft.subjectRef}`
  if (facts.calls?.get(key)?.closedBy) return false
  const phone = draftCallPhone({
    toEmail: draft.toEmail,
    contactStatus: facts.contactStatuses.get(key) ?? null,
    phone: facts.phones.get(key) ?? null,
    callsReadable: facts.calls !== null,
  })
  return phone !== null
}

export function outreachBriefingCounts(input: {
  rows: readonly Pick<WorklistRow, 'action'>[]
  drafts: readonly CountedDraft[]
  sent: readonly Pick<OutreachDraft, 'status' | 'sentAt'>[]
  now: Date
  /** Absent: no draft is counted as a call. */
  draftCalls?: DraftCallFacts
}): OutreachBriefingCounts {
  const { start, end } = yesterdayWindow(input.now)
  const startMs = Date.parse(start)
  const endMs = Date.parse(end)
  const inReview = input.drafts.filter((draft) => draft.status === 'draft')
  const draftsToCall = inReview.filter((draft) => isDraftToCall(draft, input.draftCalls)).length
  return {
    acceptedWaiting: input.rows.length,
    needsReview: inReview.length - draftsToCall,
    approvedNotSent: input.drafts.filter((draft) => draft.status === 'approved').length,
    toCall: input.rows.filter((row) => row.action === 'log_call').length + draftsToCall,
    sentYesterday: input.sent.filter((draft) => {
      if (draft.status !== 'sent' || draft.sentAt === null) return false
      const at = Date.parse(draft.sentAt)
      return !Number.isNaN(at) && at >= startMs && at < endMs
    }).length,
  }
}
