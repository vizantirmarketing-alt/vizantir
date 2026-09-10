/**
 * Pure llms-full.txt URL extraction and sitemap diff. No I/O.
 *
 * The scan already holds the sitemap URL list in memory (frontier.urls).
 * This module turns the llms-full.txt body into a comparable set and
 * returns the sitemap URLs that do not appear in it.
 *
 * Mentions in the live file are scheme-less host paths (`vizantir.com/about`)
 * rather than absolute URLs. Comparison is by host (www-insensitive) and
 * pathname (trailing-slash-insensitive), so those forms match the sitemap.
 */

const TRAILING_PUNCTUATION = /[.,;:!?)]+$/

export function parseLlmsFullUrls(text: string, origin: string): string[] {
  let originUrl: URL
  try {
    originUrl = new URL(origin)
  } catch {
    return []
  }

  const hostname = originUrl.hostname.replace(/^www\./i, '').toLowerCase()
  const found = new Set<string>()

  collectMarkdownHrefs(text, originUrl, hostname, found)
  collectSchemeUrls(text, hostname, found)
  collectHostPaths(text, originUrl, hostname, found)

  return [...found]
}

/**
 * Sitemap URLs with no matching mention in the llms-full URL set.
 * Returned in sitemap order, de-duplicated by compare key.
 */
export function sitemapUrlsMissingFromLlms(
  sitemapUrls: readonly string[],
  llmsUrls: readonly string[],
): string[] {
  const present = new Set<string>()
  for (const url of llmsUrls) {
    const key = compareKey(url)
    if (key !== null) {
      present.add(key)
    }
  }

  const missing: string[] = []
  const seen = new Set<string>()
  for (const url of sitemapUrls) {
    const key = compareKey(url)
    if (key === null || present.has(key) || seen.has(key)) {
      continue
    }
    seen.add(key)
    missing.push(url)
  }
  return missing
}

export function compareKey(url: string): string | null {
  const parsed = parseAsUrl(url.includes('://') ? url : `https://${url}`)
  if (parsed === null) {
    return null
  }
  const host = parsed.hostname.replace(/^www\./i, '').toLowerCase()
  let path = parsed.pathname
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1)
  }
  return `${host}${path}${parsed.search}`
}

function collectMarkdownHrefs(
  text: string,
  originUrl: URL,
  hostname: string,
  into: Set<string>,
): void {
  const matches = text.matchAll(/\[[^\]]*]\(([^)]+)\)/g)
  for (const match of matches) {
    const href = match[1]
    if (href === undefined) {
      continue
    }
    addIfSiteUrl(href.trim(), originUrl, hostname, into)
  }
}

function collectSchemeUrls(text: string, hostname: string, into: Set<string>): void {
  const matches = text.matchAll(/https?:\/\/[^\s)<>"']+/gi)
  for (const match of matches) {
    const raw = stripTrailingPunctuation(match[0] ?? '')
    const parsed = parseAsUrl(raw)
    if (parsed === null || !hostMatches(parsed.hostname, hostname)) {
      continue
    }
    parsed.hash = ''
    into.add(parsed.toString())
  }
}

function collectHostPaths(
  text: string,
  originUrl: URL,
  hostname: string,
  into: Set<string>,
): void {
  const escaped = hostname.replace(/\./g, '\\.')
  const pattern = new RegExp(
    `(^|[^\\w@])((?:www\\.)?${escaped}(?![\\w@])(?:/[^\\s)<>"'\\]]*)?)`,
    'gi',
  )
  const matches = text.matchAll(pattern)
  for (const match of matches) {
    const raw = stripTrailingPunctuation(match[2] ?? '')
    addIfSiteUrl(raw, originUrl, hostname, into)
  }
}

function addIfSiteUrl(
  raw: string,
  originUrl: URL,
  hostname: string,
  into: Set<string>,
): void {
  if (raw.length === 0) {
    return
  }
  const parsed = parseAsUrl(raw.includes('://') ? raw : `https://${raw}`)
  if (parsed === null || !hostMatches(parsed.hostname, hostname)) {
    return
  }
  const resolved = new URL(parsed.pathname + parsed.search, originUrl)
  resolved.hash = ''
  into.add(resolved.toString())
}

function hostMatches(candidate: string, hostname: string): boolean {
  const host = candidate.replace(/^www\./i, '').toLowerCase()
  return host === hostname
}

function parseAsUrl(value: string): URL | null {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

function stripTrailingPunctuation(value: string): string {
  return value.replace(TRAILING_PUNCTUATION, '')
}
