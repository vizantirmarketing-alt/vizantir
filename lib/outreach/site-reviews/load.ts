import 'server-only'

/**
 * Read-only loaders for what the pages show about site reviews. Each returns
 * null when the tables cannot be read (for example before migration 0036),
 * so a page renders without site-review features rather than failing.
 */

import { readStoredObservations, SITE_REVIEW_STATUSES, type SiteReviewStatus, type StoredObservation } from '@/lib/outreach/site-reviews/rules'
import { subjectKey } from '@/lib/outreach/site-reviews/runs'
import { createSiteReviewStore, hasRequestedGeneralSiteReviewRun } from '@/lib/outreach/site-reviews/store'
import { siteReviewState, type SiteReviewState } from '@/lib/outreach/site-reviews/view'
import { createSupabaseServiceRole } from '@/lib/supabase/service'
import { z } from 'zod'

/**
 * The state of every accepted business with an own site to review, keyed by
 * "new_business:subjectRef". Businesses without one are absent. null when the
 * site-review tables cannot be read.
 */
export async function loadSiteReviewStates(): Promise<Map<string, SiteReviewState> | null> {
  try {
    const store = createSiteReviewStore()
    const [leads, reviews, generalRunQueued] = await Promise.all([store.listAcceptedLeads(), store.listReviews(), hasRequestedGeneralSiteReviewRun()])
    const byKey = new Map(reviews.map((review) => [subjectKey(review), review]))
    const states = new Map<string, SiteReviewState>()
    for (const lead of leads) {
      const review = byKey.get(subjectKey(lead))
      const state = siteReviewState(lead.site !== null, review === undefined ? undefined : { status: review.status, waiting: review.heldByRunId !== null }, generalRunQueued)
      if (state !== null) states.set(subjectKey(lead), state)
    }
    return states
  } catch {
    return null
  }
}

/** Stored review statuses and observations by subject ref, for the finding rule. null when they cannot be read. */
export async function loadSiteReviewResults(): Promise<Map<string, { status: SiteReviewStatus | null; observations: StoredObservation[] }> | null> {
  try {
    const { data, error } = await createSupabaseServiceRole()
      .from('outreach_site_reviews')
      .select('subject_ref, status, observations')
      .eq('subject_type', 'new_business')
    if (error) return null
    const rows = z.array(z.object({ subject_ref: z.string(), status: z.enum(SITE_REVIEW_STATUSES).nullable(), observations: z.unknown() })).safeParse(data ?? [])
    if (!rows.success) return null
    return new Map(rows.data.map((row) => [row.subject_ref, { status: row.status, observations: readStoredObservations(row.observations) }]))
  } catch {
    return null
  }
}

/** One business's stored review, for drafting and the "Written from" panel. null when there is none or it cannot be read. */
export async function loadSiteReviewFor(subjectRef: string): Promise<{ status: SiteReviewStatus | null; observations: StoredObservation[] } | null> {
  try {
    const review = await createSiteReviewStore().getReview({ subjectType: 'new_business', subjectRef })
    return review === null ? null : { status: review.status, observations: review.observations }
  } catch {
    return null
  }
}
