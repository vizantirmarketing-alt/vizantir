import 'server-only'

import { createSupabaseServiceRole } from '@/lib/supabase/service'
import {
  LEADS_EXPORT_ROW_CAP,
  LEADS_PAGE_SIZE,
  centsToDollarInput,
  isLeadStatus,
  isNotifyStatus,
  leadsFiltersActive,
  type LeadListRow,
  type LeadStatus,
  type LeadsListParams,
  type NotifyStatus,
} from '@/lib/intel/lead-params'

export type { LeadListRow }

export type LeadDetail = {
  id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  service: string
  budget: string | null
  message: string
  landing_page: string | null
  referrer: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  initial_channel: string | null
  notify_status: NotifyStatus | null
  notified_at: string | null
  notify_error: string | null
  status: LeadStatus
  estimated_value_cents: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type LeadStatusHistoryRow = {
  id: number
  previous_status: string | null
  new_status: string
  changed_by: string | null
  changed_at: string
}

export type FetchLeadDetailResult =
  | { ok: true; lead: LeadDetail; history: LeadStatusHistoryRow[] }
  | { ok: false; reason: 'not_found' | 'query_failed' }

export type FetchLeadsResult =
  | {
      ok: true
      rows: LeadListRow[]
      total: number
      page: number
      pageCount: number
      filtersActive: boolean
      nowMs: number
    }
  | { ok: false }

export type LeadExportRecord = {
  submitted_at: string
  name: string
  email: string
  phone: string | null
  company: string | null
  service: string
  budget: string | null
  message: string
  status: LeadStatus
  estimated_value_dollars: string
  notes: string | null
  landing_page: string | null
  referrer: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  initial_channel: string | null
  notify_status: NotifyStatus | null
  notified_at: string | null
}

export type FetchLeadsExportResult =
  | { ok: true; records: LeadExportRecord[]; truncated: boolean }
  | { ok: false }

const LIST_COLUMNS =
  'id, name, company, service, status, initial_channel, notify_status, created_at'

const DETAIL_COLUMNS = [
  'id',
  'name',
  'email',
  'phone',
  'company',
  'service',
  'budget',
  'message',
  'landing_page',
  'referrer',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'initial_channel',
  'notify_status',
  'notified_at',
  'notify_error',
  'status',
  'estimated_value_cents',
  'notes',
  'created_at',
  'updated_at',
].join(', ')

const HISTORY_COLUMNS = 'id, previous_status, new_status, changed_by, changed_at'

const EXPORT_COLUMNS = [
  'name',
  'email',
  'phone',
  'company',
  'service',
  'budget',
  'message',
  'landing_page',
  'referrer',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'initial_channel',
  'notify_status',
  'notified_at',
  'status',
  'estimated_value_cents',
  'notes',
  'created_at',
].join(', ')

function asOptionalText(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function readField(value: object, key: string): unknown {
  return Reflect.get(value, key)
}

function toLeadListRow(value: unknown): LeadListRow | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const id = readField(value, 'id')
  const name = readField(value, 'name')
  const service = readField(value, 'service')
  const status = readField(value, 'status')
  const createdAt = readField(value, 'created_at')

  if (typeof id !== 'string' || id.length === 0) {
    return null
  }
  if (typeof name !== 'string' || name.trim().length === 0) {
    return null
  }
  if (typeof service !== 'string') {
    return null
  }
  if (typeof status !== 'string' || !isLeadStatus(status)) {
    return null
  }
  if (typeof createdAt !== 'string' || Number.isNaN(Date.parse(createdAt))) {
    return null
  }

  const notifyRaw = readField(value, 'notify_status')
  let notifyStatus: NotifyStatus | null = null
  if (typeof notifyRaw === 'string') {
    notifyStatus = isNotifyStatus(notifyRaw) ? notifyRaw : null
  }

  return {
    id,
    name: name.trim(),
    company: asOptionalText(readField(value, 'company')),
    service: service.trim().length > 0 ? service.trim() : '—',
    status,
    initial_channel: asOptionalText(readField(value, 'initial_channel')),
    notify_status: notifyStatus,
    created_at: createdAt,
  }
}

function asIsoTimestamp(value: unknown): string | null {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    return null
  }
  return value
}

function asNonNegativeInt(value: unknown): number | null {
  if (typeof value === 'bigint') {
    if (value < BigInt(0) || value > BigInt(Number.MAX_SAFE_INTEGER)) {
      return null
    }
    return Number(value)
  }
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    const rounded = Math.round(value)
    if (Number.isSafeInteger(rounded) && Math.abs(value - rounded) < 1e-9) {
      return rounded
    }
    return null
  }
  if (typeof value === 'string' && /^(0|[1-9]\d*)(\.0+)?$/.test(value)) {
    const parsed = Number(value)
    if (Number.isSafeInteger(parsed)) {
      return parsed
    }
  }
  return null
}

function asNotifyStatus(value: unknown): NotifyStatus | null {
  if (typeof value !== 'string') {
    return null
  }
  return isNotifyStatus(value) ? value : null
}

function toLeadDetail(value: unknown): LeadDetail | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const id = readField(value, 'id')
  const name = readField(value, 'name')
  const email = readField(value, 'email')
  const service = readField(value, 'service')
  const message = readField(value, 'message')
  const status = readField(value, 'status')
  const createdAt = asIsoTimestamp(readField(value, 'created_at'))
  const updatedAt = asIsoTimestamp(readField(value, 'updated_at'))

  if (typeof id !== 'string' || id.length === 0) {
    return null
  }
  if (typeof name !== 'string' || name.trim().length === 0) {
    return null
  }
  if (typeof email !== 'string' || email.trim().length === 0) {
    return null
  }
  if (typeof service !== 'string') {
    return null
  }
  if (typeof message !== 'string') {
    return null
  }
  if (typeof status !== 'string' || !isLeadStatus(status)) {
    return null
  }
  if (createdAt === null || updatedAt === null) {
    return null
  }

  const estimatedRaw = readField(value, 'estimated_value_cents')
  const estimatedValueCents =
    estimatedRaw === null || estimatedRaw === undefined
      ? null
      : asNonNegativeInt(estimatedRaw)

  if (
    estimatedRaw !== null &&
    estimatedRaw !== undefined &&
    estimatedValueCents === null
  ) {
    return null
  }

  return {
    id,
    name: name.trim(),
    email: email.trim(),
    phone: asOptionalText(readField(value, 'phone')),
    company: asOptionalText(readField(value, 'company')),
    service: service.trim().length > 0 ? service.trim() : '—',
    budget: asOptionalText(readField(value, 'budget')),
    message,
    landing_page: asOptionalText(readField(value, 'landing_page')),
    referrer: asOptionalText(readField(value, 'referrer')),
    utm_source: asOptionalText(readField(value, 'utm_source')),
    utm_medium: asOptionalText(readField(value, 'utm_medium')),
    utm_campaign: asOptionalText(readField(value, 'utm_campaign')),
    initial_channel: asOptionalText(readField(value, 'initial_channel')),
    notify_status: asNotifyStatus(readField(value, 'notify_status')),
    notified_at: asIsoTimestamp(readField(value, 'notified_at')),
    notify_error: asOptionalText(readField(value, 'notify_error')),
    status,
    estimated_value_cents: estimatedValueCents,
    notes: asOptionalText(readField(value, 'notes')),
    created_at: createdAt,
    updated_at: updatedAt,
  }
}

function toIso8601Utc(iso: string): string {
  return new Date(iso).toISOString()
}

function toLeadExportRecord(value: unknown): LeadExportRecord | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const name = readField(value, 'name')
  const email = readField(value, 'email')
  const service = readField(value, 'service')
  const message = readField(value, 'message')
  const status = readField(value, 'status')
  const createdAt = asIsoTimestamp(readField(value, 'created_at'))

  if (typeof name !== 'string' || name.trim().length === 0) {
    return null
  }
  if (typeof email !== 'string' || email.trim().length === 0) {
    return null
  }
  if (typeof service !== 'string') {
    return null
  }
  if (typeof message !== 'string') {
    return null
  }
  if (typeof status !== 'string' || !isLeadStatus(status)) {
    return null
  }
  if (createdAt === null) {
    return null
  }

  const estimatedRaw = readField(value, 'estimated_value_cents')
  const estimatedValueCents =
    estimatedRaw === null || estimatedRaw === undefined
      ? null
      : asNonNegativeInt(estimatedRaw)

  if (
    estimatedRaw !== null &&
    estimatedRaw !== undefined &&
    estimatedValueCents === null
  ) {
    return null
  }

  const notifiedAt = asIsoTimestamp(readField(value, 'notified_at'))

  return {
    submitted_at: toIso8601Utc(createdAt),
    name: name.trim(),
    email: email.trim(),
    phone: asOptionalText(readField(value, 'phone')),
    company: asOptionalText(readField(value, 'company')),
    service: service.trim(),
    budget: asOptionalText(readField(value, 'budget')),
    message,
    status,
    estimated_value_dollars: centsToDollarInput(estimatedValueCents),
    notes: asOptionalText(readField(value, 'notes')),
    landing_page: asOptionalText(readField(value, 'landing_page')),
    referrer: asOptionalText(readField(value, 'referrer')),
    utm_source: asOptionalText(readField(value, 'utm_source')),
    utm_medium: asOptionalText(readField(value, 'utm_medium')),
    utm_campaign: asOptionalText(readField(value, 'utm_campaign')),
    initial_channel: asOptionalText(readField(value, 'initial_channel')),
    notify_status: asNotifyStatus(readField(value, 'notify_status')),
    notified_at: notifiedAt === null ? null : toIso8601Utc(notifiedAt),
  }
}

function toHistoryRow(value: unknown): LeadStatusHistoryRow | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const id = asNonNegativeInt(readField(value, 'id'))
  const newStatus = readField(value, 'new_status')
  const changedAt = asIsoTimestamp(readField(value, 'changed_at'))

  if (id === null) {
    return null
  }
  if (typeof newStatus !== 'string' || newStatus.length === 0) {
    return null
  }
  if (changedAt === null) {
    return null
  }

  const previous = readField(value, 'previous_status')
  const changedBy = readField(value, 'changed_by')

  return {
    id,
    previous_status: asOptionalText(previous),
    new_status: newStatus,
    changed_by: asOptionalText(changedBy),
    changed_at: changedAt,
  }
}

/**
 * PostgREST `.or()` treats commas and some punctuation as syntax.
 * Keep the operator's search usable without injecting filter clauses.
 */
function sanitizeSearchTerm(raw: string): string {
  return raw
    .replace(/[%_,.()"'\\*;&]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100)
}

/**
 * Shared status / channel / q / sort application for the list page and CSV export.
 */
async function queryFilteredLeads(
  columns: string,
  params: LeadsListParams,
  range: { from: number; to: number },
) {
  const supabase = createSupabaseServiceRole()
  let query = supabase
    .from('contact_submissions')
    .select(columns, { count: 'exact' })

  if (params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  if (params.channel !== 'all') {
    query = query.eq('initial_channel', params.channel)
  }

  const search = sanitizeSearchTerm(params.q)
  if (search.length > 0) {
    query = query.or(
      `name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`,
    )
  }

  return query
    .order('created_at', { ascending: params.sort === 'oldest' })
    .order('id', { ascending: params.sort === 'oldest' })
    .range(range.from, range.to)
}

export async function fetchLeads(
  params: LeadsListParams,
): Promise<FetchLeadsResult> {
  const filtersActive = leadsFiltersActive(params)

  try {
    const from = (params.page - 1) * LEADS_PAGE_SIZE
    const to = from + LEADS_PAGE_SIZE - 1
    const { data, error, count } = await queryFilteredLeads(
      LIST_COLUMNS,
      params,
      { from, to },
    )

    if (error) {
      console.error('Intel leads query failed')
      return { ok: false }
    }

    const rows = Array.isArray(data)
      ? data.flatMap((row) => {
          const parsed = toLeadListRow(row)
          return parsed ? [parsed] : []
        })
      : []

    const total = typeof count === 'number' && count >= 0 ? count : rows.length
    const pageCount = Math.max(1, Math.ceil(total / LEADS_PAGE_SIZE))

    return {
      ok: true,
      rows,
      total,
      page: params.page,
      pageCount,
      filtersActive,
      nowMs: Date.now(),
    }
  } catch {
    console.error('Intel leads query failed')
    return { ok: false }
  }
}

export async function fetchLeadsExport(
  params: LeadsListParams,
): Promise<FetchLeadsExportResult> {
  try {
    const { data, error, count } = await queryFilteredLeads(
      EXPORT_COLUMNS,
      params,
      { from: 0, to: LEADS_EXPORT_ROW_CAP - 1 },
    )

    if (error) {
      console.error('Intel leads export query failed')
      return { ok: false }
    }

    const records = Array.isArray(data)
      ? data.flatMap((row) => {
          const parsed = toLeadExportRecord(row)
          return parsed ? [parsed] : []
        })
      : []

    const fetched = Array.isArray(data) ? data.length : records.length
    const total = typeof count === 'number' && count >= 0 ? count : fetched
    const truncated = total > LEADS_EXPORT_ROW_CAP

    return { ok: true, records, truncated }
  } catch {
    console.error('Intel leads export query failed')
    return { ok: false }
  }
}

export async function fetchLeadDetail(
  id: string,
): Promise<FetchLeadDetailResult> {
  try {
    const supabase = createSupabaseServiceRole()

    const { data, error } = await supabase
      .from('contact_submissions')
      .select(DETAIL_COLUMNS)
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('Intel lead detail query failed')
      return { ok: false, reason: 'query_failed' }
    }

    if (data === null) {
      return { ok: false, reason: 'not_found' }
    }

    const lead = toLeadDetail(data)
    if (lead === null) {
      console.error('Intel lead detail row invalid')
      return { ok: false, reason: 'query_failed' }
    }

    const { data: historyData, error: historyError } = await supabase
      .from('lead_status_history')
      .select(HISTORY_COLUMNS)
      .eq('lead_id', id)
      .order('changed_at', { ascending: false })
      .order('id', { ascending: false })

    if (historyError) {
      console.error('Intel lead history query failed')
      return { ok: false, reason: 'query_failed' }
    }

    const history = Array.isArray(historyData)
      ? historyData.flatMap((row) => {
          const parsed = toHistoryRow(row)
          return parsed ? [parsed] : []
        })
      : []

    return { ok: true, lead, history }
  } catch {
    console.error('Intel lead detail query failed')
    return { ok: false, reason: 'query_failed' }
  }
}
