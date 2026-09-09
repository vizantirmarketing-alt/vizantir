import {
  emissionKeyFor,
  slugifyKey,
  type Detector,
  type DetectorInput,
  type Finding,
} from '@/lib/intel/decisions/types'
import { wasFetched, type PageSnapshot } from '@/lib/scan/types'

/**
 * A query that is nearly ranking, whose landing page fails its scan.
 *
 * Architecture §18.4: connects a ranking opportunity to a concrete technical
 * cause. `within-reach` says "this query is close"; this says "and the page it
 * lands on is broken", which turns an opportunity into a specific repair.
 *
 * The `within-reach` gates are mirrored deliberately rather than loosened, so
 * this detector describes the same population that detector already surfaces.
 * Changing them here would silently create a second, differently-scoped
 * opportunity set.
 *
 * Overlap with `indexed-but-broken` is real and intended: that detector is
 * page-centric and fires on any indexed URL that breaks, this one is
 * query-centric and fires only for queries within reach. A URL can produce
 * both, and they carry different actions. §12.5 records the same accepted
 * overlap between law-firm and geo-signal.
 */

const MAX_POSITION = 30
const MIN_IMPRESSIONS = 8
const MAX_CTR = 0.01
const SCORE_SCALE = 40

function isBroken(page: PageSnapshot): boolean {
  if (!wasFetched(page)) {
    return false
  }
  if (page.httpStatus !== null && page.httpStatus >= 400) {
    return true
  }
  return page.robotsNoindex
}

export const demandWithoutPageDetector: Detector = {
  name: 'demand-without-page',
  needsScan: true,
  detect(input: DetectorInput): Finding[] {
    const scan = input.scan
    if (scan === undefined) {
      return []
    }

    const byPath = new Map<string, PageSnapshot>()
    for (const page of scan.pages) {
      byPath.set(pathKey(page.url), page)
    }

    const findings: Finding[] = []

    for (const query of input.queries) {
      if (query.topPage === null) {
        continue
      }
      // Same gates as within-reach.
      if (query.impressions < MIN_IMPRESSIONS) {
        continue
      }
      if (query.position === null || query.position > MAX_POSITION) {
        continue
      }
      const ctr = query.impressions > 0 ? query.clicks / query.impressions : null
      if (query.clicks !== 0 && (ctr === null || ctr >= MAX_CTR)) {
        continue
      }

      const page = byPath.get(pathKey(query.topPage))
      if (page === undefined || !isBroken(page)) {
        continue
      }

      const state =
        page.httpStatus !== null && page.httpStatus >= 400
          ? `returns HTTP ${page.httpStatus}`
          : 'is marked noindex'

      findings.push({
        emissionKey: emissionKeyFor(
          `demand-without-page:${slugifyKey(query.query)}`,
          input.periodEnd,
        ),
        category: 'search_intelligence',
        title: `“${query.query}” is within reach but its page ${state}`,
        description:
          `“${query.query}” held an impression-weighted position of ${query.position?.toFixed(1)} ` +
          `across ${formatCount(query.impressions)} impressions between ${input.periodStart} and ` +
          `${input.periodEnd}, landing on ${page.url}. The scan on ${scan.capturedOn} found that ` +
          `page ${state}. The ranking opportunity and the technical fault are the same URL.`,
        evidence: {
          query: query.query,
          url: page.url,
          httpStatus: page.httpStatus,
          robotsNoindex: page.robotsNoindex,
          position: query.position,
          impressions: query.impressions,
          clicks: query.clicks,
          ctr,
          capturedOn: scan.capturedOn,
        },
        relatedUrl: page.url,
        recommendedAction:
          'Repair the landing page before treating this as a content or ranking problem. This does not establish that repairing it would increase clicks.',
        confidence: 'high',
        score: (31 - query.position) * query.impressions * (SCORE_SCALE / 31),
      })
    }

    return findings
  },
}

function pathKey(url: string): string {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname.replace(/\/+$/, '') || '/'
    return `${path}${parsed.search}`
  } catch {
    return url
  }
}

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}
