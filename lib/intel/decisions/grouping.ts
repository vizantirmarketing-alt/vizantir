import 'server-only'

import { createSupabaseServiceRole } from '@/lib/supabase/service'
import { isIsoDate, type DateSpan } from '@/lib/intel/search-params'
import type {
  GroupedQueryStats,
  MatchType,
  PageWindowStats,
  QueryGroup,
  QueryWindowStats,
  SiteDailyRow,
} from '@/lib/intel/decisions/types'

const QUERY_PAGE_SIZE = 1000
const QUERY_PAGE_CAP = 80
const SITE_COLUMNS = 'date, clicks, impressions, position'
const QUERY_COLUMNS = 'date, query, page, clicks, impressions, position'
const GROUP_COLUMNS = 'id, slug, label, match_terms, match_type, active'
const TOP_PAGE_LIMIT = 5

type ServiceClient = ReturnType<typeof createSupabaseServiceRole>

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
  pages: Map<string, PageWindowStats>
}

type GroupBucket = {
  group: QueryGroup
  clicks: number
  impressions: number
  positionMass: number
  queries: Map<string, QueryBucket>
  pages: Map<string, PageWindowStats>
}

export type GroupingResult = {
  groups: QueryGroup[]
  groupedRows: Map<string, GroupedQueryStats>
  queries: QueryWindowStats[]
  siteDaily: SiteDailyRow[]
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

function asPositiveInt(value: unknown): number | null {
  const parsed = asNonNegativeInt(value)
  if (parsed === null || parsed < 1) {
    return null
  }
  return parsed
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

function asMatchType(value: unknown): MatchType | null {
  if (value === 'contains_any' || value === 'exact_any') {
    return value
  }
  return null
}

function asStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null
  }
  const terms: string[] = []
  for (const item of value) {
    if (typeof item !== 'string') {
      return null
    }
    terms.push(item)
  }
  return terms
}

function toQueryGroup(value: unknown): QueryGroup | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const id = asPositiveInt(readField(value, 'id'))
  const slug = readField(value, 'slug')
  const label = readField(value, 'label')
  const matchTerms = asStringArray(readField(value, 'match_terms'))
  const matchType = asMatchType(readField(value, 'match_type'))
  const active = readField(value, 'active')

  if (id === null || typeof slug !== 'string' || slug.length === 0) {
    return null
  }
  if (typeof label !== 'string' || matchTerms === null || matchType === null) {
    return null
  }
  if (typeof active !== 'boolean') {
    return null
  }

  return { id, slug, label, matchTerms, matchType, active }
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

function weightedTotals(
  clicks: number,
  impressions: number,
  positionMass: number,
): { ctr: number | null; position: number | null } {
  return {
    ctr: impressions > 0 ? clicks / impressions : null,
    position: impressions > 0 ? positionMass / impressions : null,
  }
}

function emptyPageStats(page: string): PageWindowStats {
  return { page, clicks: 0, impressions: 0 }
}

function emptyQueryBucket(query: string): QueryBucket {
  return {
    query,
    clicks: 0,
    impressions: 0,
    positionMass: 0,
    pages: new Map(),
  }
}

function addPageStats(
  pages: Map<string, PageWindowStats>,
  row: QueryPageRow,
): void {
  const existing = pages.get(row.page) ?? emptyPageStats(row.page)
  existing.clicks += row.clicks
  existing.impressions += row.impressions
  pages.set(row.page, existing)
}

function addQueryRow(bucket: QueryBucket, row: QueryPageRow): void {
  bucket.clicks += row.clicks
  bucket.impressions += row.impressions
  bucket.positionMass += row.position * row.impressions
  addPageStats(bucket.pages, row)
}

function topPageFrom(pages: Map<string, PageWindowStats>): string | null {
  let best: PageWindowStats | null = null
  for (const page of pages.values()) {
    if (best === null || page.impressions > best.impressions) {
      best = page
      continue
    }
    if (best && page.impressions === best.impressions && page.clicks > best.clicks) {
      best = page
    }
  }
  if (best === null || best.page.trim().length === 0) {
    return null
  }
  return best.page
}

function bucketToQueryStats(bucket: QueryBucket): QueryWindowStats {
  const totals = weightedTotals(
    bucket.clicks,
    bucket.impressions,
    bucket.positionMass,
  )
  return {
    query: bucket.query.trim().length > 0 ? bucket.query : '—',
    clicks: bucket.clicks,
    impressions: bucket.impressions,
    ctr: totals.ctr,
    position: totals.position,
    topPage: topPageFrom(bucket.pages),
  }
}

function sortPages(pages: Map<string, PageWindowStats>): PageWindowStats[] {
  return [...pages.values()]
    .filter((page) => page.page.trim().length > 0)
    .sort((left, right) => {
      if (right.impressions !== left.impressions) {
        return right.impressions - left.impressions
      }
      return right.clicks - left.clicks
    })
    .slice(0, TOP_PAGE_LIMIT)
}

function sortQueries(queries: QueryWindowStats[]): QueryWindowStats[] {
  return [...queries].sort((left, right) => {
    if (right.impressions !== left.impressions) {
      return right.impressions - left.impressions
    }
    return right.clicks - left.clicks
  })
}

export function queryMatchesGroup(
  query: string,
  group: QueryGroup,
): boolean {
  const haystack = query.toLowerCase()
  if (group.matchType === 'contains_any') {
    return group.matchTerms.some((term) =>
      haystack.includes(term.toLowerCase()),
    )
  }
  return group.matchTerms.some((term) => haystack === term.toLowerCase())
}

/**
 * First matching group in seed/id order. A query matches at most one group.
 */
export function assignQueryToGroup(
  query: string,
  groups: readonly QueryGroup[],
): QueryGroup | null {
  for (const group of groups) {
    if (queryMatchesGroup(query, group)) {
      return group
    }
  }
  return null
}

export function aggregateGroupedWindow(
  rows: readonly QueryPageRow[],
  groups: readonly QueryGroup[],
): {
  groupedRows: Map<string, GroupedQueryStats>
  queries: QueryWindowStats[]
} {
  const queryBuckets = new Map<string, QueryBucket>()
  for (const row of rows) {
    const existing = queryBuckets.get(row.query) ?? emptyQueryBucket(row.query)
    addQueryRow(existing, row)
    queryBuckets.set(row.query, existing)
  }

  const groupBuckets = new Map<string, GroupBucket>()
  for (const group of groups) {
    groupBuckets.set(group.slug, {
      group,
      clicks: 0,
      impressions: 0,
      positionMass: 0,
      queries: new Map(),
      pages: new Map(),
    })
  }

  const queries: QueryWindowStats[] = []

  for (const bucket of queryBuckets.values()) {
    const stats = bucketToQueryStats(bucket)
    queries.push(stats)

    const group = assignQueryToGroup(bucket.query, groups)
    if (group === null) {
      continue
    }

    const groupBucket = groupBuckets.get(group.slug)
    if (!groupBucket) {
      continue
    }

    groupBucket.clicks += bucket.clicks
    groupBucket.impressions += bucket.impressions
    groupBucket.positionMass += bucket.positionMass
    groupBucket.queries.set(bucket.query, bucket)
    for (const page of bucket.pages.values()) {
      const existing = groupBucket.pages.get(page.page) ?? emptyPageStats(page.page)
      existing.clicks += page.clicks
      existing.impressions += page.impressions
      groupBucket.pages.set(page.page, existing)
    }
  }

  const groupedRows = new Map<string, GroupedQueryStats>()
  for (const bucket of groupBuckets.values()) {
    const totals = weightedTotals(
      bucket.clicks,
      bucket.impressions,
      bucket.positionMass,
    )
    groupedRows.set(bucket.group.slug, {
      group: bucket.group,
      clicks: bucket.clicks,
      impressions: bucket.impressions,
      ctr: totals.ctr,
      position: totals.position,
      memberQueries: sortQueries(
        [...bucket.queries.values()].map(bucketToQueryStats),
      ),
      topPages: sortPages(bucket.pages),
    })
  }

  return { groupedRows, queries: sortQueries(queries) }
}

async function fetchActiveGroups(
  supabase: ServiceClient,
): Promise<QueryGroup[] | null> {
  const { data, error } = await supabase
    .from('gsc_query_groups')
    .select(GROUP_COLUMNS)
    .eq('active', true)
    .order('id', { ascending: true })

  if (error) {
    return null
  }
  return parseRows(data, toQueryGroup)
}

async function fetchSiteDaily(
  supabase: ServiceClient,
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
  supabase: ServiceClient,
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

export async function loadGroupingForSpan(
  span: DateSpan,
): Promise<GroupingResult | null> {
  try {
    const supabase = createSupabaseServiceRole()
    const [groups, siteDaily, queryRows] = await Promise.all([
      fetchActiveGroups(supabase),
      fetchSiteDaily(supabase, span),
      fetchQueryPageDaily(supabase, span),
    ])

    if (groups === null || siteDaily === null || queryRows === null) {
      return null
    }

    const aggregated = aggregateGroupedWindow(queryRows, groups)
    return {
      groups,
      groupedRows: aggregated.groupedRows,
      queries: aggregated.queries,
      siteDaily,
    }
  } catch {
    return null
  }
}
