import 'server-only'

/**
 * Supabase adapters for daily_briefings and prospect_campaigns. Thin on
 * purpose; the rules live in generate.ts and campaigns.ts. Scheduled runs are
 * inserted into prospect_runs with requested_by and source 'schedule'.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

import { readBriefingContent, readSourceFreshness } from '@/lib/briefing/content-schema'
import {
  SCHEDULE_REQUESTED_BY,
  SCHEDULE_SOURCE,
  scheduledRunConfig,
  type Campaign,
  type CampaignStore,
} from '@/lib/briefing/campaigns'
import {
  BRIEFING_STATUSES,
  type BriefingRecord,
  type BriefingStore,
} from '@/lib/briefing/generate'
import { createSupabaseServiceRole } from '@/lib/supabase/service'

export class BriefingStoreError extends Error {
  constructor(operation: string) {
    super(`Briefing store ${operation} failed`)
    this.name = 'BriefingStoreError'
  }
}

const BRIEFING_COLUMNS =
  'briefing_date, generated_at, status, content, narrative, source_freshness, error'

const briefingRowSchema = z.object({
  briefing_date: z.string(),
  generated_at: z.string(),
  status: z.enum(BRIEFING_STATUSES),
  content: z.unknown(),
  narrative: z.string().nullable(),
  source_freshness: z.unknown(),
  error: z.string().nullable(),
})

export type StoredBriefing = BriefingRecord & { contentReadable: boolean }

function toRecord(value: unknown): StoredBriefing | null {
  const row = briefingRowSchema.safeParse(value)
  if (!row.success) {
    return null
  }
  const content = readBriefingContent(row.data.content)
  if (content === null) {
    return null
  }
  return {
    briefingDate: row.data.briefing_date,
    generatedAt: row.data.generated_at,
    status: row.data.status,
    content,
    narrative: row.data.narrative,
    sourceFreshness: readSourceFreshness(row.data.source_freshness),
    error: row.data.error,
    contentReadable: true,
  }
}

export function createBriefingStore(
  client: SupabaseClient = createSupabaseServiceRole(),
): BriefingStore & {
  listRecent(limit: number): Promise<{ briefingDate: string; status: string; generatedAt: string }[]>
  getLatest(): Promise<StoredBriefing | null>
} {
  async function single(query: PromiseLike<{ data: unknown; error: unknown }>, op: string) {
    const { data, error } = await query
    if (error) {
      throw new BriefingStoreError(op)
    }
    return data === null ? null : toRecord(data)
  }

  return {
    async getByDate(briefingDate) {
      return single(
        client.from('daily_briefings').select(BRIEFING_COLUMNS).eq('briefing_date', briefingDate).maybeSingle(),
        'read by date',
      )
    },

    async getLatestBefore(briefingDate) {
      return single(
        client
          .from('daily_briefings')
          .select(BRIEFING_COLUMNS)
          .lt('briefing_date', briefingDate)
          .order('briefing_date', { ascending: false })
          .limit(1)
          .maybeSingle(),
        'read previous',
      )
    },

    async getLatest() {
      return single(
        client
          .from('daily_briefings')
          .select(BRIEFING_COLUMNS)
          .order('briefing_date', { ascending: false })
          .limit(1)
          .maybeSingle(),
        'read latest',
      )
    },

    async listRecent(limit) {
      const { data, error } = await client
        .from('daily_briefings')
        .select('briefing_date, status, generated_at')
        .order('briefing_date', { ascending: false })
        .limit(limit)
      if (error) {
        throw new BriefingStoreError('list')
      }
      const rows = z
        .array(z.object({ briefing_date: z.string(), status: z.string(), generated_at: z.string() }))
        .safeParse(data ?? [])
      if (!rows.success) {
        throw new BriefingStoreError('list parse')
      }
      return rows.data.map((row) => ({
        briefingDate: row.briefing_date,
        status: row.status,
        generatedAt: row.generated_at,
      }))
    },

    async save(record, { overwrite }) {
      const row = {
        briefing_date: record.briefingDate,
        generated_at: record.generatedAt,
        status: record.status,
        content: record.content,
        narrative: record.narrative,
        source_freshness: record.sourceFreshness,
        error: record.error,
        updated_at: record.generatedAt,
      }
      const { data, error } = await client
        .from('daily_briefings')
        .upsert(row, { onConflict: 'briefing_date', ignoreDuplicates: !overwrite })
        .select('briefing_date')

      if (error) {
        throw new BriefingStoreError('save')
      }
      // With ignoreDuplicates, a conflicting row is skipped and nothing returns.
      return Array.isArray(data) && data.length > 0 ? 'saved' : 'exists'
    },
  }
}

const campaignRowSchema = z.object({
  id: z.string(),
  market: z.string(),
  industry: z.string(),
  target_count: z.number().int(),
  exclusions: z.array(z.string()),
  cadence_days: z.number().int(),
  active: z.boolean(),
  last_queued_at: z.string().nullable(),
})

const CAMPAIGN_COLUMNS =
  'id, market, industry, target_count, exclusions, cadence_days, active, last_queued_at'

function toCampaign(row: z.infer<typeof campaignRowSchema>): Campaign {
  return {
    id: row.id,
    market: row.market,
    industry: row.industry,
    targetCount: row.target_count,
    exclusions: row.exclusions,
    cadenceDays: row.cadence_days,
    active: row.active,
    lastQueuedAt: row.last_queued_at,
  }
}

export function createCampaignStore(
  client: SupabaseClient = createSupabaseServiceRole(),
): CampaignStore & { listAllCampaigns(): Promise<Campaign[]> } {
  async function list(activeOnly: boolean): Promise<Campaign[]> {
    let query = client.from('prospect_campaigns').select(CAMPAIGN_COLUMNS)
    if (activeOnly) {
      query = query.eq('active', true)
    }
    const { data, error } = await query.order('created_at', { ascending: true })
    if (error) {
      throw new BriefingStoreError('campaigns read')
    }
    const rows = z.array(campaignRowSchema).safeParse(data ?? [])
    if (!rows.success) {
      throw new BriefingStoreError('campaigns parse')
    }
    return rows.data.map(toCampaign)
  }

  return {
    listActiveCampaigns: () => list(true),
    listAllCampaigns: () => list(false),

    async campaignIdsWithOpenRuns() {
      const { data, error } = await client
        .from('prospect_runs')
        .select('config')
        .in('state', ['requested', 'claimed'])
        .not('config->>campaignId', 'is', null)
      if (error) {
        throw new BriefingStoreError('open runs read')
      }
      const ids = new Set<string>()
      for (const row of data ?? []) {
        const config: unknown = Reflect.get(row, 'config')
        const id = typeof config === 'object' && config !== null ? Reflect.get(config, 'campaignId') : null
        if (typeof id === 'string') {
          ids.add(id)
        }
      }
      return ids
    },

    async queueRun(campaign, nowIso) {
      const { data, error } = await client
        .from('prospect_runs')
        .insert({
          state: 'requested',
          config: scheduledRunConfig(campaign),
          requested_by: SCHEDULE_REQUESTED_BY,
          source: SCHEDULE_SOURCE,
        })
        .select('id')
        .single()
      if (error) {
        throw new BriefingStoreError('scheduled run insert')
      }
      const run = z.object({ id: z.string() }).safeParse(data)
      if (!run.success) {
        throw new BriefingStoreError('scheduled run parse')
      }

      // If this update fails, the open run still blocks a duplicate next tick.
      const { error: updateError } = await client
        .from('prospect_campaigns')
        .update({ last_queued_at: nowIso, updated_at: nowIso })
        .eq('id', campaign.id)
      if (updateError) {
        throw new BriefingStoreError('campaign queued update')
      }
      return run.data.id
    },
  }
}
