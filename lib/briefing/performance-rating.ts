/**
 * Ratings for a prospect's measured mobile performance, computed in code so
 * the briefing's writer never chooses its own adjectives. Standard Lighthouse
 * bands. Pure.
 */

export type PerformanceRating = 'good' | 'needs improvement' | 'poor'

/** Mobile performance score: 90 and above good, 50 to 89 needs improvement, below 50 poor. */
export function mobileScoreRating(score: number): PerformanceRating {
  if (score >= 90) return 'good'
  if (score >= 50) return 'needs improvement'
  return 'poor'
}

/** Largest Contentful Paint: up to 2.5 s good, up to 4.0 s needs improvement, above 4.0 s poor. */
export function lcpRating(lcpMs: number): PerformanceRating {
  if (lcpMs <= 2500) return 'good'
  if (lcpMs <= 4000) return 'needs improvement'
  return 'poor'
}

export type PerformanceRatings = {
  mobileScore: number
  mobileScoreRating: PerformanceRating
  lcpSeconds: number
  lcpRating: PerformanceRating
}

export function performanceRatings(measurement: { performanceScore: number; lcpMs: number }): PerformanceRatings {
  return {
    mobileScore: measurement.performanceScore,
    mobileScoreRating: mobileScoreRating(measurement.performanceScore),
    // One decimal, the same rounding as the performance line.
    lcpSeconds: Number((measurement.lcpMs / 1000).toFixed(1)),
    lcpRating: lcpRating(measurement.lcpMs),
  }
}
