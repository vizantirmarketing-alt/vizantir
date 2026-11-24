import 'server-only'

/**
 * Production research queue and confirmation signer for the Assistant page.
 *
 * Writes: one insert into prospect_runs per confirmed request, with source
 * "assistant": queueRun, of the same shape the Prospect Research form
 * inserts, or queueTargetedRun, the same with targetCount 1 and the target
 * domain from the stored prospect. Nothing else is written; every other
 * function here selects.
 *
 * The signer keys an HMAC with the existing RATE_LIMIT_SALT (which the
 * assistant's hourly cap already requires), under its own prefix so the two
 * uses never share a key. No new secret or environment variable.
 */

import { createHmac, timingSafeEqual } from 'node:crypto'

import { z } from 'zod'

import { ASSISTANT_RUN_SOURCE, OPEN_RUN_STATES, type ConfirmationSigner, type ResearchQueue, type ResearchRunRecord } from '@/lib/assistant/research'
import { PROSPECT_RUN_STATES } from '@/lib/prospects/params'
import { readRunConfig } from '@/lib/prospects/run-config'
import { createSupabaseServiceRole } from '@/lib/supabase/service'

const RUN_COLUMNS = 'id, state, config, counts, error_summary, requested_at, claimed_at, finished_at'
/** More open runs than this at once is not expected; the duplicate check fails closed above it. */
const OPEN_RUNS_LIMIT = 200

const runRowSchema = z.object({
  id: z.string(),
  state: z.enum(PROSPECT_RUN_STATES),
  config: z.unknown(),
  counts: z.unknown(),
  error_summary: z.string().nullable(),
  requested_at: z.string(),
  claimed_at: z.string().nullable(),
  finished_at: z.string().nullable(),
})

const countsSchema = z.object({ saved: z.number().int(), rejected: z.number().int() })

function toRecords(data: unknown): ResearchRunRecord[] | null {
  const rows = z.array(runRowSchema).safeParse(data ?? [])
  if (!rows.success) return null
  return rows.data.map((row) => {
    const counts = countsSchema.safeParse(row.counts)
    return {
      id: row.id,
      state: row.state,
      config: readRunConfig(row.config),
      counts: counts.success ? counts.data : { saved: 0, rejected: 0 },
      errorSummary: row.error_summary,
      requestedAt: row.requested_at,
      claimedAt: row.claimed_at,
      finishedAt: row.finished_at,
    }
  })
}

export function createResearchQueue(): ResearchQueue {
  return {
    async countRequestedSince(requestedBy, sinceIso) {
      try {
        const { count, error } = await createSupabaseServiceRole()
          .from('prospect_runs')
          .select('id', { count: 'exact', head: true })
          .eq('source', ASSISTANT_RUN_SOURCE)
          .eq('requested_by', requestedBy)
          .gte('requested_at', sinceIso)
        return error || count === null ? null : count
      } catch {
        return null
      }
    },
    async openRuns() {
      try {
        const { data, error } = await createSupabaseServiceRole()
          .from('prospect_runs')
          .select(RUN_COLUMNS)
          .in('state', [...OPEN_RUN_STATES])
          .limit(OPEN_RUNS_LIMIT + 1)
        if (error) return null
        const records = toRecords(data)
        return records === null || records.length > OPEN_RUNS_LIMIT ? null : records
      } catch {
        return null
      }
    },
    async queueRun(request, requestedBy) {
      try {
        const { data, error } = await createSupabaseServiceRole()
          .from('prospect_runs')
          .insert({
            state: 'requested',
            config: { market: request.market, industry: request.industry, targetCount: request.targetCount, exclusions: [] },
            requested_by: requestedBy,
            source: ASSISTANT_RUN_SOURCE,
          })
          .select('id')
          .single()
        if (error) return null
        const row = z.object({ id: z.string() }).safeParse(data)
        return row.success ? { id: row.data.id } : null
      } catch {
        return null
      }
    },
    async queueTargetedRun(request, requestedBy) {
      try {
        const { data, error } = await createSupabaseServiceRole()
          .from('prospect_runs')
          .insert({
            state: 'requested',
            config: { market: request.market, industry: request.industry, targetCount: 1, exclusions: [], targetDomain: request.domain },
            requested_by: requestedBy,
            source: ASSISTANT_RUN_SOURCE,
          })
          .select('id')
          .single()
        if (error) return null
        const row = z.object({ id: z.string() }).safeParse(data)
        return row.success ? { id: row.data.id } : null
      } catch {
        return null
      }
    },
    async prospectsByDomain(domains) {
      try {
        const { data, error } = await createSupabaseServiceRole()
          .from('prospects')
          .select('id, canonical_name, domain')
          .in('domain', [...domains])
        if (error) return null
        const rows = z.array(z.object({ id: z.string(), canonical_name: z.string(), domain: z.string() })).safeParse(data ?? [])
        return rows.success ? new Map(rows.data.map((row) => [row.domain, { id: row.id, name: row.canonical_name }])) : null
      } catch {
        return null
      }
    },
    async listAssistantRuns(limit) {
      try {
        const { data, error } = await createSupabaseServiceRole()
          .from('prospect_runs')
          .select(RUN_COLUMNS)
          .eq('source', ASSISTANT_RUN_SOURCE)
          .order('requested_at', { ascending: false })
          .limit(limit)
        return error ? null : toRecords(data)
      } catch {
        return null
      }
    },
  }
}

/** Null when RATE_LIMIT_SALT is not set: confirmations then cannot be issued or accepted. */
export function createConfirmationSigner(): ConfirmationSigner | null {
  const salt = process.env.RATE_LIMIT_SALT?.trim()
  if (!salt) return null
  const key = `intel-assistant-confirmation:${salt}`
  const sign = (payload: string) => createHmac('sha256', key).update(payload).digest('base64url')
  return {
    sign,
    verify(payload, signature) {
      const expected = Buffer.from(sign(payload))
      const provided = Buffer.from(signature)
      return expected.length === provided.length && timingSafeEqual(expected, provided)
    },
  }
}
