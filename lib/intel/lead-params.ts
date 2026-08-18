import type { InitialChannel } from '@/lib/forms/attribution'

export const LEADS_PAGE_SIZE = 25
export const LEADS_EXPORT_ROW_CAP = 5000

export const LEAD_STATUSES = [
  'new',
  'reviewing',
  'contacted',
  'discovery_scheduled',
  'proposal_sent',
  'won',
  'lost',
  'not_qualified',
  'spam',
] as const

export type LeadStatus = (typeof LEAD_STATUSES)[number]

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  reviewing: 'Reviewing',
  contacted: 'Contacted',
  discovery_scheduled: 'Discovery scheduled',
  proposal_sent: 'Proposal sent',
  won: 'Won',
  lost: 'Lost',
  not_qualified: 'Not qualified',
  spam: 'Spam',
}

const CLOSED_STATUSES = new Set<LeadStatus>([
  'won',
  'lost',
  'not_qualified',
  'spam',
])

export function isClosedLeadStatus(status: LeadStatus): boolean {
  return CLOSED_STATUSES.has(status)
}

export const LEAD_CHANNELS = [
  'campaign',
  'direct',
  'organic_search',
  'ai_referral',
  'social',
  'referral',
] as const satisfies readonly InitialChannel[]

export type LeadChannel = (typeof LEAD_CHANNELS)[number]

export const LEAD_CHANNEL_LABELS: Record<LeadChannel, string> = {
  campaign: 'Campaign',
  direct: 'Direct',
  organic_search: 'Organic search',
  ai_referral: 'AI referral',
  social: 'Social',
  referral: 'Referral',
}

export const NOTIFY_STATUSES = ['sent', 'failed', 'not_configured'] as const

export type NotifyStatus = (typeof NOTIFY_STATUSES)[number]

export type LeadListRow = {
  id: string
  name: string
  company: string | null
  service: string
  status: LeadStatus
  initial_channel: string | null
  notify_status: NotifyStatus | null
  created_at: string
}

export type LeadsSort = 'newest' | 'oldest'

export type LeadsListParams = {
  status: LeadStatus | 'all'
  channel: LeadChannel | 'all'
  q: string
  sort: LeadsSort
  page: number
}

export type LeadsSearchParams = {
  status?: string | string[]
  channel?: string | string[]
  q?: string | string[]
  sort?: string | string[]
  page?: string | string[]
}

const DEFAULT_PARAMS: LeadsListParams = {
  status: 'all',
  channel: 'all',
  q: '',
  sort: 'newest',
  page: 1,
}

function firstSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    const first = value[0]
    return typeof first === 'string' ? first : undefined
  }
  return value
}

export function isLeadStatus(value: string): value is LeadStatus {
  return LEAD_STATUSES.some((status) => status === value)
}

export function isNotifyStatus(value: string): value is NotifyStatus {
  return NOTIFY_STATUSES.some((status) => status === value)
}

export function formatStatusLabel(status: string): string {
  if (isLeadStatus(status)) {
    return LEAD_STATUS_LABELS[status]
  }
  return status
}

const LEAD_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isLeadId(value: string): boolean {
  return LEAD_ID_RE.test(value)
}

function isLeadChannel(value: string): value is LeadChannel {
  return LEAD_CHANNELS.some((channel) => channel === value)
}

export function parseLeadsListParams(
  searchParams: LeadsSearchParams,
): LeadsListParams {
  const statusRaw = firstSearchParam(searchParams.status)
  const channelRaw = firstSearchParam(searchParams.channel)
  const qRaw = firstSearchParam(searchParams.q)
  const sortRaw = firstSearchParam(searchParams.sort)
  const pageRaw = firstSearchParam(searchParams.page)

  const status =
    statusRaw && statusRaw !== 'all' && isLeadStatus(statusRaw)
      ? statusRaw
      : 'all'
  const channel =
    channelRaw && channelRaw !== 'all' && isLeadChannel(channelRaw)
      ? channelRaw
      : 'all'
  const q = qRaw?.trim() ?? ''
  const sort: LeadsSort = sortRaw === 'oldest' ? 'oldest' : 'newest'

  const parsedPage = pageRaw ? Number.parseInt(pageRaw, 10) : 1
  const page =
    Number.isFinite(parsedPage) && parsedPage > 0
      ? Math.floor(parsedPage)
      : 1

  return { status, channel, q, sort, page }
}

export function leadsFiltersActive(params: LeadsListParams): boolean {
  return params.status !== 'all' || params.channel !== 'all' || params.q.length > 0
}

function leadsFilterSearchParams(
  params: Partial<LeadsListParams>,
  options?: { includePage?: boolean },
): URLSearchParams {
  const merged: LeadsListParams = { ...DEFAULT_PARAMS, ...params }
  const search = new URLSearchParams()

  if (merged.status !== 'all') {
    search.set('status', merged.status)
  }
  if (merged.channel !== 'all') {
    search.set('channel', merged.channel)
  }
  if (merged.q.length > 0) {
    search.set('q', merged.q)
  }
  if (merged.sort !== 'newest') {
    search.set('sort', merged.sort)
  }
  if (options?.includePage && merged.page > 1) {
    search.set('page', String(merged.page))
  }

  return search
}

export function leadsListHref(params: Partial<LeadsListParams>): string {
  const query = leadsFilterSearchParams(params, { includePage: true }).toString()
  return query.length > 0 ? `/intel/leads?${query}` : '/intel/leads'
}

export function leadsExportHref(params: Partial<LeadsListParams>): string {
  const query = leadsFilterSearchParams(params).toString()
  return query.length > 0
    ? `/intel/leads/export?${query}`
    : '/intel/leads/export'
}

function utcDateStamp(date: Date): string {
  const year = String(date.getUTCFullYear())
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function leadsExportFilename(
  params: LeadsListParams,
  options: { truncated: boolean; now?: Date },
): string {
  const parts = ['leads', utcDateStamp(options.now ?? new Date())]

  if (params.status !== 'all') {
    parts.push(`status-${params.status}`)
  }
  if (params.channel !== 'all') {
    parts.push(`channel-${params.channel}`)
  }
  if (params.q.length > 0) {
    parts.push('search')
  }
  if (options.truncated) {
    parts.push('truncated')
  }

  return `${parts.join('-')}.csv`
}

export function leadDetailHref(
  id: string,
  params?: Partial<LeadsListParams>,
): string {
  const path = `/intel/leads/${id}`
  if (!params) {
    return path
  }
  const listHref = leadsListHref(params)
  const queryIndex = listHref.indexOf('?')
  if (queryIndex === -1) {
    return path
  }
  return `${path}${listHref.slice(queryIndex)}`
}

export function centsToDollarInput(cents: number | null): string {
  if (cents === null || typeof cents !== 'number' || !Number.isFinite(cents)) {
    return ''
  }
  const dollars = cents / 100
  return Number.isInteger(dollars) ? String(dollars) : dollars.toFixed(2)
}

export function formatChannelLabel(channel: string | null): string {
  if (channel === null || channel.length === 0) {
    return '—'
  }
  for (const known of LEAD_CHANNELS) {
    if (known === channel) {
      return LEAD_CHANNEL_LABELS[known]
    }
  }
  return channel
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export function formatFullTimestamp(iso: string): string {
  const then = Date.parse(iso)
  if (Number.isNaN(then)) {
    return '—'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  }).format(new Date(then))
}

export function formatSubmittedAt(iso: string, nowMs: number): string {
  const then = Date.parse(iso)
  if (Number.isNaN(then)) {
    return '—'
  }

  const diffMs = nowMs - then
  if (diffMs >= 0 && diffMs < WEEK_MS) {
    return formatRelative(diffMs)
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(then))
}

function formatRelative(diffMs: number): string {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const seconds = Math.round(diffMs / 1000)

  if (seconds < 60) {
    return 'Just now'
  }

  const minutes = Math.round(seconds / 60)
  if (minutes < 60) {
    return rtf.format(-minutes, 'minute')
  }

  const hours = Math.round(minutes / 60)
  if (hours < 24) {
    return rtf.format(-hours, 'hour')
  }

  const days = Math.round(hours / 24)
  return rtf.format(-days, 'day')
}
