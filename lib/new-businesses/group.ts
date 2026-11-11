/**
 * Groups stored license rows into businesses. Pure.
 *
 * A business is one normalized name at one location (address and suite),
 * across every period. Rows without an address group by name and phone
 * instead, and a row with neither stays on its own: two unrelated businesses
 * can share a name, so name alone never groups.
 *
 * Grouping only changes how rows are displayed. No stored row is merged or
 * deleted; each keeps its own category, period, review status and note.
 */

import { locationKey, normalizeName, normalizePhone } from '@/lib/new-businesses/normalize'

export type GroupInput = {
  id: string
  name: string
  address: string | null
  suite: string | null
  phone: string | null
  category: string
  /** YYYY-MM */
  period: string
  reviewStatus: string
  reviewedAt: string | null
  hasNote: boolean
  createdAt: string
}

export type BusinessGroup = {
  key: string
  rowIds: string[]
  /** The row that represents the business in the list. */
  primaryId: string
  /** Every category the business holds, sorted, without duplicates. */
  categories: string[]
  /** Every period (YYYY-MM) with a license row, newest first. */
  periods: string[]
  licenseCount: number
}

export function businessKey(row: Pick<GroupInput, 'id' | 'name' | 'address' | 'suite' | 'phone'>): string {
  const name = normalizeName(row.name)
  const location = locationKey(row.address, row.suite)
  if (name.length > 0 && location !== null) return `loc:${name}|${location}`
  const phone = normalizePhone(row.phone)
  if (name.length > 0 && phone !== null) return `tel:${name}|${phone}`
  return `row:${row.id}`
}

/**
 * The primary row, which carries the business's review status and note in
 * the list:
 *   1. a reviewed row (most recently reviewed first), so a business reviewed
 *      on any of its rows shows as reviewed;
 *   2. otherwise a row with a note;
 *   3. otherwise the earliest stored row, so a license row added later never
 *      takes over from the row the owner has been looking at.
 */
export function choosePrimary(rows: readonly GroupInput[]): GroupInput {
  const reviewed = rows.filter((row) => row.reviewStatus !== 'unreviewed')
  if (reviewed.length > 0) {
    return [...reviewed].sort(
      (a, b) => (b.reviewedAt ?? '').localeCompare(a.reviewedAt ?? '') || byAge(a, b),
    )[0]!
  }
  const noted = rows.filter((row) => row.hasNote)
  if (noted.length > 0) return [...noted].sort(byAge)[0]!
  return [...rows].sort(byAge)[0]!
}

function byAge(a: GroupInput, b: GroupInput): number {
  return a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)
}

export function groupBusinesses(rows: readonly GroupInput[]): BusinessGroup[] {
  const byKey = new Map<string, GroupInput[]>()
  for (const row of rows) {
    const key = businessKey(row)
    const list = byKey.get(key) ?? []
    list.push(row)
    byKey.set(key, list)
  }
  return [...byKey.entries()].map(([key, members]) => ({
    key,
    rowIds: members.map((row) => row.id),
    primaryId: choosePrimary(members).id,
    categories: [...new Set(members.map((row) => row.category.trim()))].sort((a, b) => a.localeCompare(b)),
    periods: [...new Set(members.map((row) => row.period))].sort((a, b) => b.localeCompare(a)),
    licenseCount: members.length,
  }))
}
