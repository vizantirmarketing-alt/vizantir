/**
 * TEST FIXTURE. In-memory WebsiteCheckStore over a MemoryNewBusinessStore's
 * rows. Used by tests only; never import from application code. Mirrors
 * lib/new-businesses/website-store.ts.
 */

import { appendSummaryLine } from '@/lib/prospects/ingest'
import { abandonedReasonLine } from '@/lib/prospects/claim'
import type { MemoryNewBusinessStore, MemoryRow } from '@/lib/new-businesses/fixtures/memory-store'
import type {
  CheckBusiness,
  CheckRunSource,
  CheckRunState,
  CheckRunUpdate,
  StoredCheckRun,
  WebsiteCheckStore,
} from '@/lib/new-businesses/website-runs'
import type { WebsiteDecision } from '@/lib/new-businesses/website-rules'

export type MemoryCheckRun = StoredCheckRun & {
  source: CheckRunSource
  requestedAt: string
  claimedAt: string | null
  finishedAt: string | null
  counts: { checked: number; rejected: number }
}

const ELIGIBLE = new Set(['unreviewed', 'accepted'])

export class MemoryWebsiteCheckStore implements WebsiteCheckStore {
  runs: MemoryCheckRun[] = []
  private next = 0

  constructor(readonly businesses: MemoryNewBusinessStore) {}

  private rows(): MemoryRow[] {
    return [...this.businesses.rows.values()]
  }

  private groupRows(primaryId: string): MemoryRow[] {
    const primary = this.rows().find((row) => row.id === primaryId)
    if (primary === undefined) return []
    const key = primary.rank?.groupKey
    return key === undefined ? [primary] : this.rows().filter((row) => row.rank?.groupKey === key)
  }

  private eligiblePrimaries(): MemoryRow[] {
    return this.rows().filter(
      (row) => row.rank?.groupPrimary === true && row.website === null && row.websiteCheckRunId === null && ELIGIBLE.has(row.reviewStatus),
    )
  }

  async failStaleRuns(cutoffIso: string, nowIso: string) {
    let failed = 0
    for (const run of this.runs) {
      if (run.state === 'claimed' && run.claimedAt !== null && run.claimedAt < cutoffIso) {
        run.state = 'failed'
        run.finishedAt = nowIso
        run.errorSummary = appendSummaryLine(run.errorSummary, abandonedReasonLine(run.claimedAt))
        await this.releaseUnchecked(run.id)
        failed += 1
      }
    }
    return failed
  }

  async claimOldestRequestedRun(nowIso: string) {
    const run = [...this.runs].filter((r) => r.state === 'requested').sort((a, b) => a.requestedAt.localeCompare(b.requestedAt))[0]
    if (run === undefined) return null
    run.state = 'claimed'
    run.claimedAt = nowIso
    return { id: run.id, requestedAt: run.requestedAt, claimedAt: nowIso }
  }

  async selectBusinessesForCheck(limit: number): Promise<CheckBusiness[]> {
    return this.eligiblePrimaries()
      .sort((a, b) => (b.rank?.score ?? -1) - (a.rank?.score ?? -1) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id))
      .slice(0, limit)
      .map((row) => ({
        id: row.id,
        name: row.name,
        licenses: row.rank?.groupCategories ?? [row.category],
        address: row.address,
        suite: row.suite,
        city: row.city,
        state: row.state,
        zip: row.zip,
        phone: row.phone,
      }))
  }

  async attachBusinesses(runId: string, businessIds: string[]) {
    const run = this.runs.find((r) => r.id === runId)!
    run.businessIds = [...businessIds]
    for (const id of businessIds) for (const row of this.groupRows(id)) row.websiteCheckRunId = runId
  }

  async closeEmptyRun(runId: string, summary: string, nowIso: string) {
    const run = this.runs.find((r) => r.id === runId)!
    run.state = 'completed'
    run.finishedAt = nowIso
    run.errorSummary = appendSummaryLine(run.errorSummary, summary)
  }

  async getRun(runId: string) {
    const run = this.runs.find((r) => r.id === runId)
    return run === undefined ? null : { ...run, businessIds: [...run.businessIds], recordOutcomes: { ...run.recordOutcomes } }
  }

  async saveWebsiteResult(businessId: string, runId: string, decision: WebsiteDecision, nowIso: string) {
    for (const row of this.groupRows(businessId)) {
      row.website = { status: decision.status, url: decision.url, evidence: decision.evidence, rulesVersion: decision.rulesVersion, checkedAt: nowIso }
      row.websiteCheckRunId = runId
    }
  }

  async updateRun(runId: string, update: CheckRunUpdate) {
    const run = this.runs.find((r) => r.id === runId)
    if (run === undefined || run.state !== 'claimed') return false
    run.recordOutcomes = update.recordOutcomes
    run.counts = update.counts
    run.errorSummary = update.errorSummary
    if (update.finish) {
      run.state = update.finish.state
      run.finishedAt = update.finish.finishedAt
    }
    return true
  }

  async releaseUnchecked(runId: string) {
    for (const row of this.rows()) if (row.websiteCheckRunId === runId && row.website === null) row.websiteCheckRunId = null
  }

  async countRuns(states: readonly CheckRunState[]) {
    return this.runs.filter((r) => states.includes(r.state)).length
  }

  async countUncheckedBusinesses() {
    return this.eligiblePrimaries().length
  }

  async requestRun(source: CheckRunSource, nowIso: string) {
    this.next += 1
    const id = `00000000-0000-4000-8000-${String(this.next).padStart(12, '0')}`
    this.runs.push({ id, state: 'requested', source, requestedAt: nowIso, claimedAt: null, finishedAt: null, businessIds: [], recordOutcomes: {}, errorSummary: null, counts: { checked: 0, rejected: 0 } })
    return { id }
  }
}
