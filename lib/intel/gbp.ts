import 'server-only'

import { serverEnv } from '@/lib/env/server'
import { utcToday } from '@/lib/intel/search-params'
import { createSupabaseServiceRole } from '@/lib/supabase/service'

const ADMINISTRATOR_MESSAGE_MAX = 500
const BODY_EXCERPT_MAX = 200

const LAS_VEGAS_LAT = 36.1699
const LAS_VEGAS_LNG = -115.1398
const LAS_VEGAS_RADIUS_M = 50_000

const PLACE_DETAILS_FIELD_MASK = 'rating,userRatingCount'
const SEARCH_FIELD_MASK = 'places.id,places.rating,places.userRatingCount'
const SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText'

const UPSERT_CONFLICT = 'gbp_place_id,captured_on'

export type GbpFailure = {
  displayName: string
  status: number | null
  body: string
}

export type SyncGbpResult = {
  status: 'success' | 'partial' | 'failed'
  recordsProcessed: number
  placesProcessed: number
  snapshotsWritten: number
  failures: GbpFailure[]
  message?: string
}

type ServiceClient = ReturnType<typeof createSupabaseServiceRole>

type GbpPlaceRow = {
  id: string
  display_name: string
  place_id: string | null
  search_query: string | null
}

type PlaceMetrics = {
  rating: number | null
  reviewCount: number | null
}

type PlaceDetailsResponse = {
  rating?: unknown
  userRatingCount?: unknown
}

type SearchPlace = {
  id?: unknown
  rating?: unknown
  userRatingCount?: unknown
}

type SearchTextResponse = {
  places?: SearchPlace[]
}

type PlaceOutcome =
  | { ok: true; snapshotWritten: true }
  | { ok: false; failure: GbpFailure; snapshotWritten: boolean }

export async function syncGbp(): Promise<SyncGbpResult> {
  let runId: number | null = null
  let placesProcessed = 0
  let snapshotsWritten = 0
  const capturedOn = utcToday()

  try {
    const supabase = createSupabaseServiceRole()

    const inserted = await supabase
      .from('sync_runs')
      .insert({ provider: 'gbp', status: 'running' })
      .select('id')
      .single()

    runId = readNumericId(inserted.data)
    if (inserted.error || runId === null) {
      return emptyResult({
        status: 'failed',
        message: 'Failed to record sync run',
      })
    }

    const apiKey = serverEnv.PLACES_API_KEY?.trim()
    if (!apiKey) {
      const message = 'Places API is not configured'
      await finishRun(supabase, runId, {
        status: 'failed',
        recordsProcessed: 0,
        dataThroughDate: capturedOn,
        message,
      })
      return emptyResult({ status: 'failed', message })
    }

    const loaded = await supabase
      .from('gbp_places')
      .select('id, display_name, place_id, search_query')

    if (loaded.error || !Array.isArray(loaded.data)) {
      console.error('GBP sync failed')
      const message = 'Failed to load GBP places'
      await finishRun(supabase, runId, {
        status: 'failed',
        recordsProcessed: 0,
        dataThroughDate: capturedOn,
        message,
      })
      return emptyResult({ status: 'failed', message })
    }

    if (loaded.data.length === 0) {
      const message = 'No places were configured'
      await finishRun(supabase, runId, {
        status: 'success',
        recordsProcessed: 0,
        dataThroughDate: capturedOn,
        message,
      })
      return emptyResult({ status: 'success', message })
    }

    const failures: GbpFailure[] = []

    for (const raw of loaded.data) {
      placesProcessed += 1
      const place = parsePlace(raw)
      if (place === null) {
        failures.push({
          displayName: '(invalid row)',
          status: null,
          body: 'unreadable gbp_places row',
        })
        continue
      }

      const outcome = await syncPlace(supabase, apiKey, place, capturedOn)
      if (outcome.snapshotWritten) {
        snapshotsWritten += 1
      }
      if (!outcome.ok) {
        failures.push(outcome.failure)
      }
    }

    const status: SyncGbpResult['status'] =
      failures.length === 0
        ? 'success'
        : failures.length === placesProcessed
          ? 'failed'
          : 'partial'

    if (status === 'failed') {
      console.error('GBP sync failed')
    }

    const message =
      failures.length > 0
        ? truncate(
            failures.map(formatFailure).join('; '),
            ADMINISTRATOR_MESSAGE_MAX,
          )
        : undefined

    await finishRun(supabase, runId, {
      status,
      recordsProcessed: snapshotsWritten,
      dataThroughDate: capturedOn,
      message,
    })

    return {
      status,
      recordsProcessed: snapshotsWritten,
      placesProcessed,
      snapshotsWritten,
      failures,
      message,
    }
  } catch {
    console.error('GBP sync failed')
    if (runId !== null) {
      try {
        const supabase = createSupabaseServiceRole()
        await finishRun(supabase, runId, {
          status: 'failed',
          recordsProcessed: snapshotsWritten,
          dataThroughDate: capturedOn,
          message: 'Sync failed',
        })
      } catch {
        // Swallow so the function never throws.
      }
    }

    return {
      status: 'failed',
      recordsProcessed: snapshotsWritten,
      placesProcessed,
      snapshotsWritten,
      failures: [],
      message: 'Sync failed',
    }
  }
}

async function syncPlace(
  supabase: ServiceClient,
  apiKey: string,
  place: GbpPlaceRow,
  capturedOn: string,
): Promise<PlaceOutcome> {
  if (place.place_id !== null) {
    return syncByPlaceId(supabase, apiKey, place, capturedOn)
  }
  if (place.search_query !== null) {
    return syncBySearchQuery(supabase, apiKey, place, capturedOn)
  }
  return {
    ok: false,
    snapshotWritten: false,
    failure: {
      displayName: place.display_name,
      status: null,
      body: 'missing place_id and search_query',
    },
  }
}

async function syncByPlaceId(
  supabase: ServiceClient,
  apiKey: string,
  place: GbpPlaceRow,
  capturedOn: string,
): Promise<PlaceOutcome> {
  try {
    const placeId = normalizePlaceId(place.place_id ?? '')
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        method: 'GET',
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': PLACE_DETAILS_FIELD_MASK,
        },
      },
    )

    const body = await response.text()
    if (!response.ok) {
      return {
        ok: false,
        snapshotWritten: false,
        failure: {
          displayName: place.display_name,
          status: response.status,
          body,
        },
      }
    }

    const parsed = parseJson(body)
    if (parsed === null) {
      return {
        ok: false,
        snapshotWritten: false,
        failure: {
          displayName: place.display_name,
          status: response.status,
          body: body.length > 0 ? body : 'invalid json',
        },
      }
    }

    const details = parsed as PlaceDetailsResponse
    const written = await writeSnapshot(supabase, {
      gbpPlaceId: place.id,
      found: true,
      metrics: readMetrics(details),
      capturedOn,
    })
    if (!written.ok) {
      return {
        ok: false,
        snapshotWritten: false,
        failure: {
          displayName: place.display_name,
          status: null,
          body: written.message,
        },
      }
    }

    return { ok: true, snapshotWritten: true }
  } catch (error) {
    return {
      ok: false,
      snapshotWritten: false,
      failure: {
        displayName: place.display_name,
        status: null,
        body: String(error),
      },
    }
  }
}

async function syncBySearchQuery(
  supabase: ServiceClient,
  apiKey: string,
  place: GbpPlaceRow,
  capturedOn: string,
): Promise<PlaceOutcome> {
  try {
    const response = await fetch(SEARCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': SEARCH_FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: place.search_query,
        locationBias: {
          circle: {
            center: {
              latitude: LAS_VEGAS_LAT,
              longitude: LAS_VEGAS_LNG,
            },
            radius: LAS_VEGAS_RADIUS_M,
          },
        },
      }),
    })

    const body = await response.text()
    if (!response.ok) {
      return {
        ok: false,
        snapshotWritten: false,
        failure: {
          displayName: place.display_name,
          status: response.status,
          body,
        },
      }
    }

    const parsed = parseJson(body)
    if (parsed === null) {
      return {
        ok: false,
        snapshotWritten: false,
        failure: {
          displayName: place.display_name,
          status: response.status,
          body: body.length > 0 ? body : 'invalid json',
        },
      }
    }

    const top = firstPlace((parsed as SearchTextResponse).places)
    if (top === null) {
      const written = await writeSnapshot(supabase, {
        gbpPlaceId: place.id,
        found: false,
        metrics: { rating: null, reviewCount: null },
        capturedOn,
      })
      if (!written.ok) {
        return {
          ok: false,
          snapshotWritten: false,
          failure: {
            displayName: place.display_name,
            status: null,
            body: written.message,
          },
        }
      }
      return { ok: true, snapshotWritten: true }
    }

    const resolvedId = readPlaceId(top.id)
    if (resolvedId !== null) {
      const updated = await supabase
        .from('gbp_places')
        .update({ place_id: resolvedId })
        .eq('id', place.id)
      if (updated.error) {
        const written = await writeSnapshot(supabase, {
          gbpPlaceId: place.id,
          found: true,
          metrics: readMetrics(top),
          capturedOn,
        })
        return {
          ok: false,
          snapshotWritten: written.ok,
          failure: {
            displayName: place.display_name,
            status: null,
            body: updated.error.message,
          },
        }
      }
    }

    const written = await writeSnapshot(supabase, {
      gbpPlaceId: place.id,
      found: true,
      metrics: readMetrics(top),
      capturedOn,
    })
    if (!written.ok) {
      return {
        ok: false,
        snapshotWritten: false,
        failure: {
          displayName: place.display_name,
          status: null,
          body: written.message,
        },
      }
    }

    return { ok: true, snapshotWritten: true }
  } catch (error) {
    return {
      ok: false,
      snapshotWritten: false,
      failure: {
        displayName: place.display_name,
        status: null,
        body: String(error),
      },
    }
  }
}

async function writeSnapshot(
  supabase: ServiceClient,
  input: {
    gbpPlaceId: string
    found: boolean
    metrics: PlaceMetrics
    capturedOn: string
  },
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error } = await supabase.from('gbp_snapshots').upsert(
    {
      gbp_place_id: input.gbpPlaceId,
      found: input.found,
      rating: input.metrics.rating,
      review_count: input.metrics.reviewCount,
      captured_on: input.capturedOn,
    },
    { onConflict: UPSERT_CONFLICT },
  )
  if (error) {
    console.error('GBP snapshot upsert failed')
    return { ok: false, message: error.message }
  }
  return { ok: true }
}

async function finishRun(
  supabase: ServiceClient,
  runId: number,
  result: {
    status: SyncGbpResult['status']
    recordsProcessed: number
    dataThroughDate: string
    message?: string
  },
): Promise<void> {
  await supabase
    .from('sync_runs')
    .update({
      status: result.status,
      completed_at: new Date().toISOString(),
      records_processed: result.recordsProcessed,
      data_through_date: result.dataThroughDate,
      administrator_message: result.message ?? null,
      error_code: result.status === 'success' ? null : result.status,
    })
    .eq('id', runId)
}

function emptyResult(input: {
  status: SyncGbpResult['status']
  message: string
}): SyncGbpResult {
  return {
    status: input.status,
    recordsProcessed: 0,
    placesProcessed: 0,
    snapshotsWritten: 0,
    failures: [],
    message: input.message,
  }
}

function formatFailure(failure: GbpFailure): string {
  const statusLabel =
    failure.status === null ? 'error' : String(failure.status)
  const excerpt =
    failure.body.trim().length > 0
      ? truncate(failure.body.trim(), BODY_EXCERPT_MAX)
      : '(empty)'
  return `${failure.displayName} (${statusLabel}: ${excerpt})`
}

function truncate(value: string, max: number): string {
  if (value.length <= max) {
    return value
  }
  return value.slice(0, max)
}

function parsePlace(value: unknown): GbpPlaceRow | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }
  const id = readField(value, 'id')
  const displayName = readField(value, 'display_name')
  if (typeof id !== 'string' || id.length === 0) {
    return null
  }
  if (typeof displayName !== 'string' || displayName.length === 0) {
    return null
  }
  return {
    id,
    display_name: displayName,
    place_id: asNonEmptyString(readField(value, 'place_id')),
    search_query: asNonEmptyString(readField(value, 'search_query')),
  }
}

function readMetrics(value: {
  rating?: unknown
  userRatingCount?: unknown
}): PlaceMetrics {
  return {
    rating: asFiniteNumber(value.rating),
    reviewCount: asInteger(value.userRatingCount),
  }
}

function firstPlace(places: SearchPlace[] | undefined): SearchPlace | null {
  if (!Array.isArray(places) || places.length === 0) {
    return null
  }
  return places[0] ?? null
}

function readPlaceId(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null
  }
  return normalizePlaceId(value.trim())
}

function normalizePlaceId(value: string): string {
  return value.startsWith('places/') ? value.slice('places/'.length) : value
}

function parseJson(body: string): unknown | null {
  try {
    return JSON.parse(body) as unknown
  } catch {
    return null
  }
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
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

function readNumericId(value: unknown): number | null {
  if (typeof value !== 'object' || value === null || !('id' in value)) {
    return null
  }
  const id = value.id
  if (typeof id === 'number' && Number.isFinite(id)) {
    return id
  }
  if (typeof id === 'string' && /^\d+$/.test(id)) {
    return Number(id)
  }
  return null
}
