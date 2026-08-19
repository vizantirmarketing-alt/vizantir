import {
  emissionKeyFor,
  slugifyKey,
  type Detector,
  type DetectorInput,
  type Finding,
} from '@/lib/intel/decisions/types'

const MAX_POSITION = 30
const MIN_IMPRESSIONS = 8
const MAX_CTR = 0.01
const MEDIUM_CONFIDENCE_MAX_POSITION = 25
const COMMERCIAL_TERMS = ['vs', 'compare', 'best'] as const

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

function formatPosition(value: number): string {
  return value.toFixed(1)
}

function hasCommercialComparisonIntent(query: string): boolean {
  const lower = query.toLowerCase()
  return COMMERCIAL_TERMS.some((term) => lower.includes(term))
}

export const withinReachDetector: Detector = {
  name: 'within-reach',
  detect(input: DetectorInput): Finding[] {
    const findings: Finding[] = []

    for (const row of input.queries) {
      if (row.impressions < MIN_IMPRESSIONS) {
        continue
      }
      if (row.position === null || row.position > MAX_POSITION) {
        continue
      }
      const ctr = row.impressions > 0 ? row.clicks / row.impressions : null
      if (row.clicks !== 0 && (ctr === null || ctr >= MAX_CTR)) {
        continue
      }

      const position = row.position
      const commercial = hasCommercialComparisonIntent(row.query)
      const clickClause =
        row.clicks === 0
          ? 'with no clicks'
          : `with a CTR of ${((ctr ?? 0) * 100).toFixed(1)}%`
      const intentClause = commercial
        ? ' The query contains comparison language (vs, compare, or best), which suggests commercial-comparison intent.'
        : ''

      const finding: Finding = {
        emissionKey: emissionKeyFor(
          `within-reach:${slugifyKey(row.query)}`,
          input.periodEnd,
        ),
        category: 'opportunity',
        title: `“${row.query}” is within reach and converting almost none of its demand`,
        description: `“${row.query}” appeared with an impression-weighted position of ${formatPosition(position)} and ${formatCount(row.impressions)} impressions, ${clickClause}.${intentClause} This is among the better-positioned queries still drawing almost no clicks.`,
        evidence: {
          query: row.query,
          position,
          impressions: row.impressions,
          clicks: row.clicks,
          ctr,
          page: row.topPage,
          commercialComparisonIntent: commercial,
        },
        recommendedAction: commercial
          ? 'This query has comparison intent. Review whether the listed page addresses the comparison directly. This does not establish that changes would increase clicks.'
          : 'Review the listed page for query alignment — title, heading, and whether the page actually answers this query. This does not establish that changes would increase clicks.',
        confidence:
          position <= MEDIUM_CONFIDENCE_MAX_POSITION ? 'medium' : 'exploratory',
        score: (31 - position) * row.impressions,
      }

      if (row.topPage) {
        finding.relatedUrl = row.topPage
      }

      findings.push(finding)
    }

    return findings
  },
}
