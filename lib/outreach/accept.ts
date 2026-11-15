/**
 * Accepting a lead, then queuing its contact address lookup. Pure: the review
 * write and the queue are passed in. The queue is the same single-lead path
 * as "Find contact email" (queueLeadContactCheck), with the same caps and
 * rules. The accept never depends on it: a refusal, a failure or contact
 * tables that are not there yet leave the accept as it was.
 */

import type { QueueLeadResult } from '@/lib/outreach/contacts/runs'

export type ReviewResult = { ok: true } | { ok: false; error: string }

export type AcceptOutcome = ReviewResult & {
  /** The queue's outcome; 'skipped' when the status was not accepted, 'failed' when queuing threw. */
  contact?: QueueLeadResult['outcome'] | 'skipped' | 'failed'
}

export async function reviewAndQueueContact(
  status: string,
  writeReview: () => Promise<ReviewResult>,
  queueContact: () => Promise<QueueLeadResult>,
): Promise<AcceptOutcome> {
  const review = await writeReview()
  if (!review.ok || status !== 'accepted') return { ...review, contact: 'skipped' }
  try {
    return { ok: true, contact: (await queueContact()).outcome }
  } catch {
    return { ok: true, contact: 'failed' }
  }
}
