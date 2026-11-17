/**
 * Accepting a lead, then queuing its contact address lookup and, for a
 * business with its own website, its site review. Pure: the review
 * write and the queue are passed in. The queue is the same single-lead path
 * as "Find contact email" (queueLeadContactCheck), with the same caps and
 * rules. The accept never depends on it: a refusal, a failure or contact
 * tables that are not there yet leave the accept as it was. The same holds
 * for the site review (queueLeadSiteReview with onlyIfUnreviewed), and a
 * failure of one queue never stops the other.
 */

import type { QueueLeadResult } from '@/lib/outreach/contacts/runs'
import type { QueueLeadSiteReviewResult } from '@/lib/outreach/site-reviews/runs'

export type ReviewResult = { ok: true } | { ok: false; error: string }

export type AcceptOutcome = ReviewResult & {
  /** The queue's outcome; 'skipped' when the status was not accepted, 'failed' when queuing threw. */
  contact?: QueueLeadResult['outcome'] | 'skipped' | 'failed'
  /** The site review queue's outcome, when one was passed. */
  siteReview?: QueueLeadSiteReviewResult['outcome'] | 'skipped' | 'failed'
}

export async function reviewAndQueueContact(
  status: string,
  writeReview: () => Promise<ReviewResult>,
  queueContact: () => Promise<QueueLeadResult>,
  queueSiteReview?: () => Promise<QueueLeadSiteReviewResult>,
): Promise<AcceptOutcome> {
  const review = await writeReview()
  if (!review.ok || status !== 'accepted') {
    return { ...review, contact: 'skipped', ...(queueSiteReview === undefined ? {} : { siteReview: 'skipped' as const }) }
  }
  let contact: AcceptOutcome['contact']
  try {
    contact = (await queueContact()).outcome
  } catch {
    contact = 'failed'
  }
  if (queueSiteReview === undefined) return { ok: true, contact }
  let siteReview: AcceptOutcome['siteReview']
  try {
    siteReview = (await queueSiteReview()).outcome
  } catch {
    siteReview = 'failed'
  }
  return { ok: true, contact, siteReview }
}
