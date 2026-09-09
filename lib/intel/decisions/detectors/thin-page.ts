import {
  emissionKeyFor,
  slugifyKey,
  type Detector,
  type DetectorInput,
  type Finding,
} from '@/lib/intel/decisions/types'
import { wasFetched, type PageSnapshot } from '@/lib/scan/types'

/**
 * Indexable pages whose word count falls below a threshold.
 *
 * DORMANT BY DESIGN. `THIN_PAGE_WORD_THRESHOLD` is null, and while it is null
 * this detector emits nothing.
 *
 * Every other detector in this codebase fires on a stated numeric threshold
 * that can be argued about — impressions >= 100, position > 40, CTR < 0.5%.
 * §18.1 calls thin-page "noisier than the other two" and the only one needing
 * a threshold decision, and §20.2 records that the number is a judgment call
 * about Vizantir's own content. Guessing it would mean shipping a detector
 * calibrated against nothing, which is exactly the noise §6 is built to avoid.
 *
 * TO ENABLE: run a scan, read the actual word-count distribution across the
 * sitemap URLs, choose a threshold from that data, and set the constant. The
 * detector needs no other change — it is wired into DETECTORS and the registry
 * already, so enabling it is a one-line edit.
 *
 * Word count is an approximation (see lib/scan/parse.ts). That is another
 * reason to calibrate against observed values rather than an external
 * convention: the number this detector compares against is the number this
 * parser produces, not a canonical word count.
 */

/** Set to a number to enable. See the note above before choosing one. */
export const THIN_PAGE_WORD_THRESHOLD: number | null = null

const SCORE_SCALE = 300

function isIndexable(page: PageSnapshot): boolean {
  if (!wasFetched(page) || page.robotsNoindex) {
    return false
  }
  return page.httpStatus !== null && page.httpStatus >= 200 && page.httpStatus < 300
}

export const thinPageDetector: Detector = {
  name: 'thin-page',
  needsScan: true,
  detect(input: DetectorInput): Finding[] {
    const threshold = THIN_PAGE_WORD_THRESHOLD
    if (threshold === null) {
      return []
    }

    const scan = input.scan
    if (scan === undefined) {
      return []
    }

    const findings: Finding[] = []

    for (const page of scan.pages) {
      if (!isIndexable(page)) {
        continue
      }
      if (page.wordCount === null || page.wordCount >= threshold) {
        continue
      }

      const path = pathOf(page.url)

      findings.push({
        emissionKey: emissionKeyFor(
          `thin-page:${slugifyKey(path)}`,
          input.periodEnd,
        ),
        category: 'search_intelligence',
        title: `${path} has ${page.wordCount} words of body content`,
        description:
          `The scan on ${scan.capturedOn} counted ${page.wordCount} words on ${page.url}, ` +
          `below the ${threshold}-word threshold. Word count is a proxy for depth, not a ` +
          `measure of quality — a short page can be the right answer.`,
        evidence: {
          url: page.url,
          wordCount: page.wordCount,
          threshold,
          capturedOn: scan.capturedOn,
        },
        relatedUrl: page.url,
        recommendedAction:
          'Review whether this page answers what it is meant to answer. This finding does not establish that adding words would improve it.',
        confidence: 'exploratory',
        score: Math.max(0, threshold - page.wordCount) * (SCORE_SCALE / threshold),
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
