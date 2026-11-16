/**
 * TEST FIXTURE. In-memory CallStore used by tests only; never import from
 * application code. Set failing to act as if migration 0035 were not applied.
 */

import type { CallStore, CallSubject, OutreachCall } from '@/lib/outreach/calls'

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
