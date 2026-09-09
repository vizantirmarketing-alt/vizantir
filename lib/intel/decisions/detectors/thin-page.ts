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
 * Threshold: 350 words. Calibrated against the Phase 2b production scan
 * (97 pages: min 118, p10 368, p25 689, median 898). Sits just under p10
 * so it catches genuinely thin content without flagging the median.
 *
 * Word count is an approximation (see lib/scan/parse.ts). The number this
 * detector compares against is the number this parser produces, not a
 * canonical word count.
 */

export const THIN_PAGE_WORD_THRESHOLD: number | null = 350

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
