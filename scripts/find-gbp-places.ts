/**
 * Resolve business names to Google Place IDs via Places API (New) Text Search.
 * Read-only. Usage: npm run find:gbp
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { config as loadEnv } from 'dotenv'

const CANDIDATES = [
  '(702) 289-0758',
  'K2 Analytics INC',
  '702 Pros',
  'Lightning Design Las Vegas',
  'First Impression Las Vegas web design',
] as const

const LAS_VEGAS_LAT = 36.1699
const LAS_VEGAS_LNG = -115.1398
const LAS_VEGAS_RADIUS_M = 50_000

const SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText'
const FIELD_MASK =
  'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

type PlaceDisplayName = {
  text?: string
}

type PlaceResult = {
  id?: string
  displayName?: PlaceDisplayName
  formattedAddress?: string
  rating?: number
  userRatingCount?: number
}

type SearchTextResponse = {
  places?: PlaceResult[]
}

function requireEnv(name: string, value: string | undefined): string {
  if (!value || !String(value).trim()) {
    console.error(`Missing required environment variable: ${name}`)
    process.exit(1)
  }
  return value.trim()
}

async function searchPlaces(apiKey: string, textQuery: string): Promise<Response> {
  return fetch(SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery,
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
}

function formatPlace(place: PlaceResult): string {
  const name = place.displayName?.text ?? '(no name)'
  const address = place.formattedAddress ?? '(no address)'
  const rating = place.rating ?? '—'
  const count = place.userRatingCount ?? '—'
  const id = place.id ?? '(no id)'
  return `${name} | ${address} | ${rating} | ${count} | ${id}`
}

async function main(): Promise<void> {
  loadEnv({ path: join(ROOT, '.env.local') })
  const apiKey = requireEnv('PLACES_API_KEY', process.env.PLACES_API_KEY)

  for (const query of CANDIDATES) {
    console.log(`\n${query}`)

    const response = await searchPlaces(apiKey, query)
    if (!response.ok) {
      const body = await response.text()
      console.log(`  ${response.status}`)
      console.log(`  ${body}`)
      continue
    }

    const data = (await response.json()) as SearchTextResponse
    const top = (data.places ?? []).slice(0, 2)

    if (top.length === 0) {
      console.log('  (no results)')
      continue
    }

    for (const place of top) {
      console.log(`  ${formatPlace(place)}`)
    }
  }
}

void main()
