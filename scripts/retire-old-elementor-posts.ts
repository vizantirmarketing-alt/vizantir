/**
 * One-off: delete two retired Elementor comparison posts (and draft twins)
 * from the production Sanity dataset.
 *
 * Requires --allow-production.
 * Run: npm run retire:old-elementor-posts -- --allow-production
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient, type SanityClient } from '@sanity/client'
import { config as loadEnv } from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

const API_VERSION = '2025-12-05'
const PRODUCTION_DATASET = 'production'

const IDS_TO_DELETE = [
  'post-the-elementor-lock-in-that-never-shows-up-on-the-invoice',
  'drafts.post-the-elementor-lock-in-that-never-shows-up-on-the-invoice',
  'post-what-vizantir-tells-you-before-you-sign-that-elementor-doesnt',
  'drafts.post-what-vizantir-tells-you-before-you-sign-that-elementor-doesnt',
] as const

function requireEnv(name: string, value: string | undefined): string {
  if (!value || !String(value).trim()) {
    console.error(`Missing required environment variable: ${name}`)
    process.exit(1)
  }
  return value.trim()
}

function createWriteClient(dataset: string): SanityClient {
  loadEnv({ path: join(ROOT, '.env.local') })

  const projectId = requireEnv(
    'NEXT_PUBLIC_SANITY_PROJECT_ID',
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  )
  const token = requireEnv(
    'SANITY_API_WRITE_TOKEN',
    process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_TOKEN
  )

  return createClient({
    projectId,
    dataset,
    token,
    apiVersion: API_VERSION,
    useCdn: false,
  })
}

async function deleteIfExists(client: SanityClient, id: string): Promise<void> {
  const doc = await client.getDocument(id)
  if (!doc) {
    console.log(`Skip (not found): ${id}`)
    return
  }

  await client.delete(id)
  console.log(`Deleted: ${id}`)
}

async function main() {
  if (!process.argv.includes('--allow-production')) {
    console.error(
      'Refusing to run: pass --allow-production to delete from the production dataset.'
    )
    process.exit(1)
  }

  console.warn(
    'WARNING: Deleting documents from the production dataset (--allow-production was passed).'
  )

  const client = createWriteClient(PRODUCTION_DATASET)
  console.log(
    `Retiring ${IDS_TO_DELETE.length} document IDs from dataset "${PRODUCTION_DATASET}"...`
  )

  for (const id of IDS_TO_DELETE) {
    try {
      await deleteIfExists(client, id)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      // Document not found / already gone — continue
      if (
        message.includes('not found') ||
        message.includes('Document not found') ||
        message.includes('HTTP 404')
      ) {
        console.log(`Skip (not found): ${id}`)
        continue
      }
      throw err
    }
  }

  console.log('Done.')
}

main().catch((err: unknown) => {
  console.error('retire-old-elementor-posts failed:')
  if (err instanceof Error) {
    console.error(err.message)
    if (err.stack) console.error(err.stack)
  } else {
    console.error(err)
  }
  process.exit(1)
})
