function asFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  return null
}

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(value))
}

function formatPosition(value: number): string {
  return value.toFixed(1)
}

function joinFacts(parts: readonly string[]): string | null {
  if (parts.length === 0) {
    return null
  }
  return parts.join(' · ')
}

/**
 * One-line triage fact from evidence_json, keyed by detector.
 */
export function formatHeadlineFact(
  detector: string,
  evidence: Record<string, unknown>,
): string | null {
  const impressions = asFiniteNumber(evidence.impressions)
  const position = asFiniteNumber(evidence.position)

  if (detector === 'geo-signal') {
    if (impressions === null) {
      return null
    }
    return `${formatCount(impressions)} impressions`
  }

  const parts: string[] = []
  if (impressions !== null) {
    parts.push(`${formatCount(impressions)} impressions`)
  }
  if (position !== null) {
    parts.push(`pos ${formatPosition(position)}`)
  }

  if (detector === 'buried-demand' || detector === 'within-reach') {
    return joinFacts(parts)
  }

  return joinFacts(parts)
}
