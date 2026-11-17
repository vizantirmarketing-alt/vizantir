/**
 * TEST FIXTURE. In-memory SiteReviewStore used by tests only; never import
 * from application code. Mirrors lib/outreach/site-reviews/store.ts and
 * migration 0036: one review row per subject, conditional run updates, holds
 * cleared on release. Set failing to act as if migration 0036 were not applied.
 */

import { abandonedReasonLine } from '@/lib/prospects/claim'
import { appendSummaryLine } from '@/lib/prospects/ingest'
import type { SiteReviewDecision } from '@/lib/outreach/site-reviews/rules'
import {
  subjectKey,
  type ClaimedSiteReviewRun,
  type SiteReviewLead,
  type SiteReviewRunSource,
  type SiteReviewRunState,
  type SiteReviewRunUpdate,
  type SiteReviewStore,
  type SiteReviewSubject,
  type StoredSiteReview,
  type StoredSiteReviewRun,
} from '@/lib/outreach/site-reviews/runs'

export type MemorySiteReviewRun = StoredSiteReviewRun & {
  source: SiteReviewRunSource
  target: SiteReviewSubject | null
  requestedAt: string
  claimedAt: string | null
  finishedAt: string | null
  counts: { reviewed: number; rejected: number }
}

export class MemorySiteReviewStore implements SiteReviewStore {
  leads: SiteReviewLead[] = []
  reviews: StoredSiteReview[] = []
  runs: MemorySiteReviewRun[] = []
  /** Throws on every table read or write, as before migration 0036. Accepted leads still read. */
  failing = false
  private nextId = 1

  constructor(leads: SiteReviewLead[] = []) {
    this.leads = leads
  }

  private check(): void {
    if (this.failing) throw new Error('relation "public.outreach_site_reviews" does not exist')
  }

  /** A stable uuid-shaped id, so the strict schema accepts it. */
  private uuid(): string {
    const n = (this.nextId++).toString(16).padStart(12, '0')
    return `00000000-0000-4000-9000-${n}`
  }

  async failStaleRuns(cutoffIso: string, nowIso: string) {
    this.check()
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

  async claimOldestRequestedRun(nowIso: string): Promise<ClaimedSiteReviewRun | null> {
    this.check()
    const run = [...this.runs].filter((r) => r.state === 'requested').sort((a, b) => a.requestedAt.localeCompare(b.requestedAt))[0]
    if (run === undefined) return null
    run.state = 'claimed'
    run.claimedAt = nowIso
    return { id: run.id, requestedAt: run.requestedAt, claimedAt: nowIso, target: run.target }
  }

  async listAcceptedLeads() {
    return [...this.leads].sort((a, b) => a.name.localeCompare(b.name))
  }

  async listReviews() {
    this.check()
    return this.reviews.map((r) => ({ ...r }))
  }

  async getReview(subject: SiteReviewSubject) {
    this.check()
    const row = this.reviews.find((r) => subjectKey(r) === subjectKey(subject))
    return row === undefined ? null : { ...row }
  }

  private ensure(lead: SiteReviewLead): StoredSiteReview {
    let row = this.reviews.find((r) => subjectKey(r) === subjectKey(lead))
    if (row === undefined) {
      row = {
        id: this.uuid(),
        subjectType: 'new_business',
        subjectRef: lead.subjectRef,
        leadId: lead.leadId,
        status: null,
        observations: [],
        pagesRead: [],
        acceptedCount: 0,
        rejectedCount: 0,
        evidence: null,
        rulesVersion: null,
        checkedAt: null,
        heldByRunId: null,
      }
      this.reviews.push(row)
    }
    return row
  }

  async holdLeads(runId: string, leads: readonly SiteReviewLead[]) {
    this.check()
    return leads.map((lead) => {
      const row = this.ensure(lead)
      row.heldByRunId = runId
      return { ...row }
    })
  }

  async attachLeads(runId: string, reviewIds: string[]) {
    this.check()
    const run = this.runs.find((r) => r.id === runId)!
    run.leadIds = [...reviewIds]
  }

  async closeEmptyRun(runId: string, summary: string, nowIso: string) {
    this.check()
    const run = this.runs.find((r) => r.id === runId && r.state === 'claimed')
    if (run === undefined) return
    run.state = 'completed'
    run.finishedAt = nowIso
    run.errorSummary = summary
  }

  async getRun(runId: string) {
    this.check()
    const run = this.runs.find((r) => r.id === runId)
    return run === undefined
      ? null
      : { id: run.id, state: run.state, leadIds: [...run.leadIds], recordOutcomes: { ...run.recordOutcomes }, errorSummary: run.errorSummary }
  }

  async saveResult(reviewId: string, _runId: string | null, decision: SiteReviewDecision, nowIso: string) {
    this.check()
    const row = this.reviews.find((r) => r.id === reviewId)
    if (row === undefined) return
    row.status = decision.status
    row.observations = decision.observations
    row.pagesRead = decision.pagesRead
    row.acceptedCount = decision.acceptedCount
    row.rejectedCount = decision.rejectedCount
    row.evidence = decision.evidence
    row.rulesVersion = decision.rulesVersion
    row.checkedAt = nowIso
    row.heldByRunId = null
  }

  async updateRun(runId: string, update: SiteReviewRunUpdate) {
    this.check()
    const run = this.runs.find((r) => r.id === runId && r.state === 'claimed')
    if (run === undefined) return false
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
    this.check()
    for (const row of this.reviews) if (row.heldByRunId === runId) row.heldByRunId = null
  }

  async countRuns(states: readonly SiteReviewRunState[]) {
    this.check()
    return this.runs.filter((r) => states.includes(r.state)).length
  }

  async requestRun(source: SiteReviewRunSource, target: SiteReviewSubject | null, nowIso: string) {
    this.check()
    const id = this.uuid()
    this.runs.push({
      id,
      source,
      target,
      state: 'requested',
      leadIds: [],
      recordOutcomes: {},
      errorSummary: null,
      requestedAt: nowIso,
      claimedAt: null,
      finishedAt: null,
      counts: { reviewed: 0, rejected: 0 },
    })
    return { id }
  }
}
