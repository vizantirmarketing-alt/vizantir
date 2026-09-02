/**
 * Create a new post document in Sanity.
 * Swap POST_DATA and run: npm run create:post
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient, type SanityClient } from '@sanity/client'
import { config as loadEnv } from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

const API_VERSION = '2025-12-05'

function requireEnv(name: string, value: string | undefined): string {
  if (!value || !String(value).trim()) {
    console.error(`Missing required environment variable: ${name}`)
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
  const token = requireEnv('SANITY_API_WRITE_TOKEN', process.env.SANITY_API_WRITE_TOKEN)

  return createClient({
    projectId,
    dataset,
    token,
    apiVersion: API_VERSION,
    useCdn: false,
  })
}

async function main() {
  const client = createWriteClient()
  const slug = POST_DATA.slug.current

  const existing = await client.fetch<{ _id: string } | null>(
    `*[_type == "post" && slug.current == $slug][0]{ _id }`,
    { slug }
  )

  if (existing) {
    console.log(`Already exists: ${slug}`)
    process.exit(0)
  }

  const created = await client.create(POST_DATA)
  console.log(created._id)
}

const POST_DATA = {
  _type: 'post',
  title: 'Two Searches, One Key: How Messy Search Data Breaks Clean Code',
  slug: {
    _type: 'slug',
    current: 'two-searches-one-key',
  },
  publishedAt: '2026-09-03T16:00:00.000Z',
  category: 'Platform',
  excerpt:
    'A detector job failed on a unique constraint that had never fired before. The cause: two real search queries that normalize to the same slug. Full walkthrough with code and SQL.',
  readTime: '7 min read',
  tags: ['search-console', 'postgres', 'typescript', 'debugging'],
  author: {
    _type: 'reference',
    _ref: 'author-james-tram',
  },
  seo: {
    metaTitle: 'Two Searches, One Key: How Messy Search Data Breaks Clean Code',
    metaDescription:
      'Two real search queries normalized to the same slug and hit a unique constraint months after shipping. A debugging walkthrough with the actual code, SQL, and fix.',
    noIndex: false,
  },
} as const

main().catch((err: unknown) => {
  console.error('Failed to create post:')
  if (err instanceof Error) {
    console.error(err.message)
    if (err.stack) console.error(err.stack)
  } else {
    console.error(err)
  }
  process.exit(1)
})
