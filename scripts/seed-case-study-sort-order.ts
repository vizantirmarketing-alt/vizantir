/**
 * Seed sortOrder on all published case studies.
 * Real client work first (10–60), concept projects after (70–110),
 * in gaps of 10.
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

/**
 * Real client work (10–60), then concept projects (70–110) in their
 * previous relative order.
 */
const CASE_STUDY_SORT_ORDER = [
  { slug: 'evolve-dance-center', sortOrder: 10 },
  { slug: 'pink-salt-salon', sortOrder: 20 },
  { slug: 'beacon-of-light-music', sortOrder: 30 },
  { slug: 'elorae-nails', sortOrder: 40 },
  { slug: 'golden-era-integra', sortOrder: 50 },
  { slug: 'essence-of-watches', sortOrder: 60 },
  { slug: 'petale-fete', sortOrder: 70 },
  { slug: 'high-roller-legal', sortOrder: 80 },
  { slug: 'meridian-row', sortOrder: 90 },
  { slug: 'fuji-omakase', sortOrder: 100 },
  { slug: 'eclat-lounge', sortOrder: 110 },
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
  return CASE_STUDY_SORT_ORDER.map((row) => ({
    slug: row.slug,
    sortOrder: row.sortOrder,
  }))
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
  const expectedSlugs = new Set(CASE_STUDY_SORT_ORDER.map((row) => row.slug))
  const unexpected = docs.filter(
    (doc) => !expectedSlugs.has(doc.slug as (typeof CASE_STUDY_SORT_ORDER)[number]['slug'])
  )
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
