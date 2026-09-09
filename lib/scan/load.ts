import 'server-only'

import { isIsoDate } from '@/lib/intel/search-params'
import type { PageSnapshot, ScanWindow, SiteSnapshot } from '@/lib/scan/types'
import { createSupabaseServiceRole } from '@/lib/supabase/service'

/**
 * Reads the latest scan into the shape detectors consume. Mirrors
 * decisions/grouping.ts: pure parsing of DB rows, paged, failing closed rather
 * than returning a truncated set (§5.4).
 *
 * Detectors never see HTML or make a fetch. This is the only bridge between
 * the I/O half of the pipeline and the pure half (§16).
 */

const PAGE_SIZE = 1000
const PAGE_CAP = 80

const PAGE_COLUMNS = [
  'url',
  'captured_on',
  'http_status',
  'redirected_to',
  'title',
  'meta_description',
  'h1',
  'canonical',
  'robots_noindex',
  'word_count',
  'schema_types',
  'internal_links',
  'fetch_ms',
  'error_reason',
].join(', ')

const SITE_COLUMNS = [
  'captured_on',
  'robots_status',
  'sitemap_status',
  'sitemap_url_count',
  'llms_txt_status',
  'llms_full_status',
  'llms_missing_urls',
  'error_reason',
].join(', ')

type ServiceClient = ReturnType<typeof createSupabaseServiceRole>

function readField(value: object, key: string): unknown {
  return Reflect.get(value, key)
}

function asNullableInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value)
  }
  if (typeof value === 'string' && /^-?\d+$/.test(value)) {
    return Number(value)
  }
  return null
}

function asNullableText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter((item): item is string => typeof item === 'string')
}

function toPageSnapshot(value: unknown): PageSnapshot | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const url = readField(value, 'url')
  const capturedOn = readField(value, 'captured_on')
  if (typeof url !== 'string' || url.length === 0) {
    return null
  }
  if (typeof capturedOn !== 'string' || !isIsoDate(capturedOn)) {
    return null
  }

  return {
    url,
    capturedOn,
    httpStatus: asNullableInt(readField(value, 'http_status')),
    redirectedTo: asNullableText(readField(value, 'redirected_to')),
    title: asNullableText(readField(value, 'title')),
    metaDescription: asNullableText(readField(value, 'meta_description')),
    h1: asNullableText(readField(value, 'h1')),
    canonical: asNullableText(readField(value, 'canonical')),
    robotsNoindex: readField(value, 'robots_noindex') === true,
    wordCount: asNullableInt(readField(value, 'word_count')),
    schemaTypes: asStringArray(readField(value, 'schema_types')),
    internalLinks: asNullableInt(readField(value, 'internal_links')),
    fetchMs: asNullableInt(readField(value, 'fetch_ms')),
    errorReason: asNullableText(readField(value, 'error_reason')),
  }
}

function toSiteSnapshot(value: unknown): SiteSnapshot | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }
  const capturedOn = readField(value, 'captured_on')
  if (typeof capturedOn !== 'string' || !isIsoDate(capturedOn)) {
    return null
  }

  return {
    capturedOn,
    robotsStatus: asNullableInt(readField(value, 'robots_status')),
    sitemapStatus: asNullableInt(readField(value, 'sitemap_status')),
    sitemapUrlCount: asNullableInt(readField(value, 'sitemap_url_count')),
    llmsTxtStatus: asNullableInt(readField(value, 'llms_txt_status')),
    llmsFullStatus: asNullableInt(readField(value, 'llms_full_status')),
    llmsMissingUrls: asNullableInt(readField(value, 'llms_missing_urls')),
    errorReason: asNullableText(readField(value, 'error_reason')),
  }
}

async function fetchLatestSiteSnapshot(
  supabase: ServiceClient,
): Promise<SiteSnapshot | null | 'error'> {
  const { data, error } = await supabase
    .from('scan_site_snapshots')
    .select(SITE_COLUMNS)
    .order('captured_on', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return 'error'
  }
  if (data === null) {
    return null
  }
  return toSiteSnapshot(data) ?? 'error'
}

async function fetchPagesForDate(
  supabase: ServiceClient,
  capturedOn: string,
): Promise<PageSnapshot[] | null> {
  const pages: PageSnapshot[] = []

  for (let page = 0; page < PAGE_CAP; page += 1) {
    const from = page * PAGE_SIZE
    const { data, error } = await supabase
      .from('scan_page_snapshots')
      .select(PAGE_COLUMNS)
      .eq('captured_on', capturedOn)
      .order('url', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error || !Array.isArray(data)) {
      return null
    }

    for (const row of data) {
      const parsed = toPageSnapshot(row)
      if (parsed) {
        pages.push(parsed)
      }
    }

    if (data.length < PAGE_SIZE) {
      return pages
    }
  }

  return null
}

/**
 * The most recent scan, or null when none exists. Null is the normal state
 * before the first scan runs and is not an error — `run.ts` sets
 * scanAvailable false and skips needsScan detectors, exactly as it does for
 * comparison availability.
 *
 * Returns 'error' only when a query failed, so a genuine failure is never
 * silently rendered as "no scan yet".
 */
export async function loadLatestScan(): Promise<ScanWindow | null | 'error'> {
  try {
    const supabase = createSupabaseServiceRole()

    const site = await fetchLatestSiteSnapshot(supabase)
    if (site === 'error') {
      return 'error'
    }
    if (site === null) {
      return null
    }

    const pages = await fetchPagesForDate(supabase, site.capturedOn)
    if (pages === null) {
      return 'error'
    }

    return { capturedOn: site.capturedOn, pages, site }
  } catch {
    return 'error'
  }
}
