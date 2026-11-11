'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireIntelUser } from '@/lib/auth/allowlist'
import { BULK_CATEGORY_LIMIT } from '@/lib/new-businesses/categories'
import { NEW_BUSINESS_SOURCE } from '@/lib/new-businesses/discovery'
import { createImportDeps } from '@/lib/new-businesses/deps'
import { importLatest, reimportPeriod, type ImportResult } from '@/lib/new-businesses/import'
import { importResultMessage } from '@/lib/new-businesses/messages'
import {
  NEW_BUSINESS_NOTE_MAX,
  NEW_BUSINESS_REVIEW_STATUSES,
  parsePeriodParam,
} from '@/lib/new-businesses/params'
import { isUuid } from '@/lib/prospects/params'
import { createSupabaseServiceRole } from '@/lib/supabase/service'

export type NewBusinessMutationResult = { ok: true } | { ok: false; error: string }
export type ImportActionResult = { ok: true; message: string } | { ok: false; error: string }

const GENERIC_ERROR = 'Unable to save. Try again shortly.'

function revalidate(): void {
  revalidatePath('/intel/new-businesses')
}

function describe(result: ImportResult, action: 'import' | 'reimport' = 'import'): ImportActionResult {
  return importResultMessage(result, action)
}

/**
 * Imports the newest list not yet imported. Long running (download and parse
 * of one PDF): the page sets maxDuration to cover it.
 */
export async function importLatestNow(): Promise<ImportActionResult> {
  await requireIntelUser()
  try {
    const result = await importLatest(createImportDeps())
    revalidate()
    return describe(result)
  } catch {
    console.error('New business import failed')
    return { ok: false, error: 'The import could not run. Try again shortly.' }
  }
}

/** Re-imports a stored period, for example after enabling a category. */
export async function reimportNewBusinessPeriod(period: string): Promise<ImportActionResult> {
  await requireIntelUser()
  const parsed = parsePeriodParam(period)
  if (parsed === null) {
    return { ok: false, error: 'Invalid period.' }
  }
  try {
    const result = await reimportPeriod(createImportDeps(), parsed)
    revalidate()
    return describe(result, 'reimport')
  } catch {
    console.error('New business re-import failed')
    return { ok: false, error: 'The import could not run. Try again shortly.' }
  }
}

export async function setNewBusinessCategoryEnabled(
  category: string,
  enabled: boolean,
): Promise<NewBusinessMutationResult> {
  await requireIntelUser()
  if (typeof category !== 'string' || category.length === 0 || category.length > 300 || typeof enabled !== 'boolean') {
    return { ok: false, error: 'Invalid category.' }
  }
  try {
    const { data, error } = await createSupabaseServiceRole()
      .from('new_business_categories')
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq('source', NEW_BUSINESS_SOURCE)
      .eq('category', category)
      .select('category')
      .maybeSingle()
    if (error) {
      console.error('New business category update failed')
      return { ok: false, error: GENERIC_ERROR }
    }
    if (data === null) {
      return { ok: false, error: 'Category not found.' }
    }
    revalidate()
    return { ok: true }
  } catch {
    console.error('New business category update failed')
    return { ok: false, error: GENERIC_ERROR }
  }
}

const reviewSchema = z.object({
  id: z.string().refine(isUuid),
  status: z.enum(NEW_BUSINESS_REVIEW_STATUSES),
})

export async function updateNewBusinessReview(
  id: string,
  status: string,
): Promise<NewBusinessMutationResult> {
  await requireIntelUser()
  const parsed = reviewSchema.safeParse({ id, status })
  if (!parsed.success) {
    return { ok: false, error: 'Choose a valid review status.' }
  }
  try {
    const now = new Date().toISOString()
    const { data, error } = await createSupabaseServiceRole()
      .from('new_businesses')
      .update({
        review_status: parsed.data.status,
        reviewed_at: parsed.data.status === 'unreviewed' ? null : now,
        updated_at: now,
      })
      .eq('id', parsed.data.id)
      .select('id')
      .maybeSingle()
    if (error) {
      console.error('New business review update failed')
      return { ok: false, error: GENERIC_ERROR }
    }
    if (data === null) {
      return { ok: false, error: 'Business not found.' }
    }
    revalidate()
    return { ok: true }
  } catch {
    console.error('New business review update failed')
    return { ok: false, error: GENERIC_ERROR }
  }
}

const noteSchema = z.object({
  id: z.string().refine(isUuid),
  note: z.string().max(NEW_BUSINESS_NOTE_MAX, `Notes cannot exceed ${NEW_BUSINESS_NOTE_MAX} characters.`),
})

export async function updateNewBusinessNote(id: string, note: string): Promise<NewBusinessMutationResult> {
  await requireIntelUser()
  const parsed = noteSchema.safeParse({ id, note })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the note.' }
  }
  const trimmed = parsed.data.note.trim()
  try {
    const { data, error } = await createSupabaseServiceRole()
      .from('new_businesses')
      .update({ owner_note: trimmed.length > 0 ? trimmed : null, updated_at: new Date().toISOString() })
      .eq('id', parsed.data.id)
      .select('id')
      .maybeSingle()
    if (error) {
      console.error('New business note update failed')
      return { ok: false, error: GENERIC_ERROR }
    }
    if (data === null) {
      return { ok: false, error: 'Business not found.' }
    }
    revalidate()
    return { ok: true }
  } catch {
    console.error('New business note update failed')
    return { ok: false, error: GENERIC_ERROR }
  }
}

/** Turns several categories on or off at once (the Turn on/off shown actions). */
export async function setNewBusinessCategoriesEnabled(
  categories: string[],
  enabled: boolean,
): Promise<NewBusinessMutationResult> {
  await requireIntelUser()
  const parsed = z
    .object({
      categories: z.array(z.string().min(1).max(300)).min(1).max(BULK_CATEGORY_LIMIT),
      enabled: z.boolean(),
    })
    .safeParse({ categories, enabled })
  if (!parsed.success) {
    return { ok: false, error: 'Invalid categories.' }
  }
  try {
    const { error } = await createSupabaseServiceRole()
      .from('new_business_categories')
      .update({ enabled: parsed.data.enabled, updated_at: new Date().toISOString() })
      .eq('source', NEW_BUSINESS_SOURCE)
      .in('category', [...new Set(parsed.data.categories)])
    if (error) {
      console.error('New business categories update failed')
      return { ok: false, error: GENERIC_ERROR }
    }
    revalidate()
    return { ok: true }
  } catch {
    console.error('New business categories update failed')
    return { ok: false, error: GENERIC_ERROR }
  }
}
