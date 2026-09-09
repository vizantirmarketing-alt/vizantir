import {
  emissionKeyFor,
  slugifyKey,
  type Detector,
  type DetectorInput,
  type Finding,
} from '@/lib/intel/decisions/types'
import { wasFetched, type PageSnapshot } from '@/lib/scan/types'

/**
 * A URL the sitemap advertises that the site then refuses to serve.
 *
 * Architecture §18.1 calls this the highest-value detector in Phase 2:
 * unambiguous, cheap, and aimed at a sitemap that is hand-maintained in
 * app/sitemap.ts in a way that invites drift.
 *
 * Every scanned URL came from /sitemap.xml (the frontier IS the sitemap), so
 * membership needs no separate flag.
 *
 * Fires on three distinct contradictions, each a different defect:
 *   - non-200        the sitemap points at something that does not resolve
 *   - redirect       the sitemap points at a URL that is not the destination
 *   - noindex        the sitemap asks Google to crawl a page marked do-not-index
 *
 * A page we could not reach at all (`error_reason` set) is NOT a finding.
 * That is an absent observation, not an observed defect — invariant 4. A
 * genuinely down site would otherwise emit a finding per URL on the strength
 * of our own network failure.
 */

const SCORE_NON_200 = 1000
const SCORE_NOINDEX = 800
const SCORE_REDIRECT = 400

type Contradiction = {
  kind: 'non_200' | 'noindex' | 'redirect'
  score: number
  summary: string
  action: string
}

function classify(page: PageSnapshot): Contradiction | null {
  if (page.httpStatus !== null && page.httpStatus >= 400) {
    return {
      kind: 'non_200',
      score: SCORE_NON_200,
      summary: `returns HTTP ${page.httpStatus}`,
      action:
        'Either restore the page or remove the URL from the sitemap. A sitemap entry that does not resolve wastes crawl budget and is a signal of neglect.',
    }
  }

  if (page.robotsNoindex) {
    return {
      kind: 'noindex',
      score: SCORE_NOINDEX,
      summary: 'is marked noindex',
      action:
        'The sitemap asks Google to crawl this URL while the page asks not to be indexed. Decide which is intended and change the other.',
    }
  }

  if (page.redirectedTo !== null) {
    return {
      kind: 'redirect',
      score: SCORE_REDIRECT,
      summary: `redirects to ${page.redirectedTo}`,
      action:
        'Point the sitemap at the destination URL directly. Listing a redirecting URL sends crawlers through an extra hop for every visit.',
    }
  }

  return null
}

export const sitemapContradictionDetector: Detector = {
  name: 'sitemap-contradiction',
  needsScan: true,
  detect(input: DetectorInput): Finding[] {
    const scan = input.scan
    if (scan === undefined) {
      return []
    }

    const findings: Finding[] = []

    for (const page of scan.pages) {
      if (!wasFetched(page)) {
        continue
      }

      const contradiction = classify(page)
      if (contradiction === null) {
        continue
      }

      const path = pathOf(page.url)

      findings.push({
        emissionKey: emissionKeyFor(
          `sitemap-contradiction:${slugifyKey(path)}`,
          input.periodEnd,
        ),
        category: 'search_intelligence',
        title: `${path} is in the sitemap but ${contradiction.summary}`,
        description:
          `The sitemap lists ${page.url}, and the scan on ${scan.capturedOn} found that it ` +
          `${contradiction.summary}. The site is advertising a URL it does not serve as listed.`,
        evidence: {
          url: page.url,
          contradiction: contradiction.kind,
          httpStatus: page.httpStatus,
          redirectedTo: page.redirectedTo,
          robotsNoindex: page.robotsNoindex,
          capturedOn: scan.capturedOn,
        },
        relatedUrl: page.url,
        recommendedAction: contradiction.action,
        confidence: 'high',
        score: contradiction.score,
      })
    }

    return findings
  },
}

function pathOf(url: string): string {
  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}
