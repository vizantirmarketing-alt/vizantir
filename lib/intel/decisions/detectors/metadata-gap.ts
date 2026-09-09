import {
  emissionKeyFor,
  slugifyKey,
  type Detector,
  type DetectorInput,
  type Finding,
} from '@/lib/intel/decisions/types'
import { wasFetched, type PageSnapshot } from '@/lib/scan/types'

/**
 * Missing or duplicated on-page metadata. Architecture §18.1: deterministic
 * and directly actionable.
 *
 * Two shapes of finding:
 *   - per page   a missing title, meta description, or h1
 *   - per title  the same title text on more than one URL
 *
 * Scope rules, both of which prevent false positives rather than tune noise:
 *   - Only indexable, successfully served pages are considered. A 404 or a
 *     noindex page having no title is not a metadata defect; the 404 is the
 *     defect, and `sitemap-contradiction` already owns it.
 *   - A page we could not reach is skipped (invariant 4).
 */

const SCORE_MISSING_TITLE = 700
const SCORE_MISSING_DESCRIPTION = 500
const SCORE_MISSING_H1 = 450
const SCORE_DUPLICATE_TITLE = 600

function isIndexable(page: PageSnapshot): boolean {
  if (!wasFetched(page)) {
    return false
  }
  if (page.robotsNoindex) {
    return false
  }
  return page.httpStatus !== null && page.httpStatus >= 200 && page.httpStatus < 300
}

/**
 * Only pages that actually returned a document can be judged for metadata. A
 * 200 that served a PDF or an image has no title by nature, and the parser
 * records null across the board for it; `word_count === null` is the marker
 * that no HTML document was parsed.
 */
function hasDocument(page: PageSnapshot): boolean {
  return page.wordCount !== null
}

export const metadataGapDetector: Detector = {
  name: 'metadata-gap',
  needsScan: true,
  detect(input: DetectorInput): Finding[] {
    const scan = input.scan
    if (scan === undefined) {
      return []
    }

    const candidates = scan.pages.filter(
      (page) => isIndexable(page) && hasDocument(page),
    )

    const findings: Finding[] = []

    for (const page of candidates) {
      const missing: string[] = []
      if (page.title === null) {
        missing.push('title')
      }
      if (page.metaDescription === null) {
        missing.push('meta description')
      }
      if (page.h1 === null) {
        missing.push('h1')
      }
      if (missing.length === 0) {
        continue
      }

      const path = pathOf(page.url)
      const score =
        (page.title === null ? SCORE_MISSING_TITLE : 0) +
        (page.metaDescription === null ? SCORE_MISSING_DESCRIPTION : 0) +
        (page.h1 === null ? SCORE_MISSING_H1 : 0)

      findings.push({
        emissionKey: emissionKeyFor(
          `metadata-gap:${slugifyKey(path)}`,
          input.periodEnd,
        ),
        category: 'search_intelligence',
        title: `${path} is missing ${formatList(missing)}`,
        description:
          `The scan on ${scan.capturedOn} found ${page.url} serving 200 and indexable, ` +
          `with no ${formatList(missing)}. These are the fields Google uses to build a ` +
          `result for the page.`,
        evidence: {
          url: page.url,
          missing,
          title: page.title,
          metaDescription: page.metaDescription,
          h1: page.h1,
          capturedOn: scan.capturedOn,
        },
        relatedUrl: page.url,
        recommendedAction: `Add the missing ${formatList(
          missing,
        )} for this page. This does not establish that adding it would change rankings.`,
        confidence: 'high',
        score,
      })
    }

    findings.push(...duplicateTitleFindings(candidates, input, scan.capturedOn))

    return findings
  },
}

function duplicateTitleFindings(
  pages: readonly PageSnapshot[],
  input: DetectorInput,
  capturedOn: string,
): Finding[] {
  const byTitle = new Map<string, PageSnapshot[]>()
  for (const page of pages) {
    if (page.title === null) {
      continue
    }
    const key = page.title.toLowerCase()
    const bucket = byTitle.get(key)
    if (bucket) {
      bucket.push(page)
    } else {
      byTitle.set(key, [page])
    }
  }

  const findings: Finding[] = []

  for (const [key, group] of byTitle) {
    if (group.length < 2) {
      continue
    }
    const urls = group.map((page) => page.url).sort()
    const title = group[0]?.title ?? key

    findings.push({
      emissionKey: emissionKeyFor(
        `metadata-gap:duplicate-title:${slugifyKey(key)}`,
        input.periodEnd,
      ),
      category: 'search_intelligence',
      title: `${group.length} pages share the title “${title}”`,
      description:
        `The scan on ${capturedOn} found ${group.length} indexable URLs serving the same ` +
        `title. Identical titles give Google no way to tell the pages apart in a result list.`,
      evidence: { title, urls, pageCount: group.length, capturedOn },
      relatedUrl: urls[0],
      recommendedAction:
        'Give each page a title that describes that page specifically. This does not establish which page should rank for the shared term.',
      confidence: 'high',
      score: SCORE_DUPLICATE_TITLE * group.length,
    })
  }

  return findings
}

function formatList(values: readonly string[]): string {
  if (values.length <= 1) {
    return values[0] ?? ''
  }
  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`
  }
  return `${values.slice(0, -1).join(', ')}, and ${values[values.length - 1]}`
}

function pathOf(url: string): string {
  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}
