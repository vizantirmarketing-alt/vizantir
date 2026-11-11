/**
 * TEST FIXTURE. In-memory NewBusinessStore used by tests only; never import
 * from application code. Mirrors lib/new-businesses/store.ts: new categories
 * start disabled, rows are insert-or-ignore on (period, dedupe key).
 */

import { periodKey, type Period } from '@/lib/new-businesses/discovery'
import type { ImportCounts, ImportSummary, NewBusinessStore, RankUpdate, StoredRow } from '@/lib/new-businesses/import'
import type { NewBusinessReviewWriter, ReviewPatch, ReviewTarget } from '@/lib/new-businesses/review'

export type MemoryImport = ImportSummary & { counts?: ImportCounts; error?: string | null }

export type MemoryRow = StoredRow & {
  id: string
  period: Period
  reviewStatus: string
  reviewedAt: string | null
  ownerNote: string | null
  createdAt: string
  rank: Omit<RankUpdate, 'id'> | null
}

export class MemoryNewBusinessStore implements NewBusinessStore {
  imports = new Map<string, MemoryImport>()
  categories = new Map<string, { enabled: boolean; lastSeenCount: number }>()
  rows = new Map<string, MemoryRow>()
  /** Set to make the next rank save throw, to test that scoring never fails an import. */
  failRankSave = false
  rankSaveBatches: number[] = []

  async listImports() {
    return [...this.imports.values()].map(({ period, fileUrl, state, startedAt }) => ({ period, fileUrl, state, startedAt }))
  }
  async beginImport(_source: string, period: Period, fileUrl: string, nowIso: string) {
    this.imports.set(periodKey(period), { period, fileUrl, state: 'importing', startedAt: nowIso })
  }
  async finishImport(_source: string, period: Period, counts: ImportCounts, _nowIso: string, note: string | null = null) {
    const entry = this.imports.get(periodKey(period))
    if (entry) this.imports.set(periodKey(period), { ...entry, state: 'imported', counts, error: note })
  }
  async failImport(_source: string, period: Period, error: string) {
    const entry = this.imports.get(periodKey(period))
    if (entry) this.imports.set(periodKey(period), { ...entry, state: 'failed', error })
  }
  async recordCategoryCounts(_source: string, counts: Map<string, number>) {
    for (const [category, count] of counts) {
      const existing = this.categories.get(category)
      this.categories.set(category, { enabled: existing?.enabled ?? false, lastSeenCount: count })
    }
    return new Map([...this.categories].map(([category, value]) => [category, value.enabled]))
  }
  async storeRows(_source: string, period: Period, rows: StoredRow[], nowIso = '2026-11-10T15:00:00.000Z') {
    let inserted = 0
    for (const row of rows) {
      const key = `${periodKey(period)}|${row.dedupeKey}`
      if (this.rows.has(key)) continue
      const id = `row-${String(this.rows.size + 1).padStart(4, '0')}`
      this.rows.set(key, { ...row, id, period, reviewStatus: 'unreviewed', reviewedAt: null, ownerNote: null, createdAt: nowIso, rank: null })
      inserted += 1
    }
    return inserted
  }
  async listRankableRows() {
    return [...this.rows.values()].map((row) => ({
      id: row.id,
      name: row.name,
      address: row.address,
      suite: row.suite,
      phone: row.phone,
      category: row.category,
      period: periodKey(row.period),
      reviewStatus: row.reviewStatus,
      reviewedAt: row.reviewedAt,
      hasNote: row.ownerNote !== null,
      createdAt: row.createdAt,
    }))
  }
  async saveRanks(_source: string, updates: RankUpdate[]) {
    if (this.failRankSave) throw new Error('rank save unavailable')
    this.rankSaveBatches.push(updates.length)
    const byId = new Map([...this.rows.values()].map((row) => [row.id, row]))
    for (const { id, ...rank } of updates) {
      const row = byId.get(id)
      if (row) row.rank = rank
    }
  }
  /** Every row of one business, by group key from the last rescore. */
  businessRows(groupKey: string) {
    return [...this.rows.values()].filter((row) => row.rank?.groupKey === groupKey)
  }
  /** Primary rows: one per business, as the list shows them. */
  businesses() {
    return [...this.rows.values()].filter((row) => row.rank?.groupPrimary === true)
  }
  reviewWriter(): NewBusinessReviewWriter {
    const rows = () => [...this.rows.values()]
    return {
      groupKeyOf: async (id: string) => {
        const row = rows().find((r) => r.id === id)
        return row === undefined ? undefined : (row.rank?.groupKey ?? null)
      },
      update: async (target: ReviewTarget, patch: ReviewPatch) => {
        const matches = target.groupKey !== null ? rows().filter((r) => r.rank?.groupKey === target.groupKey) : rows().filter((r) => r.id === target.id)
        for (const row of matches) {
          if ('review_status' in patch) {
            row.reviewStatus = patch.review_status
            row.reviewedAt = patch.reviewed_at
          } else {
            row.ownerNote = patch.owner_note
          }
        }
      },
    }
  }
  byName(name: string) {
    return [...this.rows.values()].find((row) => row.name === name)
  }
  enable(category: string) {
    const existing = this.categories.get(category)
    this.categories.set(category, { enabled: true, lastSeenCount: existing?.lastSeenCount ?? 0 })
  }
}
