import 'server-only'

/**
 * Supabase adapter for website-check runs. Thin on purpose: the rules live in
 * website-runs.ts and website-rules.ts. Writes only new_business_check_runs
 * and the website_* columns of new_businesses; never review status or notes.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

import { NEW_BUSINESS_SOURCE } from '@/lib/new-businesses/discovery'
import {
  CHECK_RUN_STATES,
  type CheckBusiness,
  type CheckRunSource,
  type CheckRunState,
  type StoredCheckRun,
  type WebsiteCheckStore,
} from '@/lib/new-businesses/website-runs'
import { abandonedReasonLine } from '@/lib/prospects/claim'
import { appendSummaryLine } from '@/lib/prospects/ingest'
import { createSupabaseServiceRole } from '@/lib/supabase/service'

export class WebsiteCheckStoreError extends Error {
  constructor(operation: string) {
    super(`Website check store ${operation} failed`)
    this.name = 'WebsiteCheckStoreError'
  }
}

const RUNS = 'new_business_check_runs'
const ROWS = 'new_businesses'
const ELIGIBLE_REVIEW = ['unreviewed', 'accepted']

const outcomesSchema = z.record(z.string(), z.object({ status: z.enum(['saved', 'rejected']), reasons: z.array(z.string()) }))

const storedRunSchema = z.object({
  id: z.string(),
  state: z.enum(CHECK_RUN_STATES),
  business_ids: z.array(z.string()).nullable(),
  record_outcomes: outcomesSchema,
  error_summary: z.string().nullable(),
})

const businessRowSchema = z.object({
  id: z.string(),
  business_name: z.string(),
  category: z.string(),
  group_categories: z.array(z.string()).nullable(),
  address: z.string().nullable(),
  suite: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  zip: z.string().nullable(),
  phone: z.string().nullable(),
})

export function createWebsiteCheckStore(client: SupabaseClient = createSupabaseServiceRole()): WebsiteCheckStore {
  /** Every license row of a business: its group, or the row alone when ungrouped. */
  async function groupFilterFor(businessId: string): Promise<{ column: 'group_key' | 'id'; value: string }> {
    const { data, error } = await client.from(ROWS).select('id, group_key').eq('id', businessId).eq('source', NEW_BUSINESS_SOURCE).maybeSingle()
    if (error || data === null) throw new WebsiteCheckStoreError('business lookup')
    const parsed = z.object({ id: z.string(), group_key: z.string().nullable() }).safeParse(data)
    if (!parsed.success) throw new WebsiteCheckStoreError('business parse')
    return parsed.data.group_key !== null ? { column: 'group_key', value: parsed.data.group_key } : { column: 'id', value: parsed.data.id }
  }

  const store: WebsiteCheckStore = {
    async failStaleRuns(cutoffIso, nowIso) {
      const { data, error } = await client.from(RUNS).select('id, claimed_at, error_summary').eq('state', 'claimed').lt('claimed_at', cutoffIso)
      if (error) throw new WebsiteCheckStoreError('stale runs read')
      const stale = z.array(z.object({ id: z.string(), claimed_at: z.string(), error_summary: z.string().nullable() })).safeParse(data ?? [])
      if (!stale.success) throw new WebsiteCheckStoreError('stale runs parse')
      let failed = 0
      for (const run of stale.data) {
        const { data: updated, error: updateError } = await client
          .from(RUNS)
          .update({
            state: 'failed',
            finished_at: nowIso,
            updated_at: nowIso,
            error_summary: appendSummaryLine(run.error_summary, abandonedReasonLine(run.claimed_at)),
          })
          .eq('id', run.id)
          .eq('state', 'claimed')
          .select('id')
        if (updateError) throw new WebsiteCheckStoreError('stale run fail')
        if (Array.isArray(updated) && updated.length > 0) {
          failed += 1
          await store.releaseUnchecked(run.id)
        }
      }
      return failed
    },

    async claimOldestRequestedRun(nowIso) {
      const { data, error } = await client.from(RUNS).select('id, requested_at').eq('state', 'requested').order('requested_at', { ascending: true }).limit(1)
      if (error) throw new WebsiteCheckStoreError('requested run read')
      const oldest = z.array(z.object({ id: z.string(), requested_at: z.string() })).safeParse(data ?? [])
      if (!oldest.success) throw new WebsiteCheckStoreError('requested run parse')
      const candidate = oldest.data[0]
      if (candidate === undefined) return null
      const { data: claimed, error: claimError } = await client
        .from(RUNS)
        .update({ state: 'claimed', claimed_at: nowIso, updated_at: nowIso })
        .eq('id', candidate.id)
        .eq('state', 'requested')
        .select('id')
      if (claimError) throw new WebsiteCheckStoreError('run claim')
      if (!Array.isArray(claimed) || claimed.length === 0) return null
      return { id: candidate.id, requestedAt: candidate.requested_at, claimedAt: nowIso }
    },

    async selectBusinessesForCheck(limit) {
      const { data, error } = await client
        .from(ROWS)
        .select('id, business_name, category, group_categories, address, suite, city, state, zip, phone')
        .eq('source', NEW_BUSINESS_SOURCE)
        .eq('group_primary', true)
        .is('website_status', null)
        .is('website_check_run_id', null)
        .in('review_status', ELIGIBLE_REVIEW)
        .order('lead_score', { ascending: false, nullsFirst: false })
        .order('business_name', { ascending: true })
        .order('id', { ascending: true })
        .limit(limit)
      if (error) throw new WebsiteCheckStoreError('business selection')
      const rows = z.array(businessRowSchema).safeParse(data ?? [])
      if (!rows.success) throw new WebsiteCheckStoreError('business selection parse')
      return rows.data.map(
        (row): CheckBusiness => ({
          id: row.id,
          name: row.business_name,
          licenses: row.group_categories && row.group_categories.length > 0 ? row.group_categories : [row.category],
          address: row.address,
          suite: row.suite,
          city: row.city,
          state: row.state,
          zip: row.zip,
          phone: row.phone,
        }),
      )
    },

    async attachBusinesses(runId, businessIds, nowIso) {
      const { error } = await client
        .from(RUNS)
        .update({ business_ids: businessIds, business_count: businessIds.length, updated_at: nowIso })
        .eq('id', runId)
      if (error) throw new WebsiteCheckStoreError('run attach')
      for (const id of businessIds) {
        const target = await groupFilterFor(id)
        const { error: linkError } = await client
          .from(ROWS)
          .update({ website_check_run_id: runId })
          .eq('source', NEW_BUSINESS_SOURCE)
          .eq(target.column, target.value)
        if (linkError) throw new WebsiteCheckStoreError('business link')
      }
    },

    async closeEmptyRun(runId, summary, nowIso) {
      const { error } = await client
        .from(RUNS)
        .update({ state: 'completed', finished_at: nowIso, updated_at: nowIso, error_summary: summary, business_count: 0 })
        .eq('id', runId)
        .eq('state', 'claimed')
      if (error) throw new WebsiteCheckStoreError('empty run close')
    },

    async getRun(runId): Promise<StoredCheckRun | null> {
      const { data, error } = await client.from(RUNS).select('id, state, business_ids, record_outcomes, error_summary').eq('id', runId).maybeSingle()
      if (error) throw new WebsiteCheckStoreError('run read')
      if (data === null) return null
      const parsed = storedRunSchema.safeParse(data)
      if (!parsed.success) throw new WebsiteCheckStoreError('run parse')
      return {
        id: parsed.data.id,
        state: parsed.data.state,
        businessIds: parsed.data.business_ids ?? [],
        recordOutcomes: parsed.data.record_outcomes,
        errorSummary: parsed.data.error_summary,
      }
    },

    async saveWebsiteResult(businessId, runId, decision, nowIso) {
      const target = await groupFilterFor(businessId)
      const { error } = await client
        .from(ROWS)
        .update({
          website_status: decision.status,
          website_url: decision.url,
          website_evidence: decision.evidence,
          website_rules_version: decision.rulesVersion,
          website_checked_at: nowIso,
          website_check_run_id: runId,
        })
        .eq('source', NEW_BUSINESS_SOURCE)
        .eq(target.column, target.value)
      if (error) throw new WebsiteCheckStoreError('result write')
    },

    async updateRun(runId, update) {
      const { data, error } = await client
        .from(RUNS)
        .update({
          record_outcomes: update.recordOutcomes,
          counts: update.counts,
          error_summary: update.errorSummary,
          updated_at: update.updatedAt,
          ...(update.finish ? { state: update.finish.state, finished_at: update.finish.finishedAt } : {}),
        })
        .eq('id', runId)
        .eq('state', 'claimed')
        .select('id')
      if (error) throw new WebsiteCheckStoreError('run update')
      return Array.isArray(data) && data.length > 0
    },

    async releaseUnchecked(runId) {
      const { error } = await client
        .from(ROWS)
        .update({ website_check_run_id: null })
        .eq('website_check_run_id', runId)
        .is('website_status', null)
      if (error) throw new WebsiteCheckStoreError('release')
    },

    async countRuns(states) {
      const { count, error } = await client.from(RUNS).select('id', { count: 'exact', head: true }).in('state', [...states])
      if (error) throw new WebsiteCheckStoreError('run count')
      return count ?? 0
    },

    async countUncheckedBusinesses() {
      const { count, error } = await client
        .from(ROWS)
        .select('id', { count: 'exact', head: true })
        .eq('source', NEW_BUSINESS_SOURCE)
        .eq('group_primary', true)
        .is('website_status', null)
        .is('website_check_run_id', null)
        .in('review_status', ELIGIBLE_REVIEW)
      if (error) throw new WebsiteCheckStoreError('unchecked count')
      return count ?? 0
    },

    async requestRun(source: CheckRunSource, nowIso) {
      const { data, error } = await client
        .from(RUNS)
        .insert({ source, state: 'requested', requested_at: nowIso, updated_at: nowIso })
        .select('id')
        .single()
      if (error) throw new WebsiteCheckStoreError('run request')
      const parsed = z.object({ id: z.string() }).safeParse(data)
      if (!parsed.success) throw new WebsiteCheckStoreError('run request parse')
      return { id: parsed.data.id }
    },
  }
  return store
}

// --- Read-only loaders for the page.

export type CheckRunRow = {
  id: string
  state: CheckRunState
  source: string
  businessCount: number
  checked: number
  rejected: number
  errorSummary: string | null
  requestedAt: string
  claimedAt: string | null
  finishedAt: string | null
}

export async function fetchCheckRuns(limit = 5): Promise<CheckRunRow[] | null> {
  try {
    const { data, error } = await createSupabaseServiceRole()
      .from(RUNS)
      .select('id, state, source, business_count, counts, error_summary, requested_at, claimed_at, finished_at')
      .order('requested_at', { ascending: false })
      .limit(limit)
    if (error) return null
    const rows = z
      .array(
        z.object({
          id: z.string(),
          state: z.enum(CHECK_RUN_STATES),
          source: z.string(),
          business_count: z.number().int().nullable(),
          counts: z.object({ checked: z.number().int().optional(), rejected: z.number().int().optional() }).catch({}),
          error_summary: z.string().nullable(),
          requested_at: z.string(),
          claimed_at: z.string().nullable(),
          finished_at: z.string().nullable(),
        }),
      )
      .safeParse(data ?? [])
    if (!rows.success) return null
    return rows.data.map((row) => ({
      id: row.id,
      state: row.state,
      source: row.source,
      businessCount: row.business_count ?? 0,
      checked: row.counts.checked ?? 0,
      rejected: row.counts.rejected ?? 0,
      errorSummary: row.error_summary,
      requestedAt: row.requested_at,
      claimedAt: row.claimed_at,
      finishedAt: row.finished_at,
    }))
  } catch {
    return null
  }
}

/** Unreviewed businesses whose website check found no website. A count only. */
export async function countUnreviewedNoWebsite(): Promise<number | null> {
  try {
    const { count, error } = await createSupabaseServiceRole()
      .from(ROWS)
      .select('id', { count: 'exact', head: true })
      .eq('source', NEW_BUSINESS_SOURCE)
      .eq('group_primary', true)
      .eq('review_status', 'unreviewed')
      .eq('website_status', 'no_website')
    return error ? null : count ?? 0
  } catch {
    return null
  }
}
