import 'server-only'

/**
 * Supabase adapter for the call log (migration 0035). Reads and writes
 * outreach_calls only. Every read throws CallStoreError on failure, so the
 * loaders can hide the call features until the migration is applied.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

import { CALL_OUTCOMES, summariesBySubject, type CallStore, type CallSummary, type OutreachCall } from '@/lib/outreach/calls'
import { OUTREACH_SUBJECT_TYPES } from '@/lib/outreach/params'
import { createSupabaseServiceRole } from '@/lib/supabase/service'

export class CallStoreError extends Error {
  constructor(operation: string) {
    super(`Call store ${operation} failed`)
    this.name = 'CallStoreError'
  }
}

const CALLS = 'outreach_calls'
const COLUMNS = 'id, subject_type, subject_ref, lead_id, outcome, note, created_at, created_by'
/** Far above the calls one owner can make. */
const CALLS_LIMIT = 5000

const rowSchema = z.object({
  id: z.string(),
  subject_type: z.enum(OUTREACH_SUBJECT_TYPES),
  subject_ref: z.string(),
  lead_id: z.string(),
  outcome: z.enum(CALL_OUTCOMES),
  note: z.string().nullable(),
  created_at: z.string(),
  created_by: z.string(),
})

function parse(data: unknown, operation: string): OutreachCall[] {
  const rows = z.array(rowSchema).safeParse(data ?? [])
  if (!rows.success) throw new CallStoreError(`${operation} parse`)
  return rows.data.map((row) => ({
    id: row.id,
    subjectType: row.subject_type,
    subjectRef: row.subject_ref,
    leadId: row.lead_id,
    outcome: row.outcome,
    note: row.note,
    createdAt: row.created_at,
    createdBy: row.created_by,
  }))
}

export function createCallStore(client: SupabaseClient = createSupabaseServiceRole()): CallStore {
  return {
    async listCalls() {
      const { data, error } = await client.from(CALLS).select(COLUMNS).order('created_at', { ascending: false }).limit(CALLS_LIMIT)
      if (error) throw new CallStoreError('calls list')
      return parse(data, 'calls list')
    },

    async callsFor(subject) {
      const { data, error } = await client
        .from(CALLS)
        .select(COLUMNS)
        .eq('subject_type', subject.subjectType)
        .eq('subject_ref', subject.subjectRef)
        .order('created_at', { ascending: false })
        .limit(CALLS_LIMIT)
      if (error) throw new CallStoreError('calls read')
      return parse(data, 'calls read')
    },

    async addCall(call) {
      const { data, error } = await client
        .from(CALLS)
        .insert({
          subject_type: call.subjectType,
          subject_ref: call.subjectRef,
          lead_id: call.leadId,
          outcome: call.outcome,
          note: call.note,
          created_at: call.createdAt,
          created_by: call.createdBy,
        })
        .select('id')
        .single()
      if (error) throw new CallStoreError('call insert')
      const row = z.object({ id: z.string() }).safeParse(data)
      if (!row.success) throw new CallStoreError('call insert parse')
      return { id: row.data.id }
    },
  }
}

/** Call summaries keyed by "subjectType:subjectRef"; null when the log cannot be read (before migration 0035). */
export async function loadCallSummaries(): Promise<Map<string, CallSummary> | null> {
  try {
    return summariesBySubject(await createCallStore().listCalls())
  } catch {
    return null
  }
}
