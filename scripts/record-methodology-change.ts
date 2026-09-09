/**
 * Record a methodology change in intel_events at its cutover.
 *
 * Invariant 13 (docs/SEARCH_INTELLIGENCE_ARCHITECTURE.md): a change to how a
 * metric is computed is recorded as one, so a later reader comparing periods
 * across the cutover sees the marker instead of inferring an organic move.
 * intel_events is read into the Overview activity feed by fetchRecordedEvents,
 * which puts the marker in the chronological record at its own date.
 *
 * RUN THIS AT THE CUTOVER — after the behaviour change is deployed, not when
 * the code is written. The row asserts that the method changed; asserting it
 * before deploy would be false if the change never ships.
 *
 * Idempotent. Re-running with --live cannot create a second event and cannot
 * modify the existing one. Two independent mechanisms guarantee that; see
 * CONFLICT_TARGET below for why both exist.
 *
 * Usage:
 *   npx tsx scripts/record-methodology-change.ts --help
 *   npx tsx scripts/record-methodology-change.ts --list
 *   npx tsx scripts/record-methodology-change.ts detector-window --dry-run
 *   npx tsx scripts/record-methodology-change.ts detector-window --live
 *
 * Or via package.json:
 *   npm run record:methodology -- detector-window --live
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { config as loadEnv } from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

/**
 * The column PostgREST must use to detect the conflict.
 *
 * `Prefer: resolution=ignore-duplicates` alone is NOT enough. PostgREST infers
 * the ON CONFLICT target from the primary key unless `on_conflict` names a
 * different column. intel_events.id is a generated identity that this script
 * never supplies, so a primary-key conflict can never occur: the DO NOTHING
 * clause never fires, and the dedupe_key unique violation surfaces as
 * Postgres 23505 / HTTP 409 instead of being skipped.
 *
 * Verified against the live database:
 *   POST /intel_events                        -> 409 23505 (violation raised)
 *   POST /intel_events?on_conflict=dedupe_key -> 201 []     (insert skipped)
 *
 * `ignore-duplicates` is DO NOTHING, not DO UPDATE — an existing event is left
 * byte-for-byte untouched, which is what we want. Never switch this to
 * `merge-duplicates`: that would rewrite the recorded cutover, and the whole
 * point of the row is that it is a fixed historical marker.
 */
const CONFLICT_TARGET = 'dedupe_key'

/** Postgres unique_violation. The fallback path below treats it as "already recorded". */
const UNIQUE_VIOLATION = '23505'

type MethodologyChange = {
  key: string
  dedupeKey: string
  title: string
  detail: string
}

const CHANGES: readonly MethodologyChange[] = [
  {
    key: 'detector-window',
    dedupeKey: 'methodology:detector-window-completed-day',
    title: 'Detector window corrected to the completed-day rule',
    detail:
      'Detectors previously analysed a 28-day window ending today-2, which ' +
      'included the trailing GSC day that the sync zero-fills before Google ' +
      'has finalised it. They now end on today-3 via latestCompleteDay, the ' +
      'same rule the dashboard already used for display. Group impressions ' +
      'and CTR rise slightly as a result, so findings sitting near a ' +
      'threshold may appear or disappear once. Findings changing at this date ' +
      'reflect the corrected method, not a change in site performance. ' +
      'Comparisons spanning this date are not like-for-like. Pre-correction ' +
      'baseline: docs/intel/baselines/2026-09-09-detector-window-pre-correction.json',
  },
]

function readErrorCode(body: unknown): string | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return null
  }
  const code = Reflect.get(body, 'code')
  return typeof code === 'string' ? code : null
}

function requireEnv(name: string, value: string | undefined): string {
  if (!value || !String(value).trim()) {
    console.error(`Missing required environment variable: ${name}`)
    process.exit(1)
  }
  return value.trim()
}

function usage(exitCode: number): never {
  console.log('Usage: record-methodology-change.ts <key> [--live|--dry-run]')
  console.log('       record-methodology-change.ts --list')
  console.log('       record-methodology-change.ts --help')
  console.log('')
  console.log('Default is --dry-run. --live writes one intel_events row.')
  console.log('Running --live repeatedly is safe: it cannot create a duplicate')
  console.log('and cannot modify an event that already exists.')
  console.log('')
  console.log('Known changes:')
  for (const change of CHANGES) {
    console.log(`  ${change.key.padEnd(20)} ${change.title}`)
  }
  process.exit(exitCode)
}

async function main(): Promise<void> {
  loadEnv({ path: join(ROOT, '.env.local') })

  const args = process.argv.slice(2)
  if (args.includes('--help')) {
    usage(0)
  }
  if (args.includes('--list')) {
    for (const change of CHANGES) {
      console.log(`${change.key}\n  ${change.title}\n  dedupe_key: ${change.dedupeKey}\n`)
    }
    return
  }

  const key = args.find((arg) => !arg.startsWith('--'))
  if (key === undefined) {
    usage(1)
  }

  const change = CHANGES.find((candidate) => candidate.key === key)
  if (change === undefined) {
    console.error(`Unknown methodology change: ${key}`)
    usage(1)
  }

  const live = args.includes('--live')

  const url = requireEnv(
    'NEXT_PUBLIC_SUPABASE_URL',
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  )
  const serviceKey = requireEnv(
    'SUPABASE_SERVICE_ROLE_KEY',
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  )

  const payload = {
    event_type: 'methodology_change',
    title: change.title,
    detail: change.detail,
    source: 'system',
    dedupe_key: change.dedupeKey,
  }

  if (!live) {
    console.log('DRY RUN — pass --live to write. Payload:')
    console.log(JSON.stringify(payload, null, 2))
    return
  }

  const endpoint = `${url}/rest/v1/intel_events?on_conflict=${CONFLICT_TARGET}`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation,resolution=ignore-duplicates',
    },
    body: JSON.stringify(payload),
  })

  const body: unknown = await response.json().catch(() => null)

  // Second line of defence. With on_conflict set the server skips the insert and
  // this branch should be unreachable, but if the unique index is ever renamed
  // or reshaped so PostgREST cannot infer it, a duplicate run must still be a
  // no-op that exits 0 rather than a hard failure.
  if (response.status === 409 && readErrorCode(body) === UNIQUE_VIOLATION) {
    console.log(`Already recorded (dedupe_key ${change.dedupeKey}). No change.`)
    return
  }

  if (!response.ok) {
    console.error(`Failed: ${response.status}`)
    console.error(JSON.stringify(body, null, 2))
    process.exit(1)
  }

  const inserted = Array.isArray(body) ? body.length : 0
  if (inserted === 0) {
    console.log(`Already recorded (dedupe_key ${change.dedupeKey}). No change.`)
    return
  }

  console.log(`Recorded: ${change.title}`)
  console.log(JSON.stringify(body, null, 2))
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
