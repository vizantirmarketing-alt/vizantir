import 'server-only'

import type { PageFetch } from '@/lib/scan/types'

/**
 * One page fetch. Mirrors lib/gsc/client.ts: closed failure union, never
 * throws, every caller pattern-matches.
 *
 * A non-2xx is `ok: true` with that status — the status is the observation
 * `sitemap-contradiction` exists to read. Only a fetch that never reached the
 * origin is `ok: false`.
 */

const REQUEST_TIMEOUT_MS = 15_000

/** Vercel functions cap at 300s; a single slow page must not consume it. */
const MAX_HTML_BYTES = 5_000_000

const USER_AGENT =
  'VizantirIntelScan/1.0 (+https://www.vizantir.com; internal SEO scan)'

export async function fetchPage(url: string): Promise<PageFetch> {
  const startedAt = Date.now()

  let response: Response
  try {
    response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (error) {
    const reason =
      error instanceof Error && error.name === 'TimeoutError'
        ? 'timeout'
        : 'network_error'
    return { ok: false, reason, fetchMs: Date.now() - startedAt }
  }

  const redirectedTo = resolveRedirect(url, response.url)

  if (!response.ok) {
    // Body is irrelevant for a non-2xx and may be large; do not read it.
    return {
      ok: true,
      status: response.status,
      redirectedTo,
      html: null,
      fetchMs: Date.now() - startedAt,
    }
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('html')) {
    return {
      ok: true,
      status: response.status,
      redirectedTo,
      html: null,
      fetchMs: Date.now() - startedAt,
    }
  }

  let html: string
  try {
    html = await response.text()
  } catch {
    return {
      ok: false,
      reason: 'invalid_response',
      fetchMs: Date.now() - startedAt,
    }
  }

  if (html.length > MAX_HTML_BYTES) {
    html = html.slice(0, MAX_HTML_BYTES)
  }

  return {
    ok: true,
    status: response.status,
    redirectedTo,
    html,
    fetchMs: Date.now() - startedAt,
  }
}

/**
 * `response.url` is the final URL after redirects. Compared with the requested
 * URL normalised, so a bare trailing-slash difference is not reported as a
 * redirect the operator has to act on.
 */
function resolveRedirect(requested: string, finalUrl: string): string | null {
  if (finalUrl.length === 0) {
    return null
  }
  if (normalizeForCompare(requested) === normalizeForCompare(finalUrl)) {
    return null
  }
  return finalUrl
}

function normalizeForCompare(value: string): string {
  try {
    const url = new URL(value)
    url.hash = ''
    const path = url.pathname.replace(/\/+$/, '')
    return `${url.protocol}//${url.host}${path}${url.search}`
  } catch {
    return value
  }
}

/** Status-only probe for robots.txt and sitemap.xml. */
export async function fetchStatus(url: string): Promise<number | null> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store',
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    return response.status
  } catch {
    return null
  }
}
