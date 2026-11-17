/**
 * Where a business's site review stands, as the Outreach page and New
 * Businesses read it. Pure; safe for client components.
 */

import type { SiteReviewStatus } from '@/lib/outreach/site-reviews/categories'

/**
 *   queued         a run holds the lead, or the waiting scheduled run will include it
 *   not_reviewed   an own site to review, no result and no run for it: Review this site
 *   reviewed       at least one observation was accepted: drafting has a finding
 *   nothing_found  pages were read and nothing was accepted, or no page could be read: Review again
 *   unclear        the last report could not be read: Review again
 */
export type SiteReviewState = 'queued' | 'not_reviewed' | 'reviewed' | 'nothing_found' | 'unclear'

export const REVIEW_WAITING_TEXT = "Looking at this business's site. Runs with the next scheduled research."
export const NOTHING_FOUND_TEXT = "Nothing specific was found on this business's site."
export const REVIEW_UNCLEAR_TEXT = "The last look at this business's site did not finish cleanly."

/**
 * The state for one lead. null when the lead has no own site to review (not
 * has_website, or no own-site URL stored).
 */
export function siteReviewState(
  hasSite: boolean,
  review: { status: SiteReviewStatus | null; waiting: boolean } | undefined,
  generalRunQueued: boolean,
): SiteReviewState | null {
  if (!hasSite) return null
  if (review?.waiting) return 'queued'
  const status = review?.status ?? null
  if (status === null) return generalRunQueued ? 'queued' : 'not_reviewed'
  if (status === 'reviewed') return 'reviewed'
  if (status === 'unclear') return 'unclear'
  return 'nothing_found'
}

/** The line shown for a state without a finding; null for reviewed and not_reviewed. */
export function siteReviewText(state: SiteReviewState): string | null {
  if (state === 'queued') return REVIEW_WAITING_TEXT
  if (state === 'nothing_found') return NOTHING_FOUND_TEXT
  if (state === 'unclear') return REVIEW_UNCLEAR_TEXT
  return null
}
