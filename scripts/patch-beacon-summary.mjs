#!/usr/bin/env node
/**
 * One-off patch: replace summary copy on the
 * Beacon of Light Music case study.
 *
 * USAGE
 *   node --env-file=.env.local scripts/patch-beacon-summary.mjs
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
const DOCUMENT_IDS = [DOCUMENT_ID, `drafts.${DOCUMENT_ID}`]

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

const summary =
  'Michael Aaron Dreyer needed a home for his music that felt like the work itself. We built a catalog site with his songs, story, and prayer wall in one place — and handed him the keys so new releases go up without a developer.'

function isNotFoundError(err) {
  return (
    err !== null &&
    typeof err === 'object' &&
    'statusCode' in err &&
    err.statusCode === 404
  )
}

try {
  for (const id of DOCUMENT_IDS) {
    try {
      await client.patch(id).set({ summary }).commit()
      console.log(`Patched case study _id: ${id}`)
    } catch (err) {
      if (isNotFoundError(err)) {
        console.log(`Skipped missing document _id: ${id}`)
        continue
      }
      throw err
    }
  }
} catch (err) {
  console.error('Failed to patch Beacon of Light Music case study:')
  if (err instanceof Error) {
    console.error(err.message)
  } else {
    console.error(err)
  }
  process.exit(1)
}
