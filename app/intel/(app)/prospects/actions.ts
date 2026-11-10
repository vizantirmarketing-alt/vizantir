'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireIntelUser } from '@/lib/auth/allowlist'
import { measureProspectById } from '@/lib/prospects/measure'
import { createMeasureDeps } from '@/lib/prospects/measure-deps'
import {
  CANCELLABLE_RUN_STATES,
  OWNER_NOTE_MAX,
  PROSPECT_REVIEW_STATUSES,
  isUuid,
} from '@/lib/prospects/params'
import { parseRunExclusions, runRequestSchema } from '@/lib/prospects/run-config'
import { createSupabaseServiceRole } from '@/lib/supabase/service'

export type ProspectMutationResult =
  | { ok: true }
  | { ok: false; error: string }

const GENERIC_ERROR = 'Unable to save. Try again shortly.'

const idSchema = z
  .string()
  .refine((value) => isUuid(value), { message: 'Invalid record.' })

const reviewSchema = z.object({
  prospectId: idSchema,
  reviewStatus: z.enum(PROSPECT_REVIEW_STATUSES),
})

const noteSchema = z.object({
  prospectId: idSchema,
  note: z
    .string()
    .max(OWNER_NOTE_MAX, `Notes cannot exceed ${OWNER_NOTE_MAX.toLocaleString('en-US')} characters.`),
})

function revalidateProspects(prospectId?: string): void {
  revalidatePath('/intel/prospects')
  if (prospectId !== undefined) {
    revalidatePath(`/intel/prospects/${prospectId}`)
  }
}

export type RequestProspectRunInput = {
  market: string
  industry: string
  targetCount: string
  exclusions: string
}

export async function requestProspectRun(
  input: RequestProspectRunInput,
): Promise<ProspectMutationResult> {
  const user = await requireIntelUser()

  const parsed = runRequestSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { ok: false, error: first?.message ?? 'Check the request fields.' }
  }

  const exclusions = parseRunExclusions(parsed.data.exclusions)
  if (!exclusions.ok) {
    return { ok: false, error: exclusions.error }
  }

  try {
    const supabase = createSupabaseServiceRole()
    const { error } = await supabase.from('prospect_runs').insert({
      state: 'requested',
      config: {
        market: parsed.data.market,
        industry: parsed.data.industry,
        targetCount: parsed.data.targetCount,
        exclusions: exclusions.domains,
      },
      requested_by: user.email,
      source: 'dashboard',
    })

    if (error) {
      console.error('Prospect run request failed')
      return { ok: false, error: GENERIC_ERROR }
    }

    revalidateProspects()
    return { ok: true }
  } catch {
    console.error('Prospect run request failed')
    return { ok: false, error: GENERIC_ERROR }
  }
}

export async function cancelProspectRun(
  runId: string,
): Promise<ProspectMutationResult> {
  await requireIntelUser()

  const parsed = idSchema.safeParse(runId)
  if (!parsed.success) {
    return { ok: false, error: 'Invalid run.' }
  }

  try {
    const supabase = createSupabaseServiceRole()
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('prospect_runs')
      .update({ state: 'cancelled', finished_at: now, updated_at: now })
      .eq('id', parsed.data)
      .in('state', [...CANCELLABLE_RUN_STATES])
      .select('id')
      .maybeSingle()

    if (error) {
      console.error('Prospect run cancel failed')
      return { ok: false, error: GENERIC_ERROR }
    }
    if (data === null) {
      return { ok: false, error: 'This run can no longer be cancelled.' }
    }

    revalidateProspects()
    return { ok: true }
  } catch {
    console.error('Prospect run cancel failed')
    return { ok: false, error: GENERIC_ERROR }
  }
}

export async function updateProspectReview(
  prospectId: string,
  reviewStatus: string,
): Promise<ProspectMutationResult> {
  await requireIntelUser()

  const parsed = reviewSchema.safeParse({ prospectId, reviewStatus })
  if (!parsed.success) {
    return { ok: false, error: 'Choose a valid review status.' }
  }

  try {
    const supabase = createSupabaseServiceRole()
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('prospects')
      .update({
        review_status: parsed.data.reviewStatus,
        reviewed_at: parsed.data.reviewStatus === 'unreviewed' ? null : now,
        updated_at: now,
      })
      .eq('id', parsed.data.prospectId)
      .select('id')
      .maybeSingle()

    if (error) {
      console.error('Prospect review update failed')
      return { ok: false, error: GENERIC_ERROR }
    }
    if (data === null) {
      return { ok: false, error: 'Prospect not found.' }
    }

    revalidateProspects(parsed.data.prospectId)
    return { ok: true }
  } catch {
    console.error('Prospect review update failed')
    return { ok: false, error: GENERIC_ERROR }
  }
}

export async function updateProspectNote(
  prospectId: string,
  note: string,
): Promise<ProspectMutationResult> {
  await requireIntelUser()

  const parsed = noteSchema.safeParse({ prospectId, note })
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { ok: false, error: first?.message ?? 'Check the note.' }
  }

  const trimmed = parsed.data.note.trim()

  try {
    const supabase = createSupabaseServiceRole()
    const { data, error } = await supabase
      .from('prospects')
      .update({
        owner_note: trimmed.length > 0 ? trimmed : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', parsed.data.prospectId)
      .select('id')
      .maybeSingle()

    if (error) {
      console.error('Prospect note update failed')
      return { ok: false, error: GENERIC_ERROR }
    }
    if (data === null) {
      return { ok: false, error: 'Prospect not found.' }
    }

    revalidateProspects(parsed.data.prospectId)
    return { ok: true }
  } catch {
    console.error('Prospect note update failed')
    return { ok: false, error: GENERIC_ERROR }
  }
}

export type MeasurePerformanceResult =
  | {
      ok: true
      performanceScore: number
      rating: string
      fitScore: number | null
      opportunityScore: number | null
      confidence: string
    }
  | { ok: false; error: string }

/**
 * Measures the prospect's home page with PageSpeed Insights through the same
 * logic as the runner measure route. Long running (up to about 105 seconds):
 * the detail page sets maxDuration to cover it.
 */
export async function measureProspectPerformance(
  prospectId: string,
): Promise<MeasurePerformanceResult> {
  await requireIntelUser()

  try {
    const result = await measureProspectById(prospectId, createMeasureDeps())
    if (!result.ok) {
      return {
        ok: false,
        error: result.reason ? `${result.error} (${result.reason})` : result.error,
      }
    }

    revalidateProspects(prospectId)
    return {
      ok: true,
      performanceScore: result.performanceScore,
      rating: result.rating,
      fitScore: result.fitScore,
      opportunityScore: result.opportunityScore,
      confidence: result.confidence,
    }
  } catch {
    console.error('Prospect measurement failed')
    return { ok: false, error: 'Measurement failed. Try again shortly.' }
  }
}

const CAMPAIGN_CADENCE_MAX = 90

const campaignSchema = runRequestSchema.extend({
  cadenceDays: z.coerce
    .number({ message: 'Enter a cadence in days.' })
    .int('Enter a whole number of days.')
    .min(1, 'Cadence must be at least 1 day.')
    .max(CAMPAIGN_CADENCE_MAX, `Cadence can be at most ${CAMPAIGN_CADENCE_MAX} days.`),
})

export type CampaignInput = RequestProspectRunInput & { cadenceDays: string }

function parseCampaignInput(
  input: CampaignInput,
):
  | {
      ok: true
      row: {
        market: string
        industry: string
        target_count: number
        exclusions: string[]
        cadence_days: number
      }
    }
  | { ok: false; error: string } {
  const parsed = campaignSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the campaign fields.' }
  }
  const exclusions = parseRunExclusions(parsed.data.exclusions)
  if (!exclusions.ok) {
    return { ok: false, error: exclusions.error }
  }
  return {
    ok: true,
    row: {
      market: parsed.data.market,
      industry: parsed.data.industry,
      target_count: parsed.data.targetCount,
      exclusions: exclusions.domains,
      cadence_days: parsed.data.cadenceDays,
    },
  }
}

export async function createCampaign(input: CampaignInput): Promise<ProspectMutationResult> {
  await requireIntelUser()

  const parsed = parseCampaignInput(input)
  if (!parsed.ok) {
    return parsed
  }

  try {
    const supabase = createSupabaseServiceRole()
    const { error } = await supabase.from('prospect_campaigns').insert(parsed.row)
    if (error) {
      console.error('Prospect campaign create failed')
      return { ok: false, error: GENERIC_ERROR }
    }
    revalidateProspects()
    return { ok: true }
  } catch {
    console.error('Prospect campaign create failed')
    return { ok: false, error: GENERIC_ERROR }
  }
}

export async function updateCampaign(
  campaignId: string,
  input: CampaignInput,
): Promise<ProspectMutationResult> {
  await requireIntelUser()

  if (!idSchema.safeParse(campaignId).success) {
    return { ok: false, error: 'Invalid campaign.' }
  }
  const parsed = parseCampaignInput(input)
  if (!parsed.ok) {
    return parsed
  }

  try {
    const supabase = createSupabaseServiceRole()
    const { data, error } = await supabase
      .from('prospect_campaigns')
      .update({ ...parsed.row, updated_at: new Date().toISOString() })
      .eq('id', campaignId)
      .select('id')
      .maybeSingle()
    if (error) {
      console.error('Prospect campaign update failed')
      return { ok: false, error: GENERIC_ERROR }
    }
    if (data === null) {
      return { ok: false, error: 'Campaign not found.' }
    }
    revalidateProspects()
    return { ok: true }
  } catch {
    console.error('Prospect campaign update failed')
    return { ok: false, error: GENERIC_ERROR }
  }
}

export async function setCampaignActive(
  campaignId: string,
  active: boolean,
): Promise<ProspectMutationResult> {
  await requireIntelUser()

  if (!idSchema.safeParse(campaignId).success || typeof active !== 'boolean') {
    return { ok: false, error: 'Invalid campaign.' }
  }

  try {
    const supabase = createSupabaseServiceRole()
    const { data, error } = await supabase
      .from('prospect_campaigns')
      .update({ active, updated_at: new Date().toISOString() })
      .eq('id', campaignId)
      .select('id')
      .maybeSingle()
    if (error) {
      console.error('Prospect campaign status update failed')
      return { ok: false, error: GENERIC_ERROR }
    }
    if (data === null) {
      return { ok: false, error: 'Campaign not found.' }
    }
    revalidateProspects()
    return { ok: true }
  } catch {
    console.error('Prospect campaign status update failed')
    return { ok: false, error: GENERIC_ERROR }
  }
}
