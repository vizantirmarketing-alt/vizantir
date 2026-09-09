import {
  emissionKeyFor,
  slugifyKey,
  type Detector,
  type DetectorInput,
  type Finding,
} from '@/lib/intel/decisions/types'
import { wasFetched, type PageSnapshot } from '@/lib/scan/types'

/**
 * A URL Google is showing to people that the site no longer serves.
 *
 * Architecture §18.4: the single best argument for the §16 design. Neither
 * data source produces this alone — it needs GSC impressions and a scan
 * snapshot in the same DetectorInput, which is exactly what reusing
 * decision_items rather than building a separate scan store buys.
 *
 * Category is `search_intelligence`, decided rather than defaulted. §18.4
 * notes this is the one detector that would plausibly warrant
 * `needs_attention`; routing it there would pull it out of the SEO discipline
 * grouping, and severity is already carried by score and confidence. Severity
 * and discipline are different axes and `category` can only express one.
 *
 * Matching is by pathname, not by full URL. GSC reports the canonical URL it
 * indexed, which may differ from the sitemap entry in scheme, host casing, or
 * trailing slash; comparing paths avoids missing a genuine break over a
 * cosmetic difference. Query strings are preserved in the key so two distinct
 * parameterised URLs do not collapse into one finding.
 */

const SCORE_PER_IMPRESSION = 50
const MIN_IMPRESSIONS = 1

type BrokenKind = 'non_200' | 'noindex'

function brokenKind(page: PageSnapshot): BrokenKind | null {
  if (!wasFetched(page)) {
    return null
  }
  if (page.httpStatus !== null && page.httpStatus >= 400) {
    return 'non_200'
  }
  if (page.robotsNoindex) {
    return 'noindex'
  }
  return null
}

export const indexedButBrokenDetector: Detector = {
  name: 'indexed-but-broken',
  needsScan: true,
  detect(input: DetectorInput): Finding[] {
    const scan = input.scan
    if (scan === undefined) {
      return []
    }

    const brokenByPath = new Map<string, { page: PageSnapshot; kind: BrokenKind }>()
    for (const page of scan.pages) {
      const kind = brokenKind(page)
      if (kind === null) {
        continue
      }
      brokenByPath.set(pathKey(page.url), { page, kind })
    }

    if (brokenByPath.size === 0) {
      return []
    }

    // GSC impressions for the window, summed per page across every query.
    const impressionsByPath = new Map<string, { impressions: number; clicks: number }>()
    for (const query of input.queries) {
      if (query.topPage === null) {
        continue
      }
      const key = pathKey(query.topPage)
      if (!brokenByPath.has(key)) {
        continue
      }
      const existing = impressionsByPath.get(key) ?? { impressions: 0, clicks: 0 }
      existing.impressions += query.impressions
      existing.clicks += query.clicks
      impressionsByPath.set(key, existing)
    }

    const findings: Finding[] = []

    for (const [key, totals] of impressionsByPath) {
      if (totals.impressions < MIN_IMPRESSIONS) {
        continue
      }
      const broken = brokenByPath.get(key)
      if (broken === undefined) {
        continue
      }

      const { page, kind } = broken
      const path = pathOf(page.url)
      const state =
        kind === 'non_200'
          ? `returns HTTP ${page.httpStatus}`
          : 'is marked noindex'

      findings.push({
        emissionKey: emissionKeyFor(
          `indexed-but-broken:${slugifyKey(key)}`,
          input.periodEnd,
        ),
        category: 'search_intelligence',
        title: `${path} drew ${formatCount(totals.impressions)} impressions and ${state}`,
        description:
          `Search Console recorded ${formatCount(totals.impressions)} impressions and ` +
          `${formatCount(totals.clicks)} clicks for ${page.url} between ${input.periodStart} ` +
          `and ${input.periodEnd}. The scan on ${scan.capturedOn} found that it ${state}. ` +
          `Google is showing this URL to people the site does not serve as listed.`,
        evidence: {
          url: page.url,
          kind,
          httpStatus: page.httpStatus,
          robotsNoindex: page.robotsNoindex,
          impressions: totals.impressions,
          clicks: totals.clicks,
          periodStart: input.periodStart,
          periodEnd: input.periodEnd,
          capturedOn: scan.capturedOn,
        },
        relatedUrl: page.url,
        recommendedAction:
          kind === 'non_200'
            ? 'Restore the page or redirect it to whatever replaced it. Every impression here is a person being offered a page that does not load.'
            : 'Decide whether this page should be indexed. It is currently earning impressions while telling Google not to index it.',
        confidence: 'high',
        score: totals.impressions * SCORE_PER_IMPRESSION,
      })
    }

    return findings
  },
}

/** Path plus query, lowercased host-insensitively, trailing slash normalised. */
function pathKey(url: string): string {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname.replace(/\/+$/, '') || '/'
    return `${path}${parsed.search}`
  } catch {
    return url
  }
}

function pathOf(url: string): string {
  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}
