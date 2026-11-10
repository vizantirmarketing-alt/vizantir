/**
 * Prospect scoring rubric. Pure; no I/O.
 *
 * The runner submits one rating per factor. Scores are computed here and are
 * never accepted from a caller. Contact data plays no part in scoring.
 *
 * Changing a weight, a factor, or the rating map changes what a score means:
 * bump RUBRIC_VERSION in the same change.
 */

export const RUBRIC_VERSION = 'prospect-rubric-v1'

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
}

export const FACTOR_DEFINITIONS: Record<ProspectFactor, FactorDefinition> = {
  market_industry_match: {
    key: 'market_industry_match',
    score: 'fit',
    weight: 30,
    label: 'Market and industry match',
  },
  business_complexity: {
    key: 'business_complexity',
    score: 'fit',
    weight: 30,
    label: 'Business complexity and established operations',
  },
  custom_web_relevance: {
    key: 'custom_web_relevance',
    score: 'fit',
    weight: 25,
    label: 'Relevance to custom website services',
  },
  growth_signals: {
    key: 'growth_signals',
    score: 'fit',
    weight: 15,
    label: 'Project or growth signals',
  },
  navigation_conversion_friction: {
    key: 'navigation_conversion_friction',
    score: 'opportunity',
    weight: 35,
    label: 'Navigation and conversion friction',
  },
  performance_technical_issues: {
    key: 'performance_technical_issues',
    score: 'opportunity',
    weight: 30,
    label: 'Measured performance or technical issues',
  },
  content_information_architecture: {
    key: 'content_information_architecture',
    score: 'opportunity',
    weight: 20,
    label: 'Content or information architecture',
  },
  integration_cms_opportunity: {
    key: 'integration_cms_opportunity',
    score: 'opportunity',
    weight: 15,
    label: 'Integration or CMS opportunity',
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
