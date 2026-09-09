/**
 * Pure HTML → PageObservation. No I/O, no network, no imports with side
 * effects. Separately testable by construction.
 *
 * §17.2 flags this file as the one place in Phase 2 where a subtle bug yields
 * plausible-looking wrong findings rather than a visible failure, so the
 * limits are stated rather than left implicit.
 *
 * WHY NO HTML PARSER: jsdom is a devDependency used by one script and is not
 * in the production bundle; adding a parser to `dependencies` for this would
 * put a new package in every serverless function. The extractions below are
 * narrow and anchored, and the two detectors that actually fire in Phase 2b
 * (`sitemap-contradiction`, `metadata-gap`) depend only on the robust ones:
 * title, meta description, h1, canonical, robots. Word count and internal
 * link count are approximations — `thin-page` is dormant and nothing reads
 * `internal_links` yet. If Phase 2c's schema-drift needs stricter parsing,
 * that is the moment to reconsider, not this one.
 *
 * KNOWN LIMITS, all of which fail toward "no observation" rather than a wrong one:
 * - Attribute order is handled, but an attribute value containing an unescaped
 *   `>` will truncate that tag's match.
 * - Comments are stripped before extraction, so commented-out tags are ignored.
 * - <script>, <style>, <noscript>, <template> and <svg> are removed before word
 *   counting so their contents never inflate it.
 * - Word count is whitespace-delimited tokens of the remaining text. It is an
 *   approximation of prose length, not a content-quality measure.
 */

import type { PageObservation } from '@/lib/scan/types'

const NON_CONTENT_ELEMENTS = [
  'script',
  'style',
  'noscript',
  'template',
  'svg',
] as const

export function parseHtml(html: string, pageUrl: string): PageObservation {
  const withoutComments = html.replace(/<!--[\s\S]*?-->/g, ' ')

  return {
    title: extractTitle(withoutComments),
    metaDescription: extractMetaContent(withoutComments, 'description'),
    h1: extractFirstH1(withoutComments),
    canonical: extractCanonical(withoutComments),
    robotsNoindex: extractRobotsNoindex(withoutComments),
    wordCount: countWords(withoutComments),
    schemaTypes: extractSchemaTypes(withoutComments),
    internalLinks: countInternalLinks(withoutComments, pageUrl),
  }
}

function normalizeText(value: string): string {
  return decodeEntities(value).replace(/\s+/g, ' ').trim()
}

function emptyToNull(value: string): string | null {
  return value.length > 0 ? value : null
}

/** The five named entities that actually matter for the fields we extract. */
function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
}

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, ' ')
}

function extractTitle(html: string): string | null {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)
  if (match === null || match[1] === undefined) {
    return null
  }
  return emptyToNull(normalizeText(stripTags(match[1])))
}

function extractFirstH1(html: string): string | null {
  const match = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html)
  if (match === null || match[1] === undefined) {
    return null
  }
  return emptyToNull(normalizeText(stripTags(match[1])))
}

/** Reads an attribute out of a single tag string, quoted or unquoted. */
function attributeValue(tag: string, attribute: string): string | null {
  const quoted = new RegExp(`\\b${attribute}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i').exec(tag)
  if (quoted) {
    return quoted[2] ?? quoted[3] ?? null
  }
  const bare = new RegExp(`\\b${attribute}\\s*=\\s*([^\\s"'>]+)`, 'i').exec(tag)
  return bare?.[1] ?? null
}

function metaTags(html: string): string[] {
  return html.match(/<meta\b[^>]*>/gi) ?? []
}

function extractMetaContent(html: string, nameValue: string): string | null {
  for (const tag of metaTags(html)) {
    const name = attributeValue(tag, 'name')
    if (name === null || name.toLowerCase() !== nameValue) {
      continue
    }
    const content = attributeValue(tag, 'content')
    if (content === null) {
      continue
    }
    return emptyToNull(normalizeText(content))
  }
  return null
}

/**
 * True when a robots directive asks search engines not to index the page.
 * Checks both the generic `robots` meta and `googlebot`, since either alone
 * suppresses indexing in Google.
 */
function extractRobotsNoindex(html: string): boolean {
  for (const tag of metaTags(html)) {
    const name = attributeValue(tag, 'name')?.toLowerCase()
    if (name !== 'robots' && name !== 'googlebot') {
      continue
    }
    const content = attributeValue(tag, 'content')
    if (content === null) {
      continue
    }
    const directives = content.toLowerCase().split(',').map((part) => part.trim())
    if (directives.includes('noindex') || directives.includes('none')) {
      return true
    }
  }
  return false
}

function extractCanonical(html: string): string | null {
  const links = html.match(/<link\b[^>]*>/gi) ?? []
  for (const tag of links) {
    const rel = attributeValue(tag, 'rel')
    if (rel === null || rel.toLowerCase().trim() !== 'canonical') {
      continue
    }
    const href = attributeValue(tag, 'href')
    if (href === null) {
      continue
    }
    return emptyToNull(normalizeText(href))
  }
  return null
}

function removeNonContentElements(html: string): string {
  let output = html
  for (const element of NON_CONTENT_ELEMENTS) {
    output = output.replace(
      new RegExp(`<${element}\\b[^>]*>[\\s\\S]*?<\\/${element}>`, 'gi'),
      ' ',
    )
    // Self-closing or unterminated variants.
    output = output.replace(new RegExp(`<${element}\\b[^>]*\\/?>`, 'gi'), ' ')
  }
  return output
}

function countWords(html: string): number {
  const body = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(html)?.[1] ?? html
  const text = normalizeText(stripTags(removeNonContentElements(body)))
  if (text.length === 0) {
    return 0
  }
  return text.split(' ').filter((token) => token.length > 0).length
}

function scriptElements(html: string): string[] {
  return html.match(/<script\b[^>]*>[\s\S]*?<\/script>/gi) ?? []
}

/**
 * `@type` values from every `application/ld+json` block. A block may be a
 * single object, an array of objects, or an `@graph` wrapper — and `@type`
 * itself may be a string or an array (schema.org allows both; the site's
 * layout Organization block uses the array form). A block that does not
 * parse is skipped rather than failing the whole page: malformed JSON-LD is
 * evidence for a later detector, not a reason to drop the rest of the parse.
 *
 * Only the block's own `@type` and each `@graph` node's `@type` are
 * collected. Nested types (ListItem inside BreadcrumbList, Offer inside
 * Service) are not — those are properties of a valid parent, not a separate
 * rendered block.
 */
function extractSchemaTypes(html: string): string[] {
  const types = new Set<string>()

  for (const script of scriptElements(html)) {
    const openTag = /<script\b[^>]*>/i.exec(script)?.[0]
    if (openTag === undefined) {
      continue
    }
    const type = attributeValue(openTag, 'type')
    if (type === null || type.trim().toLowerCase() !== 'application/ld+json') {
      continue
    }
    const body = /<script\b[^>]*>([\s\S]*?)<\/script>/i.exec(script)?.[1]
    if (body === undefined) {
      continue
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(decodeEntities(body))
    } catch {
      continue
    }
    collectTypes(parsed, types)
  }

  return [...types].sort()
}

function collectTypes(value: unknown, into: Set<string>): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectTypes(item, into)
    }
    return
  }
  if (typeof value !== 'object' || value === null) {
    return
  }

  const type = Reflect.get(value, '@type')
  if (typeof type === 'string' && type.length > 0) {
    into.add(type)
  } else if (Array.isArray(type)) {
    for (const entry of type) {
      if (typeof entry === 'string' && entry.length > 0) {
        into.add(entry)
      }
    }
  }

  const graph = Reflect.get(value, '@graph')
  if (graph !== undefined) {
    collectTypes(graph, into)
  }
}

/**
 * Anchors resolving to the same host as the page. Fragment-only and
 * non-navigational schemes are excluded. Duplicates are counted once per
 * destination so a repeated nav link does not dominate the number.
 */
function countInternalLinks(html: string, pageUrl: string): number {
  let origin: string
  try {
    origin = new URL(pageUrl).origin
  } catch {
    return 0
  }

  const anchors = html.match(/<a\b[^>]*>/gi) ?? []
  const destinations = new Set<string>()

  for (const tag of anchors) {
    const href = attributeValue(tag, 'href')
    if (href === null) {
      continue
    }
    const trimmed = href.trim()
    if (trimmed.length === 0 || trimmed.startsWith('#')) {
      continue
    }
    if (/^(mailto:|tel:|javascript:|data:)/i.test(trimmed)) {
      continue
    }
    try {
      const resolved = new URL(decodeEntities(trimmed), pageUrl)
      if (resolved.origin !== origin) {
        continue
      }
      resolved.hash = ''
      destinations.add(resolved.toString())
    } catch {
      continue
    }
  }

  return destinations.size
}
