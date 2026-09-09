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
 * Idempotent: intel_events.dedupe_key is unique with `nulls not distinct`, so
 * re-running cannot double-post.
 *
 * Usage:
 *   npx tsx scripts/record-methodology-change.ts --list
 *   npx tsx scripts/record-methodology-change.ts detector-window --dry-run
 *   npx tsx scripts/record-methodology-change.ts detector-window --live
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { config as loadEnv } from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

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

function requireEnv(name: string, value: string | undefined): string {
  if (!value || !String(value).trim()) {
    console.error(`Missing required environment variable: ${name}`)
    process.exit(1)
  }
  return value.trim()
}

function usage(): never {
  console.log('Usage: record-methodology-change.ts <key> [--live|--dry-run]')
  console.log('       record-methodology-change.ts --list')
  console.log('')
  console.log('Known changes:')
  for (const change of CHANGES) {
    console.log(`  ${change.key.padEnd(20)} ${change.title}`)
  }
  process.exit(1)
}

async function main(): Promise<void> {
  loadEnv({ path: join(ROOT, '.env.local') })

  const args = process.argv.slice(2)
  if (args.includes('--list')) {
    for (const change of CHANGES) {
      console.log(`${change.key}\n  ${change.title}\n  dedupe_key: ${change.dedupeKey}\n`)
    }
    return
  }

  const key = args.find((arg) => !arg.startsWith('--'))
  if (key === undefined) {
    usage()
  }

  const change = CHANGES.find((candidate) => candidate.key === key)
  if (change === undefined) {
    console.error(`Unknown methodology change: ${key}`)
    usage()
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

  const response = await fetch(`${url}/rest/v1/intel_events`, {
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
