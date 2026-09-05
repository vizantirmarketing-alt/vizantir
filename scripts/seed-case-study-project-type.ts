/**
 * Seed projectType on all published case studies.
 * Distinguishes commissioned client work from self-initiated studio work.
 *
 * Default: dry run. Pass --execute to write.
 *
 * Run: pnpm seed:case-study-project-type
 *      pnpm seed:case-study-project-type -- --execute
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient, type SanityClient } from '@sanity/client'
import { config as loadEnv } from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

const API_VERSION = '2025-12-05'

type ProjectType = 'client' | 'studio'

const CASE_STUDY_PROJECT_TYPES = [
  { slug: 'elorae-nails', projectType: 'client' },
  { slug: 'beacon-of-light-music', projectType: 'client' },
  { slug: 'evolve-dance-center', projectType: 'client' },
  { slug: 'golden-era-integra', projectType: 'client' },
  { slug: 'pink-salt-salon', projectType: 'client' },
  { slug: 'essence-of-watches', projectType: 'studio' },
  { slug: 'meridian-row', projectType: 'studio' },
  { slug: 'high-roller-legal', projectType: 'studio' },
  { slug: 'fuji-omakase', projectType: 'studio' },
  { slug: 'eclat-lounge', projectType: 'studio' },
  { slug: 'petale-fete', projectType: 'studio' },
] as const

type CaseStudyDoc = {
  _id: string
  title: string
  slug: string
  projectType: ProjectType | null
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
  const isExecute = process.argv.includes('--execute')
  const mapping = CASE_STUDY_PROJECT_TYPES.map((row) => ({
    slug: row.slug,
    projectType: row.projectType,
  }))
  const client = createWriteClient()

  console.log(isExecute ? 'EXECUTE' : 'DRY RUN')
  console.log('')

  const docs = await client.fetch<CaseStudyDoc[]>(
    `*[_type == "caseStudy" && !(_id in path("drafts.**"))]{
      _id,
      title,
      "slug": slug.current,
      projectType
    }`
  )

  const expectedSlugs = new Set(CASE_STUDY_PROJECT_TYPES.map((row) => row.slug))
  const matchErrors: string[] = []

  for (const row of mapping) {
    const matches = docs.filter((doc) => doc.slug === row.slug)
    if (matches.length !== 1) {
      const found =
        matches.length === 0
          ? 'none'
          : matches.map((match) => `${match._id} ("${match.title}")`).join(', ')
      matchErrors.push(
        `Expected exactly one document for slug "${row.slug}", found ${matches.length}: ${found}`
      )
    }
  }

  const unexpected = docs.filter(
    (doc) => !expectedSlugs.has(doc.slug as (typeof CASE_STUDY_PROJECT_TYPES)[number]['slug'])
  )
  for (const doc of unexpected) {
    matchErrors.push(
      `Unexpected published case study (not in projectType mapping): ${doc.slug} (${doc._id})`
    )
  }

  if (matchErrors.length > 0) {
    console.error('Aborting — no documents written.')
    for (const error of matchErrors) {
      console.error(`  ${error}`)
    }
    process.exit(1)
  }

  const bySlug = new Map(docs.map((doc) => [doc.slug, doc]))

  console.log('Matched documents:')
  for (const row of mapping) {
    const doc = bySlug.get(row.slug)
    if (!doc) continue
    console.log(`  ${doc._id} — ${doc.title} (${row.slug}) → ${row.projectType}`)
  }
  console.log('')

  const total = mapping.length
  const updatedIds: string[] = []
  const unchangedIds: string[] = []
  let index = 0

  for (const row of mapping) {
    const doc = bySlug.get(row.slug)
    if (!doc) continue
    index++
    const current = doc.projectType ?? 'unset'
    const typeChanged = doc.projectType !== row.projectType

    console.log(`[${index}/${total}] ${doc._id}`)
    console.log(`  Title: ${doc.title}`)
    console.log(`  Slug: ${row.slug}`)
    console.log(`  Current: ${current}`)
    console.log(`  New:     ${row.projectType}`)

    if (typeChanged && isExecute) {
      await client.patch(doc._id).set({ projectType: row.projectType }).commit()
    }

    if (!typeChanged) {
      unchangedIds.push(doc._id)
      console.log('  Status: unchanged')
      console.log('')
      continue
    }

    updatedIds.push(doc._id)
    console.log(isExecute ? '  Status: updated' : '  Status: would update')
    console.log('')
  }

  console.log('Summary')
  console.log(`  Patches:            ${total}`)
  console.log(`  ${isExecute ? 'Updated' : 'Would update'}:       ${updatedIds.length}`)
  console.log(`  Unchanged:          ${unchangedIds.length}`)

  if (!isExecute) {
    console.log('')
    console.log('Dry run complete — no writes. Pass --execute to patch documents in Sanity.')
    return
  }

  const verified = await client.fetch<
    { title: string; slug: string; projectType: ProjectType }[]
  >(
    `*[_type == "caseStudy" && !(_id in path("drafts.**"))] | order(coalesce(sortOrder, 999) asc, _updatedAt desc){
      title,
      "slug": slug.current,
      projectType
    }`
  )

  console.log('')
  console.log('Verified projectType after seed:')
  verified.forEach((doc, verifiedIndex) => {
    console.log(`  ${verifiedIndex + 1}. ${doc.projectType}  ${doc.title}  (${doc.slug})`)
  })
}

main().catch((err: unknown) => {
  console.error('Failed to seed case study projectType:')
  if (err instanceof Error) {
    console.error(err.message)
    if (err.stack) console.error(err.stack)
  } else {
    console.error(err)
  }
  process.exit(1)
})
