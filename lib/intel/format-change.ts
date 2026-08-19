/** Prior-period values below this are too small for a percentage to be meaningful. */
export const MEANINGFUL_COMPARISON_BASE = 10

/**
 * Percentages are only meaningful against a meaningful base.
 * Returns a signed relative percent when `previous` is at least
 * MEANINGFUL_COMPARISON_BASE; otherwise null so callers show the
 * absolute delta instead of a noisy or infinite percent.
 */
export function formatPercentAgainstMeaningfulBase(
  current: number,
  previous: number,
): string | null {
  if (previous < MEANINGFUL_COMPARISON_BASE) {
    return null
  }

  const percent = ((current - previous) / previous) * 100
  const abs = Math.abs(percent)
  const rounded = abs >= 10 ? abs.toFixed(0) : abs.toFixed(1)

  if (percent > 0) {
    return `+${rounded}%`
  }
  if (percent < 0) {
    return `−${rounded}%`
  }
  return '0%'
}
