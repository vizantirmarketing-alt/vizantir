export const SEARCH_RANGES = ['28d', '90d', '180d'] as const

export type SearchRange = (typeof SEARCH_RANGES)[number]

export const SEARCH_RANGE_DAYS: Record<SearchRange, number> = {
  '28d': 28,
  '90d': 90,
  '180d': 180,
}

export const SEARCH_RANGE_LABELS: Record<SearchRange, string> = {
  '28d': '28 days',
  '90d': '90 days',
  '180d': '180 days',
}

export type SearchPageParams = {
  range: SearchRange
}

export type SearchSearchParams = {
  range?: string | string[]
}

export type DateSpan = {
  start: string
  end: string
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

export function isSearchRange(value: string): value is SearchRange {
  return SEARCH_RANGES.some((range) => range === value)
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

export function parseSearchPageParams(
  searchParams: SearchSearchParams,
): SearchPageParams {
  const raw = firstSearchParam(searchParams.range)
  const range = raw && isSearchRange(raw) ? raw : '28d'
  return { range }
}

export function searchHref(range: SearchRange): string {
  return range === '28d' ? '/intel/search' : `/intel/search?range=${range}`
}

export function isIsoDate(value: string): boolean {
  return DATE_RE.test(value)
}

export function parseUtcDate(iso: string): Date {
  const match = DATE_RE.exec(iso)
  if (match === null) {
    return new Date(NaN)
  }
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  return new Date(Date.UTC(year, month - 1, day))
}

export function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function addUtcDays(iso: string, days: number): string {
  const date = parseUtcDate(iso)
  date.setUTCDate(date.getUTCDate() + days)
  return formatUtcDate(date)
}

export function daysInclusive(start: string, end: string): number {
  const startMs = parseUtcDate(start).getTime()
  const endMs = parseUtcDate(end).getTime()
  return Math.round((endMs - startMs) / 86_400_000) + 1
}

export function spanEndingOn(end: string, days: number): DateSpan {
  return {
    start: addUtcDays(end, -(days - 1)),
    end,
  }
}

export function priorSpan(current: DateSpan): DateSpan {
  const days = daysInclusive(current.start, current.end)
  const end = addUtcDays(current.start, -1)
  return spanEndingOn(end, days)
}

export function enumerateDates(span: DateSpan): string[] {
  const dates: string[] = []
  let cursor = span.start
  while (cursor <= span.end) {
    dates.push(cursor)
    cursor = addUtcDays(cursor, 1)
  }
  return dates
}

export function formatDisplayDate(iso: string): string {
  const date = parseUtcDate(iso)
  if (Number.isNaN(date.getTime())) {
    return iso
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export function formatSpanLabel(span: DateSpan): string {
  return `${formatDisplayDate(span.start)} – ${formatDisplayDate(span.end)}`
}
