/**
 * TEST FIXTURE. In-memory OutreachStore used by tests only; never import from
 * application code. Mirrors lib/outreach/store.ts and migration 0032: one
 * active (draft or approved) row per subject, conditional status updates,
 * and a unique normalized email on the suppression list.
 */

import { ACTIVE_STATUSES, type OutreachStatus, type OutreachSubjectType } from '@/lib/outreach/params'
import type {
  DraftPatch,
  GmailConnection,
  GmailConnectionStore,
  NewDraft,
  OutreachDraft,
  OutreachSettings,
  OutreachStore,
  Suppression,
} from '@/lib/outreach/types'

export class MemoryOutreachStore implements OutreachStore {
  settings: OutreachSettings | null = null
  drafts: OutreachDraft[] = []
  suppressions: Suppression[] = []
  private nextId = 1

  constructor(settings: OutreachSettings | null = null) {
    this.settings = settings
  }

  private id(prefix: string): string {
    return `${prefix}-${this.nextId++}`
  }

  async getSettings() {
    return this.settings === null ? null : { ...this.settings }
  }
  async saveSettings(settings: OutreachSettings) {
    this.settings = { ...settings }
  }

  async getDraft(id: string) {
    const row = this.drafts.find((d) => d.id === id)
    return row === undefined ? null : { ...row }
  }
  async findActiveDraft(subjectType: OutreachSubjectType, subjectRef: string) {
    const row = this.drafts.find((d) => d.subjectType === subjectType && d.subjectRef === subjectRef && ACTIVE_STATUSES.includes(d.status))
    return row === undefined ? null : { ...row }
  }
  async countCreatedSince(iso: string) {
    return this.drafts.filter((d) => d.createdAt >= iso).length
  }
  async countSentSince(iso: string) {
    return this.drafts.filter((d) => d.status === 'sent' && d.sentAt !== null && d.sentAt >= iso).length
  }
  async countGmailSentSince(iso: string) {
    return this.drafts.filter((d) => d.status === 'sent' && d.sentVia === 'gmail' && d.sentAt !== null && d.sentAt >= iso).length
  }
  async insertDraft(draft: NewDraft, replaceId: string | null, nowIso: string) {
    if (replaceId !== null) {
      const old = this.drafts.find((d) => d.id === replaceId && d.status === 'draft')
      if (old) {
        old.status = 'discarded'
        old.updatedAt = nowIso
      }
    }
    // The partial unique index in 0032.
    if (this.drafts.some((d) => d.subjectType === draft.subjectType && d.subjectRef === draft.subjectRef && ACTIVE_STATUSES.includes(d.status))) {
      return { ok: false as const, reason: 'conflict' as const }
    }
    const id = this.id('draft')
    this.drafts.push({
      ...draft,
      id,
      status: 'draft',
      createdAt: nowIso,
      updatedAt: nowIso,
      approvedAt: null,
      sentAt: null,
      sentVia: null,
      gmailMessageId: null,
      gmailThreadId: null,
      sendError: null,
    })
    return { ok: true as const, id }
  }
  async updateDraft(id: string, from: readonly OutreachStatus[], patch: DraftPatch) {
    const row = this.drafts.find((d) => d.id === id)
    if (row === undefined || !from.includes(row.status)) return null
    const next = { ...row, ...patch }
    if (
      ACTIVE_STATUSES.includes(next.status) &&
      this.drafts.some((d) => d.id !== id && d.subjectType === next.subjectType && d.subjectRef === next.subjectRef && ACTIVE_STATUSES.includes(d.status))
    ) {
      throw new Error('duplicate key value violates unique constraint "outreach_drafts_one_active_idx"')
    }
    Object.assign(row, patch)
    return { ...row }
  }
  async listDrafts(limit: number) {
    return this.drafts
      .filter((d) => d.status !== 'discarded')
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, limit)
      .map((d) => ({ ...d }))
  }
  async activeDraftsFor(subjectType: OutreachSubjectType, refs: readonly string[]) {
    return this.drafts.filter((d) => d.subjectType === subjectType && refs.includes(d.subjectRef) && ACTIVE_STATUSES.includes(d.status)).map((d) => ({ ...d }))
  }

  async listSuppressions() {
    return this.suppressions.map((s) => ({ ...s }))
  }
  async findSuppressions(email: string, domain: string | null) {
    return this.suppressions.filter((s) => s.email === email || (domain !== null && s.domain === domain)).map((s) => ({ ...s }))
  }
  async addSuppression(entry: Omit<Suppression, 'id' | 'createdAt'>, nowIso: string) {
    const existing = this.suppressions.find((s) => s.email === entry.email)
    if (existing) {
      if (entry.domain !== null) existing.domain = entry.domain
      return 'exists' as const
    }
    this.suppressions.push({ ...entry, id: this.id('sup'), createdAt: nowIso })
    return 'added' as const
  }
  async removeSuppression(id: string) {
    const before = this.suppressions.length
    this.suppressions = this.suppressions.filter((s) => s.id !== id)
    return this.suppressions.length < before
  }
}

/** TEST FIXTURE. The one-row Gmail connection, in memory. */
export class MemoryGmailConnectionStore implements GmailConnectionStore {
  connection: GmailConnection | null = null
  saves = 0

  async get() {
    return this.connection === null ? null : { ...this.connection }
  }
  async save(connection: GmailConnection) {
    this.saves += 1
    this.connection = { ...connection }
  }
  async markNeedsReconnect() {
    if (this.connection !== null) this.connection.needsReconnect = true
  }
  async remove() {
    this.connection = null
  }
}
