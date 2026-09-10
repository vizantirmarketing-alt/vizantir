import 'server-only'

import { fetchPage, fetchStatus, fetchText } from '@/lib/scan/fetch'
import { loadFrontier, resolveScanTarget, type ScanTarget } from '@/lib/scan/frontier'
import { parseLlmsFullUrls, sitemapUrlsMissingFromLlms } from '@/lib/scan/llms'
import { parseHtml } from '@/lib/scan/parse'
import { utcToday } from '@/lib/intel/search-params'
import { createSupabaseServiceRole } from '@/lib/supabase/service'

/**
 * Scan orchestration. Mirrors lib/gsc/sync.ts: opens a sync_runs row, does the
 * I/O, upserts in chunks, closes the run with success / partial / failed and a
 * typed administrator_message.
 *
 * Phase 2b (§17.2, §17.3, §17.6). Vizantir only — the target comes from
 * NEXT_PUBLIC_SITE_URL via resolveScanTarget and there is no client path.
 */

const UPSERT_CHUNK_SIZE = 200

/** §17.3: bounded, not sequential and not unbounded. This is the site fetching itself. */
const FETCH_CONCURRENCY = 5

/** S10 / §17.6. Applies to raw page snapshots ONLY. */
export const SCAN_SNAPSHOT_RETENTION_DAYS = 180

const PAGE_CONFLICT = 'url,captured_on'
const SITE_CONFLICT = 'captured_on'

const ADMINISTRATOR_MESSAGE_MAX = 500

export type SyncScanResult = {
  status: 'success' | 'partial' | 'failed'
  recordsProcessed: number
  pagesFetched: number
  pagesFailed: number
  prunedSnapshots: number | null
  message?: string
}

type ServiceClient = ReturnType<typeof createSupabaseServiceRole>

type PageRow = {
  captured_on: string
  url: string
  http_status: number | null
  redirected_to: string | null
  title: string | null
  meta_description: string | null
  h1: string | null
  canonical: string | null
  robots_noindex: boolean
  word_count: number | null
  schema_types: string[]
  internal_links: number | null
  fetch_ms: number | null
  error_reason: string | null
}

export async function syncScan(): Promise<SyncScanResult> {
  let runId: number | null = null
  const capturedOn = utcToday()

  try {
    const supabase = createSupabaseServiceRole()

    const inserted = await supabase
      .from('sync_runs')
      .insert({ provider: 'scan', status: 'running' })
      .select('id')
      .single()

    runId = readNumericId(inserted.data)
    if (inserted.error || runId === null) {
      return {
        status: 'failed',
        recordsProcessed: 0,
        pagesFetched: 0,
        pagesFailed: 0,
        prunedSnapshots: null,
        message: 'Failed to record sync run',
      }
    }

    const target = resolveScanTarget()
    if (target === null) {
      const message = 'NEXT_PUBLIC_SITE_URL is not set; scan target is unresolved'
      await finishRun(supabase, runId, {
        status: 'failed',
        recordsProcessed: 0,
        capturedOn,
        message,
      })
      return {
        status: 'failed',
        recordsProcessed: 0,
        pagesFetched: 0,
        pagesFailed: 0,
        prunedSnapshots: null,
        message,
      }
    }

    const frontier = await loadFrontier(target)
    if (!frontier.ok) {
      const message = `Sitemap unavailable (${frontier.reason}${
        frontier.sitemapStatus === null ? '' : ` ${frontier.sitemapStatus}`
      })`
      const llms = await observeLlms(target, null)
      await writeSiteSnapshot(supabase, {
        captured_on: capturedOn,
        robots_status: await fetchStatus(target.robotsUrl),
        sitemap_status: frontier.sitemapStatus,
        sitemap_url_count: null,
        llms_txt_status: llms.txtStatus,
        llms_full_status: llms.fullStatus,
        llms_missing_urls: null,
        error_reason: frontier.reason,
      })
      await finishRun(supabase, runId, {
        status: 'failed',
        recordsProcessed: 0,
        capturedOn,
        message,
      })
      return {
        status: 'failed',
        recordsProcessed: 0,
        pagesFetched: 0,
        pagesFailed: 0,
        prunedSnapshots: null,
        message,
      }
    }

    const [robotsStatus, llms] = await Promise.all([
      fetchStatus(target.robotsUrl),
      observeLlms(target, frontier.urls),
    ])

    const rows = await scanPages(target, frontier.urls, capturedOn)
    const pagesFailed = rows.filter((row) => row.error_reason !== null).length
    const pagesFetched = rows.length - pagesFailed

    const siteWritten = await writeSiteSnapshot(supabase, {
      captured_on: capturedOn,
      robots_status: robotsStatus,
      sitemap_status: frontier.sitemapStatus,
      sitemap_url_count: frontier.urls.length,
      llms_txt_status: llms.txtStatus,
      llms_full_status: llms.fullStatus,
      llms_missing_urls: llms.missingCount,
      error_reason: null,
    })

    const pagesWritten = await upsertPageRows(supabase, rows)

    if (!pagesWritten) {
      const message = 'Failed to persist page snapshots'
      await finishRun(supabase, runId, {
        status: 'failed',
        recordsProcessed: 0,
        capturedOn,
        message,
      })
      return {
        status: 'failed',
        recordsProcessed: 0,
        pagesFetched,
        pagesFailed,
        prunedSnapshots: null,
        message,
      }
    }

    // §17.6: prune only after a successful scan. A failed scan wrote no rows,
    // so pruning then would delete history while adding none.
    const prunedSnapshots = await pruneExpiredSnapshots(supabase)

    const problems: string[] = []
    if (!siteWritten) {
      problems.push('site snapshot upsert failed')
    }
    if (pagesFailed > 0) {
      problems.push(`${pagesFailed} of ${rows.length} pages unreachable`)
    }
    if (prunedSnapshots === null) {
      problems.push('retention prune failed')
    }

    // A prune failure is a nuisance, not a failed scan: the data is written.
    // Unreachable pages are recorded as observations, so the run is partial
    // rather than failed unless nothing at all was fetched.
    const status: SyncScanResult['status'] =
      rows.length > 0 && pagesFetched === 0
        ? 'failed'
        : problems.length > 0
          ? 'partial'
          : 'success'

    const message =
      problems.length > 0
        ? truncate(problems.join('; '), ADMINISTRATOR_MESSAGE_MAX)
        : undefined

    await finishRun(supabase, runId, {
      status,
      recordsProcessed: rows.length,
      capturedOn,
      message,
    })

    return {
      status,
      recordsProcessed: rows.length,
      pagesFetched,
      pagesFailed,
      prunedSnapshots,
      message,
    }
  } catch {
    if (runId !== null) {
      try {
        const supabase = createSupabaseServiceRole()
        await finishRun(supabase, runId, {
          status: 'failed',
          recordsProcessed: 0,
          capturedOn,
          message: 'Scan failed',
        })
      } catch {
        // Swallow so the function never throws.
      }
    }
    return {
      status: 'failed',
      recordsProcessed: 0,
      pagesFetched: 0,
      pagesFailed: 0,
      prunedSnapshots: null,
      message: 'Scan failed',
    }
  }
}

type LlmsObservation = {
  txtStatus: number | null
  fullStatus: number | null
  missingCount: number | null
}

/**
 * Status of both llms files, plus the sitemap-vs-llms-full diff when the
 * full file returned 200 and the sitemap URL list is in hand. Null count
 * means the diff was not measured — not that zero URLs are missing.
 */
async function observeLlms(
  target: ScanTarget,
  sitemapUrls: readonly string[] | null,
): Promise<LlmsObservation> {
  const [txtStatus, full] = await Promise.all([
    fetchStatus(target.llmsTxtUrl),
    fetchText(target.llmsFullUrl),
  ])

  const fullStatus = full.ok ? full.status : null

  if (
    sitemapUrls === null ||
    !full.ok ||
    full.status !== 200 ||
    full.body === null
  ) {
    return {
      txtStatus,
      fullStatus,
      missingCount: null,
    }
  }

  const llmsUrls = parseLlmsFullUrls(full.body, target.origin)
  const missingUrls = sitemapUrlsMissingFromLlms(sitemapUrls, llmsUrls)
  return {
    txtStatus,
    fullStatus,
    missingCount: missingUrls.length,
  }
}

/** Bounded worker pool. Order of results is irrelevant; each row is keyed by url. */
async function scanPages(
  target: ScanTarget,
  urls: readonly string[],
  capturedOn: string,
): Promise<PageRow[]> {
  const rows: PageRow[] = []
  let cursor = 0

  async function worker(): Promise<void> {
    for (;;) {
      const index = cursor
      cursor += 1
      const url = urls[index]
      if (url === undefined) {
        return
      }
      rows.push(await scanOnePage(url, capturedOn))
    }
  }

  const workers = Array.from(
    { length: Math.min(FETCH_CONCURRENCY, Math.max(urls.length, 1)) },
    () => worker(),
  )
  await Promise.all(workers)

  return rows
}

async function scanOnePage(url: string, capturedOn: string): Promise<PageRow> {
  const result = await fetchPage(url)

  if (!result.ok) {
    return {
      captured_on: capturedOn,
      url,
      http_status: null,
      redirected_to: null,
      title: null,
      meta_description: null,
      h1: null,
      canonical: null,
      robots_noindex: false,
      word_count: null,
      schema_types: [],
      internal_links: null,
      fetch_ms: result.fetchMs,
      error_reason: result.reason,
    }
  }

  if (result.html === null) {
    // Reached the origin, but there is no document to parse — a non-2xx or a
    // non-HTML response. The status is the observation; the rest stays null so
    // "not measured" is never confused with "measured as empty" (invariant 4).
    return {
      captured_on: capturedOn,
      url,
      http_status: result.status,
      redirected_to: result.redirectedTo,
      title: null,
      meta_description: null,
      h1: null,
      canonical: null,
      robots_noindex: false,
      word_count: null,
      schema_types: [],
      internal_links: null,
      fetch_ms: result.fetchMs,
      error_reason: null,
    }
  }

  const observation = parseHtml(result.html, url)

  return {
    captured_on: capturedOn,
    url,
    http_status: result.status,
    redirected_to: result.redirectedTo,
    title: observation.title,
    meta_description: observation.metaDescription,
    h1: observation.h1,
    canonical: observation.canonical,
    robots_noindex: observation.robotsNoindex,
    word_count: observation.wordCount,
    schema_types: observation.schemaTypes,
    internal_links: observation.internalLinks,
    fetch_ms: result.fetchMs,
    error_reason: null,
  }
}

async function upsertPageRows(
  supabase: ServiceClient,
  rows: readonly PageRow[],
): Promise<boolean> {
  for (let index = 0; index < rows.length; index += UPSERT_CHUNK_SIZE) {
    const chunk = rows.slice(index, index + UPSERT_CHUNK_SIZE)
    const { error } = await supabase
      .from('scan_page_snapshots')
      .upsert(chunk, { onConflict: PAGE_CONFLICT })
    if (error) {
      return false
    }
  }
  return true
}

async function writeSiteSnapshot(
  supabase: ServiceClient,
  row: Record<string, unknown>,
): Promise<boolean> {
  const { error } = await supabase
    .from('scan_site_snapshots')
    .upsert(row, { onConflict: SITE_CONFLICT })
  return !error
}

/**
 * S10 / §17.6. Raw page snapshots only. decision_items, finding_state and
 * resolution history are never pruned (invariant 14) — they are the record of
 * what was observed and what was decided about it, and are not re-derivable.
 *
 * Returns the number of rows removed, or null if the prune itself failed. A
 * null must not fail the run: the scan succeeded and the data is written.
 */
async function pruneExpiredSnapshots(
  supabase: ServiceClient,
): Promise<number | null> {
  const cutoff = addUtcDays(utcToday(), -SCAN_SNAPSHOT_RETENTION_DAYS)
  const { error, count } = await supabase
    .from('scan_page_snapshots')
    .delete({ count: 'exact' })
    .lt('captured_on', cutoff)

  if (error) {
    return null
  }
  return count ?? 0
}

async function finishRun(
  supabase: ServiceClient,
  runId: number,
  result: {
    status: SyncScanResult['status']
    recordsProcessed: number
    capturedOn: string
    message?: string
  },
): Promise<void> {
  await supabase
    .from('sync_runs')
    .update({
      status: result.status,
      completed_at: new Date().toISOString(),
      records_processed: result.recordsProcessed,
      data_through_date: result.capturedOn,
      administrator_message: result.message ?? null,
      error_code: result.status === 'success' ? null : result.status,
    })
    .eq('id', runId)
}

function addUtcDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : value.slice(0, max)
}

function readNumericId(value: unknown): number | null {
  if (typeof value !== 'object' || value === null || !('id' in value)) {
    return null
  }
  const id = value.id
  if (typeof id === 'number' && Number.isFinite(id)) {
    return id
  }
  if (typeof id === 'string' && /^\d+$/.test(id)) {
    return Number(id)
  }
  return null
}
