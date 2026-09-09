/**
 * Shared types for the Search Intelligence scan pipeline.
 *
 * Phase 2b (docs/SEARCH_INTELLIGENCE_ARCHITECTURE.md §16-§18).
 *
 * The split matters: `PageObservation` is what a pure parse of one HTML
 * document yields, `PageSnapshot` is what a row of scan_page_snapshots reads
 * back as. Detectors only ever see snapshots — never HTML, never a fetch.
 */

/** Vizantir only. Phase 2 is single-tenant; no client_id anywhere (S8). */
export const SCAN_TENANCY = 'vizantir-only' as const

export type ScanFetchFailure =
  | 'not_configured'
  | 'network_error'
  | 'timeout'
  | 'invalid_response'

/**
 * A fetch that reached the origin is `ok: true` even when the status is 404 or
 * 500 — the status IS the observation. `ok: false` means we never got an
 * answer, which is a different fact and must not be recorded as a status.
 */
export type PageFetch =
  | {
      ok: true
      status: number
      /** Final URL when the request was redirected, else null. */
      redirectedTo: string | null
      /** Present only for a 2xx HTML response. */
      html: string | null
      fetchMs: number
    }
  | { ok: false; reason: ScanFetchFailure; fetchMs: number }

/** Pure output of parsing one HTML document. No I/O produced any of this. */
export type PageObservation = {
  title: string | null
  metaDescription: string | null
  h1: string | null
  canonical: string | null
  robotsNoindex: boolean
  wordCount: number
  schemaTypes: string[]
  internalLinks: number
}

/** One row of scan_page_snapshots, as detectors see it. */
export type PageSnapshot = {
  url: string
  capturedOn: string
  httpStatus: number | null
  redirectedTo: string | null
  title: string | null
  metaDescription: string | null
  h1: string | null
  canonical: string | null
  robotsNoindex: boolean
  wordCount: number | null
  schemaTypes: string[]
  internalLinks: number | null
  fetchMs: number | null
  errorReason: string | null
}

/** One row of scan_site_snapshots. */
export type SiteSnapshot = {
  capturedOn: string
  robotsStatus: number | null
  sitemapStatus: number | null
  sitemapUrlCount: number | null
  /** Populated in Phase 2d (GEO). Null throughout Phase 2b. */
  llmsTxtStatus: number | null
  /** Populated in Phase 2d (GEO). Null throughout Phase 2b. */
  llmsFullStatus: number | null
  /** Populated in Phase 2d (GEO). Null throughout Phase 2b. */
  llmsMissingUrls: number | null
  errorReason: string | null
}

/** What lib/scan/load.ts hands to DetectorInput. */
export type ScanWindow = {
  capturedOn: string
  pages: PageSnapshot[]
  site: SiteSnapshot
}

/**
 * A snapshot is usable by a detector only when the fetch actually reached the
 * origin. `errorReason` set means we have no observation of the page, which is
 * not the same as observing that the page is broken — invariant 4 applied to
 * scans.
 */
export function wasFetched(page: PageSnapshot): boolean {
  return page.errorReason === null && page.httpStatus !== null
}
