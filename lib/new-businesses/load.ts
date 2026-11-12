import 'server-only'

/**
 * Read-only loaders for the New Businesses page and the briefing count.
 * Selects only.
 */

import { z } from 'zod'

import { NEW_BUSINESS_SOURCE, type Period } from '@/lib/new-businesses/discovery'
import { LEAD_TIERS, reasonLine, type LeadTier, type RankSignal } from '@/lib/new-businesses/rank'
import { WEBSITE_STATUSES, candidateClass, type WebsiteStatus } from '@/lib/new-businesses/website-rules'
import { CANDIDATE_KINDS } from '@/lib/new-businesses/website-schema'
import {
  NEW_BUSINESSES_PAGE_SIZE,
  NEW_BUSINESS_REVIEW_STATUSES,
  parsePeriodParam,
  type NewBusinessReviewStatus,
  type NewBusinessesListParams,
} from '@/lib/new-businesses/params'
import { createSupabaseServiceRole } from '@/lib/supabase/service'

const OPTIONS_SCAN_LIMIT = 5000
const IMPORTS_LIMIT = 24
const COUNT_PAGE = 1000

/** One business in the list: its primary license row plus the group's licenses. */
export type NewBusinessRow = {
  /** The primary row's id. Review actions apply to every license row of the business. */
  id: string
  /** Shared by every license row of the business; null before grouping. */
  groupKey: string | null
  name: string
  address: string | null
  suite: string | null
  city: string | null
  state: string | null
  zip: string | null
  phone: string | null
  /** Every category the business holds. */
  licenses: string[]
  /** The newest period with a license row. */
  latestPeriod: Period
  licenseCount: number
  reviewStatus: NewBusinessReviewStatus
  ownerNote: string | null
  /** Null until the next import or re-import scores the business. */
  leadScore: number | null
  leadTier: LeadTier | null
  /** The business type, then only what sets it apart. */
  leadReason: string | null
  /** The website check result, or null when the business has not been checked. */
  website: NewBusinessWebsite | null
}

export type NewBusinessWebsite = {
  status: WebsiteStatus
  /** The best accepted URL; http or https only (checked again before rendering). */
  url: string | null
  checkedAt: string | null
  searches: string[]
  /** mention: a page about the business that is not its web presence. */
  candidates: { url: string; excerpt: string; accepted: boolean; mention: boolean }[]
  /** The runner's note, for example why a business was not searched. */
  note: string | null
}

const websiteEvidenceSchema = z
  .object({
    searches: z.array(z.string()).catch([]),
    candidates: z
      .array(
        z.object({
          url: z.string(),
          excerpt: z.string(),
          accepted: z.boolean().catch(false),
          kindClaimed: z.enum(CANDIDATE_KINDS).optional().catch(undefined),
        }),
      )
      .catch([]),
    note: z.string().nullable().optional().catch(null),
  })
  .nullable()
  .catch(null)

export type CategoryRow = {
  category: string
  enabled: boolean
  lastSeenCount: number
  lastSeenAt: string | null
}

export type ImportRow = {
  period: Period
  state: 'importing' | 'imported' | 'failed'
  fileUrl: string
  rowsTotal: number
  rowsStored: number
  rowsDiscarded: number
  rowsInserted: number
  unparsedLines: number
  error: string | null
  startedAt: string
  finishedAt: string | null
}

const PERIOD_KEY_RE = /^(\d{4})-(\d{2})$/

const scoreFields = {
  // A malformed score is shown as unscored rather than failing the page.
  lead_score: z.number().int().min(0).max(100).nullable().catch(null),
  lead_tier: z.enum(LEAD_TIERS).nullable().catch(null),
  lead_signals: z
    .array(z.object({ key: z.string(), label: z.string(), points: z.number() }))
    .nullable()
    .catch(null),
}

const baseRowSchema = z.object({
  id: z.string(),
  period_year: z.number().int(),
  period_month: z.number().int(),
  business_name: z.string(),
  address: z.string().nullable(),
  suite: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  zip: z.string().nullable(),
  phone: z.string().nullable(),
  category: z.string(),
  review_status: z.enum(NEW_BUSINESS_REVIEW_STATUSES),
  owner_note: z.string().nullable(),
  ...scoreFields,
})

const groupedRowSchema = baseRowSchema.extend({
  group_key: z.string().nullable().optional().catch(null),
  group_categories: z.array(z.string()).nullable().catch(null),
  group_periods: z.array(z.string()).nullable().catch(null),
  group_license_count: z.number().int().nullable().catch(null),
})

const BASE_COLUMNS =
  'id, period_year, period_month, business_name, address, suite, city, state, zip, phone, category, review_status, owner_note, lead_score, lead_tier, lead_signals'
const GROUPED_COLUMNS = `${BASE_COLUMNS}, group_key, group_categories, group_periods, group_license_count`
const WEBSITE_COLUMNS = 'website_status, website_url, website_evidence, website_checked_at'

const websiteFields = {
  website_status: z.enum(WEBSITE_STATUSES).nullable().optional().catch(null),
  website_url: z.string().nullable().optional().catch(null),
  website_evidence: websiteEvidenceSchema.optional(),
  website_checked_at: z.string().nullable().optional().catch(null),
}

/**
 * grouped:  every row has been regrouped; the list shows one primary row per business.
 * licenses: some rows have not been regrouped yet (or migration 0030 is not
 *           applied); the list shows license rows as before, so nothing is
 *           hidden while waiting for the next import or re-import.
 */
export type NewBusinessListMode = 'grouped' | 'licenses'

async function listMode(supabase: ReturnType<typeof createSupabaseServiceRole>): Promise<NewBusinessListMode> {
  const { count, error } = await supabase
    .from('new_businesses')
    .select('id', { count: 'exact', head: true })
    .eq('source', NEW_BUSINESS_SOURCE)
    .is('group_primary', null)
  if (error) return 'licenses'
  return (count ?? 0) === 0 ? 'grouped' : 'licenses'
}

/** Whether migration 0031 is applied. Before it, the page works without website columns. */
async function websiteColumnsAvailable(supabase: ReturnType<typeof createSupabaseServiceRole>): Promise<boolean> {
  const { error } = await supabase.from('new_businesses').select('website_status', { count: 'exact', head: true }).limit(1)
  return !error
}

type FilterStep =
  | { op: 'eq'; column: string; value: string | number | boolean }
  | { op: 'contains'; column: string; value: string[] }
  | { op: 'isNull'; column: string }

/** The list filters for a mode. Category and period match any license of a business. */
function listFilters(params: NewBusinessesListParams, mode: NewBusinessListMode, withLead: boolean, website: boolean): FilterStep[] {
  const steps: FilterStep[] = [{ op: 'eq', column: 'source', value: NEW_BUSINESS_SOURCE }]
  if (website && params.website !== 'all') {
    steps.push(params.website === 'unchecked' ? { op: 'isNull', column: 'website_status' } : { op: 'eq', column: 'website_status', value: params.website })
  }
  if (mode === 'grouped') steps.push({ op: 'eq', column: 'group_primary', value: true })
  if (params.review !== 'all') steps.push({ op: 'eq', column: 'review_status', value: params.review })
  if (withLead && params.lead !== 'all') steps.push({ op: 'eq', column: 'lead_tier', value: params.lead })
  if (params.category !== null) {
    steps.push(
      mode === 'grouped'
        ? { op: 'contains', column: 'group_categories', value: [params.category] }
        : { op: 'eq', column: 'category', value: params.category },
    )
  }
  if (params.city !== null) steps.push({ op: 'eq', column: 'city', value: params.city })
  if (params.zip !== null) steps.push({ op: 'eq', column: 'zip', value: params.zip })
  const period = parsePeriodParam(params.period)
  if (period !== null) {
    if (mode === 'grouped') {
      steps.push({ op: 'contains', column: 'group_periods', value: [params.period!] })
    } else {
      steps.push({ op: 'eq', column: 'period_year', value: period.year }, { op: 'eq', column: 'period_month', value: period.month })
    }
  }
  return steps
}

function periodFromKey(key: string | undefined): Period | null {
  const match = key === undefined ? null : PERIOD_KEY_RE.exec(key)
  return match ? { year: Number(match[1]), month: Number(match[2]) } : null
}

/** Scores written before version 2 spelled "licence"; the owner reads American spelling. */
function americanSpelling(signals: RankSignal[]): RankSignal[] {
  return signals.map((signal) => ({ ...signal, label: signal.label.replace(/\blicence(s?)\b/gi, 'license$1') }))
}

export async function fetchNewBusinesses(
  params: NewBusinessesListParams,
): Promise<{ ok: true; mode: NewBusinessListMode; rows: NewBusinessRow[]; total: number; pageCount: number } | { ok: false }> {
  try {
    const supabase = createSupabaseServiceRole()
    const [mode, website] = await Promise.all([listMode(supabase), websiteColumnsAvailable(supabase)])
    const columns = `${mode === 'grouped' ? GROUPED_COLUMNS : BASE_COLUMNS}${website ? `, ${WEBSITE_COLUMNS}` : ''}`
    let query = supabase.from('new_businesses').select(columns, { count: 'exact' })
    for (const step of listFilters(params, mode, true, website)) {
      query = step.op === 'eq' ? query.eq(step.column, step.value) : step.op === 'contains' ? query.contains(step.column, step.value) : query.is(step.column, null)
    }

    const from = (params.page - 1) * NEW_BUSINESSES_PAGE_SIZE
    // Highest score first, unscored last, then name.
    const { data, error, count } = await query
      .order('lead_score', { ascending: false, nullsFirst: false })
      .order('business_name', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + NEW_BUSINESSES_PAGE_SIZE - 1)
    if (error) return { ok: false }

    const rows = z
      .array(groupedRowSchema.partial({ group_key: true, group_categories: true, group_periods: true, group_license_count: true }).extend(websiteFields))
      .safeParse(data ?? [])
    if (!rows.success) return { ok: false }
    const total = count ?? 0
    return {
      ok: true,
      mode,
      total,
      pageCount: Math.max(1, Math.ceil(total / NEW_BUSINESSES_PAGE_SIZE)),
      rows: rows.data.map((row) => {
        const ownPeriod = { year: row.period_year, month: row.period_month }
        const licenses = row.group_categories && row.group_categories.length > 0 ? row.group_categories : [row.category]
        const signals = row.lead_signals === null ? null : americanSpelling(row.lead_signals as RankSignal[])
        return {
          id: row.id,
          groupKey: row.group_key ?? null,
          name: row.business_name,
          address: row.address,
          suite: row.suite,
          city: row.city,
          state: row.state,
          zip: row.zip,
          phone: row.phone,
          licenses,
          latestPeriod: periodFromKey(row.group_periods?.[0]) ?? ownPeriod,
          licenseCount: row.group_license_count ?? 1,
          reviewStatus: row.review_status,
          ownerNote: row.owner_note,
          leadScore: row.lead_score,
          leadTier: row.lead_score === null ? null : row.lead_tier,
          leadReason: row.lead_score !== null && signals !== null && signals.length > 0 ? reasonLine(signals) : null,
          website:
            row.website_status === null || row.website_status === undefined
              ? null
              : {
                  status: row.website_status,
                  url: row.website_url ?? null,
                  checkedAt: row.website_checked_at ?? null,
                  searches: row.website_evidence?.searches.slice(0, 3) ?? [],
                  candidates: (row.website_evidence?.candidates.slice(0, 6) ?? []).map((c) => ({
                    url: c.url,
                    excerpt: c.excerpt,
                    accepted: c.accepted,
                    // Classed from the stored URL and kind_claimed under the current rules.
                    mention: c.kindClaimed !== undefined && candidateClass(c.url, c.kindClaimed) === 'mention',
                  })),
                  note: row.website_evidence?.note?.trim() || null,
                },
        }
      }),
    }
  } catch {
    return { ok: false }
  }
}

export type NewBusinessTierCounts = {
  mode: NewBusinessListMode
  /** Businesses in grouped mode; license rows otherwise. */
  businesses: number
  licenseRecords: number
  likely: number
  possible: number
  low: number
  unscored: number
  /** Businesses with a website check result, and those found to have no website. */
  checked: number
  noWebsite: number
}

/**
 * Counts per lead tier under the current filters, ignoring the Lead filter
 * itself so the breakdown always shows every tier. In grouped mode these
 * count businesses, and licenseRecords sums the license rows behind them.
 */
export async function fetchNewBusinessTierCounts(params: NewBusinessesListParams): Promise<NewBusinessTierCounts | null> {
  try {
    const supabase = createSupabaseServiceRole()
    const [mode, website] = await Promise.all([listMode(supabase), websiteColumnsAvailable(supabase)])
    const steps = listFilters(params, mode, false, website)
    const counts: NewBusinessTierCounts = { mode, businesses: 0, licenseRecords: 0, likely: 0, possible: 0, low: 0, unscored: 0, checked: 0, noWebsite: 0 }
    for (let from = 0; ; from += COUNT_PAGE) {
      let query = supabase
        .from('new_businesses')
        .select(`id, lead_score, lead_tier${mode === 'grouped' ? ', group_license_count' : ''}${website ? ', website_status' : ''}`)
      for (const step of steps) {
        query = step.op === 'eq' ? query.eq(step.column, step.value) : step.op === 'contains' ? query.contains(step.column, step.value) : query.is(step.column, null)
      }
      const { data, error } = await query.order('id', { ascending: true }).range(from, from + COUNT_PAGE - 1)
      if (error) return null
      const parsed = z
        .array(
          z.object({
            lead_score: scoreFields.lead_score,
            lead_tier: scoreFields.lead_tier,
            group_license_count: z.number().int().nullable().optional().catch(null),
            website_status: websiteFields.website_status,
          }),
        )
        .safeParse(data ?? [])
      if (!parsed.success) return null
      for (const row of parsed.data) {
        counts.businesses += 1
        counts.licenseRecords += row.group_license_count ?? 1
        if (row.lead_score === null || row.lead_tier === null) counts.unscored += 1
        else counts[row.lead_tier] += 1
        if (row.website_status !== null && row.website_status !== undefined) counts.checked += 1
        if (row.website_status === 'no_website') counts.noWebsite += 1
      }
      if (parsed.data.length < COUNT_PAGE) break
    }
    return counts
  } catch {
    return null
  }
}

export async function fetchCategories(): Promise<CategoryRow[] | null> {
  try {
    const { data, error } = await createSupabaseServiceRole()
      .from('new_business_categories')
      .select('category, enabled, last_seen_count, last_seen_at')
      .eq('source', NEW_BUSINESS_SOURCE)
      .order('last_seen_count', { ascending: false })
      .order('category', { ascending: true })
    if (error) return null
    const rows = z
      .array(
        z.object({
          category: z.string(),
          enabled: z.boolean(),
          last_seen_count: z.number().int(),
          last_seen_at: z.string().nullable(),
        }),
      )
      .safeParse(data ?? [])
    if (!rows.success) return null
    return rows.data.map((row) => ({
      category: row.category,
      enabled: row.enabled,
      lastSeenCount: row.last_seen_count,
      lastSeenAt: row.last_seen_at,
    }))
  } catch {
    return null
  }
}

export async function fetchImports(): Promise<ImportRow[] | null> {
  try {
    const { data, error } = await createSupabaseServiceRole()
      .from('new_business_imports')
      .select(
        'period_year, period_month, state, file_url, rows_total, rows_stored, rows_discarded, rows_inserted, unparsed_lines, error, started_at, finished_at',
      )
      .eq('source', NEW_BUSINESS_SOURCE)
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false })
      .limit(IMPORTS_LIMIT)
    if (error) return null
    const rows = z
      .array(
        z.object({
          period_year: z.number().int(),
          period_month: z.number().int(),
          state: z.enum(['importing', 'imported', 'failed']),
          file_url: z.string(),
          rows_total: z.number().int(),
          rows_stored: z.number().int(),
          rows_discarded: z.number().int(),
          rows_inserted: z.number().int(),
          unparsed_lines: z.number().int(),
          error: z.string().nullable(),
          started_at: z.string(),
          finished_at: z.string().nullable(),
        }),
      )
      .safeParse(data ?? [])
    if (!rows.success) return null
    return rows.data.map((row) => ({
      period: { year: row.period_year, month: row.period_month },
      state: row.state,
      fileUrl: row.file_url,
      rowsTotal: row.rows_total,
      rowsStored: row.rows_stored,
      rowsDiscarded: row.rows_discarded,
      rowsInserted: row.rows_inserted,
      unparsedLines: row.unparsed_lines,
      error: row.error,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
    }))
  } catch {
    return null
  }
}

export type NewBusinessFilterOptions = { categories: string[]; cities: string[]; zips: string[] }

export async function fetchNewBusinessFilterOptions(): Promise<NewBusinessFilterOptions> {
  try {
    const { data, error } = await createSupabaseServiceRole()
      .from('new_businesses')
      .select('category, city, zip')
      .eq('source', NEW_BUSINESS_SOURCE)
      .limit(OPTIONS_SCAN_LIMIT)
    if (error) return { categories: [], cities: [], zips: [] }
    const rows = z
      .array(z.object({ category: z.string(), city: z.string().nullable(), zip: z.string().nullable() }))
      .safeParse(data ?? [])
    if (!rows.success) return { categories: [], cities: [], zips: [] }
    const distinct = (values: (string | null)[]) =>
      [...new Set(values.filter((v): v is string => v !== null && v.length > 0))].sort((a, b) => a.localeCompare(b))
    return {
      categories: distinct(rows.data.map((r) => r.category)),
      cities: distinct(rows.data.map((r) => r.city)),
      zips: distinct(rows.data.map((r) => r.zip)),
    }
  } catch {
    return { categories: [], cities: [], zips: [] }
  }
}

/**
 * Count of new businesses in currently enabled categories first stored after
 * `sinceIso`, matching the page: a business is counted once, by its primary
 * row, and a new license for a business that already existed does not count.
 * Rows not grouped yet count one each. A count only: no rows are returned.
 * Used by the daily briefing.
 */
export async function countNewBusinessesSince(sinceIso: string): Promise<number | null> {
  try {
    const supabase = createSupabaseServiceRole()
    const { data, error } = await supabase
      .from('new_business_categories')
      .select('category')
      .eq('source', NEW_BUSINESS_SOURCE)
      .eq('enabled', true)
    if (error) return null
    const enabled = z.array(z.object({ category: z.string() })).safeParse(data ?? [])
    if (!enabled.success) return null
    if (enabled.data.length === 0) return 0
    const categories = enabled.data.map((row) => row.category)

    const grouped = await supabase
      .from('new_businesses')
      .select('id', { count: 'exact', head: true })
      .eq('source', NEW_BUSINESS_SOURCE)
      .or('group_primary.is.null,group_primary.eq.true')
      .gt('created_at', sinceIso)
      .in('category', categories)
    if (!grouped.error) return grouped.count ?? 0

    // Before migration 0030 there is no group_primary column: count license rows.
    const { count, error: countError } = await supabase
      .from('new_businesses')
      .select('id', { count: 'exact', head: true })
      .eq('source', NEW_BUSINESS_SOURCE)
      .gt('created_at', sinceIso)
      .in('category', categories)
    return countError ? null : count ?? 0
  } catch {
    return null
  }
}
