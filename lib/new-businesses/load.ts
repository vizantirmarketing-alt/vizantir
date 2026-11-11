import 'server-only'

/**
 * Read-only loaders for the New Businesses page and the briefing count.
 * Selects only.
 */

import { z } from 'zod'

import { NEW_BUSINESS_SOURCE, type Period } from '@/lib/new-businesses/discovery'
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

export type NewBusinessRow = {
  id: string
  period: Period
  name: string
  address: string | null
  suite: string | null
  city: string | null
  state: string | null
  zip: string | null
  phone: string | null
  category: string
  reviewStatus: NewBusinessReviewStatus
  ownerNote: string | null
}

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

const rowSchema = z.object({
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
})

export async function fetchNewBusinesses(
  params: NewBusinessesListParams,
): Promise<{ ok: true; rows: NewBusinessRow[]; total: number; pageCount: number } | { ok: false }> {
  try {
    let query = createSupabaseServiceRole()
      .from('new_businesses')
      .select(
        'id, period_year, period_month, business_name, address, suite, city, state, zip, phone, category, review_status, owner_note',
        { count: 'exact' },
      )
      .eq('source', NEW_BUSINESS_SOURCE)
    if (params.review !== 'all') query = query.eq('review_status', params.review)
    if (params.category !== null) query = query.eq('category', params.category)
    if (params.city !== null) query = query.eq('city', params.city)
    if (params.zip !== null) query = query.eq('zip', params.zip)
    const period = parsePeriodParam(params.period)
    if (period !== null) query = query.eq('period_year', period.year).eq('period_month', period.month)

    const from = (params.page - 1) * NEW_BUSINESSES_PAGE_SIZE
    const { data, error, count } = await query
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false })
      .order('business_name', { ascending: true })
      .range(from, from + NEW_BUSINESSES_PAGE_SIZE - 1)
    if (error) return { ok: false }

    const rows = z.array(rowSchema).safeParse(data ?? [])
    if (!rows.success) return { ok: false }
    const total = count ?? 0
    return {
      ok: true,
      total,
      pageCount: Math.max(1, Math.ceil(total / NEW_BUSINESSES_PAGE_SIZE)),
      rows: rows.data.map((row) => ({
        id: row.id,
        period: { year: row.period_year, month: row.period_month },
        name: row.business_name,
        address: row.address,
        suite: row.suite,
        city: row.city,
        state: row.state,
        zip: row.zip,
        phone: row.phone,
        category: row.category,
        reviewStatus: row.review_status,
        ownerNote: row.owner_note,
      })),
    }
  } catch {
    return { ok: false }
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
 * Count of stored new businesses in currently enabled categories added after
 * `sinceIso`. A count only: no rows are returned. Used by the daily briefing.
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

    const { count, error: countError } = await supabase
      .from('new_businesses')
      .select('id', { count: 'exact', head: true })
      .eq('source', NEW_BUSINESS_SOURCE)
      .gt('created_at', sinceIso)
      .in('category', enabled.data.map((row) => row.category))
    return countError ? null : count ?? 0
  } catch {
    return null
  }
}
