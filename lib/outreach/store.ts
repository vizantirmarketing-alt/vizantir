import 'server-only'

/**
 * Supabase adapter for the OutreachStore contract (lib/outreach/types.ts).
 * Thin on purpose: the rules live in lib/outreach/draft.ts and
 * lib/outreach/lifecycle.ts. Service role, explicit column lists, Zod on
 * every read. Writes only to outreach_drafts, outreach_suppressions and
 * outreach_settings (migration 0032), and outreach_gmail_connection (0033).
 *
 * Mirrors lib/outreach/fixtures/memory-store.ts:
 *   - one active (draft or approved) row per subject: the partial unique
 *     index outreach_drafts_one_active_idx, read here as Postgres 23505
 *   - status changes are conditional on the status they start from
 *   - the suppression email is unique and stored normalized
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

import {
  ACTIVE_STATUSES,
  OUTREACH_STATUSES,
  OUTREACH_SUBJECT_TYPES,
  SENT_VIA,
  SUPPRESSION_REASONS,
  normalizeEmail,
  type OutreachStatus,
  type OutreachSubjectType,
} from '@/lib/outreach/params'
import type {
  DraftPatch,
  GmailConnection,
  GmailConnectionStore,
  NewDraft,
  OutreachDraft,
  OutreachSettings,
  OutreachStore,
  Suppression,
} from '@/lib/outreach/types'
import { createSupabaseServiceRole } from '@/lib/supabase/service'

const DRAFT_COLUMNS =
  'id, subject_type, subject_ref, lead_id, lead_name, to_email, subject, body, footer, status, model, prompt_version, created_at, updated_at, approved_at, sent_at, sent_via, gmail_message_id, gmail_thread_id, send_error'
const SUPPRESSION_COLUMNS = 'id, email, domain, reason, created_at'
const SETTINGS_COLUMNS = 'sender_name, studio_name, reply_to_email, postal_address'

const UNIQUE_VIOLATION = '23505'
const SUBJECT_REF_BATCH = 200

const draftRowSchema = z.object({
  id: z.string(),
  subject_type: z.enum(OUTREACH_SUBJECT_TYPES),
  subject_ref: z.string(),
  lead_id: z.string(),
  lead_name: z.string(),
  to_email: z.string().nullable(),
  subject: z.string(),
  body: z.string(),
  footer: z.string(),
  status: z.enum(OUTREACH_STATUSES),
  model: z.string(),
  prompt_version: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  approved_at: z.string().nullable(),
  sent_at: z.string().nullable(),
  sent_via: z.enum(SENT_VIA).nullable(),
  gmail_message_id: z.string().nullable(),
  gmail_thread_id: z.string().nullable(),
  send_error: z.string().nullable(),
})

const suppressionRowSchema = z.object({
  id: z.string(),
  email: z.string(),
  domain: z.string().nullable(),
  reason: z.enum(SUPPRESSION_REASONS),
  created_at: z.string(),
})

const settingsRowSchema = z.object({
  sender_name: z.string(),
  studio_name: z.string(),
  reply_to_email: z.string(),
  postal_address: z.string(),
})

export class OutreachStoreError extends Error {
  constructor(operation: string) {
    super(`Outreach store ${operation} failed`)
    this.name = 'OutreachStoreError'
  }
}

function toDraft(row: z.infer<typeof draftRowSchema>): OutreachDraft {
  return {
    id: row.id,
    subjectType: row.subject_type,
    subjectRef: row.subject_ref,
    leadId: row.lead_id,
    leadName: row.lead_name,
    toEmail: row.to_email,
    subject: row.subject,
    body: row.body,
    footer: row.footer,
    status: row.status,
    model: row.model,
    promptVersion: row.prompt_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    approvedAt: row.approved_at,
    sentAt: row.sent_at,
    sentVia: row.sent_via,
    gmailMessageId: row.gmail_message_id,
    gmailThreadId: row.gmail_thread_id,
    sendError: row.send_error,
  }
}

function toSuppression(row: z.infer<typeof suppressionRowSchema>): Suppression {
  return { id: row.id, email: row.email, domain: row.domain, reason: row.reason, createdAt: row.created_at }
}

function parseDrafts(data: unknown, operation: string): OutreachDraft[] {
  const rows = z.array(draftRowSchema).safeParse(data ?? [])
  if (!rows.success) throw new OutreachStoreError(`${operation} parse`)
  return rows.data.map(toDraft)
}

function parseDraft(data: unknown, operation: string): OutreachDraft | null {
  if (data === null || data === undefined) return null
  const row = draftRowSchema.safeParse(data)
  if (!row.success) throw new OutreachStoreError(`${operation} parse`)
  return toDraft(row.data)
}

function parseSuppressions(data: unknown, operation: string): Suppression[] {
  const rows = z.array(suppressionRowSchema).safeParse(data ?? [])
  if (!rows.success) throw new OutreachStoreError(`${operation} parse`)
  return rows.data.map(toSuppression)
}

function patchColumns(patch: DraftPatch): Record<string, string | null> {
  const columns: Record<string, string | null> = { updated_at: patch.updatedAt }
  if (patch.toEmail !== undefined) columns.to_email = patch.toEmail
  if (patch.subject !== undefined) columns.subject = patch.subject
  if (patch.body !== undefined) columns.body = patch.body
  if (patch.status !== undefined) columns.status = patch.status
  if (patch.approvedAt !== undefined) columns.approved_at = patch.approvedAt
  if (patch.sentAt !== undefined) columns.sent_at = patch.sentAt
  if (patch.sentVia !== undefined) columns.sent_via = patch.sentVia
  if (patch.gmailMessageId !== undefined) columns.gmail_message_id = patch.gmailMessageId
  if (patch.gmailThreadId !== undefined) columns.gmail_thread_id = patch.gmailThreadId
  if (patch.sendError !== undefined) columns.send_error = patch.sendError
  return columns
}

export function createOutreachStore(client: SupabaseClient = createSupabaseServiceRole()): OutreachStore {
  async function countSince(column: 'created_at' | 'sent_at', iso: string, status?: OutreachStatus, sentVia?: 'gmail'): Promise<number> {
    let query = client.from('outreach_drafts').select('id', { count: 'exact', head: true }).gte(column, iso)
    if (status !== undefined) query = query.eq('status', status)
    if (sentVia !== undefined) query = query.eq('sent_via', sentVia)
    const { count, error } = await query
    if (error) throw new OutreachStoreError(`count ${column}`)
    return count ?? 0
  }

  return {
    async getSettings() {
      const { data, error } = await client.from('outreach_settings').select(SETTINGS_COLUMNS).eq('id', true).maybeSingle()
      if (error) throw new OutreachStoreError('settings read')
      if (data === null) return null
      const row = settingsRowSchema.safeParse(data)
      if (!row.success) throw new OutreachStoreError('settings parse')
      return {
        senderName: row.data.sender_name,
        studioName: row.data.studio_name,
        replyToEmail: row.data.reply_to_email,
        postalAddress: row.data.postal_address,
      }
    },

    async saveSettings(settings: OutreachSettings, nowIso: string) {
      const { error } = await client.from('outreach_settings').upsert(
        {
          id: true,
          sender_name: settings.senderName,
          studio_name: settings.studioName,
          reply_to_email: settings.replyToEmail,
          postal_address: settings.postalAddress,
          updated_at: nowIso,
        },
        { onConflict: 'id' },
      )
      if (error) throw new OutreachStoreError('settings save')
    },

    async getDraft(id: string) {
      const { data, error } = await client.from('outreach_drafts').select(DRAFT_COLUMNS).eq('id', id).maybeSingle()
      if (error) throw new OutreachStoreError('draft read')
      return parseDraft(data, 'draft read')
    },

    async findActiveDraft(subjectType: OutreachSubjectType, subjectRef: string) {
      const { data, error } = await client
        .from('outreach_drafts')
        .select(DRAFT_COLUMNS)
        .eq('subject_type', subjectType)
        .eq('subject_ref', subjectRef)
        .in('status', [...ACTIVE_STATUSES])
        .limit(1)
      if (error) throw new OutreachStoreError('active draft read')
      return parseDrafts(data, 'active draft read')[0] ?? null
    },

    countCreatedSince: (iso: string) => countSince('created_at', iso),
    countSentSince: (iso: string) => countSince('sent_at', iso, 'sent'),
    countGmailSentSince: (iso: string) => countSince('sent_at', iso, 'sent', 'gmail'),

    async insertDraft(draft: NewDraft, replaceId: string | null, nowIso: string) {
      let replaced = false
      if (replaceId !== null) {
        const { data, error } = await client
          .from('outreach_drafts')
          .update({ status: 'discarded', updated_at: nowIso })
          .eq('id', replaceId)
          .eq('status', 'draft')
          .select('id')
          .maybeSingle()
        if (error) throw new OutreachStoreError('draft replace')
        replaced = data !== null
      }

      const { data, error } = await client
        .from('outreach_drafts')
        .insert({
          subject_type: draft.subjectType,
          subject_ref: draft.subjectRef,
          lead_id: draft.leadId,
          lead_name: draft.leadName,
          to_email: draft.toEmail,
          subject: draft.subject,
          body: draft.body,
          footer: draft.footer,
          status: 'draft',
          model: draft.model,
          prompt_version: draft.promptVersion,
          created_at: nowIso,
          updated_at: nowIso,
        })
        .select('id')
        .single()

      if (error) {
        // The two statements are not one transaction. If the insert fails,
        // the replaced draft is put back so the lead keeps its draft.
        if (replaced && replaceId !== null) {
          await client.from('outreach_drafts').update({ status: 'draft', updated_at: nowIso }).eq('id', replaceId).eq('status', 'discarded')
        }
        if (error.code === UNIQUE_VIOLATION) return { ok: false as const, reason: 'conflict' as const }
        throw new OutreachStoreError('draft insert')
      }
      const row = z.object({ id: z.string() }).safeParse(data)
      if (!row.success) throw new OutreachStoreError('draft insert parse')
      return { ok: true as const, id: row.data.id }
    },

    async updateDraft(id: string, from: readonly OutreachStatus[], patch: DraftPatch) {
      const { data, error } = await client
        .from('outreach_drafts')
        .update(patchColumns(patch))
        .eq('id', id)
        .in('status', [...from])
        .select(DRAFT_COLUMNS)
        .maybeSingle()
      if (error) {
        if (error.code === UNIQUE_VIOLATION) return null
        throw new OutreachStoreError('draft update')
      }
      return parseDraft(data, 'draft update')
    },

    async listDrafts(limit: number) {
      const { data, error } = await client
        .from('outreach_drafts')
        .select(DRAFT_COLUMNS)
        .neq('status', 'discarded')
        .order('updated_at', { ascending: false })
        .limit(limit)
      if (error) throw new OutreachStoreError('drafts list')
      return parseDrafts(data, 'drafts list')
    },

    async activeDraftsFor(subjectType: OutreachSubjectType, subjectRefs: readonly string[]) {
      const refs = [...new Set(subjectRefs)]
      const out: OutreachDraft[] = []
      for (let i = 0; i < refs.length; i += SUBJECT_REF_BATCH) {
        const { data, error } = await client
          .from('outreach_drafts')
          .select(DRAFT_COLUMNS)
          .eq('subject_type', subjectType)
          .in('subject_ref', refs.slice(i, i + SUBJECT_REF_BATCH))
          .in('status', [...ACTIVE_STATUSES])
        if (error) throw new OutreachStoreError('active drafts read')
        out.push(...parseDrafts(data, 'active drafts read'))
      }
      return out
    },

    async listSuppressions() {
      const { data, error } = await client
        .from('outreach_suppressions')
        .select(SUPPRESSION_COLUMNS)
        .order('created_at', { ascending: false })
        .limit(1000)
      if (error) throw new OutreachStoreError('suppressions list')
      return parseSuppressions(data, 'suppressions list')
    },

    async findSuppressions(email: string, domain: string | null) {
      // Two plain equality reads rather than one or() filter, so no address
      // character needs quoting in a filter string.
      const address = normalizeEmail(email)
      const byEmail = await client.from('outreach_suppressions').select(SUPPRESSION_COLUMNS).eq('email', address).limit(1)
      if (byEmail.error) throw new OutreachStoreError('suppression read')
      const found = parseSuppressions(byEmail.data, 'suppression read')
      if (domain !== null) {
        const byDomain = await client.from('outreach_suppressions').select(SUPPRESSION_COLUMNS).eq('domain', domain.toLowerCase()).limit(1)
        if (byDomain.error) throw new OutreachStoreError('suppression read')
        found.push(...parseSuppressions(byDomain.data, 'suppression read'))
      }
      return found
    },

    async addSuppression(entry, nowIso: string) {
      const email = normalizeEmail(entry.email)
      const existing = await client.from('outreach_suppressions').select('id, domain').eq('email', email).maybeSingle()
      if (existing.error) throw new OutreachStoreError('suppression read')
      if (existing.data !== null) {
        const row = z.object({ id: z.string(), domain: z.string().nullable() }).safeParse(existing.data)
        if (!row.success) throw new OutreachStoreError('suppression parse')
        // Widened to the whole domain when asked, never narrowed.
        if (entry.domain !== null && row.data.domain === null) {
          const { error } = await client.from('outreach_suppressions').update({ domain: entry.domain }).eq('id', row.data.id)
          if (error) throw new OutreachStoreError('suppression update')
        }
        return 'exists' as const
      }
      const { error } = await client
        .from('outreach_suppressions')
        .insert({ email, domain: entry.domain, reason: entry.reason, created_at: nowIso })
      if (error) {
        if (error.code === UNIQUE_VIOLATION) return 'exists' as const
        throw new OutreachStoreError('suppression insert')
      }
      return 'added' as const
    },

    async removeSuppression(id: string) {
      const { data, error } = await client.from('outreach_suppressions').delete().eq('id', id).select('id')
      if (error) throw new OutreachStoreError('suppression delete')
      return Array.isArray(data) && data.length > 0
    },
  }
}

const CONNECTION_COLUMNS = 'email, token_ciphertext, token_iv, token_tag, connected_at, connected_by, needs_reconnect'

const connectionRowSchema = z.object({
  email: z.string(),
  token_ciphertext: z.string(),
  token_iv: z.string(),
  token_tag: z.string(),
  connected_at: z.string(),
  connected_by: z.string(),
  needs_reconnect: z.boolean(),
})

/** The one connected Google mailbox (migration 0033). Single row, id = true. */
export function createGmailConnectionStore(client: SupabaseClient = createSupabaseServiceRole()): GmailConnectionStore {
  return {
    async get() {
      const { data, error } = await client.from('outreach_gmail_connection').select(CONNECTION_COLUMNS).eq('id', true).maybeSingle()
      if (error) throw new OutreachStoreError('connection read')
      if (data === null) return null
      const row = connectionRowSchema.safeParse(data)
      if (!row.success) throw new OutreachStoreError('connection parse')
      return {
        email: row.data.email,
        tokenCiphertext: row.data.token_ciphertext,
        tokenIv: row.data.token_iv,
        tokenTag: row.data.token_tag,
        connectedAt: row.data.connected_at,
        connectedBy: row.data.connected_by,
        needsReconnect: row.data.needs_reconnect,
      }
    },

    async save(connection: GmailConnection) {
      const { error } = await client.from('outreach_gmail_connection').upsert(
        {
          id: true,
          email: connection.email,
          token_ciphertext: connection.tokenCiphertext,
          token_iv: connection.tokenIv,
          token_tag: connection.tokenTag,
          connected_at: connection.connectedAt,
          connected_by: connection.connectedBy,
          needs_reconnect: connection.needsReconnect,
        },
        { onConflict: 'id' },
      )
      if (error) throw new OutreachStoreError('connection save')
    },

    async markNeedsReconnect() {
      const { error } = await client.from('outreach_gmail_connection').update({ needs_reconnect: true }).eq('id', true)
      if (error) throw new OutreachStoreError('connection update')
    },

    async remove() {
      const { error } = await client.from('outreach_gmail_connection').delete().eq('id', true)
      if (error) throw new OutreachStoreError('connection delete')
    },
  }
}
