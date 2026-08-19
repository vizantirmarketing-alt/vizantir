import { MEANINGFUL_COMPARISON_BASE } from '@/lib/intel/format-change'

/**
 * Percentage changes are only valid against a meaningful prior base.
 * A prior below MEANINGFUL_COMPARISON_BASE (including zero) returns null
 * so callers show an absolute delta instead of a noisy or infinite percent.
 */
export function percentChangeFromPrior(
  current: number,
  previous: number,
): number | null {
  if (previous < MEANINGFUL_COMPARISON_BASE) {
    return null
  }
  return ((current - previous) / previous) * 100
}
