import 'server-only'

/**
 * Loads the Outreach counts for the daily briefing. Select-only: every
 * loader here reads (the outreach store's list and count reads, accepted
 * leads, contact rows, lead facts, the call log and site-review states);
 * nothing is queued, written or sent. null when the core outreach tables
 * cannot be read, so the briefing marks the section unavailable.
 */

import { loadCallSummaries } from '@/lib/outreach/calls-store'
import { loadWorklistContacts } from '@/lib/outreach/contacts/load'
import { createOutreachStore } from '@/lib/outreach/deps'
import { loadLeadFacts } from '@/lib/outreach/lead-facts'
import { outreachBriefingCounts, type OutreachBriefingCounts } from '@/lib/outreach/briefing-counts'
import { loadSiteReviewStates } from '@/lib/outreach/site-reviews/load'
import { acceptedLeadRows, withLeadFacts } from '@/lib/outreach/worklist'

const DRAFTS_LIMIT = 300
const SENT_LIMIT = 2000

export async function loadOutreachBriefingCounts(now: Date): Promise<OutreachBriefingCounts | null> {
  try {
    const store = createOutreachStore()
    const [drafts, sent, states, suppressions, worklist, facts, calls, siteReviews] = await Promise.all([
      store.listDrafts(DRAFTS_LIMIT),
      store.listSent(SENT_LIMIT),
      store.listSubjectStates(),
      store.listSuppressions(),
      loadWorklistContacts(),
      loadLeadFacts(),
      loadCallSummaries(),
      loadSiteReviewStates(),
    ])
    if (worklist === null || facts === null) return null
    const rows = acceptedLeadRows({
      leads: withLeadFacts(worklist.leads, facts, siteReviews),
      states,
      contacts:
        worklist.contacts?.map((contact) => ({
          subjectType: contact.subjectType,
          subjectRef: contact.subjectRef,
          status: contact.status,
          email: contact.email,
          waiting: contact.heldByRunId !== null,
        })) ?? null,
      suppressions,
      generalRunQueued: worklist.generalRunQueued,
      calls,
    })
    return outreachBriefingCounts({ rows, drafts, sent, now })
  } catch {
    return null
  }
}
