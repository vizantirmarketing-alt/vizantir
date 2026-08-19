import {
  emissionKeyFor,
  type Detector,
  type DetectorInput,
  type Finding,
  type QueryWindowStats,
} from '@/lib/intel/decisions/types'

const MIN_IMPRESSIONS = 100
const MIN_POSITION = 40
const MAX_CTR = 0.005
const SCORE_SCALE = 100
const MEMBER_QUERY_EVIDENCE_LIMIT = 20
const INFORMATIONAL_TERMS = ['how', 'why', 'what', 'hacked'] as const

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

function formatCtr(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

function formatPosition(value: number): string {
  return value.toFixed(1)
}

function hasPhrase(haystack: string, phrase: string): boolean {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i').test(
    haystack,
  )
}

function isInformational(members: readonly QueryWindowStats[]): boolean {
  const joined = members.map((member) => member.query).join(' ')
  if (hasPhrase(joined, 'vs')) {
    return false
  }
  return INFORMATIONAL_TERMS.some((term) => hasPhrase(joined, term))
}

function recommendedAction(
  informational: boolean,
  label: string,
): string {
  if (informational) {
    return `These ${label} queries look informational. Deepen existing content and internal links rather than treating this as a ranking contest against entrenched competitors.`
  }
  return `Review whether an existing page can serve this ${label} demand, or whether the queries belong on a different URL. This finding does not establish that new content would rank.`
}

export const buriedDemandDetector: Detector = {
  name: 'buried-demand',
  detect(input: DetectorInput): Finding[] {
    const findings: Finding[] = []

    for (const group of input.groups) {
      const stats = input.groupedRows.get(group.slug)
      if (!stats) {
        continue
      }
      if (stats.impressions < MIN_IMPRESSIONS) {
        continue
      }
      if (stats.position === null || stats.position <= MIN_POSITION) {
        continue
      }
      if (stats.ctr === null || stats.ctr >= MAX_CTR) {
        continue
      }

      const informational = isInformational(stats.memberQueries)
      const topPage = stats.topPages[0]?.page ?? null
      const ctr = stats.ctr
      const position = stats.position

      const finding: Finding = {
        emissionKey: emissionKeyFor(group.slug, input.periodEnd),
        category: 'opportunity',
        title: `${group.label} has demand with little visibility`,
        description: `The ${group.label} group received ${formatCount(stats.impressions)} impressions over the completed 28-day window, associated with an impression-weighted position of ${formatPosition(position)} and a CTR of ${formatCtr(ctr)}. That combination suggests real demand and almost no visibility.`,
        evidence: {
          groupSlug: group.slug,
          groupLabel: group.label,
          impressions: stats.impressions,
          clicks: stats.clicks,
          position,
          ctr,
          memberQueryCount: stats.memberQueries.length,
          memberQueries: stats.memberQueries
            .slice(0, MEMBER_QUERY_EVIDENCE_LIMIT)
            .map((member) => ({
              query: member.query,
              impressions: member.impressions,
              clicks: member.clicks,
            })),
          topPage,
        },
        recommendedAction: recommendedAction(informational, group.label),
        confidence: 'medium',
        score: (stats.impressions * SCORE_SCALE) / position,
      }

      if (topPage) {
        finding.relatedUrl = topPage
      }

      findings.push(finding)
    }

    return findings
  },
}
