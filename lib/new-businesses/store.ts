import 'server-only'

/**
 * Supabase adapter for the New Businesses import. Thin on purpose: the rules,
 * including the enabled-category privacy rule, live in import.ts. Writes only
 * new_business_imports, new_business_categories and new_businesses.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

import type { Period } from '@/lib/new-businesses/discovery'
import type { ImportSummary, NewBusinessStore, StoredRow } from '@/lib/new-businesses/import'
import { createSupabaseServiceRole } from '@/lib/supabase/service'

export class NewBusinessStoreError extends Error {
  constructor(operation: string) {
    super(`New business store ${operation} failed`)
    this.name = 'NewBusinessStoreError'
  }
}

const CHUNK = 500

function periodColumns(period: Period) {
  return { period_year: period.year, period_month: period.month }
}

export function createNewBusinessStore(
  client: SupabaseClient = createSupabaseServiceRole(),
): NewBusinessStore {
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

    async finishImport(source, period, counts, nowIso) {
      const { error } = await client
        .from('new_business_imports')
        .update({
          state: 'imported',
          rows_total: counts.rowsTotal,
          rows_stored: counts.rowsStored,
          rows_discarded: counts.rowsDiscarded,
          rows_inserted: counts.rowsInserted,
          unparsed_lines: counts.unparsedLines,
          error: null,
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
  }
}
