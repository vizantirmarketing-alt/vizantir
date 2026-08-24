import 'server-only'

import { fetchCrawlerFirstSeen } from '@/lib/intel/crawlers'
import {
  formatStatusLabel,
  leadDetailHref,
} from '@/lib/intel/lead-params'
import { isIsoDate } from '@/lib/intel/search-params'
import { createSupabaseServiceRole } from '@/lib/supabase/service'

export type ActivityTone = 'neutral' | 'positive' | 'warning' | 'warning-severe'

export type ActivityCategory =
  | 'lead'
  | 'finding'
  | 'sync'
  | 'visitors'
  | 'crawler'

export type ActivityItem = {
  id: string
  occurredAt: string
  category: ActivityCategory
  title: string
  detail: string | null
  href: string | null
  tone: ActivityTone
}

export type FetchActivityResult =
  | { ok: true; items: ActivityItem[]; nowMs: number }
  | { ok: false; nowMs: number }

type ActivitySourceResult =
  | { ok: true; items: ActivityItem[] }
  | { ok: false }

type SyncProvider = 'ga4' | 'gsc' | 'clarity' | 'decisions'

type SyncRunStatus = 'success' | 'partial' | 'failed'

type ParsedSyncRun = {
  provider: SyncProvider
  status: SyncRunStatus
  item: ActivityItem
}

const SYNC_EVENT_TYPES = new Set([
  'ga4_sync',
  'gsc_sync',
  'clarity_sync',
  'decisions_sync',
])

const DEFAULT_ACTIVITY_LIMIT = 12
const SYNC_LOOKBACK_LIMIT = 40
const DAY_MS = 86_400_000
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const GA4_PROPERTY_TIME_ZONE = 'America/Los_Angeles'

export async function fetchActivity(
  limit: number = DEFAULT_ACTIVITY_LIMIT,
): Promise<FetchActivityResult> {
  const take = Number.isInteger(limit) && limit > 0 ? limit : DEFAULT_ACTIVITY_LIMIT
  const nowMs = Date.now()

  const [
    inquiries,
    statusMoves,
    findings,
    syncs,
    visitors,
    recorded,
    crawlerFirsts,
  ] = await Promise.all([
    fetchInquiryEvents(take),
    fetchStatusMoveEvents(take),
    fetchFindingEvents(take),
    fetchSyncRunEvents(),
    fetchVisitorEvents(),
    fetchRecordedEvents(take),
    fetchCrawlerFirstVisitEvents(nowMs),
  ])

  if (
    !inquiries.ok ||
    !statusMoves.ok ||
    !findings.ok ||
    !syncs.ok ||
    !visitors.ok ||
    !recorded.ok ||
    !crawlerFirsts.ok
  ) {
    return { ok: false, nowMs }
  }

  const merged = [
    ...inquiries.items,
    ...statusMoves.items,
    ...findings.items,
    ...syncs.items,
    ...visitors.items,
    ...recorded.items,
    ...crawlerFirsts.items,
  ]

  merged.sort((left, right) => {
    const byTime = right.occurredAt.localeCompare(left.occurredAt)
    if (byTime !== 0) {
      return byTime
    }
    return left.id.localeCompare(right.id)
  })

  return { ok: true, items: merged.slice(0, take), nowMs }
}

export async function recordSyncSuccessEvent(input: {
  provider: SyncProvider
  recordsProcessed: number
  dataThroughDate: string
}): Promise<void> {
  try {
    if (input.recordsProcessed <= 0) {
      return
    }
    if (!DATE_RE.test(input.dataThroughDate)) {
      return
    }

    const supabase = createSupabaseServiceRole()
    const label = providerLabel(input.provider)
    const count = formatCount(input.recordsProcessed)

    await supabase.from('intel_events').upsert(
      {
        event_type: `${input.provider}_sync`,
        title: `${label} completed · ${count} records`,
        source: input.provider,
        dedupe_key: `${input.provider}:${input.dataThroughDate}`,
      },
      { onConflict: 'dedupe_key', ignoreDuplicates: true },
    )
  } catch {
    // Recording an event must never fail a sync.
  }
}

export function isActivityRecent(occurredAt: string, nowMs: number): boolean {
  const then = Date.parse(occurredAt)
  if (Number.isNaN(then)) {
    return false
  }
  const diff = nowMs - then
  return diff >= 0 && diff < DAY_MS
}

export function formatActivityRelative(iso: string, nowMs: number): string {
  const then = Date.parse(iso)
  if (Number.isNaN(then)) {
    return '—'
  }

  const diff = nowMs - then
  if (diff < 60_000) {
    return 'just now'
  }

  if (diff < 3_600_000) {
    const minutes = Math.max(1, Math.round(diff / 60_000))
    return `${minutes}m ago`
  }

  if (diff < DAY_MS) {
    const hours = Math.max(1, Math.round(diff / 3_600_000))
    return `${hours}h ago`
  }

  if (isCalendarYesterday(then, nowMs)) {
    return 'yesterday'
  }

  const days = Math.round(diff / DAY_MS)
  if (days < 7) {
    return `${days}d ago`
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(then))
}

function activityQueryFailed(): ActivitySourceResult {
  console.error('Intel activity query failed')
  return { ok: false }
}

async function fetchInquiryEvents(limit: number): Promise<ActivitySourceResult> {
  try {
    const supabase = createSupabaseServiceRole()
    const { data, error } = await supabase
      .from('contact_submissions')
      .select('id, name, service, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error || !Array.isArray(data)) {
      return activityQueryFailed()
    }

    const items: ActivityItem[] = []
    for (const row of data) {
      const parsed = toInquiryEvent(row)
      if (parsed) {
        items.push(parsed)
      }
    }
    return { ok: true, items }
  } catch {
    return activityQueryFailed()
  }
}

async function fetchStatusMoveEvents(
  limit: number,
): Promise<ActivitySourceResult> {
  try {
    const supabase = createSupabaseServiceRole()
    const { data, error } = await supabase
      .from('lead_status_history')
      .select('id, lead_id, new_status, changed_at')
      .order('changed_at', { ascending: false })
      .limit(limit)

    if (error || !Array.isArray(data)) {
      return activityQueryFailed()
    }

    const rows: Array<{
      id: string
      leadId: string
      status: string
      changedAt: string
    }> = []
    const leadIds: string[] = []

    for (const row of data) {
      const parsed = parseStatusHistory(row)
      if (parsed === null) {
        continue
      }
      rows.push(parsed)
      if (!leadIds.includes(parsed.leadId)) {
        leadIds.push(parsed.leadId)
      }
    }

    if (rows.length === 0) {
      return { ok: true, items: [] }
    }

    const names = await fetchLeadNames(leadIds)
    if (names === null) {
      return activityQueryFailed()
    }
    const items: ActivityItem[] = []

    for (const row of rows) {
      const name = names.get(row.leadId)
      if (name === undefined) {
        continue
      }
      items.push({
        id: `lead-status:${row.id}`,
        occurredAt: row.changedAt,
        category: 'lead',
        title: `${name} moved to ${formatStatusLabel(row.status)}`,
        detail: null,
        href: leadDetailHref(row.leadId),
        tone: statusMoveTone(row.status),
      })
    }

    return { ok: true, items }
  } catch {
    return activityQueryFailed()
  }
}

async function fetchFindingEvents(limit: number): Promise<ActivitySourceResult> {
  try {
    const supabase = createSupabaseServiceRole()
    const { data, error } = await supabase
      .from('finding_state')
      .select('finding_key, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error || !Array.isArray(data)) {
      return activityQueryFailed()
    }

    const states: Array<{ findingKey: string; createdAt: string }> = []
    for (const row of data) {
      const parsed = toFindingStateRow(row)
      if (parsed) {
        states.push(parsed)
      }
    }
    if (states.length === 0) {
      return { ok: true, items: [] }
    }

    const titles = await fetchFindingTitles(
      states.map((state) => state.findingKey),
    )
    if (titles === null) {
      return activityQueryFailed()
    }

    const items: ActivityItem[] = []
    for (const state of states) {
      const title = titles.get(state.findingKey)
      if (title === undefined) {
        continue
      }
      items.push({
        id: `finding:${state.findingKey}`,
        occurredAt: state.createdAt,
        category: 'finding',
        title: `New finding: ${title}`,
        detail: null,
        href: '/intel',
        tone: 'neutral',
      })
    }
    return { ok: true, items }
  } catch {
    return activityQueryFailed()
  }
}

async function fetchFindingTitles(
  findingKeys: readonly string[],
): Promise<Map<string, string> | null> {
  const titles = new Map<string, string>()
  if (findingKeys.length === 0) {
    return titles
  }

  const supabase = createSupabaseServiceRole()
  const { data, error } = await supabase
    .from('decision_items')
    .select('finding_key, title, period_end')
    .in('finding_key', [...findingKeys])
    .order('period_end', { ascending: false })

  if (error || !Array.isArray(data)) {
    return null
  }

  for (const row of data) {
    if (typeof row !== 'object' || row === null) {
      continue
    }
    const findingKey = readField(row, 'finding_key')
    const title = readField(row, 'title')
    if (typeof findingKey !== 'string' || findingKey.length === 0) {
      continue
    }
    if (typeof title !== 'string' || title.trim().length === 0) {
      continue
    }
    if (titles.has(findingKey)) {
      continue
    }
    titles.set(findingKey, title.trim())
  }

  return titles
}

async function fetchSyncRunEvents(): Promise<ActivitySourceResult> {
  try {
    const supabase = createSupabaseServiceRole()
    const { data, error } = await supabase
      .from('sync_runs')
      .select(
        'id, provider, status, records_processed, started_at, completed_at',
      )
      .in('status', ['success', 'partial', 'failed'])
      .order('started_at', { ascending: false })
      .limit(SYNC_LOOKBACK_LIMIT)

    if (error || !Array.isArray(data)) {
      return activityQueryFailed()
    }

    const parsed: ParsedSyncRun[] = []
    for (const row of data) {
      const item = toSyncRunEvent(row)
      if (item) {
        parsed.push(item)
      }
    }
    return { ok: true, items: selectSyncActivity(parsed) }
  } catch {
    return activityQueryFailed()
  }
}

async function fetchCrawlerFirstVisitEvents(
  nowMs: number,
): Promise<ActivitySourceResult> {
  try {
    const result = await fetchCrawlerFirstSeen()
    if (!result.ok) {
      return activityQueryFailed()
    }
    const windowStart = nowMs - 30 * DAY_MS
    const items: ActivityItem[] = []

    for (const row of result.items) {
      const then = Date.parse(row.firstSeenAt)
      if (Number.isNaN(then)) {
        continue
      }
      if (then < windowStart || then > nowMs) {
        continue
      }
      items.push({
        id: `crawler-first:${row.bot}`,
        occurredAt: row.firstSeenAt,
        category: 'crawler',
        title: `First visit from ${row.bot}`,
        detail: null,
        href: null,
        tone: 'positive',
      })
    }

    return { ok: true, items }
  } catch {
    return activityQueryFailed()
  }
}

async function fetchVisitorEvents(): Promise<ActivitySourceResult> {
  try {
    const yesterday = propertyYesterdayDate()
    const supabase = createSupabaseServiceRole()
    const { data, error } = await supabase
      .from('ga4_daily')
      .select('date, users, channel_group')
      .eq('date', yesterday)

    if (error || !Array.isArray(data)) {
      return activityQueryFailed()
    }

    for (const row of data) {
      if (!isSiteTotalChannel(readField(row, 'channel_group'))) {
        continue
      }
      const parsed = toVisitorEvent(row, yesterday)
      if (parsed) {
        return { ok: true, items: [parsed] }
      }
    }
    return { ok: true, items: [] }
  } catch {
    return activityQueryFailed()
  }
}

async function fetchRecordedEvents(limit: number): Promise<ActivitySourceResult> {
  try {
    const supabase = createSupabaseServiceRole()
    const { data, error } = await supabase
      .from('intel_events')
      .select('id, occurred_at, event_type, title, detail, href')
      .order('occurred_at', { ascending: false })
      .limit(limit)

    if (error || !Array.isArray(data)) {
      return activityQueryFailed()
    }

    const items: ActivityItem[] = []
    for (const row of data) {
      const parsed = toRecordedEvent(row)
      if (parsed) {
        items.push(parsed)
      }
    }
    return { ok: true, items }
  } catch {
    return activityQueryFailed()
  }
}

async function fetchLeadNames(
  ids: string[],
): Promise<Map<string, string> | null> {
  const names = new Map<string, string>()
  if (ids.length === 0) {
    return names
  }

  const supabase = createSupabaseServiceRole()
  const { data, error } = await supabase
    .from('contact_submissions')
    .select('id, name')
    .in('id', ids)

  if (error || !Array.isArray(data)) {
    return null
  }

  for (const row of data) {
    if (typeof row !== 'object' || row === null) {
      continue
    }
    const id = readField(row, 'id')
    const name = readField(row, 'name')
    if (typeof id !== 'string' || id.length === 0) {
      continue
    }
    if (typeof name !== 'string' || name.trim().length === 0) {
      continue
    }
    names.set(id, name.trim())
  }

  return names
}

function toInquiryEvent(value: unknown): ActivityItem | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const id = readField(value, 'id')
  const name = readField(value, 'name')
  const service = readField(value, 'service')
  const createdAt = asIsoTimestamp(readField(value, 'created_at'))

  if (typeof id !== 'string' || id.length === 0) {
    return null
  }
  if (typeof name !== 'string' || name.trim().length === 0) {
    return null
  }
  if (createdAt === null) {
    return null
  }

  const serviceLabel =
    typeof service === 'string' && service.trim().length > 0
      ? service.trim()
      : null

  return {
    id: `inquiry:${id}`,
    occurredAt: createdAt,
    category: 'lead',
    title: `New inquiry from ${name.trim()}`,
    detail: serviceLabel,
    href: leadDetailHref(id),
    tone: 'positive',
  }
}

function parseStatusHistory(value: unknown): {
  id: string
  leadId: string
  status: string
  changedAt: string
} | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const id = asPositiveInt(readField(value, 'id'))
  const leadId = readField(value, 'lead_id')
  const status = readField(value, 'new_status')
  const changedAt = asIsoTimestamp(readField(value, 'changed_at'))

  if (id === null) {
    return null
  }
  if (typeof leadId !== 'string' || leadId.length === 0) {
    return null
  }
  if (typeof status !== 'string' || status.length === 0) {
    return null
  }
  if (changedAt === null) {
    return null
  }

  return {
    id: String(id),
    leadId,
    status,
    changedAt,
  }
}

function toFindingStateRow(value: unknown): {
  findingKey: string
  createdAt: string
} | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const findingKey = readField(value, 'finding_key')
  const createdAt = asIsoTimestamp(readField(value, 'created_at'))

  if (typeof findingKey !== 'string' || findingKey.length === 0) {
    return null
  }
  if (createdAt === null) {
    return null
  }

  return { findingKey, createdAt }
}

function toSyncRunEvent(value: unknown): ParsedSyncRun | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const id = asPositiveInt(readField(value, 'id'))
  const providerRaw = readField(value, 'provider')
  const statusRaw = readField(value, 'status')
  const records = asNonNegativeInt(readField(value, 'records_processed'))
  const completedAt = asIsoTimestamp(readField(value, 'completed_at'))
  const startedAt = asIsoTimestamp(readField(value, 'started_at'))
  const occurredAt = completedAt ?? startedAt

  if (id === null || records === null || occurredAt === null) {
    return null
  }
  if (typeof providerRaw !== 'string' || !isSyncProvider(providerRaw)) {
    return null
  }
  if (typeof statusRaw !== 'string' || !isSyncRunStatus(statusRaw)) {
    return null
  }

  const label = providerLabel(providerRaw)
  const count = formatCount(records)

  let title: string
  let tone: ActivityTone
  if (statusRaw === 'failed') {
    title = `${label} failed`
    tone = 'warning-severe'
  } else if (statusRaw === 'partial') {
    title = `${label} partial · ${count} records`
    tone = 'warning'
  } else {
    title = `${label} completed · ${count} records`
    tone = 'neutral'
  }

  return {
    provider: providerRaw,
    status: statusRaw,
    item: {
      id: `sync:${id}`,
      occurredAt,
      category: 'sync',
      title,
      detail: null,
      href: null,
      tone,
    },
  }
}

function selectSyncActivity(runs: readonly ParsedSyncRun[]): ActivityItem[] {
  const latestSuccessAt = new Map<SyncProvider, string>()
  for (const run of runs) {
    if (run.status !== 'success') {
      continue
    }
    const current = latestSuccessAt.get(run.provider)
    if (current === undefined || run.item.occurredAt > current) {
      latestSuccessAt.set(run.provider, run.item.occurredAt)
    }
  }

  const keptSuccess = new Set<SyncProvider>()
  const items: ActivityItem[] = []

  for (const run of runs) {
    if (run.status === 'failed') {
      const successAt = latestSuccessAt.get(run.provider)
      if (successAt !== undefined && run.item.occurredAt < successAt) {
        continue
      }
      items.push(run.item)
      continue
    }

    if (run.status === 'partial') {
      items.push(run.item)
      continue
    }

    if (keptSuccess.has(run.provider)) {
      continue
    }
    keptSuccess.add(run.provider)
    items.push(run.item)
  }

  return items
}

function toVisitorEvent(
  value: unknown,
  yesterday: string,
): ActivityItem | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const date = readField(value, 'date')
  const users = asNonNegativeInt(readField(value, 'users'))

  if (typeof date !== 'string' || !isIsoDate(date) || users === null) {
    return null
  }
  if (date !== yesterday) {
    return null
  }

  return {
    id: `visitors:${date}`,
    occurredAt: `${date}T12:00:00.000Z`,
    category: 'visitors',
    title: `${formatCount(users)} visitors yesterday`,
    detail: null,
    href: null,
    tone: 'neutral',
  }
}

function toRecordedEvent(value: unknown): ActivityItem | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const id = asPositiveInt(readField(value, 'id'))
  const occurredAt = asIsoTimestamp(readField(value, 'occurred_at'))
  const eventType = readField(value, 'event_type')
  const title = readField(value, 'title')

  if (id === null || occurredAt === null) {
    return null
  }
  if (typeof eventType !== 'string' || eventType.length === 0) {
    return null
  }
  if (SYNC_EVENT_TYPES.has(eventType)) {
    return null
  }
  if (typeof title !== 'string' || title.trim().length === 0) {
    return null
  }

  return {
    id: `event:${id}`,
    occurredAt,
    category: recordedCategory(eventType),
    title: title.trim(),
    detail: asOptionalText(readField(value, 'detail')),
    href: asOptionalText(readField(value, 'href')),
    tone: recordedTone(eventType),
  }
}

function recordedCategory(eventType: string): ActivityCategory {
  if (eventType.includes('lead') || eventType.includes('inquiry')) {
    return 'lead'
  }
  if (eventType.includes('finding')) {
    return 'finding'
  }
  if (eventType.includes('visitor') || eventType.includes('ga4')) {
    return 'visitors'
  }
  return 'sync'
}

function recordedTone(eventType: string): ActivityTone {
  if (eventType.includes('fail')) {
    return 'warning-severe'
  }
  if (eventType.includes('partial') || eventType.includes('warning')) {
    return 'warning'
  }
  if (eventType.includes('won') || eventType.includes('success')) {
    return 'positive'
  }
  return 'neutral'
}

function statusMoveTone(status: string): ActivityTone {
  if (status === 'won') {
    return 'positive'
  }
  if (status === 'lost' || status === 'not_qualified' || status === 'spam') {
    return 'warning'
  }
  return 'neutral'
}

function providerLabel(provider: SyncProvider): string {
  if (provider === 'ga4') {
    return 'GA4 sync'
  }
  if (provider === 'gsc') {
    return 'GSC sync'
  }
  if (provider === 'clarity') {
    return 'Clarity sync'
  }
  return 'Decision scan'
}

function isSyncProvider(value: string): value is SyncProvider {
  return (
    value === 'ga4' ||
    value === 'gsc' ||
    value === 'clarity' ||
    value === 'decisions'
  )
}

function isSyncRunStatus(value: string): value is SyncRunStatus {
  return value === 'success' || value === 'partial' || value === 'failed'
}

function propertyYesterdayDate(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: GA4_PROPERTY_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const year = Number(parts.find((part) => part.type === 'year')?.value)
  const month = Number(parts.find((part) => part.type === 'month')?.value)
  const day = Number(parts.find((part) => part.type === 'day')?.value)
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    const fallback = new Date(Date.now() - DAY_MS)
    return fallback.toISOString().slice(0, 10)
  }

  return new Date(Date.UTC(year, month - 1, day - 1)).toISOString().slice(0, 10)
}

function isSiteTotalChannel(value: unknown): boolean {
  return value === '' || value === null || value === undefined
}

function isCalendarYesterday(thenMs: number, nowMs: number): boolean {
  const then = new Date(thenMs)
  const now = new Date(nowMs)
  const yesterday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1),
  )
  return (
    then.getUTCFullYear() === yesterday.getUTCFullYear() &&
    then.getUTCMonth() === yesterday.getUTCMonth() &&
    then.getUTCDate() === yesterday.getUTCDate()
  )
}

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

function readField(value: object, key: string): unknown {
  return Reflect.get(value, key)
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

function asIsoTimestamp(value: unknown): string | null {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    return null
  }
  return value
}

function asPositiveInt(value: unknown): number | null {
  if (typeof value === 'bigint') {
    if (value < BigInt(1) || value > BigInt(Number.MAX_SAFE_INTEGER)) {
      return null
    }
    return Number(value)
  }
  if (typeof value === 'number' && Number.isFinite(value) && value >= 1) {
    const rounded = Math.round(value)
    if (Number.isSafeInteger(rounded) && Math.abs(value - rounded) < 1e-9) {
      return rounded
    }
    return null
  }
  if (typeof value === 'string' && /^[1-9]\d*$/.test(value)) {
    const parsed = Number(value)
    if (Number.isSafeInteger(parsed)) {
      return parsed
    }
  }
  return null
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
