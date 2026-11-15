/**
 * The one-line statuses on New Businesses' collapsed sections. Pure.
 */

import { BRIEFING_TIME_ZONE } from '@/lib/briefing/dates'
import { formatPeriod, type Period } from '@/lib/new-businesses/discovery'

function day(iso: string | null): string | null {
  if (iso === null) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: BRIEFING_TIME_ZONE }).format(date)
}

/** "102 of 178 categories on". */
export function categoriesStatus(categories: readonly { enabled: boolean }[] | null): string {
  if (categories === null) return 'Unable to load categories'
  const on = categories.filter((category) => category.enabled).length
  return `${on.toLocaleString('en-US')} of ${categories.length.toLocaleString('en-US')} categories on`
}

/** "Latest import: October 2026". Imports are newest period first. */
export function importsStatus(imports: readonly { period: Period; state: string }[] | null): string {
  if (imports === null) return 'Unable to load imports'
  const latest = imports.find((i) => i.state === 'imported')
  return latest === undefined ? 'Nothing imported yet' : `Latest import: ${formatPeriod(latest.period)}`
}

/** "Latest check: 30 of 30, Nov 14". Runs are newest first. */
export function checksStatus(
  runs: readonly { state: string; businessCount: number; checked: number; requestedAt: string; claimedAt: string | null; finishedAt: string | null }[] | null,
): string {
  if (runs === null) return 'Unable to load website checks'
  const latest = runs[0]
  if (latest === undefined) return 'No website checks yet'
  const when = day(latest.finishedAt ?? latest.claimedAt ?? latest.requestedAt)
  const suffix = when === null ? '' : `, ${when}`
  if (latest.state === 'requested') return `Latest check: waiting for the research runner${suffix}`
  if (latest.businessCount === 0) return `Latest check: no businesses${suffix}`
  return `Latest check: ${latest.checked} of ${latest.businessCount}${suffix}`
}
