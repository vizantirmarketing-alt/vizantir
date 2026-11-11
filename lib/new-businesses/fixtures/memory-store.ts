/**
 * TEST FIXTURE. In-memory NewBusinessStore used by tests only; never import
 * from application code. Mirrors lib/new-businesses/store.ts: new categories
 * start disabled, rows are insert-or-ignore on (period, dedupe key).
 */

import { periodKey, type Period } from '@/lib/new-businesses/discovery'
import type { ImportCounts, ImportSummary, NewBusinessStore, StoredRow } from '@/lib/new-businesses/import'

export type MemoryImport = ImportSummary & { counts?: ImportCounts; error?: string }

export class MemoryNewBusinessStore implements NewBusinessStore {
  imports = new Map<string, MemoryImport>()
  categories = new Map<string, { enabled: boolean; lastSeenCount: number }>()
  rows = new Map<string, StoredRow & { period: Period; reviewStatus: string }>()

  async listImports() {
    return [...this.imports.values()].map(({ period, fileUrl, state, startedAt }) => ({ period, fileUrl, state, startedAt }))
  }
  async beginImport(_source: string, period: Period, fileUrl: string, nowIso: string) {
    this.imports.set(periodKey(period), { period, fileUrl, state: 'importing', startedAt: nowIso })
  }
  async finishImport(_source: string, period: Period, counts: ImportCounts) {
    const entry = this.imports.get(periodKey(period))
    if (entry) this.imports.set(periodKey(period), { ...entry, state: 'imported', counts, error: undefined })
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
  async storeRows(_source: string, period: Period, rows: StoredRow[]) {
    let inserted = 0
    for (const row of rows) {
      const key = `${periodKey(period)}|${row.dedupeKey}`
      if (this.rows.has(key)) continue
      this.rows.set(key, { ...row, period, reviewStatus: 'unreviewed' })
      inserted += 1
    }
    return inserted
  }
  enable(category: string) {
    const existing = this.categories.get(category)
    this.categories.set(category, { enabled: true, lastSeenCount: existing?.lastSeenCount ?? 0 })
  }
}
