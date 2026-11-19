/**
 * TEST FIXTURE. In-memory CallStore used by tests only; never import from
 * application code. Set failing to act as if the call history cannot be read.
 */

import type { CallStore, CallSubject, ClosedRead, OutreachCall } from '@/lib/outreach/calls'

/** The approve and edit guard for a lead whose call history was read and is open. */
export const OPEN_LEAD = { closedBy: async (): Promise<ClosedRead> => ({ readable: true, closedBy: null }) }

/**
 * A rule check that passes, for tests about something other than the writing
 * rules (their fixture texts are not full emails). Tests of the rules
 * themselves use the real check (casual-call.test.ts, rules-check.test.ts).
 */
export const PASSES_RULES = { checkRules: async (): Promise<string[] | null> => [] }

/** OPEN_LEAD with PASSES_RULES. */
export const OPEN_CLEAN_LEAD = { ...OPEN_LEAD, ...PASSES_RULES }

export class MemoryCallStore implements CallStore {
  calls: OutreachCall[] = []
  failing = false
  private nextId = 1

  private check(): void {
    if (this.failing) throw new Error('relation "public.outreach_calls" does not exist')
  }
  async listCalls() {
    this.check()
    return [...this.calls].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((c) => ({ ...c }))
  }
  async callsFor(subject: CallSubject) {
    return (await this.listCalls()).filter((c) => c.subjectType === subject.subjectType && c.subjectRef === subject.subjectRef)
  }
  async addCall(call: Omit<OutreachCall, 'id'>) {
    this.check()
    const id = `call-${this.nextId++}`
    this.calls.push({ ...call, id })
    return { id }
  }
}
