import 'server-only'

import { addUtcDays, isIsoDate, utcToday } from '@/lib/intel/search-params'
import { createSupabaseServiceRole } from '@/lib/supabase/service'

export type LocalPresencePlace = {
  id: string
  displayName: string
  isSelf: boolean
  found: boolean
  rating: number | null
  reviewCount: number | null
  reviewDelta: number | null
}

export type FetchLocalPresenceResult =
  | { ok: true; places: LocalPresencePlace[] }
  | { ok: false }

type ParsedPlace = {
  id: string
  displayName: string
  isSelf: boolean
}

type ParsedSnapshot = {
  gbpPlaceId: string
  found: boolean
  rating: number | null
  reviewCount: number | null
  capturedOn: string
}

export async function fetchLocalPresence(): Promise<FetchLocalPresenceResult> {
  try {
    const supabase = createSupabaseServiceRole()
    const placesResult = await supabase
      .from('gbp_places')
      .select('id, display_name, is_self')
      .is('client_id', null)

    if (placesResult.error || !Array.isArray(placesResult.data)) {
      console.error('Intel local presence query failed')
      return { ok: false }
    }

    const places: ParsedPlace[] = []
    for (const row of placesResult.data) {
      const parsed = parsePlace(row)
      if (parsed !== null) {
        places.push(parsed)
      }
    }

    if (places.length === 0) {
      return { ok: true, places: [] }
    }

    const snapshotsResult = await supabase
      .from('gbp_snapshots')
      .select('gbp_place_id, found, rating, review_count, captured_on')
      .in(
        'gbp_place_id',
        places.map((place) => place.id),
      )

    if (snapshotsResult.error || !Array.isArray(snapshotsResult.data)) {
      console.error('Intel local presence query failed')
      return { ok: false }
    }

    const snapshotsByPlace = new Map<string, ParsedSnapshot[]>()
    for (const row of snapshotsResult.data) {
      const parsed = parseSnapshot(row)
      if (parsed === null) {
        continue
      }
      const existing = snapshotsByPlace.get(parsed.gbpPlaceId)
      if (existing === undefined) {
        snapshotsByPlace.set(parsed.gbpPlaceId, [parsed])
      } else {
        existing.push(parsed)
      }
    }

    const priorCutoff = addUtcDays(utcToday(), -30)
    const rows: LocalPresencePlace[] = []

    for (const place of places) {
      const snapshots = snapshotsByPlace.get(place.id)
      if (snapshots === undefined) {
        continue
      }

      const latest = latestSnapshot(snapshots)
      if (latest === undefined) {
        continue
      }

      const prior = priorSnapshot(snapshots, priorCutoff)
      rows.push({
        id: place.id,
        displayName: place.displayName,
        isSelf: place.isSelf,
        found: latest.found,
        rating: latest.rating,
        reviewCount: latest.reviewCount,
        reviewDelta: reviewDelta(latest, prior),
      })
    }

    rows.sort(comparePlaces)
    return { ok: true, places: rows }
  } catch {
    console.error('Intel local presence query failed')
    return { ok: false }
  }
}

function latestSnapshot(
  snapshots: readonly ParsedSnapshot[],
): ParsedSnapshot | undefined {
  let latest: ParsedSnapshot | undefined
  for (const snapshot of snapshots) {
    if (latest === undefined || snapshot.capturedOn > latest.capturedOn) {
      latest = snapshot
    }
  }
  return latest
}

function priorSnapshot(
  snapshots: readonly ParsedSnapshot[],
  cutoff: string,
): ParsedSnapshot | null {
  let prior: ParsedSnapshot | null = null
  for (const snapshot of snapshots) {
    if (snapshot.capturedOn > cutoff) {
      continue
    }
    if (prior === null || snapshot.capturedOn > prior.capturedOn) {
      prior = snapshot
    }
  }
  return prior
}

function reviewDelta(
  latest: ParsedSnapshot,
  prior: ParsedSnapshot | null,
): number | null {
  if (prior === null || prior.capturedOn === latest.capturedOn) {
    return null
  }
  if (latest.reviewCount === null || prior.reviewCount === null) {
    return null
  }
  return latest.reviewCount - prior.reviewCount
}

function comparePlaces(
  left: LocalPresencePlace,
  right: LocalPresencePlace,
): number {
  if (left.isSelf !== right.isSelf) {
    return left.isSelf ? -1 : 1
  }

  const leftCount = left.reviewCount
  const rightCount = right.reviewCount
  if (leftCount === null && rightCount === null) {
    return left.displayName.localeCompare(right.displayName)
  }
  if (leftCount === null) {
    return 1
  }
  if (rightCount === null) {
    return -1
  }
  if (rightCount !== leftCount) {
    return rightCount - leftCount
  }
  return left.displayName.localeCompare(right.displayName)
}

function parsePlace(value: unknown): ParsedPlace | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const id = readField(value, 'id')
  const displayName = readField(value, 'display_name')
  const isSelf = readField(value, 'is_self')
  if (typeof id !== 'string' || id.length === 0) {
    return null
  }
  if (typeof displayName !== 'string' || displayName.length === 0) {
    return null
  }
  if (typeof isSelf !== 'boolean') {
    return null
  }

  return { id, displayName, isSelf }
}

function parseSnapshot(value: unknown): ParsedSnapshot | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const gbpPlaceId = readField(value, 'gbp_place_id')
  const found = readField(value, 'found')
  const capturedOn = readField(value, 'captured_on')
  if (typeof gbpPlaceId !== 'string' || gbpPlaceId.length === 0) {
    return null
  }
  if (typeof found !== 'boolean') {
    return null
  }
  if (typeof capturedOn !== 'string' || !isIsoDate(capturedOn)) {
    return null
  }

  return {
    gbpPlaceId,
    found,
    rating: asFiniteNumber(readField(value, 'rating')),
    reviewCount: asInteger(readField(value, 'review_count')),
    capturedOn,
  }
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function asInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) ? value : null
}

function readField(value: object, key: string): unknown {
  return Reflect.get(value, key)
}
