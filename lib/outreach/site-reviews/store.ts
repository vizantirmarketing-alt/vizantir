import 'server-only'

/**
 * Supabase adapter for site-review runs. Thin on purpose: the rules live in
 * lib/outreach/site-reviews/rules.ts and runs.ts. Writes only
 * outreach_site_review_runs and outreach_site_reviews (migration 0036). Reads
 * accepted New Businesses primary rows; never writes them.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

import { NEW_BUSINESS_SOURCE } from '@/lib/new-businesses/discovery'
import { WEBSITE_STATUSES, type WebsiteStatus } from '@/lib/new-businesses/website-rules'
import { siteForBusiness } from '@/lib/outreach/contacts/rules'
import { SITE_REVIEW_STATUSES, readStoredObservations, reviewSiteFor, type ReviewSite, type SiteReviewDecision } from '@/lib/outreach/site-reviews/rules'
import {
  SITE_REVIEW_RUN_STATES,
  type SiteReviewLead,
  type SiteReviewRunSource,
  type SiteReviewStore,
  type SiteReviewSubject,
  type StoredSiteReview,
  type StoredSiteReviewRun,
} from '@/lib/outreach/site-reviews/runs'
import { abandonedReasonLine } from '@/lib/prospects/claim'
import { appendSummaryLine } from '@/lib/prospects/ingest'
import { createSupabaseServiceRole } from '@/lib/supabase/service'

export class SiteReviewStoreError extends Error {
  constructor(operation: string) {
    super(`Site review store ${operation} failed`)
    this.name = 'SiteReviewStoreError'
  }
}

const RUNS = 'outreach_site_review_runs'
const REVIEWS = 'outreach_site_reviews'
const REVIEW_COLUMNS =
  'id, subject_type, subject_ref, lead_id, status, observations, pages_read, accepted_count, rejected_count, evidence, rules_version, checked_at, held_by_run_id'

const outcomesSchema = z.record(z.string(), z.object({ status: z.enum(['saved', 'rejected']), reasons: z.array(z.string()) }))

const reviewRowSchema = z.object({
  id: z.string(),
  subject_type: z.literal('new_business'),
  subject_ref: z.string(),
  lead_id: z.string(),
  status: z.enum(SITE_REVIEW_STATUSES).nullable(),
  observations: z.unknown(),
  pages_read: z.array(z.string()).nullable(),
  accepted_count: z.number().int(),
  rejected_count: z.number().int(),
  evidence: z.unknown(),
  rules_version: z.string().nullable(),
  checked_at: z.string().nullable(),
  held_by_run_id: z.string().nullable(),
})

function toReview(row: z.infer<typeof reviewRowSchema>): StoredSiteReview {
  return {
    id: row.id,
    subjectType: 'new_business',
    subjectRef: row.subject_ref,
    leadId: row.lead_id,
    status: row.status,
    observations: readStoredObservations(row.observations),
    pagesRead: row.pages_read ?? [],
    acceptedCount: row.accepted_count,
    rejectedCount: row.rejected_count,
    evidence: row.evidence ?? null,
    rulesVersion: row.rules_version,
    checkedAt: row.checked_at,
    heldByRunId: row.held_by_run_id,
  }
}

/** The own site a business may be reviewed on: has_website, with a stored URL that is its own site (not a builder or listing page). */
export function reviewSiteForBusiness(websiteStatus: WebsiteStatus | null, websiteUrl: string | null): ReviewSite | null {
  if (websiteStatus !== 'has_website' || websiteUrl === null) return null
  const site = siteForBusiness(websiteStatus, websiteUrl)
  if (site === null || site === 'pending' || site.kind !== 'own_domain') return null
  return reviewSiteFor(site.url)
}

function resultColumns(decision: SiteReviewDecision, nowIso: string) {
  return {
    status: decision.status,
    observations: decision.observations,
    pages_read: decision.pagesRead,
    accepted_count: decision.acceptedCount,
    rejected_count: decision.rejectedCount,
    evidence: decision.evidence,
    rules_version: decision.rulesVersion,
    checked_at: nowIso,
    held_by_run_id: null,
    updated_at: nowIso,
  }
}

async function readAcceptedLeads(client: SupabaseClient): Promise<SiteReviewLead[]> {
  const { data, error } = await client
    .from('new_businesses')
    .select('id, business_name, group_key, website_status, website_url')
    .eq('source', NEW_BUSINESS_SOURCE)
    .eq('group_primary', true)
    .eq('review_status', 'accepted')
  if (error) throw new SiteReviewStoreError('accepted leads read')
  const rows = z
    .array(
      z.object({
        id: z.string(),
        business_name: z.string(),
        group_key: z.string().nullable(),
        website_status: z.enum(WEBSITE_STATUSES).nullable(),
        website_url: z.string().nullable(),
      }),
    )
    .safeParse(data ?? [])
  if (!rows.success) throw new SiteReviewStoreError('accepted leads parse')
  return rows.data
    .map(
      (row): SiteReviewLead => ({
        subjectType: 'new_business',
        subjectRef: row.group_key ?? row.id,
        leadId: row.id,
        name: row.business_name,
        site: reviewSiteForBusiness(row.website_status, row.website_url),
      }),
    )
    .sort((a, b) => a.name.localeCompare(b.name) || a.subjectRef.localeCompare(b.subjectRef))
}

export function createSiteReviewStore(client: SupabaseClient = createSupabaseServiceRole()): SiteReviewStore {
  function parseReviews(data: unknown, error: unknown): StoredSiteReview[] {
    if (error) throw new SiteReviewStoreError('reviews read')
    const rows = z.array(reviewRowSchema).safeParse(data ?? [])
    if (!rows.success) throw new SiteReviewStoreError('reviews parse')
    return rows.data.map(toReview)
  }

  const store: SiteReviewStore = {
    async failStaleRuns(cutoffIso, nowIso) {
      const { data, error } = await client.from(RUNS).select('id, claimed_at, error_summary').eq('state', 'claimed').lt('claimed_at', cutoffIso)
      if (error) throw new SiteReviewStoreError('stale runs read')
      const stale = z.array(z.object({ id: z.string(), claimed_at: z.string(), error_summary: z.string().nullable() })).safeParse(data ?? [])
      if (!stale.success) throw new SiteReviewStoreError('stale runs parse')
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
        if (updateError) throw new SiteReviewStoreError('stale run fail')
        if (Array.isArray(updated) && updated.length > 0) {
          failed += 1
          await store.releaseUnchecked(run.id)
        }
      }
      return failed
    },

    async claimOldestRequestedRun(nowIso) {
      const { data, error } = await client
        .from(RUNS)
        .select('id, requested_at, target_subject_ref')
        .eq('state', 'requested')
        .order('requested_at', { ascending: true })
        .limit(1)
      if (error) throw new SiteReviewStoreError('requested run read')
      const oldest = z.array(z.object({ id: z.string(), requested_at: z.string(), target_subject_ref: z.string().nullable() })).safeParse(data ?? [])
      if (!oldest.success) throw new SiteReviewStoreError('requested run parse')
      const candidate = oldest.data[0]
      if (candidate === undefined) return null
      const { data: claimed, error: claimError } = await client
        .from(RUNS)
        .update({ state: 'claimed', claimed_at: nowIso, updated_at: nowIso })
        .eq('id', candidate.id)
        .eq('state', 'requested')
        .select('id')
      if (claimError) throw new SiteReviewStoreError('run claim')
      if (!Array.isArray(claimed) || claimed.length === 0) return null
      const target: SiteReviewSubject | null =
        candidate.target_subject_ref !== null ? { subjectType: 'new_business', subjectRef: candidate.target_subject_ref } : null
      return { id: candidate.id, requestedAt: candidate.requested_at, claimedAt: nowIso, target }
    },

    listAcceptedLeads: () => readAcceptedLeads(client),

    async listReviews() {
      const { data, error } = await client.from(REVIEWS).select(REVIEW_COLUMNS)
      return parseReviews(data, error)
    },

    async getReview(subject) {
      const { data, error } = await client
        .from(REVIEWS)
        .select(REVIEW_COLUMNS)
        .eq('subject_type', subject.subjectType)
        .eq('subject_ref', subject.subjectRef)
        .limit(1)
      return parseReviews(data, error)[0] ?? null
    },

    async holdLeads(runId, leads, nowIso) {
      if (leads.length === 0) return []
      const { data, error } = await client
        .from(REVIEWS)
        .upsert(
          leads.map((lead) => ({
            subject_type: lead.subjectType,
            subject_ref: lead.subjectRef,
            lead_id: lead.leadId,
            held_by_run_id: runId,
            updated_at: nowIso,
          })),
          { onConflict: 'subject_type,subject_ref' },
        )
        .select(REVIEW_COLUMNS)
      if (error) throw new SiteReviewStoreError('lead hold')
      const rows = z.array(reviewRowSchema).safeParse(data ?? [])
      if (!rows.success) throw new SiteReviewStoreError('lead hold parse')
      const byKey = new Map(rows.data.map((row) => [`${row.subject_type}:${row.subject_ref}`, toReview(row)]))
      return leads.map((lead) => {
        const row = byKey.get(`${lead.subjectType}:${lead.subjectRef}`)
        if (row === undefined) throw new SiteReviewStoreError('lead hold result')
        return row
      })
    },

    async attachLeads(runId, reviewIds, nowIso) {
      const { error } = await client.from(RUNS).update({ lead_ids: reviewIds, lead_count: reviewIds.length, updated_at: nowIso }).eq('id', runId)
      if (error) throw new SiteReviewStoreError('run attach')
    },

    async closeEmptyRun(runId, summary, nowIso) {
      const { error } = await client
        .from(RUNS)
        .update({ state: 'completed', finished_at: nowIso, updated_at: nowIso, error_summary: summary, lead_count: 0 })
        .eq('id', runId)
        .eq('state', 'claimed')
      if (error) throw new SiteReviewStoreError('empty run close')
    },

    async getRun(runId): Promise<StoredSiteReviewRun | null> {
      const { data, error } = await client.from(RUNS).select('id, state, lead_ids, record_outcomes, error_summary').eq('id', runId).maybeSingle()
      if (error) throw new SiteReviewStoreError('run read')
      if (data === null) return null
      const parsed = z
        .object({
          id: z.string(),
          state: z.enum(SITE_REVIEW_RUN_STATES),
          lead_ids: z.array(z.string()).nullable(),
          record_outcomes: outcomesSchema,
          error_summary: z.string().nullable(),
        })
        .safeParse(data)
      if (!parsed.success) throw new SiteReviewStoreError('run parse')
      return {
        id: parsed.data.id,
        state: parsed.data.state,
        leadIds: parsed.data.lead_ids ?? [],
        recordOutcomes: parsed.data.record_outcomes,
        errorSummary: parsed.data.error_summary,
      }
    },

    async saveResult(reviewId, runId, decision, nowIso) {
      const { error } = await client
        .from(REVIEWS)
        .update({ ...resultColumns(decision, nowIso), ...(runId === null ? {} : { run_id: runId }) })
        .eq('id', reviewId)
      if (error) throw new SiteReviewStoreError('result write')
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
      if (error) throw new SiteReviewStoreError('run update')
      return Array.isArray(data) && data.length > 0
    },

    async releaseUnchecked(runId) {
      const { error } = await client.from(REVIEWS).update({ held_by_run_id: null }).eq('held_by_run_id', runId)
      if (error) throw new SiteReviewStoreError('release')
    },

    async countRuns(states) {
      const { count, error } = await client.from(RUNS).select('id', { count: 'exact', head: true }).in('state', [...states])
      if (error) throw new SiteReviewStoreError('run count')
      return count ?? 0
    },

    async requestRun(source: SiteReviewRunSource, target: SiteReviewSubject | null, nowIso) {
      const { data, error } = await client
        .from(RUNS)
        .insert({
          source,
          state: 'requested',
          target_subject_type: target?.subjectType ?? null,
          target_subject_ref: target?.subjectRef ?? null,
          requested_at: nowIso,
          updated_at: nowIso,
        })
        .select('id')
        .single()
      if (error) throw new SiteReviewStoreError('run request')
      const parsed = z.object({ id: z.string() }).safeParse(data)
      if (!parsed.success) throw new SiteReviewStoreError('run request parse')
      return { id: parsed.data.id }
    },
  }
  return store
}

/** Whether a scheduled site-review run (not a one-lead run) is waiting to be claimed. Throws when runs cannot be read. */
export async function hasRequestedGeneralSiteReviewRun(client: SupabaseClient = createSupabaseServiceRole()): Promise<boolean> {
  const { count, error } = await client
    .from(RUNS)
    .select('id', { count: 'exact', head: true })
    .eq('state', 'requested')
    .is('target_subject_type', null)
  if (error) throw new SiteReviewStoreError('general run count')
  return (count ?? 0) > 0
}
