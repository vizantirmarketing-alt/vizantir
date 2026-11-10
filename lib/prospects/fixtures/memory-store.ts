/**
 * TEST FIXTURE. In-memory ProspectIngestStore used by tests only; never import
 * from application code. Mirrors the contract of lib/prospects/store.ts:
 * upsert by domain without touching review fields, replace one run's evidence,
 * and update a run only while it is claimed.
 */

import type {
  EvidenceWrite,
  ProspectIngestStore,
  ProspectWrite,
  RunUpdate,
  StoredRun,
} from '@/lib/prospects/ingest'
import type { ProspectReviewStatus } from '@/lib/prospects/params'

export type MemoryProspect = ProspectWrite & {
  id: string
  reviewStatus: ProspectReviewStatus
  ownerNote: string | null
}

export type MemoryEvidence = EvidenceWrite & {
  prospectId: string
  runId: string
}

export class MemoryProspectStore implements ProspectIngestStore {
  runs = new Map<string, StoredRun & { counts?: RunUpdate['counts'] }>()
  prospects = new Map<string, MemoryProspect>()
  evidence: MemoryEvidence[] = []
  private nextId = 1

  constructor(runs: StoredRun[] = []) {
    for (const run of runs) {
      this.runs.set(run.id, { ...run })
    }
  }

  async getRun(runId: string): Promise<StoredRun | null> {
    const run = this.runs.get(runId)
    return run === undefined ? null : { ...run }
  }

  async saveProspect(write: ProspectWrite): Promise<{ id: string }> {
    const existing = this.prospects.get(write.domain)
    if (existing !== undefined) {
      this.prospects.set(write.domain, {
        ...existing,
        ...write,
        id: existing.id,
        reviewStatus: existing.reviewStatus,
        ownerNote: existing.ownerNote,
      })
      return { id: existing.id }
    }

    const id = `memory-prospect-${this.nextId}`
    this.nextId += 1
    this.prospects.set(write.domain, {
      ...write,
      id,
      reviewStatus: 'unreviewed',
      ownerNote: null,
    })
    return { id }
  }

  async replaceRunEvidence(
    prospectId: string,
    runId: string,
    evidence: EvidenceWrite[],
  ): Promise<void> {
    this.evidence = this.evidence.filter(
      (item) => !(item.prospectId === prospectId && item.runId === runId),
    )
    for (const item of evidence) {
      this.evidence.push({ ...item, prospectId, runId })
    }
  }

  async updateRun(runId: string, update: RunUpdate): Promise<boolean> {
    const run = this.runs.get(runId)
    if (run === undefined || run.state !== 'claimed') {
      return false
    }
    this.runs.set(runId, {
      ...run,
      recordOutcomes: update.recordOutcomes,
      errorSummary: update.errorSummary,
      counts: update.counts,
      state: update.finish?.state ?? run.state,
    })
    return true
  }
}
