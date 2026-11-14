/**
 * TEST FIXTURE. In-memory ContactStore used by tests only; never import from
 * application code. Mirrors lib/outreach/contacts/store.ts and migration
 * 0034: one contact row per subject, conditional run updates, holds cleared
 * on release.
 */

import { abandonedReasonLine } from '@/lib/prospects/claim'
import { appendSummaryLine } from '@/lib/prospects/ingest'
import type { ContactDecision } from '@/lib/outreach/contacts/rules'
import {
  subjectKey,
  type ClaimedContactRun,
  type ContactLead,
  type ContactRunSource,
  type ContactRunState,
  type ContactRunUpdate,
  type ContactStore,
  type ContactSubject,
  type StoredContact,
  type StoredContactRun,
} from '@/lib/outreach/contacts/runs'

export type MemoryContactRun = StoredContactRun & {
  source: ContactRunSource
  target: ContactSubject | null
  requestedAt: string
  claimedAt: string | null
  finishedAt: string | null
  counts: { checked: number; rejected: number }
}

export class MemoryContactStore implements ContactStore {
  leads: ContactLead[] = []
  contacts: StoredContact[] = []
  runs: MemoryContactRun[] = []
  private nextId = 1

  constructor(leads: ContactLead[] = []) {
    this.leads = leads
  }

  /** A stable uuid-shaped id, so the strict schema accepts it. */
  private uuid(): string {
    const n = (this.nextId++).toString(16).padStart(12, '0')
    return `00000000-0000-4000-8000-${n}`
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

  async claimOldestRequestedRun(nowIso: string): Promise<ClaimedContactRun | null> {
    const run = [...this.runs].filter((r) => r.state === 'requested').sort((a, b) => a.requestedAt.localeCompare(b.requestedAt))[0]
    if (run === undefined) return null
    run.state = 'claimed'
    run.claimedAt = nowIso
    return { id: run.id, requestedAt: run.requestedAt, claimedAt: nowIso, target: run.target }
  }

  async listAcceptedLeads() {
    return [...this.leads].sort((a, b) => a.name.localeCompare(b.name))
  }

  async listContacts() {
    return this.contacts.map((c) => ({ ...c }))
  }

  async getContact(subject: ContactSubject) {
    const row = this.contacts.find((c) => subjectKey(c) === subjectKey(subject))
    return row === undefined ? null : { ...row }
  }

  async contactsFor(subjectType: ContactSubject['subjectType'], subjectRefs: readonly string[]) {
    return this.contacts.filter((c) => c.subjectType === subjectType && subjectRefs.includes(c.subjectRef)).map((c) => ({ ...c }))
  }

  private ensure(lead: ContactLead): StoredContact {
    let row = this.contacts.find((c) => subjectKey(c) === subjectKey(lead))
    if (row === undefined) {
      row = {
        id: this.uuid(),
        subjectType: lead.subjectType,
        subjectRef: lead.subjectRef,
        leadId: lead.leadId,
        status: null,
        email: null,
        sourceUrl: null,
        kind: null,
        rejectedCount: 0,
        namedCount: 0,
        evidence: null,
        rulesVersion: null,
        checkedAt: null,
        heldByRunId: null,
      }
      this.contacts.push(row)
    }
    return row
  }

  async holdLeads(runId: string, leads: readonly ContactLead[]) {
    return leads.map((lead) => {
      const row = this.ensure(lead)
      row.heldByRunId = runId
      return { ...row }
    })
  }

  async attachLeads(runId: string, contactIds: string[]) {
    const run = this.runs.find((r) => r.id === runId)!
    run.leadIds = [...contactIds]
  }

  async closeEmptyRun(runId: string, summary: string, nowIso: string) {
    const run = this.runs.find((r) => r.id === runId && r.state === 'claimed')
    if (run === undefined) return
    run.state = 'completed'
    run.finishedAt = nowIso
    run.errorSummary = summary
  }

  async getRun(runId: string) {
    const run = this.runs.find((r) => r.id === runId)
    return run === undefined
      ? null
      : { id: run.id, state: run.state, leadIds: [...run.leadIds], recordOutcomes: { ...run.recordOutcomes }, errorSummary: run.errorSummary }
  }

  private apply(row: StoredContact, decision: ContactDecision, nowIso: string) {
    row.status = decision.status
    row.email = decision.email
    row.sourceUrl = decision.sourceUrl
    row.kind = decision.kind
    row.rejectedCount = decision.rejectedCount
    row.namedCount = decision.namedCount
    row.evidence = decision.evidence
    row.rulesVersion = decision.rulesVersion
    row.checkedAt = nowIso
    row.heldByRunId = null
  }

  async saveResult(contactId: string, _runId: string | null, decision: ContactDecision, nowIso: string) {
    const row = this.contacts.find((c) => c.id === contactId)
    if (row !== undefined) this.apply(row, decision, nowIso)
  }

  async saveLeadResult(lead: ContactLead, decision: ContactDecision, nowIso: string) {
    this.apply(this.ensure(lead), decision, nowIso)
  }

  async updateRun(runId: string, update: ContactRunUpdate) {
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
    for (const row of this.contacts) if (row.heldByRunId === runId) row.heldByRunId = null
  }

  async countRuns(states: readonly ContactRunState[]) {
    return this.runs.filter((r) => states.includes(r.state)).length
  }

  async requestRun(source: ContactRunSource, target: ContactSubject | null, nowIso: string) {
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
      counts: { checked: 0, rejected: 0 },
    })
    return { id }
  }
}
