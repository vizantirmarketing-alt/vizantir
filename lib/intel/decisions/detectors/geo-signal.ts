import {
  emissionKeyFor,
  slugifyKey,
  type Detector,
  type DetectorInput,
  type Finding,
} from '@/lib/intel/decisions/types'

const MIN_COMBINED_IMPRESSIONS = 15

const GEO_FOCUS = [
  'las vegas',
  'henderson',
  'summerlin',
  'paradise',
  'southern nevada',
  'nevada',
] as const

/**
 * Specific city names outside the site's geo focus.
 * 'nevada' is intentionally absent — ambiguous statewide queries must not fire.
 */
const NON_FOCUS_GEO_TERMS = [
  'reno',
  'sparks',
  'carson city',
  'elko',
  'pahrump',
  'mesquite',
  'laughlin',
  'fernley',
  'fallon',
  'winnemucca',
  'ely',
  'incline village',
  'stateline',
  'boulder city',
  'phoenix',
  'scottsdale',
  'tucson',
  'salt lake city',
  'los angeles',
  'san diego',
  'sacramento',
  'portland',
  'seattle',
  'denver',
  'boise',
] as const

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

function containsGeoTerm(query: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+')
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i').test(query)
}

function displayGeo(term: string): string {
  return term
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export const geoSignalDetector: Detector = {
  name: 'geo-signal',
  detect(input: DetectorInput): Finding[] {
    const findings: Finding[] = []
    const focusSet = new Set<string>(GEO_FOCUS)

    for (const term of NON_FOCUS_GEO_TERMS) {
      if (focusSet.has(term)) {
        continue
      }

      const matching = input.queries.filter((row) =>
        containsGeoTerm(row.query, term),
      )
      const impressions = matching.reduce(
        (sum, row) => sum + row.impressions,
        0,
      )
      if (impressions < MIN_COMBINED_IMPRESSIONS) {
        continue
      }

      const label = displayGeo(term)
      findings.push({
        emissionKey: emissionKeyFor(slugifyKey(term), input.periodEnd),
        category: 'opportunity',
        title: `Google is surfacing the site for ${label}`,
        description: `Queries containing “${label}” accounted for ${formatCount(impressions)} impressions in the completed window. Google is surfacing the site for that geography. That may be a mis-association to correct, or an expansion to consider. This finding does not recommend either reading.`,
        evidence: {
          geo: term,
          impressions,
          matchingQueries: matching.map((row) => ({
            query: row.query,
            impressions: row.impressions,
            clicks: row.clicks,
          })),
        },
        confidence: 'exploratory',
        score: impressions,
      })
    }

    return findings
  },
}
