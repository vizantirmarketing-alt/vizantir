import 'server-only'

/**
 * The URL list to scan, read from the site's own /sitemap.xml over HTTP.
 *
 * §17.2: fetched rather than imported from app/sitemap.ts, for two reasons.
 * It exercises the same artifact Google consumes, so a broken sitemap is
 * itself observable; and importing would pull Sanity fetching into the scan.
 *
 * SINGLE-TENANT BY CONSTRUCTION (S8). The origin comes from
 * NEXT_PUBLIC_SITE_URL and nothing else. There is no client lookup, no
 * client_id, and no way to point this at a client property. Phase 2 scans
 * Vizantir only.
 */

const SITEMAP_URL_CAP = 2000
const REQUEST_TIMEOUT_MS = 15_000

export type ScanTarget = {
  origin: string
  sitemapUrl: string
  robotsUrl: string
}

export type FrontierResult =
  | {
      ok: true
      sitemapStatus: number
      urls: string[]
    }
  | { ok: false; reason: 'not_configured' | 'fetch_failed' | 'unparseable'; sitemapStatus: number | null }

/**
 * Fails closed when NEXT_PUBLIC_SITE_URL is unset rather than falling back to
 * VERCEL_URL — the same rule lib/reports/pdf.ts follows, and for the same
 * reason: the deployment host sits behind Vercel deployment protection and
 * would scan an SSO login page instead of the site.
 */
export function resolveScanTarget(): ScanTarget | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL
  if (!raw || raw.trim().length === 0) {
    return null
  }

  let origin: string
  try {
    origin = new URL(raw.trim()).origin
  } catch {
    return null
  }

  return {
    origin,
    sitemapUrl: `${origin}/sitemap.xml`,
    robotsUrl: `${origin}/robots.txt`,
  }
}

export async function loadFrontier(target: ScanTarget): Promise<FrontierResult> {
  let response: Response
  try {
    response = await fetch(target.sitemapUrl, {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch {
    return { ok: false, reason: 'fetch_failed', sitemapStatus: null }
  }

  if (!response.ok) {
    return { ok: false, reason: 'fetch_failed', sitemapStatus: response.status }
  }

  let xml: string
  try {
    xml = await response.text()
  } catch {
    return { ok: false, reason: 'unparseable', sitemapStatus: response.status }
  }

  const urls = parseSitemapUrls(xml, target.origin)
  if (urls === null) {
    return { ok: false, reason: 'unparseable', sitemapStatus: response.status }
  }

  return { ok: true, sitemapStatus: response.status, urls }
}

/**
 * <loc> entries, de-duplicated, restricted to the scan origin.
 *
 * Off-origin entries are dropped rather than scanned: this job fetches its own
 * site, and following a foreign URL out of a sitemap would turn an internal
 * scan into an outbound crawler.
 *
 * Returns null only when the document contains no <loc> at all, which is
 * indistinguishable from a non-sitemap response and should be reported as
 * unparseable rather than as an empty site.
 */
export function parseSitemapUrls(xml: string, origin: string): string[] | null {
  const matches = xml.match(/<loc>\s*([\s\S]*?)\s*<\/loc>/gi)
  if (matches === null || matches.length === 0) {
    return null
  }

  const seen = new Set<string>()
  for (const match of matches) {
    const inner = /<loc>\s*([\s\S]*?)\s*<\/loc>/i.exec(match)?.[1]
    if (inner === undefined) {
      continue
    }
    const decoded = inner
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')
      .trim()
    if (decoded.length === 0) {
      continue
    }
    try {
      const url = new URL(decoded)
      if (url.origin !== origin) {
        continue
      }
      url.hash = ''
      seen.add(url.toString())
    } catch {
      continue
    }
    if (seen.size >= SITEMAP_URL_CAP) {
      break
    }
  }

  return [...seen]
}
