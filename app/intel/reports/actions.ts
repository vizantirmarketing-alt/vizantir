'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireIntelUser } from '@/lib/auth/allowlist'
import { isReportId } from '@/lib/reports/load'
import { sendReport } from '@/lib/reports/send'
import { createSupabaseServiceRole } from '@/lib/supabase/service'

export type ReportMutationResult =
  | { ok: true }
  | { ok: false; error: string }

const GENERIC_ERROR = 'Unable to save. Try again shortly.'
const SEND_ERROR = 'Unable to send. Try again shortly.'
const FIELD_MAX = 20_000

const reportIdSchema = z
  .string()
  .refine((value) => isReportId(value), { message: 'Invalid report.' })

const reviewFieldsSchema = z.object({
  reportId: reportIdSchema,
  analysis: z.string().max(FIELD_MAX, 'Analysis is too long.'),
  workCompleted: z.string().max(FIELD_MAX, 'Work completed is too long.'),
})

type ReviewableReport = {
  id: string
  clientId: string
}

function revalidateReport(reportId: string): void {
  revalidatePath('/intel/reports')
  revalidatePath(`/intel/reports/${reportId}`)
}

export async function updateReportReviewFields(
  reportId: string,
  analysis: string,
  workCompleted: string,
): Promise<ReportMutationResult> {
  await requireIntelUser()

  const parsed = reviewFieldsSchema.safeParse({
    reportId,
    analysis,
    workCompleted,
  })
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    const message =
      first && first.message.trim().length > 0
        ? first.message
        : 'Check the review fields and try again.'
    return { ok: false, error: message }
  }

  try {
    const located = await loadReviewableReport(parsed.data.reportId)
    if (!located.ok) {
      return located
    }

    const storedAnalysis = storedText(parsed.data.analysis)
    const storedWork = storedText(parsed.data.workCompleted)

    const supabase = createSupabaseServiceRole()
    const updated = await supabase
      .from('reports')
      .update({
        analysis: storedAnalysis,
        work_completed: storedWork,
      })
      .eq('id', located.report.id)
      .eq('client_id', located.report.clientId)
      .eq('tier', 'care')
      .eq('status', 'pending')
      .select('id')
      .maybeSingle()

    if (updated.error) {
      console.error('Report review fields update failed')
      return { ok: false, error: GENERIC_ERROR }
    }
    if (updated.data === null) {
      return { ok: false, error: 'This report is no longer awaiting review.' }
    }

    revalidateReport(located.report.id)
    return { ok: true }
  } catch {
    console.error('Report review fields update failed')
    return { ok: false, error: GENERIC_ERROR }
  }
}

export async function sendReviewedReport(
  reportId: string,
): Promise<ReportMutationResult> {
  await requireIntelUser()

  const parsed = reportIdSchema.safeParse(reportId)
  if (!parsed.success) {
    return { ok: false, error: 'Report not found.' }
  }

  try {
    const located = await loadReviewableReport(parsed.data)
    if (!located.ok) {
      return located
    }

    const result = await sendReport(located.report.id)
    if (!result.ok) {
      return { ok: false, error: sendFailureMessage(result.reason) }
    }

    revalidateReport(located.report.id)
    return { ok: true }
  } catch {
    console.error('Report review send failed')
    return { ok: false, error: SEND_ERROR }
  }
}

async function loadReviewableReport(
  reportId: string,
): Promise<
  | { ok: true; report: ReviewableReport }
  | { ok: false; error: string }
> {
  const supabase = createSupabaseServiceRole()
  const byId = await supabase
    .from('reports')
    .select('id, client_id, tier, status')
    .eq('id', reportId)
    .maybeSingle()

  if (byId.error) {
    console.error('Report review lookup failed')
    return { ok: false, error: GENERIC_ERROR }
  }
  if (byId.data === null) {
    return { ok: false, error: 'Report not found.' }
  }

  const located = parseReviewRow(byId.data)
  if (located === null) {
    return { ok: false, error: 'Report not found.' }
  }

  const confirmed = await supabase
    .from('reports')
    .select('id, client_id, tier, status')
    .eq('id', located.id)
    .eq('client_id', located.clientId)
    .maybeSingle()

  if (confirmed.error) {
    console.error('Report review lookup failed')
    return { ok: false, error: GENERIC_ERROR }
  }
  if (confirmed.data === null) {
    return { ok: false, error: 'Report not found.' }
  }

  const parsed = parseReviewRow(confirmed.data)
  if (parsed === null) {
    return { ok: false, error: 'Report not found.' }
  }
  if (parsed.tier !== 'care' || parsed.status !== 'pending') {
    return { ok: false, error: 'This report is no longer awaiting review.' }
  }

  return {
    ok: true,
    report: { id: parsed.id, clientId: parsed.clientId },
  }
}

function sendFailureMessage(
  reason:
    | 'invalid_id'
    | 'not_found'
    | 'failed'
    | 'already_sent'
    | 'missing_pdf'
    | 'missing_from'
    | 'misconfigured'
    | 'send_failed'
    | 'db_error',
): string {
  if (reason === 'not_found') {
    return 'Report not found.'
  }
  if (reason === 'already_sent') {
    return 'This report was already sent.'
  }
  if (reason === 'missing_pdf') {
    return 'Generate the PDF before sending.'
  }
  if (reason === 'failed') {
    return 'This report cannot be sent.'
  }
  if (reason === 'missing_from') {
    return 'Report sender is not configured.'
  }
  if (reason === 'misconfigured') {
    return 'Email is not configured.'
  }
  return SEND_ERROR
}

function storedText(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function parseReviewRow(value: unknown): {
  id: string
  clientId: string
  tier: string
  status: string
} | null {
  if (!isPlainObject(value)) {
    return null
  }
  const id = asNonEmptyString(value.id)
  const clientId = asNonEmptyString(value.client_id)
  const tier = asNonEmptyString(value.tier)
  const status = asNonEmptyString(value.status)
  if (id === null || clientId === null || tier === null || status === null) {
    return null
  }
  if (!isReportId(id)) {
    return null
  }
  return { id, clientId, tier, status }
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
