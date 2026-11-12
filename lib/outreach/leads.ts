import 'server-only'

/**
 * Lead loaders for outreach drafting and the draft page's "Written from"
 * panel. Selects only, and only the columns lib/outreach/context.ts uses: no
 * phone, street address, owner note or review history is read, so none of it
 * can reach the model. Source links are read for the owner's view;
 * buildOutreachContext() never copies them.
 *
 * A business is loaded by any of its license rows. Its subject is its group
 * key, so a draft covers every license row; before grouping (no group key,
 * or migration 0030 not applied) the row id stands in.
 */

import { z } from 'zod'

import { NEW_BUSINESS_SOURCE } from '@/lib/new-businesses/discovery'
import { NEW_BUSINESS_REVIEW_STATUSES } from '@/lib/new-businesses/params'
import { WEBSITE_STATUSES } from '@/lib/new-businesses/website-rules'
import type { NewBusinessLead, ProspectLead } from '@/lib/outreach/context'
import { EVIDENCE_KINDS, PROSPECT_REVIEW_STATUSES } from '@/lib/prospects/params'
import { readFactorRatings } from '@/lib/prospects/rubric'
import { createSupabaseServiceRole } from '@/lib/supabase/service'

/** Plenty for the strongest three claims and the latest measurement. */
const EVIDENCE_LIMIT = 200

export type LoadLeadResult<T> = { ok: true; lead: T } | { ok: false; reason: 'not_found' | 'error' }

export async function loadProspectLead(id: string): Promise<LoadLeadResult<ProspectLead>> {
  try {
    const supabase = createSupabaseServiceRole()
    const { data, error } = await supabase
      .from('prospects')
      .select('id, canonical_name, domain, market, industry, review_status, factor_ratings')
      .eq('id', id)
      .maybeSingle()
    if (error) return { ok: false, reason: 'error' }
    if (data === null) return { ok: false, reason: 'not_found' }
    const row = z
      .object({
        id: z.string(),
        canonical_name: z.string(),
        domain: z.string(),
        market: z.string().nullable(),
        industry: z.string().nullable(),
        review_status: z.enum(PROSPECT_REVIEW_STATUSES),
        factor_ratings: z.unknown(),
      })
      .safeParse(data)
    if (!row.success) return { ok: false, reason: 'error' }

    const evidence = await supabase
      .from('prospect_evidence')
      .select('factor_key, kind, claim, source_url')
      .eq('prospect_id', id)
      .order('observed_at', { ascending: false })
      .limit(EVIDENCE_LIMIT)
    if (evidence.error) return { ok: false, reason: 'error' }
    const items = z
      .array(z.object({ factor_key: z.string(), kind: z.enum(EVIDENCE_KINDS), claim: z.string(), source_url: z.string().nullable().catch(null) }))
      .safeParse(evidence.data ?? [])
    if (!items.success) return { ok: false, reason: 'error' }

    return {
      ok: true,
      lead: {
        type: 'prospect',
        id: row.data.id,
        name: row.data.canonical_name,
        domain: row.data.domain,
        market: row.data.market,
        industry: row.data.industry,
        reviewStatus: row.data.review_status,
        factorRatings: readFactorRatings(row.data.factor_ratings),
        evidence: items.data.map((item) => ({ factorKey: item.factor_key, kind: item.kind, claim: item.claim, sourceUrl: item.source_url })),
      },
    }
  } catch {
    return { ok: false, reason: 'error' }
  }
}

const BASE_COLUMNS = 'id, business_name, category, city, review_status, period_year, period_month'
const GROUP_COLUMNS = 'group_key, group_categories, group_periods'
const WEBSITE_COLUMN = 'website_status, website_url, website_evidence'
const PERIOD_KEY_RE = /^(\d{4})-(\d{2})$/

const businessRowSchema = z.object({
  id: z.string(),
  business_name: z.string(),
  category: z.string(),
  city: z.string().nullable(),
  review_status: z.enum(NEW_BUSINESS_REVIEW_STATUSES),
  period_year: z.number().int(),
  period_month: z.number().int(),
  group_key: z.string().nullable().optional().catch(null),
  group_categories: z.array(z.string()).nullable().optional().catch(null),
  group_periods: z.array(z.string()).nullable().optional().catch(null),
  website_status: z.enum(WEBSITE_STATUSES).nullable().optional().catch(null),
  website_url: z.string().nullable().optional().catch(null),
  // Only the matching pages' links are read; excerpts and searches stay in the table.
  website_evidence: z
    .object({ candidates: z.array(z.object({ url: z.string(), accepted: z.boolean().catch(false) })).catch([]) })
    .nullable()
    .optional()
    .catch(null),
})

export async function loadBusinessLead(id: string): Promise<LoadLeadResult<NewBusinessLead>> {
  try {
    const supabase = createSupabaseServiceRole()
    // Newest schema first; each fallback drops columns a later migration
    // added (0031 website, 0030 groups), so drafting works on any of them.
    const attempts = [
      `${BASE_COLUMNS}, ${GROUP_COLUMNS}, ${WEBSITE_COLUMN}`,
      `${BASE_COLUMNS}, ${GROUP_COLUMNS}`,
      BASE_COLUMNS,
    ]
    let data: unknown = null
    let loaded = false
    for (const columns of attempts) {
      const result = await supabase.from('new_businesses').select(columns).eq('id', id).eq('source', NEW_BUSINESS_SOURCE).maybeSingle()
      if (!result.error) {
        data = result.data
        loaded = true
        break
      }
    }
    if (!loaded) return { ok: false, reason: 'error' }
    if (data === null) return { ok: false, reason: 'not_found' }
    const row = businessRowSchema.safeParse(data)
    if (!row.success) return { ok: false, reason: 'error' }

    const newest = PERIOD_KEY_RE.exec(row.data.group_periods?.[0] ?? '')
    const latestPeriod = newest
      ? { year: Number(newest[1]), month: Number(newest[2]) }
      : { year: row.data.period_year, month: row.data.period_month }
    const licenses = row.data.group_categories && row.data.group_categories.length > 0 ? row.data.group_categories : [row.data.category]

    return {
      ok: true,
      lead: {
        type: 'new_business',
        id: row.data.id,
        groupKey: row.data.group_key ?? null,
        name: row.data.business_name,
        licenses,
        city: row.data.city,
        latestPeriod,
        websiteStatus: row.data.website_status ?? null,
        websiteEvidenceUrl: row.data.website_url ?? row.data.website_evidence?.candidates.find((c) => c.accepted)?.url ?? null,
        reviewStatus: row.data.review_status,
      },
    }
  } catch {
    return { ok: false, reason: 'error' }
  }
}
