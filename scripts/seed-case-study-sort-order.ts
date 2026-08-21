/**
 * Seed sortOrder on all published case studies.
 * Evolve is pinned first (10). Remaining docs follow the 2026-08-21
 * production /case-studies visual order, in gaps of 10.
 *
 * Default: dry run. Pass --live to write.
 *
 * Run: pnpm seed:case-study-sort-order
 *      pnpm seed:case-study-sort-order:live
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient, type SanityClient } from '@sanity/client'
import { config as loadEnv } from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

const API_VERSION = '2025-12-05'
const PINNED_FIRST = 'evolve-dance-center'

/**
 * Production /case-studies order as of 2026-08-21, before this seed.
 * High Roller Legal had a later _updatedAt in Sanity but had not
 * reshuffled the live page yet — this list is the visual order, not the query.
 */
const LIVE_VISUAL_ORDER = [
  'essence-of-watches',
  'beacon-of-light-music',
  'evolve-dance-center',
  'petale-fete',
  'high-roller-legal',
  'golden-era-integra',
  'meridian-row',
  'fuji-omakase',
  'pink-salt-salon',
  'eclat-lounge',
  'elorae-nails',
] as const

type CaseStudyDoc = {
  _id: string
  title: string
  slug: string
  sortOrder: number | null
}

function requireEnv(name: string, value: string | undefined): string {
  if (!value || !String(value).trim()) {
    console.error(`Missing required environment variable: ${name}`)
    console.error(
      'Add a Sanity write token as SANITY_API_TOKEN or SANITY_API_WRITE_TOKEN in .env.local.'
    )
    process.exit(1)
  }
  return value.trim()
}

function buildSortMapping(): { slug: string; sortOrder: number }[] {
  const remaining = LIVE_VISUAL_ORDER.filter((slug) => slug !== PINNED_FIRST)
  return [
    { slug: PINNED_FIRST, sortOrder: 10 },
    ...remaining.map((slug, index) => ({
      slug,
      sortOrder: (index + 2) * 10,
    })),
  ]
}

function createWriteClient(): SanityClient {
  loadEnv({ path: join(ROOT, '.env.local') })

  const projectId = requireEnv(
    'NEXT_PUBLIC_SANITY_PROJECT_ID',
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  )
  const dataset = requireEnv('NEXT_PUBLIC_SANITY_DATASET', process.env.NEXT_PUBLIC_SANITY_DATASET)
  const token = requireEnv(
    'SANITY_API_TOKEN or SANITY_API_WRITE_TOKEN',
    process.env.SANITY_API_TOKEN || process.env.SANITY_API_WRITE_TOKEN
  )

  return createClient({
    projectId,
    dataset,
    token,
    apiVersion: API_VERSION,
    useCdn: false,
  })
}

async function main() {
  const isLive = process.argv.includes('--live')
  const mapping = buildSortMapping()
  const client = createWriteClient()

  console.log(isLive ? 'LIVE' : 'DRY RUN')
  console.log('')

  const docs = await client.fetch<CaseStudyDoc[]>(
    `*[_type == "caseStudy" && !(_id in path("drafts.**"))]{
      _id,
      title,
      "slug": slug.current,
      sortOrder
    }`
  )

  const bySlug = new Map(docs.map((doc) => [doc.slug, doc]))
  const expectedSlugs = new Set(LIVE_VISUAL_ORDER)
  const unexpected = docs.filter((doc) => !expectedSlugs.has(doc.slug as (typeof LIVE_VISUAL_ORDER)[number]))
  const missing = mapping.filter((row) => !bySlug.has(row.slug))

  if (missing.length > 0) {
    console.error('Missing published case studies:')
    for (const row of missing) {
      console.error(`  ${row.slug}`)
    }
    process.exit(1)
  }

  if (unexpected.length > 0) {
    console.error('Unexpected published case studies (not in live visual order):')
    for (const doc of unexpected) {
      console.error(`  ${doc.slug} (${doc._id})`)
    }
    process.exit(1)
  }

  if (docs.length !== mapping.length) {
    console.error(`Expected ${mapping.length} published case studies, found ${docs.length}.`)
    process.exit(1)
  }

  console.log('Final mapping:')
  for (const row of mapping) {
    const doc = bySlug.get(row.slug)
    if (!doc) continue
    const current = doc.sortOrder ?? 'unset'
    console.log(`  ${String(row.sortOrder).padStart(3)}  ${doc.title}  (${row.slug})  [${current} → ${row.sortOrder}]`)
  }
  console.log('')

  if (!isLive) {
    console.log('Dry run complete — no writes. Pass --live to write to Sanity.')
    return
  }

  for (const row of mapping) {
    const doc = bySlug.get(row.slug)
    if (!doc) continue
    await client.patch(doc._id).set({ sortOrder: row.sortOrder }).commit()
    console.log(`Patched ${row.slug} → ${row.sortOrder}`)
  }

  const verified = await client.fetch<{ title: string; slug: string; sortOrder: number }[]>(
    `*[_type == "caseStudy" && !(_id in path("drafts.**"))] | order(coalesce(sortOrder, 999) asc, _updatedAt desc){
      title,
      "slug": slug.current,
      sortOrder
    }`
  )

  console.log('')
  console.log('Verified Sanity order after seed:')
  verified.forEach((doc, index) => {
    console.log(`  ${index + 1}. ${doc.sortOrder}  ${doc.title}  (${doc.slug})`)
  })
}

main().catch((err: unknown) => {
  console.error('Failed to seed case study sortOrder:')
  if (err instanceof Error) {
    console.error(err.message)
    if (err.stack) console.error(err.stack)
  } else {
    console.error(err)
  }
  process.exit(1)
})
