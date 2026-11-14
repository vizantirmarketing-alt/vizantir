import 'server-only'

/**
 * Supabase adapter for contact-address runs. Thin on purpose: the rules live
 * in lib/outreach/contacts/rules.ts and runs.ts. Writes only
 * outreach_contact_runs and outreach_contacts (migration 0034). Reads
 * accepted prospects and accepted New Businesses primary rows; never writes
 * them.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

import { NEW_BUSINESS_SOURCE } from '@/lib/new-businesses/discovery'
import { WEBSITE_STATUSES } from '@/lib/new-businesses/website-rules'
import { CONTACT_KINDS, CONTACT_STATUSES, siteForBusiness, siteForProspect, type ContactDecision } from '@/lib/outreach/contacts/rules'
import {
  CONTACT_RUN_STATES,
  type ContactLead,
  type ContactRunSource,
  type ContactRunState,
  type ContactStore,
  type ContactSubject,
  type StoredContact,
  type StoredContactRun,
} from '@/lib/outreach/contacts/runs'
import { OUTREACH_SUBJECT_TYPES } from '@/lib/outreach/params'
import { abandonedReasonLine } from '@/lib/prospects/claim'
import { appendSummaryLine } from '@/lib/prospects/ingest'
import { createSupabaseServiceRole } from '@/lib/supabase/service'

export class ContactStoreError extends Error {
  constructor(operation: string) {
    super(`Contact store ${operation} failed`)
    this.name = 'ContactStoreError'
  }
}

const RUNS = 'outreach_contact_runs'
const CONTACTS = 'outreach_contacts'
const CONTACT_COLUMNS =
  'id, subject_type, subject_ref, lead_id, status, email, source_url, kind, rejected_count, named_count, evidence, rules_version, checked_at, held_by_run_id'

const outcomesSchema = z.record(z.string(), z.object({ status: z.enum(['saved', 'rejected']), reasons: z.array(z.string()) }))

const contactRowSchema = z.object({
  id: z.string(),
  subject_type: z.enum(OUTREACH_SUBJECT_TYPES),
  subject_ref: z.string(),
  lead_id: z.string(),
  status: z.enum(CONTACT_STATUSES).nullable(),
  email: z.string().nullable(),
  source_url: z.string().nullable(),
  kind: z.enum(CONTACT_KINDS).nullable(),
  rejected_count: z.number().int(),
  named_count: z.number().int(),
  evidence: z.unknown(),
  rules_version: z.string().nullable(),
  checked_at: z.string().nullable(),
  held_by_run_id: z.string().nullable(),
})

function toContact(row: z.infer<typeof contactRowSchema>): StoredContact {
  return {
    id: row.id,
    subjectType: row.subject_type,
    subjectRef: row.subject_ref,
    leadId: row.lead_id,
    status: row.status,
    email: row.email,
    sourceUrl: row.source_url,
    kind: row.kind,
    rejectedCount: row.rejected_count,
    namedCount: row.named_count,
    evidence: row.evidence ?? null,
    rulesVersion: row.rules_version,
    checkedAt: row.checked_at,
    heldByRunId: row.held_by_run_id,
  }
}

function resultColumns(decision: ContactDecision, nowIso: string) {
  return {
    status: decision.status,
    email: decision.email,
    source_url: decision.sourceUrl,
    kind: decision.kind,
    rejected_count: decision.rejectedCount,
    named_count: decision.namedCount,
    evidence: decision.evidence,
    rules_version: decision.rulesVersion,
    checked_at: nowIso,
    held_by_run_id: null,
    updated_at: nowIso,
  }
}

export function createContactStore(client: SupabaseClient = createSupabaseServiceRole()): ContactStore {
  function parseContacts(data: unknown, error: unknown): StoredContact[] {
    if (error) throw new ContactStoreError('contacts read')
    const rows = z.array(contactRowSchema).safeParse(data ?? [])
    if (!rows.success) throw new ContactStoreError('contacts parse')
    return rows.data.map(toContact)
  }

  const store: ContactStore = {
    async failStaleRuns(cutoffIso, nowIso) {
      const { data, error } = await client.from(RUNS).select('id, claimed_at, error_summary').eq('state', 'claimed').lt('claimed_at', cutoffIso)
      if (error) throw new ContactStoreError('stale runs read')
      const stale = z.array(z.object({ id: z.string(), claimed_at: z.string(), error_summary: z.string().nullable() })).safeParse(data ?? [])
      if (!stale.success) throw new ContactStoreError('stale runs parse')
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
        if (updateError) throw new ContactStoreError('stale run fail')
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
        .select('id, requested_at, target_subject_type, target_subject_ref')
        .eq('state', 'requested')
        .order('requested_at', { ascending: true })
        .limit(1)
      if (error) throw new ContactStoreError('requested run read')
      const oldest = z
        .array(
          z.object({
            id: z.string(),
            requested_at: z.string(),
            target_subject_type: z.enum(OUTREACH_SUBJECT_TYPES).nullable(),
            target_subject_ref: z.string().nullable(),
          }),
        )
        .safeParse(data ?? [])
      if (!oldest.success) throw new ContactStoreError('requested run parse')
      const candidate = oldest.data[0]
      if (candidate === undefined) return null
      const { data: claimed, error: claimError } = await client
        .from(RUNS)
        .update({ state: 'claimed', claimed_at: nowIso, updated_at: nowIso })
        .eq('id', candidate.id)
        .eq('state', 'requested')
        .select('id')
      if (claimError) throw new ContactStoreError('run claim')
      if (!Array.isArray(claimed) || claimed.length === 0) return null
      const target =
        candidate.target_subject_type !== null && candidate.target_subject_ref !== null
          ? { subjectType: candidate.target_subject_type, subjectRef: candidate.target_subject_ref }
          : null
      return { id: candidate.id, requestedAt: candidate.requested_at, claimedAt: nowIso, target }
    },

    async listAcceptedLeads() {
      const [prospects, businesses] = await Promise.all([
        client.from('prospects').select('id, canonical_name, domain').eq('review_status', 'accepted'),
        client
          .from('new_businesses')
          .select('id, business_name, group_key, website_status, website_url')
          .eq('source', NEW_BUSINESS_SOURCE)
          .eq('group_primary', true)
          .eq('review_status', 'accepted'),
      ])
      if (prospects.error || businesses.error) throw new ContactStoreError('accepted leads read')
      const prospectRows = z.array(z.object({ id: z.string(), canonical_name: z.string(), domain: z.string() })).safeParse(prospects.data ?? [])
      const businessRows = z
        .array(
          z.object({
            id: z.string(),
            business_name: z.string(),
            group_key: z.string().nullable(),
            website_status: z.enum(WEBSITE_STATUSES).nullable(),
            website_url: z.string().nullable(),
          }),
        )
        .safeParse(businesses.data ?? [])
      if (!prospectRows.success || !businessRows.success) throw new ContactStoreError('accepted leads parse')
      const leads: ContactLead[] = [
        ...prospectRows.data.map(
          (row): ContactLead => ({ subjectType: 'prospect', subjectRef: row.id, leadId: row.id, name: row.canonical_name, site: siteForProspect(row.domain) }),
        ),
        ...businessRows.data.map(
          (row): ContactLead => ({
            subjectType: 'new_business',
            subjectRef: row.group_key ?? row.id,
            leadId: row.id,
            name: row.business_name,
            site: siteForBusiness(row.website_status, row.website_url),
          }),
        ),
      ]
      return leads.sort((a, b) => a.name.localeCompare(b.name) || a.subjectRef.localeCompare(b.subjectRef))
    },

    async listContacts() {
      const { data, error } = await client.from(CONTACTS).select(CONTACT_COLUMNS)
      return parseContacts(data, error)
    },

    async getContact(subject) {
      const { data, error } = await client
        .from(CONTACTS)
        .select(CONTACT_COLUMNS)
        .eq('subject_type', subject.subjectType)
        .eq('subject_ref', subject.subjectRef)
        .limit(1)
      return parseContacts(data, error)[0] ?? null
    },

    async contactsFor(subjectType, subjectRefs) {
      if (subjectRefs.length === 0) return []
      const { data, error } = await client.from(CONTACTS).select(CONTACT_COLUMNS).eq('subject_type', subjectType).in('subject_ref', [...subjectRefs])
      return parseContacts(data, error)
    },

    async holdLeads(runId, leads, nowIso) {
      if (leads.length === 0) return []
      const { data, error } = await client
        .from(CONTACTS)
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
        .select(CONTACT_COLUMNS)
      if (error) throw new ContactStoreError('lead hold')
      const rows = z.array(contactRowSchema).safeParse(data ?? [])
      if (!rows.success) throw new ContactStoreError('lead hold parse')
      const byKey = new Map(rows.data.map((row) => [`${row.subject_type}:${row.subject_ref}`, toContact(row)]))
      return leads.map((lead) => {
        const row = byKey.get(`${lead.subjectType}:${lead.subjectRef}`)
        if (row === undefined) throw new ContactStoreError('lead hold result')
        return row
      })
    },

    async attachLeads(runId, contactIds, nowIso) {
      const { error } = await client.from(RUNS).update({ lead_ids: contactIds, lead_count: contactIds.length, updated_at: nowIso }).eq('id', runId)
      if (error) throw new ContactStoreError('run attach')
    },

    async closeEmptyRun(runId, summary, nowIso) {
      const { error } = await client
        .from(RUNS)
        .update({ state: 'completed', finished_at: nowIso, updated_at: nowIso, error_summary: summary, lead_count: 0 })
        .eq('id', runId)
        .eq('state', 'claimed')
      if (error) throw new ContactStoreError('empty run close')
    },

    async getRun(runId): Promise<StoredContactRun | null> {
      const { data, error } = await client.from(RUNS).select('id, state, lead_ids, record_outcomes, error_summary').eq('id', runId).maybeSingle()
      if (error) throw new ContactStoreError('run read')
      if (data === null) return null
      const parsed = z
        .object({
          id: z.string(),
          state: z.enum(CONTACT_RUN_STATES),
          lead_ids: z.array(z.string()).nullable(),
          record_outcomes: outcomesSchema,
          error_summary: z.string().nullable(),
        })
        .safeParse(data)
      if (!parsed.success) throw new ContactStoreError('run parse')
      return {
        id: parsed.data.id,
        state: parsed.data.state,
        leadIds: parsed.data.lead_ids ?? [],
        recordOutcomes: parsed.data.record_outcomes,
        errorSummary: parsed.data.error_summary,
      }
    },

    async saveResult(contactId, runId, decision, nowIso) {
      const { error } = await client
        .from(CONTACTS)
        .update({ ...resultColumns(decision, nowIso), ...(runId === null ? {} : { run_id: runId }) })
        .eq('id', contactId)
      if (error) throw new ContactStoreError('result write')
    },

    async saveLeadResult(lead, decision, nowIso) {
      const { error } = await client
        .from(CONTACTS)
        .upsert(
          { subject_type: lead.subjectType, subject_ref: lead.subjectRef, lead_id: lead.leadId, ...resultColumns(decision, nowIso) },
          { onConflict: 'subject_type,subject_ref' },
        )
      if (error) throw new ContactStoreError('lead result write')
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
      if (error) throw new ContactStoreError('run update')
      return Array.isArray(data) && data.length > 0
    },

    async releaseUnchecked(runId) {
      const { error } = await client.from(CONTACTS).update({ held_by_run_id: null }).eq('held_by_run_id', runId)
      if (error) throw new ContactStoreError('release')
    },

    async countRuns(states) {
      const { count, error } = await client.from(RUNS).select('id', { count: 'exact', head: true }).in('state', [...states])
      if (error) throw new ContactStoreError('run count')
      return count ?? 0
    },

    async requestRun(source: ContactRunSource, target: ContactSubject | null, nowIso) {
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
      if (error) throw new ContactStoreError('run request')
      const parsed = z.object({ id: z.string() }).safeParse(data)
      if (!parsed.success) throw new ContactStoreError('run request parse')
      return { id: parsed.data.id }
    },
  }
  return store
}

// --- Read-only loaders for the pages.

export type ContactRunRow = {
  id: string
  state: ContactRunState
  source: string
  leadCount: number
  checked: number
  rejected: number
  requestedAt: string
  claimedAt: string | null
  finishedAt: string | null
}

/** The newest contact runs, or null when they cannot be read (for example before migration 0034). */
export async function fetchContactRuns(limit = 3): Promise<ContactRunRow[] | null> {
  try {
    const { data, error } = await createSupabaseServiceRole()
      .from(RUNS)
      .select('id, state, source, lead_count, counts, requested_at, claimed_at, finished_at')
      .order('requested_at', { ascending: false })
      .limit(limit)
    if (error) return null
    const rows = z
      .array(
        z.object({
          id: z.string(),
          state: z.enum(CONTACT_RUN_STATES),
          source: z.string(),
          lead_count: z.number().int().nullable(),
          counts: z.object({ checked: z.number().int().optional(), rejected: z.number().int().optional() }).catch({}),
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
      leadCount: row.lead_count ?? 0,
      checked: row.counts.checked ?? 0,
      rejected: row.counts.rejected ?? 0,
      requestedAt: row.requested_at,
      claimedAt: row.claimed_at,
      finishedAt: row.finished_at,
    }))
  } catch {
    return null
  }
}
