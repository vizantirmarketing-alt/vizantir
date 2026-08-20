#!/usr/bin/env node
/**
 * One-off seed: Beacon of Light Music case study.
 * Idempotent via createIfNotExists with a fixed _id.
 *
 * USAGE
 *   node --env-file=.env.local scripts/seed-beacon-of-light.mjs
 *
 * REQUIRES SANITY_API_WRITE_TOKEN in .env.local.
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient } from '@sanity/client'
import { config as loadEnv } from 'dotenv'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
loadEnv({ path: join(ROOT, '.env.local') })

const DOCUMENT_ID = 'caseStudy-beacon-of-light-music'

const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-12-05'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const token = process.env.SANITY_API_WRITE_TOKEN

if (!token) {
  console.error(
    'Missing SANITY_API_WRITE_TOKEN. Add it to .env.local and re-run this script.'
  )
  process.exit(1)
}

if (projectId === undefined) {
  console.error('Missing environment variable: NEXT_PUBLIC_SANITY_PROJECT_ID')
  process.exit(1)
}

if (dataset === undefined) {
  console.error('Missing environment variable: NEXT_PUBLIC_SANITY_DATASET')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
})

const doc = {
  _id: DOCUMENT_ID,
  _type: 'caseStudy',
  title: 'Beacon of Light Music',
  slug: { _type: 'slug', current: 'beacon-of-light-music' },
  client: 'Beacon of Light Music',
  industry: 'Music',
  siteUrl: 'https://beaconoflightmusic.org',
  featured: false,
  stack: ['Next.js', 'TypeScript', 'Sanity CMS', 'Resend', 'Vercel'],
  summary:
    'A Las Vegas artist needed a home for his music that felt like the work itself. We built a catalog site with his songs, story, and prayer wall in one place — and handed him the keys so new releases go up without a developer.',
}

try {
  const created = await client.createIfNotExists(doc)
  console.log(`Created case study _id: ${created._id}`)
} catch (err) {
  console.error('Failed to seed Beacon of Light Music case study:')
  if (err instanceof Error) {
    console.error(err.message)
  } else {
    console.error(err)
  }
  process.exit(1)
}
