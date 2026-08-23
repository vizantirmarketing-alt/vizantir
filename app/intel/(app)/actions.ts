'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireIntelUser } from '@/lib/auth/allowlist'
import {
  DECISION_STATUSES,
  RESULT_NOTE_MAX_LENGTH,
  isFindingKey,
} from '@/lib/intel/decision-params'
import { createSupabaseServiceRole } from '@/lib/supabase/service'

export type DecisionMutationResult =
  | { ok: true }
  | { ok: false; error: string }

const GENERIC_ERROR = 'Unable to save. Try again shortly.'

const findingKeySchema = z
  .string()
  .refine((value) => isFindingKey(value), { message: 'Invalid finding.' })

const statusSchema = z.object({
  findingKey: findingKeySchema,
  newStatus: z.enum(DECISION_STATUSES),
  resultNote: z
    .string()
    .max(RESULT_NOTE_MAX_LENGTH, 'Note cannot exceed 2,000 characters.')
    .optional(),
})

function readStatus(value: unknown): string | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }
  const status = Reflect.get(value, 'status')
  return typeof status === 'string' && status.length > 0 ? status : null
}

export async function updateDecisionStatus(
  findingKey: string,
  newStatus: string,
  resultNote?: string,
): Promise<DecisionMutationResult> {
  await requireIntelUser()

  const parsed = statusSchema.safeParse({
    findingKey,
    newStatus,
    resultNote,
  })
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    const message =
      first && first.message.trim().length > 0
        ? first.message
        : 'Choose a valid status.'
    return { ok: false, error: message }
  }

  const note =
    parsed.data.newStatus === 'completed'
      ? parsed.data.resultNote?.trim() ?? ''
      : ''

  try {
    const supabase = createSupabaseServiceRole()
    const { data, error } = await supabase
      .from('finding_state')
      .select('status')
      .eq('finding_key', parsed.data.findingKey)
      .maybeSingle()

    if (error) {
      console.error('Intel decision status read failed')
      return { ok: false, error: GENERIC_ERROR }
    }

    const current = readStatus(data)
    if (current === null) {
      return { ok: false, error: 'Finding not found.' }
    }

    const storedNote = note.length > 0 ? note : null
    const now = new Date().toISOString()
    const sameStatus = current === parsed.data.newStatus

    if (sameStatus && parsed.data.newStatus !== 'completed') {
      return { ok: true }
    }
    if (sameStatus && storedNote === null) {
      return { ok: true }
    }

    const patch: Record<string, unknown> = {
      status: parsed.data.newStatus,
      updated_at: now,
    }

    if (parsed.data.newStatus === 'completed') {
      if (current !== 'completed') {
        patch.completed_at = now
      }
      if (storedNote !== null) {
        patch.result_note = storedNote
      }
    } else {
      patch.completed_at = null
    }

    const { data: updated, error: updateError } = await supabase
      .from('finding_state')
      .update(patch)
      .eq('finding_key', parsed.data.findingKey)
      .select('finding_key')
      .maybeSingle()

    if (updateError) {
      console.error('Intel decision status update failed')
      return { ok: false, error: GENERIC_ERROR }
    }

    if (updated === null) {
      return { ok: false, error: 'Finding not found.' }
    }

    revalidatePath('/intel')
    return { ok: true }
  } catch {
    console.error('Intel decision status update failed')
    return { ok: false, error: GENERIC_ERROR }
  }
}
