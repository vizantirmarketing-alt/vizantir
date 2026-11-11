import 'server-only'

/**
 * Supabase adapter for the New Businesses import. Thin on purpose: the rules,
 * including the enabled-category privacy rule, live in import.ts. Writes only
 * new_business_imports, new_business_categories and new_businesses.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

import { NEW_BUSINESS_SOURCE, type Period } from '@/lib/new-businesses/discovery'
import type { ImportSummary, NewBusinessStore, RankableRow, StoredRow } from '@/lib/new-businesses/import'
import type { NewBusinessReviewWriter } from '@/lib/new-businesses/review'
import { createSupabaseServiceRole } from '@/lib/supabase/service'

export class NewBusinessStoreError extends Error {
  constructor(operation: string) {
    super(`New business store ${operation} failed`)
    this.name = 'NewBusinessStoreError'
  }
}

const CHUNK = 500
const READ_PAGE = 1000

const rankableRowSchema = z.object({
  id: z.string(),
  source: z.string(),
  period_year: z.number().int(),
  period_month: z.number().int(),
  dedupe_key: z.string(),
  business_name: z.string(),
  address: z.string().nullable(),
  suite: z.string().nullable(),
  phone: z.string().nullable(),
  category: z.string(),
  // Read only, to choose each business's primary row. Never written by a rescore.
  review_status: z.string(),
  reviewed_at: z.string().nullable(),
  owner_note: z.string().nullable(),
  created_at: z.string(),
})
type RankableDbRow = z.infer<typeof rankableRowSchema>

function periodColumns(period: Period) {
  return { period_year: period.year, period_month: period.month }
}

export function createNewBusinessStore(
  client: SupabaseClient = createSupabaseServiceRole(),
): NewBusinessStore {
  // Identity columns of the rows last listed for ranking, by id. saveRanks
  // sends them back unchanged alongside the new scores.
  const identity = new Map<string, RankableDbRow>()

  return {
    async listImports(source) {
      const { data, error } = await client
        .from('new_business_imports')
        .select('period_year, period_month, file_url, state, started_at')
        .eq('source', source)
      if (error) throw new NewBusinessStoreError('imports read')
      const rows = z
        .array(
          z.object({
            period_year: z.number().int(),
            period_month: z.number().int(),
            file_url: z.string(),
            state: z.enum(['importing', 'imported', 'failed']),
            started_at: z.string(),
          }),
        )
        .safeParse(data ?? [])
      if (!rows.success) throw new NewBusinessStoreError('imports parse')
      return rows.data.map(
        (row): ImportSummary => ({
          period: { year: row.period_year, month: row.period_month },
          fileUrl: row.file_url,
          state: row.state,
          startedAt: row.started_at,
        }),
      )
    },

    async beginImport(source, period, fileUrl, nowIso) {
      const { error } = await client.from('new_business_imports').upsert(
        {
          source,
          ...periodColumns(period),
          file_url: fileUrl,
          state: 'importing',
          error: null,
          started_at: nowIso,
          finished_at: null,
          updated_at: nowIso,
        },
        { onConflict: 'source,period_year,period_month' },
      )
      if (error) throw new NewBusinessStoreError('import begin')
    },

    async finishImport(source, period, counts, nowIso, note = null) {
      const { error } = await client
        .from('new_business_imports')
        .update({
          state: 'imported',
          rows_total: counts.rowsTotal,
          rows_stored: counts.rowsStored,
          rows_discarded: counts.rowsDiscarded,
          rows_inserted: counts.rowsInserted,
          unparsed_lines: counts.unparsedLines,
          error: note,
          finished_at: nowIso,
          updated_at: nowIso,
        })
        .eq('source', source)
        .eq('period_year', period.year)
        .eq('period_month', period.month)
      if (error) throw new NewBusinessStoreError('import finish')
    },

    async failImport(source, period, message, nowIso) {
      const { error } = await client
        .from('new_business_imports')
        .update({ state: 'failed', error: message, finished_at: nowIso, updated_at: nowIso })
        .eq('source', source)
        .eq('period_year', period.year)
        .eq('period_month', period.month)
      if (error) throw new NewBusinessStoreError('import fail')
    },

    async recordCategoryCounts(source, counts, nowIso) {
      const rows = [...counts.entries()].map(([category, count]) => ({
        source,
        category,
        last_seen_count: count,
        last_seen_at: nowIso,
        updated_at: nowIso,
      }))
      // enabled is omitted: a new category gets the column default (false) and
      // an existing one keeps the owner's choice.
      for (let i = 0; i < rows.length; i += CHUNK) {
        const { error } = await client
          .from('new_business_categories')
          .upsert(rows.slice(i, i + CHUNK), { onConflict: 'source,category' })
        if (error) throw new NewBusinessStoreError('categories upsert')
      }

      const { data, error } = await client
        .from('new_business_categories')
        .select('category, enabled')
        .eq('source', source)
      if (error) throw new NewBusinessStoreError('categories read')
      const parsed = z.array(z.object({ category: z.string(), enabled: z.boolean() })).safeParse(data ?? [])
      if (!parsed.success) throw new NewBusinessStoreError('categories parse')
      return new Map(parsed.data.map((row) => [row.category, row.enabled]))
    },

    async storeRows(source, period, rows: StoredRow[], nowIso) {
      const unique = new Map<string, StoredRow>()
      for (const row of rows) if (!unique.has(row.dedupeKey)) unique.set(row.dedupeKey, row)
      const payload = [...unique.values()].map((row) => ({
        source,
        ...periodColumns(period),
        dedupe_key: row.dedupeKey,
        business_name: row.name,
        address: row.address,
        suite: row.suite,
        city: row.city,
        state: row.state,
        zip: row.zip,
        phone: row.phone,
        category: row.category,
        created_at: nowIso,
        updated_at: nowIso,
      }))

      let inserted = 0
      for (let i = 0; i < payload.length; i += CHUNK) {
        const { data, error } = await client
          .from('new_businesses')
          .upsert(payload.slice(i, i + CHUNK), {
            onConflict: 'source,period_year,period_month,dedupe_key',
            ignoreDuplicates: true,
          })
          .select('id')
        if (error) throw new NewBusinessStoreError('rows insert')
        inserted += Array.isArray(data) ? data.length : 0
      }
      return inserted
    },

    async listRankableRows(source) {
      const rows: RankableDbRow[] = []
      for (let from = 0; ; from += READ_PAGE) {
        const { data, error } = await client
          .from('new_businesses')
          .select(
            'id, source, period_year, period_month, dedupe_key, business_name, address, suite, phone, category, review_status, reviewed_at, owner_note, created_at',
          )
          .eq('source', source)
          .order('id', { ascending: true })
          .range(from, from + READ_PAGE - 1)
        if (error) throw new NewBusinessStoreError('rank rows read')
        const parsed = z.array(rankableRowSchema).safeParse(data ?? [])
        if (!parsed.success) throw new NewBusinessStoreError('rank rows parse')
        rows.push(...parsed.data)
        if (parsed.data.length < READ_PAGE) break
      }
      identity.clear()
      for (const row of rows) identity.set(row.id, row)
      return rows.map(
        (row): RankableRow => ({
          id: row.id,
          name: row.business_name,
          address: row.address,
          suite: row.suite,
          phone: row.phone,
          category: row.category,
          period: `${row.period_year}-${String(row.period_month).padStart(2, '0')}`,
          reviewStatus: row.review_status,
          reviewedAt: row.reviewed_at,
          hasNote: row.owner_note !== null && row.owner_note.trim().length > 0,
          createdAt: row.created_at,
        }),
      )
    },

    async saveRanks(source, updates) {
      // One upsert per batch, keyed on id. The row's own required columns are
      // sent back unchanged (an insert path needs them); only the lead_* and
      // group_* columns change. review_status, owner_note and reviewed_at are
      // not in the payload, so they are never touched.
      const payload = updates.map((update) => {
        const row = identity.get(update.id)
        if (row === undefined || row.source !== source) throw new NewBusinessStoreError('rank row lookup')
        return {
          id: row.id,
          source: row.source,
          period_year: row.period_year,
          period_month: row.period_month,
          dedupe_key: row.dedupe_key,
          business_name: row.business_name,
          category: row.category,
          lead_score: update.score,
          lead_tier: update.tier,
          lead_signals: update.signals,
          rank_version: update.version,
          scored_at: update.scoredAt,
          group_key: update.groupKey,
          group_primary: update.groupPrimary,
          group_categories: update.groupCategories,
          group_periods: update.groupPeriods,
          group_license_count: update.groupLicenseCount,
        }
      })
      for (let i = 0; i < payload.length; i += CHUNK) {
        const { error } = await client
          .from('new_businesses')
          .upsert(payload.slice(i, i + CHUNK), { onConflict: 'id' })
        if (error) throw new NewBusinessStoreError('rank save')
      }
    },
  }
}

/**
 * Review and note writes for the owner's actions. A business's rows share a
 * group_key, so an action applies to every license row of the business. A
 * row that has not been grouped yet (no group_key, or before migration 0030)
 * is updated on its own.
 */
export function createNewBusinessReviewWriter(
  client: SupabaseClient = createSupabaseServiceRole(),
): NewBusinessReviewWriter {
  return {
    async groupKeyOf(id) {
      const { data, error } = await client.from('new_businesses').select('group_key').eq('id', id).maybeSingle()
      if (error) {
        // Before migration 0030 the column does not exist: treat the row as ungrouped.
        const fallback = await client.from('new_businesses').select('id').eq('id', id).maybeSingle()
        if (fallback.error) throw new NewBusinessStoreError('review row read')
        return fallback.data === null ? undefined : null
      }
      if (data === null) return undefined
      const parsed = z.object({ group_key: z.string().nullable().optional() }).safeParse(data)
      return parsed.success ? (parsed.data.group_key ?? null) : null
    },

    async update(target, patch) {
      let query = client.from('new_businesses').update(patch).eq('source', NEW_BUSINESS_SOURCE)
      query = target.groupKey !== null ? query.eq('group_key', target.groupKey) : query.eq('id', target.id)
      const { error } = await query
      if (error) throw new NewBusinessStoreError('review update')
    },
  }
}
