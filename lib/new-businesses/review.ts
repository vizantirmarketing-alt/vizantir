/**
 * The owner's review actions on a business. No direct I/O: the writer is
 * injected (Supabase in lib/new-businesses/store.ts, memory in tests).
 *
 * Accept, Reject, Archive and Note apply to every license row of the
 * business, so the business reads the same whichever row represents it.
 */

import type { NewBusinessReviewStatus } from '@/lib/new-businesses/params'

export type ReviewTarget = { id: string; groupKey: string | null }

export type ReviewPatch =
  | { review_status: NewBusinessReviewStatus; reviewed_at: string | null; updated_at: string }
  | { owner_note: string | null; updated_at: string }

export interface NewBusinessReviewWriter {
  /** The row's group key; null when the row is not grouped yet; undefined when there is no such row. */
  groupKeyOf(id: string): Promise<string | null | undefined>
  /** Updates every row with target.groupKey, or only target.id when it is null. */
  update(target: ReviewTarget, patch: ReviewPatch): Promise<void>
}

export type ReviewWriteResult = { ok: true } | { ok: false; reason: 'not_found' }

async function target(writer: NewBusinessReviewWriter, id: string): Promise<ReviewTarget | null> {
  const groupKey = await writer.groupKeyOf(id)
  return groupKey === undefined ? null : { id, groupKey }
}

export async function setBusinessReview(
  writer: NewBusinessReviewWriter,
  id: string,
  status: NewBusinessReviewStatus,
  nowIso: string,
): Promise<ReviewWriteResult> {
  const where = await target(writer, id)
  if (where === null) return { ok: false, reason: 'not_found' }
  await writer.update(where, {
    review_status: status,
    reviewed_at: status === 'unreviewed' ? null : nowIso,
    updated_at: nowIso,
  })
  return { ok: true }
}

export async function setBusinessNote(
  writer: NewBusinessReviewWriter,
  id: string,
  note: string,
  nowIso: string,
): Promise<ReviewWriteResult> {
  const where = await target(writer, id)
  if (where === null) return { ok: false, reason: 'not_found' }
  const trimmed = note.trim()
  await writer.update(where, { owner_note: trimmed.length > 0 ? trimmed : null, updated_at: nowIso })
  return { ok: true }
}
