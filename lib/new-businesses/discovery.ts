/**
 * Finds monthly new business list PDFs on the Clark County listing page.
 * Pure; no I/O.
 *
 * File links carry unpredictable asset ids, so the only stable part is the
 * file name: new-businesses-<mon>-<year>.pdf. Links are accepted only on an
 * allowlisted host over https.
 */

export const NEW_BUSINESS_SOURCE = 'clark_county'

export const LISTING_URL =
  'https://www.clarkcountynv.gov/business/doing_business_with_clark_county/new-businesses'

export const ALLOWED_HOSTS: ReadonlySet<string> = new Set([
  'clarkcountynv.gov',
  'www.clarkcountynv.gov',
])

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
}

const FILE_RE = /\/new-businesses-([a-z]{3,4})-(\d{4})\.pdf$/i

export type Period = { year: number; month: number }

export type DiscoveredFile = Period & { url: string }

export function periodKey(period: Period): string {
  return `${period.year}-${String(period.month).padStart(2, '0')}`
}

export function comparePeriods(a: Period, b: Period): number {
  return a.year !== b.year ? a.year - b.year : a.month - b.month
}

export function formatPeriod(period: Period): string {
  const label = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  return label.format(new Date(Date.UTC(period.year, period.month - 1, 1)))
}

export function isAllowedSourceUrl(url: URL): boolean {
  return url.protocol === 'https:' && ALLOWED_HOSTS.has(url.hostname.toLowerCase()) && url.username === '' && url.password === ''
}

/** Period from a link's file name, or null if it is not a monthly list. */
export function periodFromUrl(url: URL): Period | null {
  const match = FILE_RE.exec(url.pathname)
  if (match === null || match[1] === undefined || match[2] === undefined) {
    return null
  }
  const month = MONTHS[match[1].toLowerCase()]
  const year = Number(match[2])
  if (month === undefined || !Number.isInteger(year) || year < 2000 || year > 2100) {
    return null
  }
  return { year, month }
}

/**
 * Every monthly list linked from the listing HTML, newest first, one per
 * period. Relative links resolve against the listing URL.
 */
export function discoverFiles(html: string, baseUrl: string = LISTING_URL): DiscoveredFile[] {
  const byPeriod = new Map<string, DiscoveredFile>()
  const hrefRe = /href\s*=\s*["']([^"']+)["']/gi
  for (let match = hrefRe.exec(html); match !== null; match = hrefRe.exec(html)) {
    const raw = (match[1] ?? '').replace(/&amp;/g, '&').trim()
    let url: URL
    try {
      url = new URL(raw, baseUrl)
    } catch {
      continue
    }
    if (!isAllowedSourceUrl(url)) continue
    const period = periodFromUrl(url)
    if (period === null) continue
    const key = periodKey(period)
    if (!byPeriod.has(key)) {
      url.hash = ''
      byPeriod.set(key, { ...period, url: url.toString() })
    }
  }
  return [...byPeriod.values()].sort((a, b) => comparePeriods(b, a))
}
