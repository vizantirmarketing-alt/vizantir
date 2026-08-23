'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireIntelUser } from '@/lib/auth/allowlist'
import { LEAD_STATUSES, isLeadId } from '@/lib/intel/lead-params'
import { createSupabaseServiceRole } from '@/lib/supabase/service'

export type LeadMutationResult =
  | { ok: true }
  | { ok: false; error: string }

const GENERIC_ERROR = 'Unable to save. Try again shortly.'

const leadIdSchema = z
  .string()
  .refine((value) => isLeadId(value), { message: 'Invalid inquiry.' })

const statusSchema = z.object({
  leadId: leadIdSchema,
  newStatus: z.enum(LEAD_STATUSES),
})

const notesSchema = z.object({
  leadId: leadIdSchema,
  notes: z.string().max(5000, 'Notes cannot exceed 5,000 characters.'),
})

const dollarsPattern = /^(0|[1-9]\d*)(\.\d{1,2})?$/

function parseDollarsToCents(
  raw: string,
): { ok: true; cents: number | null } | { ok: false } {
  const trimmed = raw.trim()
  if (trimmed.length === 0) {
    return { ok: true, cents: null }
  }

  const normalized = trimmed.replace(/,/g, '')
  if (!dollarsPattern.test(normalized)) {
    return { ok: false }
  }

  const cents = Math.round(Number(normalized) * 100)
  if (!Number.isSafeInteger(cents) || cents < 0) {
    return { ok: false }
  }

  return { ok: true, cents }
}

function revalidateLead(leadId: string): void {
  revalidatePath('/intel/leads')
  revalidatePath(`/intel/leads/${leadId}`)
}

function readStatus(value: unknown): string | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }
  const status = Reflect.get(value, 'status')
  return typeof status === 'string' && status.length > 0 ? status : null
}

function readUpdatedAt(value: unknown): string | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }
  const updatedAt = Reflect.get(value, 'updated_at')
  if (typeof updatedAt !== 'string' || Number.isNaN(Date.parse(updatedAt))) {
    return null
  }
  return updatedAt
}

export async function updateLeadStatus(
  leadId: string,
  newStatus: string,
): Promise<LeadMutationResult> {
  const user = await requireIntelUser()

  const parsed = statusSchema.safeParse({ leadId, newStatus })
  if (!parsed.success) {
    return { ok: false, error: 'Choose a valid status.' }
  }

  try {
    const supabase = createSupabaseServiceRole()
    const { data, error } = await supabase
      .from('contact_submissions')
      .select('status, updated_at')
      .eq('id', parsed.data.leadId)
      .maybeSingle()

    if (error) {
      console.error('Intel lead status read failed')
      return { ok: false, error: GENERIC_ERROR }
    }

    const current = readStatus(data)
    if (current === null) {
      return { ok: false, error: 'Inquiry not found.' }
    }

    if (current === parsed.data.newStatus) {
      return { ok: true }
    }

    const previousUpdatedAt = readUpdatedAt(data)
    const now = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('contact_submissions')
      .update({
        status: parsed.data.newStatus,
        updated_at: now,
      })
      .eq('id', parsed.data.leadId)

    if (updateError) {
      console.error('Intel lead status update failed')
      return { ok: false, error: GENERIC_ERROR }
    }

    const { error: historyError } = await supabase
      .from('lead_status_history')
      .insert({
        lead_id: parsed.data.leadId,
        previous_status: current,
        new_status: parsed.data.newStatus,
        changed_by: user.email,
      })

    if (historyError) {
      console.error('Intel lead status history insert failed')
      const revert: Record<string, unknown> = { status: current }
      if (previousUpdatedAt !== null) {
        revert.updated_at = previousUpdatedAt
      }
      const { error: revertError } = await supabase
        .from('contact_submissions')
        .update(revert)
        .eq('id', parsed.data.leadId)
      if (revertError) {
        console.error('Intel lead status revert failed')
      }
      return { ok: false, error: GENERIC_ERROR }
    }

    revalidateLead(parsed.data.leadId)
    return { ok: true }
  } catch {
    console.error('Intel lead status update failed')
    return { ok: false, error: GENERIC_ERROR }
  }
}

export async function updateLeadValue(
  leadId: string,
  estimatedValueDollars: string,
): Promise<LeadMutationResult> {
  await requireIntelUser()

  const idParsed = leadIdSchema.safeParse(leadId)
  if (!idParsed.success) {
    return { ok: false, error: 'Inquiry not found.' }
  }

  const centsParsed = parseDollarsToCents(estimatedValueDollars)
  if (!centsParsed.ok) {
    return {
      ok: false,
      error: 'Enter a dollar amount, or leave blank to clear.',
    }
  }

  try {
    const supabase = createSupabaseServiceRole()
    const { data, error } = await supabase
      .from('contact_submissions')
      .update({
        estimated_value_cents: centsParsed.cents,
        updated_at: new Date().toISOString(),
      })
      .eq('id', idParsed.data)
      .select('id')
      .maybeSingle()

    if (error) {
      console.error('Intel lead value update failed')
      return { ok: false, error: GENERIC_ERROR }
    }

    if (data === null) {
      return { ok: false, error: 'Inquiry not found.' }
    }

    revalidateLead(idParsed.data)
    return { ok: true }
  } catch {
    console.error('Intel lead value update failed')
    return { ok: false, error: GENERIC_ERROR }
  }
}

export async function updateLeadNotes(
  leadId: string,
  notes: string,
): Promise<LeadMutationResult> {
  await requireIntelUser()

  const parsed = notesSchema.safeParse({ leadId, notes })
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    const message =
      first && first.message.trim().length > 0
        ? first.message
        : 'Notes cannot exceed 5,000 characters.'
    return { ok: false, error: message }
  }

  const trimmed = parsed.data.notes.trim()
  const stored = trimmed.length > 0 ? trimmed : null

  try {
    const supabase = createSupabaseServiceRole()
    const { data, error } = await supabase
      .from('contact_submissions')
      .update({
        notes: stored,
        updated_at: new Date().toISOString(),
      })
      .eq('id', parsed.data.leadId)
      .select('id')
      .maybeSingle()

    if (error) {
      console.error('Intel lead notes update failed')
      return { ok: false, error: GENERIC_ERROR }
    }

    if (data === null) {
      return { ok: false, error: 'Inquiry not found.' }
    }

    revalidateLead(parsed.data.leadId)
    return { ok: true }
  } catch {
    console.error('Intel lead notes update failed')
    return { ok: false, error: GENERIC_ERROR }
  }
}
