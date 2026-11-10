/**
 * Prospect scoring rubric. Pure; no I/O.
 *
 * The runner submits one rating per factor. Scores are computed here and are
 * never accepted from a caller. Contact data plays no part in scoring.
 *
 * Changing a weight, a factor, or the rating map changes what a score means:
 * bump RUBRIC_VERSION in the same change.
 */

export const RUBRIC_VERSION = 'prospect-rubric-v2'

/**
 * Version history. Weights and the rating-to-points map are identical in
 * every version, so stored scores stay comparable across versions.
 *   v1  initial factors and weights
 *   v2  factor descriptions (rating guidance returned to the runner), the
 *       two-source rule for navigation, and server-only performance ratings
 */

export const PROSPECT_RATINGS = ['unknown', 'none', 'weak', 'strong'] as const
export type ProspectRating = (typeof PROSPECT_RATINGS)[number]

/** Share of a factor's weight each rating earns. Unknown earns nothing. */
export const RATING_FRACTION: Record<ProspectRating, number> = {
  unknown: 0,
  none: 0,
  weak: 0.5,
  strong: 1,
}

export const PROSPECT_RATING_LABELS: Record<ProspectRating, string> = {
  unknown: 'Unknown',
  none: 'None',
  weak: 'Weak',
  strong: 'Strong',
}

export const FIT_FACTORS = [
  'market_industry_match',
  'business_complexity',
  'custom_web_relevance',
  'growth_signals',
] as const

export const OPPORTUNITY_FACTORS = [
  'navigation_conversion_friction',
  'performance_technical_issues',
  'content_information_architecture',
  'integration_cms_opportunity',
] as const

export type FitFactor = (typeof FIT_FACTORS)[number]
export type OpportunityFactor = (typeof OPPORTUNITY_FACTORS)[number]

export const PROSPECT_FACTORS = [...FIT_FACTORS, ...OPPORTUNITY_FACTORS] as const
export type ProspectFactor = (typeof PROSPECT_FACTORS)[number]

export type ScoreKind = 'fit' | 'opportunity'

export type FactorDefinition = {
  key: ProspectFactor
  score: ScoreKind
  weight: number
  label: string
  /** Rating guidance. Returned by claim and shown on the prospect page. */
  description: string
}

export const FACTOR_DEFINITIONS: Record<ProspectFactor, FactorDefinition> = {
  market_industry_match: {
    key: 'market_industry_match',
    score: 'fit',
    weight: 30,
    label: 'Market and industry match',
    description:
      "Strong: headquartered or primary office in the requested market and squarely in the industry. Weak: serves the market from elsewhere, or an adjacent industry. None: neither.",
  },
  business_complexity: {
    key: 'business_complexity',
    score: 'fit',
    weight: 30,
    label: 'Business complexity and established operations',
    description:
      "Strong: several services or practice areas plus at least one of five or more professionals, multiple offices, or ten or more years operating. Weak: established but single service or very small. None: no sign of established operations.",
  },
  custom_web_relevance: {
    key: 'custom_web_relevance',
    score: 'fit',
    weight: 25,
    label: 'Relevance to custom website services',
    description:
      "Judge the business's needs, not how the current site was built. Strong: many services, locations, content types or intake paths that a template handles poorly, and the current site is a template, page builder or visibly dated. Weak: simple needs, or the current site is already a recent custom build. None: a single page presence is adequate.",
  },
  growth_signals: {
    key: 'growth_signals',
    score: 'fit',
    weight: 15,
    label: 'Project or growth signals',
    description:
      "Strong: specific expansion, new offices, hiring or recent launches. Weak: general growth claims without specifics. None: looked and found none.",
  },
  navigation_conversion_friction: {
    key: 'navigation_conversion_friction',
    score: 'opportunity',
    weight: 35,
    label: 'Navigation and conversion friction',
    description:
      "Requires at least two pages read, one of them a service page, and evidence from at least two distinct pages. Strong: no clear contact path from service pages, broken or confusing navigation, or three or more steps to reach contact. Weak: a path exists but calls to action are inconsistent, the menu is crowded, or forms appear on only some pages. None: a clear, consistent contact path on every page read. A form on the home page alone is not enough for any rating.",
  },
  performance_technical_issues: {
    key: 'performance_technical_issues',
    score: 'opportunity',
    weight: 30,
    label: 'Measured performance or technical issues',
    description:
      "Set only by the server from a PageSpeed Insights measurement. The runner always submits unknown.",
  },
  content_information_architecture: {
    key: 'content_information_architecture',
    score: 'opportunity',
    weight: 20,
    label: 'Content or information architecture',
    description:
      "Strong: text duplicated across different services, outdated dates, or thin service pages. Weak: minor issues. None: looked and found none.",
  },
  integration_cms_opportunity: {
    key: 'integration_cms_opportunity',
    score: 'opportunity',
    weight: 15,
    label: 'Integration or CMS opportunity',
    description:
      "Strong: manual contact only where scheduling, intake or chat is standard for a business this size, plus signs of a dated platform. Weak: one of those. None: modern integrated tools are present.",
  },
}

export const SCORE_FACTORS: Record<ScoreKind, readonly ProspectFactor[]> = {
  fit: FIT_FACTORS,
  opportunity: OPPORTUNITY_FACTORS,
}

/** A score is null when more than this share of its weight is unknown. */
export const MAX_UNKNOWN_WEIGHT_SHARE = 0.5

export const CONFIDENCE_LEVELS = ['high', 'medium', 'low'] as const
export type ProspectConfidence = (typeof CONFIDENCE_LEVELS)[number]

export const CONFIDENCE_LABELS: Record<ProspectConfidence, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

/** Share of factors (by count, across both scores) rated something other than unknown. */
export const HIGH_CONFIDENCE_KNOWN_SHARE = 0.75
export const MEDIUM_CONFIDENCE_KNOWN_SHARE = 0.5

export type FactorRatings = Record<ProspectFactor, ProspectRating>

export type FactorBreakdown = {
  key: ProspectFactor
  label: string
  weight: number
  rating: ProspectRating
  points: number
}

export type ScoreBreakdown = {
  score: number | null
  knownWeight: number
  totalWeight: number
  factors: FactorBreakdown[]
}

export type ProspectScores = {
  fit: ScoreBreakdown
  opportunity: ScoreBreakdown
  confidence: ProspectConfidence
  knownFactorCount: number
  rubricVersion: string
}

export function isProspectRating(value: unknown): value is ProspectRating {
  return PROSPECT_RATINGS.some((rating) => rating === value)
}

export function isProspectFactor(value: unknown): value is ProspectFactor {
  return PROSPECT_FACTORS.some((factor) => factor === value)
}

export function factorPoints(factor: ProspectFactor, rating: ProspectRating): number {
  return FACTOR_DEFINITIONS[factor].weight * RATING_FRACTION[rating]
}

export function computeScore(kind: ScoreKind, ratings: FactorRatings): ScoreBreakdown {
  const factors: FactorBreakdown[] = SCORE_FACTORS[kind].map((key) => {
    const definition = FACTOR_DEFINITIONS[key]
    const rating = ratings[key]
    return {
      key,
      label: definition.label,
      weight: definition.weight,
      rating,
      points: factorPoints(key, rating),
    }
  })

  const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0)
  const knownWeight = factors
    .filter((factor) => factor.rating !== 'unknown')
    .reduce((sum, factor) => sum + factor.weight, 0)
  const unknownShare = totalWeight === 0 ? 1 : (totalWeight - knownWeight) / totalWeight

  const score =
    unknownShare > MAX_UNKNOWN_WEIGHT_SHARE
      ? null
      : Math.round(factors.reduce((sum, factor) => sum + factor.points, 0))

  return { score, knownWeight, totalWeight, factors }
}

export function computeConfidence(ratings: FactorRatings): {
  confidence: ProspectConfidence
  knownFactorCount: number
} {
  const knownFactorCount = PROSPECT_FACTORS.filter(
    (factor) => ratings[factor] !== 'unknown',
  ).length
  const share = knownFactorCount / PROSPECT_FACTORS.length

  if (share >= HIGH_CONFIDENCE_KNOWN_SHARE) {
    return { confidence: 'high', knownFactorCount }
  }
  if (share >= MEDIUM_CONFIDENCE_KNOWN_SHARE) {
    return { confidence: 'medium', knownFactorCount }
  }
  return { confidence: 'low', knownFactorCount }
}

export function scoreProspect(ratings: FactorRatings): ProspectScores {
  const { confidence, knownFactorCount } = computeConfidence(ratings)
  return {
    fit: computeScore('fit', ratings),
    opportunity: computeScore('opportunity', ratings),
    confidence,
    knownFactorCount,
    rubricVersion: RUBRIC_VERSION,
  }
}

/** The factor only the server may rate, from a measurement. */
export const SERVER_RATED_FACTOR: ProspectFactor = 'performance_technical_issues'

/** The factor whose non-unknown ratings need evidence from two distinct pages. */
export const TWO_SOURCE_FACTOR: ProspectFactor = 'navigation_conversion_friction'
export const TWO_SOURCE_MIN_URLS = 2

/**
 * Factors rated something other than unknown whose evidence comes from fewer
 * distinct source URLs than the rule requires. Only the navigation factor
 * carries a two-source rule.
 */
export function factorsMissingDistinctSources(
  ratings: FactorRatings,
  evidence: readonly { factor: string; sourceUrl: string }[],
): ProspectFactor[] {
  if (ratings[TWO_SOURCE_FACTOR] === 'unknown') {
    return []
  }
  const urls = new Set(
    evidence
      .filter((item) => item.factor === TWO_SOURCE_FACTOR)
      .map((item) => item.sourceUrl.trim()),
  )
  return urls.size >= TWO_SOURCE_MIN_URLS ? [] : [TWO_SOURCE_FACTOR]
}

/** Factors rated something other than unknown that have no evidence row. */
export function factorsMissingEvidence(
  ratings: FactorRatings,
  evidenceFactors: readonly string[],
): ProspectFactor[] {
  const covered = new Set(evidenceFactors)
  return PROSPECT_FACTORS.filter(
    (factor) => ratings[factor] !== 'unknown' && !covered.has(factor),
  )
}

/**
 * Reads stored factor_ratings JSON back into a complete ratings record.
 * Missing or unrecognized values read as unknown.
 */
export function readFactorRatings(value: unknown): FactorRatings {
  const ratings = {} as FactorRatings
  const source =
    typeof value === 'object' && value !== null && !Array.isArray(value)
      ? value
      : {}
  for (const factor of PROSPECT_FACTORS) {
    const raw: unknown = Reflect.get(source, factor)
    ratings[factor] = isProspectRating(raw) ? raw : 'unknown'
  }
  return ratings
}
