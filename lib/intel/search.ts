import 'server-only'

import { createSupabaseServiceRole } from '@/lib/supabase/service'
import {
  enumerateDates,
  isIsoDate,
  latestCompleteDay,
  priorSpan,
  SEARCH_RANGE_DAYS,
  spanEndingOn,
  type DateSpan,
  type SearchRange,
} from '@/lib/intel/search-params'

const QUERY_PAGE_SIZE = 1000
const QUERY_PAGE_CAP = 80
const TOP_QUERY_LIMIT = 20
const MOVER_LIMIT = 10
const MOVER_MIN_IMPRESSIONS = 10
const NEAR_PAGE_ONE_MIN_IMPRESSIONS = 20
const NEAR_PAGE_ONE_POSITION_MIN = 8
const NEAR_PAGE_ONE_POSITION_MAX = 20

const SITE_COLUMNS = 'date, clicks, impressions, position'
const QUERY_COLUMNS = 'date, query, page, clicks, impressions, position'

export type MetricTotals = {
  clicks: number
  impressions: number
  ctr: number | null
  position: number | null
}

export type DailyPoint = {
  date: string
  clicks: number | null
  impressions: number | null
}

export type QueryAggregate = {
  query: string
  clicks: number
  impressions: number
  ctr: number | null
  position: number | null
}

export type QueryMover = {
  query: string
  clicks: number
  priorClicks: number
  delta: number
  impressions: number
  priorImpressions: number
}

export type SearchComparison =
  | {
      available: true
      span: DateSpan
      totals: MetricTotals
    }
  | {
      available: false
      coverageStartedOn: string | null
    }

export type FetchSearchResult =
  | { ok: false }
  | { ok: true; status: 'no_data' }
  | {
      ok: true
      status: 'empty_range'
      range: SearchRange
      span: DateSpan
      comparison: SearchComparison
    }
  | {
      ok: true
      status: 'ready'
      range: SearchRange
      span: DateSpan
      comparison: SearchComparison
      totals: MetricTotals
      daily: DailyPoint[]
      topQueries: QueryAggregate[]
      gaining: QueryMover[]
      losing: QueryMover[]
      nearPageOne: QueryAggregate[]
    }

type SiteDailyRow = {
  date: string
  clicks: number
  impressions: number
  position: number
}

type QueryPageRow = {
  date: string
  query: string
  page: string
  clicks: number
  impressions: number
  position: number
}

type QueryBucket = {
  query: string
  clicks: number
  impressions: number
  positionMass: number
}

function readField(value: object, key: string): unknown {
  return Reflect.get(value, key)
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

function asNonNegativeNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed
    }
  }
  return null
}

function asIsoDate(value: unknown): string | null {
  if (typeof value !== 'string' || !isIsoDate(value)) {
    return null
  }
  return value
}

function toSiteDailyRow(value: unknown): SiteDailyRow | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const date = asIsoDate(readField(value, 'date'))
  const clicks = asNonNegativeInt(readField(value, 'clicks'))
  const impressions = asNonNegativeInt(readField(value, 'impressions'))
  const position = asNonNegativeNumber(readField(value, 'position'))

  if (
    date === null ||
    clicks === null ||
    impressions === null ||
    position === null
  ) {
    return null
  }

  return { date, clicks, impressions, position }
}

function toQueryPageRow(value: unknown): QueryPageRow | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const date = asIsoDate(readField(value, 'date'))
  const query = readField(value, 'query')
  const page = readField(value, 'page')
  const clicks = asNonNegativeInt(readField(value, 'clicks'))
  const impressions = asNonNegativeInt(readField(value, 'impressions'))
  const position = asNonNegativeNumber(readField(value, 'position'))

  if (date === null || typeof query !== 'string' || typeof page !== 'string') {
    return null
  }
  if (clicks === null || impressions === null || position === null) {
    return null
  }

  return { date, query, page, clicks, impressions, position }
}

function parseRows<T>(
  data: unknown,
  parse: (value: unknown) => T | null,
): T[] {
  if (!Array.isArray(data)) {
    return []
  }
  return data.flatMap((row) => {
    const parsed = parse(row)
    return parsed ? [parsed] : []
  })
}

/**
 * Impression-weighted totals. CTR is sum(clicks) / sum(impressions).
 * Position is sum(position * impressions) / sum(impressions).
 * Daily averages are never averaged together.
 */
export function aggregateSiteMetrics(rows: readonly SiteDailyRow[]): MetricTotals {
  let clicks = 0
  let impressions = 0
  let positionMass = 0

  for (const row of rows) {
    clicks += row.clicks
    impressions += row.impressions
    positionMass += row.position * row.impressions
  }

  return {
    clicks,
    impressions,
    ctr: impressions > 0 ? clicks / impressions : null,
    position: impressions > 0 ? positionMass / impressions : null,
  }
}

function addToQueryBucket(
  buckets: Map<string, QueryBucket>,
  row: QueryPageRow,
): void {
  const existing = buckets.get(row.query)
  if (existing) {
    existing.clicks += row.clicks
    existing.impressions += row.impressions
    existing.positionMass += row.position * row.impressions
    return
  }

  buckets.set(row.query, {
    query: row.query,
    clicks: row.clicks,
    impressions: row.impressions,
    positionMass: row.position * row.impressions,
  })
}

function bucketToAggregate(bucket: QueryBucket): QueryAggregate {
  const label = bucket.query.trim().length > 0 ? bucket.query : '—'
  return {
    query: label,
    clicks: bucket.clicks,
    impressions: bucket.impressions,
    ctr: bucket.impressions > 0 ? bucket.clicks / bucket.impressions : null,
    position:
      bucket.impressions > 0
        ? bucket.positionMass / bucket.impressions
        : null,
  }
}

function aggregateQueries(rows: readonly QueryPageRow[]): QueryAggregate[] {
  const buckets = new Map<string, QueryBucket>()
  for (const row of rows) {
    addToQueryBucket(buckets, row)
  }
  return [...buckets.values()].map(bucketToAggregate)
}

function inSpan(date: string, span: DateSpan): boolean {
  return date >= span.start && date <= span.end
}

function dailySeries(span: DateSpan, rows: readonly SiteDailyRow[]): DailyPoint[] {
  const byDate = new Map<string, SiteDailyRow>()
  for (const row of rows) {
    byDate.set(row.date, row)
  }

  return enumerateDates(span).map((date) => {
    const row = byDate.get(date)
    return {
      date,
      clicks: row ? row.clicks : null,
      impressions: row ? row.impressions : null,
    }
  })
}

function topQueriesByImpressions(rows: QueryAggregate[]): QueryAggregate[] {
  return [...rows]
    .sort((left, right) => {
      if (right.impressions !== left.impressions) {
        return right.impressions - left.impressions
      }
      return right.clicks - left.clicks
    })
    .slice(0, TOP_QUERY_LIMIT)
}

function nearPageOneQueries(rows: QueryAggregate[]): QueryAggregate[] {
  return rows
    .filter((row) => {
      if (row.impressions < NEAR_PAGE_ONE_MIN_IMPRESSIONS) {
        return false
      }
      if (row.position === null) {
        return false
      }
      return (
        row.position >= NEAR_PAGE_ONE_POSITION_MIN &&
        row.position <= NEAR_PAGE_ONE_POSITION_MAX
      )
    })
    .sort((left, right) => right.impressions - left.impressions)
}

function emptyBucket(query: string): QueryBucket {
  return { query, clicks: 0, impressions: 0, positionMass: 0 }
}

function queryMovers(
  currentRows: readonly QueryPageRow[],
  priorRows: readonly QueryPageRow[],
): { gaining: QueryMover[]; losing: QueryMover[] } {
  const current = new Map<string, QueryBucket>()
  const prior = new Map<string, QueryBucket>()

  for (const row of currentRows) {
    addToQueryBucket(current, row)
  }
  for (const row of priorRows) {
    addToQueryBucket(prior, row)
  }

  const keys = new Set<string>([...current.keys(), ...prior.keys()])
  const gaining: QueryMover[] = []
  const losing: QueryMover[] = []

  for (const key of keys) {
    const now = current.get(key) ?? emptyBucket(key)
    const then = prior.get(key) ?? emptyBucket(key)
    if (
      now.impressions < MOVER_MIN_IMPRESSIONS &&
      then.impressions < MOVER_MIN_IMPRESSIONS
    ) {
      continue
    }

    const delta = now.clicks - then.clicks
    if (delta === 0) {
      continue
    }

    const mover: QueryMover = {
      query: now.query.trim().length > 0 ? now.query : '—',
      clicks: now.clicks,
      priorClicks: then.clicks,
      delta,
      impressions: now.impressions,
      priorImpressions: then.impressions,
    }

    if (delta > 0) {
      gaining.push(mover)
    } else {
      losing.push(mover)
    }
  }

  gaining.sort((left, right) => right.delta - left.delta)
  losing.sort((left, right) => left.delta - right.delta)

  return {
    gaining: gaining.slice(0, MOVER_LIMIT),
    losing: losing.slice(0, MOVER_LIMIT),
  }
}

function resolveComparison(
  span: DateSpan,
  coverageStartedOn: string | null,
): { available: true; span: DateSpan } | { available: false } {
  const prior = priorSpan(span)
  if (coverageStartedOn === null || prior.start < coverageStartedOn) {
    return { available: false }
  }
  return { available: true, span: prior }
}

function displaySpan(latestDate: string, days: number): DateSpan | null {
  const periodEnd = latestCompleteDay([{ date: latestDate }])
  if (periodEnd === null) {
    return null
  }
  return spanEndingOn(periodEnd, days)
}

async function fetchLatestSiteDate(
  supabase: ReturnType<typeof createSupabaseServiceRole>,
): Promise<string | null | 'error'> {
  const { data, error } = await supabase
    .from('gsc_site_daily')
    .select('date')
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return 'error'
  }
  if (data === null) {
    return null
  }
  return asIsoDate(readField(data, 'date')) ?? 'error'
}

async function fetchCoverageStartedOn(
  supabase: ReturnType<typeof createSupabaseServiceRole>,
): Promise<string | null | 'error'> {
  const { data, error } = await supabase
    .from('provider_coverage')
    .select('started_on')
    .eq('provider', 'gsc')
    .limit(1)
    .maybeSingle()

  if (error) {
    return 'error'
  }
  if (data === null) {
    return null
  }
  return asIsoDate(readField(data, 'started_on'))
}

async function fetchSiteDaily(
  supabase: ReturnType<typeof createSupabaseServiceRole>,
  span: DateSpan,
): Promise<SiteDailyRow[] | null> {
  const { data, error } = await supabase
    .from('gsc_site_daily')
    .select(SITE_COLUMNS)
    .gte('date', span.start)
    .lte('date', span.end)
    .order('date', { ascending: true })

  if (error) {
    return null
  }
  return parseRows(data, toSiteDailyRow)
}

async function fetchQueryPageDaily(
  supabase: ReturnType<typeof createSupabaseServiceRole>,
  span: DateSpan,
): Promise<QueryPageRow[] | null> {
  const rows: QueryPageRow[] = []

  for (let page = 0; page < QUERY_PAGE_CAP; page += 1) {
    const from = page * QUERY_PAGE_SIZE
    const to = from + QUERY_PAGE_SIZE - 1
    const { data, error } = await supabase
      .from('gsc_query_page_daily')
      .select(QUERY_COLUMNS)
      .gte('date', span.start)
      .lte('date', span.end)
      .order('date', { ascending: true })
      .order('query', { ascending: true })
      .order('page', { ascending: true })
      .range(from, to)

    if (error) {
      return null
    }

    const parsed = parseRows(data, toQueryPageRow)
    rows.push(...parsed)

    if (!Array.isArray(data) || data.length < QUERY_PAGE_SIZE) {
      return rows
    }
  }

  return null
}

export async function fetchSearchIntelligence(
  range: SearchRange,
): Promise<FetchSearchResult> {
  try {
    const supabase = createSupabaseServiceRole()

    const [latestDate, coverageStartedOn] = await Promise.all([
      fetchLatestSiteDate(supabase),
      fetchCoverageStartedOn(supabase),
    ])

    if (latestDate === 'error' || coverageStartedOn === 'error') {
      console.error('Intel search query failed')
      return { ok: false }
    }

    if (latestDate === null) {
      return { ok: true, status: 'no_data' }
    }

    const days = SEARCH_RANGE_DAYS[range]
    const span = displaySpan(latestDate, days)
    if (span === null) {
      return { ok: true, status: 'no_data' }
    }
    const comparisonWindow = resolveComparison(
      span,
      coverageStartedOn,
    )

    const querySpan: DateSpan = comparisonWindow.available
      ? { start: comparisonWindow.span.start, end: span.end }
      : span

    const [siteRows, queryRows] = await Promise.all([
      fetchSiteDaily(supabase, querySpan),
      fetchQueryPageDaily(supabase, querySpan),
    ])

    if (siteRows === null || queryRows === null) {
      console.error('Intel search query failed')
      return { ok: false }
    }

    const currentSite = siteRows.filter((row) => inSpan(row.date, span))
    const currentQueries = queryRows.filter((row) => inSpan(row.date, span))

    const comparison: SearchComparison = comparisonWindow.available
      ? {
          available: true,
          span: comparisonWindow.span,
          totals: aggregateSiteMetrics(
            siteRows.filter((row) => inSpan(row.date, comparisonWindow.span)),
          ),
        }
      : {
          available: false,
          coverageStartedOn,
        }

    if (currentSite.length === 0) {
      return {
        ok: true,
        status: 'empty_range',
        range,
        span,
        comparison,
      }
    }

    const currentAggregates = aggregateQueries(currentQueries)
    const movers = comparisonWindow.available
      ? queryMovers(
          currentQueries,
          queryRows.filter((row) => inSpan(row.date, comparisonWindow.span)),
        )
      : { gaining: [], losing: [] }

    return {
      ok: true,
      status: 'ready',
      range,
      span,
      comparison,
      totals: aggregateSiteMetrics(currentSite),
      daily: dailySeries(span, currentSite),
      topQueries: topQueriesByImpressions(currentAggregates),
      gaining: movers.gaining,
      losing: movers.losing,
      nearPageOne: nearPageOneQueries(currentAggregates),
    }
  } catch {
    console.error('Intel search query failed')
    return { ok: false }
  }
}

export type FetchSiteRangeTotalsResult =
  | { ok: false }
  | { ok: true; status: 'no_data' }
  | {
      ok: true
      status: 'ready'
      totals: MetricTotals
      span: DateSpan
      daily: DailyPoint[]
    }

/**
 * Site-daily totals for a range. Does not load query-page rows.
 */
export async function fetchSiteRangeTotals(
  range: SearchRange,
): Promise<FetchSiteRangeTotalsResult> {
  try {
    const supabase = createSupabaseServiceRole()
    const latestDate = await fetchLatestSiteDate(supabase)

    if (latestDate === 'error') {
      console.error('Intel search query failed')
      return { ok: false }
    }

    if (latestDate === null) {
      return { ok: true, status: 'no_data' }
    }

    const span = displaySpan(latestDate, SEARCH_RANGE_DAYS[range])
    if (span === null) {
      return { ok: true, status: 'no_data' }
    }
    const siteRows = await fetchSiteDaily(supabase, span)

    if (siteRows === null) {
      console.error('Intel search query failed')
      return { ok: false }
    }

    if (siteRows.length === 0) {
      return { ok: true, status: 'no_data' }
    }

    return {
      ok: true,
      status: 'ready',
      totals: aggregateSiteMetrics(siteRows),
      span,
      daily: dailySeries(span, siteRows),
    }
  } catch {
    console.error('Intel search query failed')
    return { ok: false }
  }
}
