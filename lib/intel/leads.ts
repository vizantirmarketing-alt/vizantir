import 'server-only'

import { createSupabaseServiceRole } from '@/lib/supabase/service'
import {
  LEADS_PAGE_SIZE,
  LEAD_STATUSES,
  NOTIFY_STATUSES,
  leadsFiltersActive,
  type LeadListRow,
  type LeadStatus,
  type LeadsListParams,
  type NotifyStatus,
} from '@/lib/intel/lead-params'

export type { LeadListRow }

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

const LIST_COLUMNS =
  'id, name, company, service, status, initial_channel, notify_status, created_at'

function isLeadStatus(value: string): value is LeadStatus {
  return LEAD_STATUSES.some((status) => status === value)
}

function isNotifyStatus(value: string): value is NotifyStatus {
  return NOTIFY_STATUSES.some((status) => status === value)
}

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

export async function fetchLeads(
  params: LeadsListParams,
): Promise<FetchLeadsResult> {
  const filtersActive = leadsFiltersActive(params)

  try {
    const supabase = createSupabaseServiceRole()
    const from = (params.page - 1) * LEADS_PAGE_SIZE
    const to = from + LEADS_PAGE_SIZE - 1

    let query = supabase
      .from('contact_submissions')
      .select(LIST_COLUMNS, { count: 'exact' })

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

    const { data, error, count } = await query
      .order('created_at', { ascending: params.sort === 'oldest' })
      .order('id', { ascending: params.sort === 'oldest' })
      .range(from, to)

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
