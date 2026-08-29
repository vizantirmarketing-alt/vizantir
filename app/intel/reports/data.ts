import 'server-only'

import { createSupabaseServiceRole } from '@/lib/supabase/service'
import { isCareTier, type CareTier } from '@/lib/reports/generate'
import type { ReportStatus } from '@/lib/reports/load'

export type QueueReportRow = {
  id: string
  clientId: string
  clientName: string
  period: string
  tier: CareTier
  status: ReportStatus
  hasPdf: boolean
  awaitingReview: boolean
}

export type LoadQueueResult =
  | { ok: true; rows: QueueReportRow[]; awaitingCount: number }
  | { ok: false; reason: 'query_failed' }

export type ReviewFields = {
  analysis: string
  workCompleted: string
}

export type LoadReviewFieldsResult =
  | { ok: true; fields: ReviewFields }
  | { ok: false; reason: 'not_found' | 'query_failed' }

const REPORT_LIST_COLUMNS =
  'id, client_id, period, tier, status, pdf_path, created_at'
const RECENT_LIMIT = 50

export async function loadReportsQueue(): Promise<LoadQueueResult> {
  try {
    const supabase = createSupabaseServiceRole()

    const [awaitingResult, recentResult] = await Promise.all([
      supabase
        .from('reports')
        .select(REPORT_LIST_COLUMNS)
        .eq('tier', 'care')
        .eq('status', 'pending')
        .order('period', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase
        .from('reports')
        .select(REPORT_LIST_COLUMNS)
        .order('period', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(RECENT_LIMIT),
    ])

    if (awaitingResult.error || recentResult.error) {
      console.error('Report queue lookup failed')
      return { ok: false, reason: 'query_failed' }
    }

    const seen = new Set<string>()
    const parsed: ParsedReportListRow[] = []

    for (const row of [...(awaitingResult.data ?? []), ...(recentResult.data ?? [])]) {
      const item = parseReportListRow(row)
      if (item === null || seen.has(item.id)) {
        continue
      }
      seen.add(item.id)
      parsed.push(item)
    }

    const clientIds = [...new Set(parsed.map((row) => row.clientId))]
    const clients = await loadClientsById(supabase, clientIds)
    if (!clients.ok) {
      return { ok: false, reason: 'query_failed' }
    }

    const rows: QueueReportRow[] = []
    for (const report of parsed) {
      const client = clients.byId.get(report.clientId)
      if (client === undefined) {
        continue
      }
      rows.push({
        id: report.id,
        clientId: report.clientId,
        clientName: client.name,
        period: report.period,
        tier: report.tier,
        status: report.status,
        hasPdf: report.hasPdf,
        awaitingReview: report.tier === 'care' && report.status === 'pending',
      })
    }

    rows.sort(compareQueueRows)

    return {
      ok: true,
      rows,
      awaitingCount: rows.filter((row) => row.awaitingReview).length,
    }
  } catch {
    console.error('Report queue lookup failed')
    return { ok: false, reason: 'query_failed' }
  }
}

export async function loadReviewFields(
  reportId: string,
  clientId: string,
): Promise<LoadReviewFieldsResult> {
  try {
    const supabase = createSupabaseServiceRole()
    const result = await supabase
      .from('reports')
      .select('analysis, work_completed')
      .eq('id', reportId)
      .eq('client_id', clientId)
      .maybeSingle()

    if (result.error) {
      console.error('Report review fields lookup failed')
      return { ok: false, reason: 'query_failed' }
    }
    if (result.data === null) {
      return { ok: false, reason: 'not_found' }
    }

    return {
      ok: true,
      fields: {
        analysis: asText(isPlainObject(result.data) ? result.data.analysis : null),
        workCompleted: asText(
          isPlainObject(result.data) ? result.data.work_completed : null,
        ),
      },
    }
  } catch {
    console.error('Report review fields lookup failed')
    return { ok: false, reason: 'query_failed' }
  }
}

type ParsedReportListRow = {
  id: string
  clientId: string
  period: string
  tier: CareTier
  status: ReportStatus
  hasPdf: boolean
}

type ServiceClient = ReturnType<typeof createSupabaseServiceRole>

async function loadClientsById(
  supabase: ServiceClient,
  clientIds: string[],
): Promise<
  | { ok: true; byId: Map<string, { id: string; name: string }> }
  | { ok: false }
> {
  const byId = new Map<string, { id: string; name: string }>()
  if (clientIds.length === 0) {
    return { ok: true, byId }
  }

  const result = await supabase
    .from('clients')
    .select('id, name')
    .in('id', clientIds)

  if (result.error) {
    console.error('Report queue client lookup failed')
    return { ok: false }
  }

  for (const row of result.data ?? []) {
    const parsed = parseClientRow(row)
    if (parsed === null) {
      continue
    }
    byId.set(parsed.id, parsed)
  }

  return { ok: true, byId }
}

function compareQueueRows(a: QueueReportRow, b: QueueReportRow): number {
  if (a.awaitingReview !== b.awaitingReview) {
    return a.awaitingReview ? -1 : 1
  }
  const period = b.period.localeCompare(a.period)
  if (period !== 0) {
    return period
  }
  return a.clientName.localeCompare(b.clientName)
}

function parseReportListRow(value: unknown): ParsedReportListRow | null {
  if (!isPlainObject(value)) {
    return null
  }

  const id = asNonEmptyString(value.id)
  const clientId = asNonEmptyString(value.client_id)
  const period = asPeriod(value.period)
  const tier = value.tier
  const status = value.status
  if (
    id === null ||
    clientId === null ||
    period === null ||
    !isCareTier(tier) ||
    !isReportStatus(status)
  ) {
    return null
  }

  const pdfPath =
    value.pdf_path === null || value.pdf_path === undefined
      ? null
      : asNonEmptyString(value.pdf_path)
  if (pdfPath === null && value.pdf_path != null) {
    return null
  }

  return {
    id,
    clientId,
    period,
    tier,
    status,
    hasPdf: pdfPath !== null,
  }
}

function parseClientRow(value: unknown): { id: string; name: string } | null {
  if (!isPlainObject(value)) {
    return null
  }
  const id = asNonEmptyString(value.id)
  const name = asNonEmptyString(value.name)
  if (id === null || name === null) {
    return null
  }
  return { id, name }
}

function asPeriod(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }
  const datePart = value.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : null
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function asText(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  return typeof value === 'string' ? value : ''
}

function isReportStatus(value: unknown): value is ReportStatus {
  return (
    value === 'pending' ||
    value === 'draft' ||
    value === 'sent' ||
    value === 'failed'
  )
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
