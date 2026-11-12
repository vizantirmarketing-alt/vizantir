/**
 * Outreach records and the store contract. Pure types; the Supabase adapter
 * is lib/outreach/store.ts and the test fixture is
 * lib/outreach/fixtures/memory-store.ts.
 */

import type { OutreachStatus, OutreachSubjectType, SuppressionReason } from '@/lib/outreach/params'

export type OutreachSettings = {
  senderName: string
  studioName: string
  replyToEmail: string
  postalAddress: string
}

export type OutreachDraft = {
  id: string
  subjectType: OutreachSubjectType
  /** Prospect id, or a business's group key (its primary row id before grouping). */
  subjectRef: string
  /** Where the lead's name links: the prospect id, or the business's primary row id. */
  leadId: string
  leadName: string
  toEmail: string | null
  subject: string
  body: string
  /** Appended by code from the settings when the draft was written. Never edited. */
  footer: string
  status: OutreachStatus
  model: string
  promptVersion: string
  createdAt: string
  updatedAt: string
  approvedAt: string | null
  sentAt: string | null
}

export type NewDraft = Omit<OutreachDraft, 'id' | 'createdAt' | 'updatedAt' | 'approvedAt' | 'sentAt' | 'status'>

export type DraftPatch = Partial<Pick<OutreachDraft, 'toEmail' | 'subject' | 'body' | 'status' | 'approvedAt' | 'sentAt'>> & {
  updatedAt: string
}

export type Suppression = {
  id: string
  /** Normalized: trimmed and lower-cased. */
  email: string
  /** Set when every address at this domain is suppressed. */
  domain: string | null
  reason: SuppressionReason
  createdAt: string
}

export interface OutreachStore {
  getSettings(): Promise<OutreachSettings | null>
  saveSettings(settings: OutreachSettings, nowIso: string): Promise<void>

  getDraft(id: string): Promise<OutreachDraft | null>
  /** The draft or approved row for a subject, if any. */
  findActiveDraft(subjectType: OutreachSubjectType, subjectRef: string): Promise<OutreachDraft | null>
  /** Rows created at or after this instant, whatever their status now. */
  countCreatedSince(iso: string): Promise<number>
  /** Rows marked sent at or after this instant. */
  countSentSince(iso: string): Promise<number>
  /**
   * Inserts a draft. When replaceId is set, that row is discarded first, and
   * only while it is still a draft. 'conflict' when the subject still has an
   * active row (the one-active rule).
   */
  insertDraft(draft: NewDraft, replaceId: string | null, nowIso: string): Promise<{ ok: true; id: string } | { ok: false; reason: 'conflict' }>
  /**
   * Applies the patch only while the row's status is one of `from`. Returns
   * the updated row, or null when the row is missing or in another status.
   */
  updateDraft(id: string, from: readonly OutreachStatus[], patch: DraftPatch): Promise<OutreachDraft | null>
  /** Every row not discarded, newest first. */
  listDrafts(limit: number): Promise<OutreachDraft[]>
  /** Active rows for these subjects, for the "View draft" links. */
  activeDraftsFor(subjectType: OutreachSubjectType, subjectRefs: readonly string[]): Promise<OutreachDraft[]>

  listSuppressions(): Promise<Suppression[]>
  /** Entries matching the address exactly, or suppressing its domain. */
  findSuppressions(email: string, domain: string | null): Promise<Suppression[]>
  /** 'exists' when the address is already listed (the domain flag is then widened, never narrowed). */
  addSuppression(entry: Omit<Suppression, 'id' | 'createdAt'>, nowIso: string): Promise<'added' | 'exists'>
  removeSuppression(id: string): Promise<boolean>
}
