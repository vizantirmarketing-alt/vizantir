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
  title: 'What Website Monitoring Actually Catches',
  slug: {
    _type: 'slug',
    current: 'what-website-monitoring-actually-catches',
  },
  publishedAt: '2026-09-04T16:00:00.000Z',
  category: 'Business',
  excerpt:
    "Downtime is the failure everyone plans for, and the least common one. The failures that cost real money are quiet. Here's what monitoring is actually for.",
  readTime: '6 min read',
  tags: ['monitoring', 'maintenance', 'analytics', 'small-business'],
  author: {
    _type: 'reference',
    _ref: 'author-james-tram',
  },
  seo: {
    metaTitle: 'What Website Monitoring Actually Catches',
    metaDescription:
      'Most website failures are silent: broken tracking, stalled data syncs, forms that stop delivering. What ongoing monitoring actually catches and why nobody notices without it.',
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
