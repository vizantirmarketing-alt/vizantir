/**
 * Migrate service.landing-pages from a dotted deterministic _id to a
 * Sanity-generated UUID so the document is publicly readable under the
 * dataset ACL path("*") rule.
 *
 * Run: pnpm migrate:landing-pages-id
 *
 * Safety: if create or public verification fails, the old doc is left intact.
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient, type SanityClient, type SanityDocument } from '@sanity/client'
import { config as loadEnv } from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

const API_VERSION = '2025-12-05'
const OLD_ID = 'service.landing-pages'
const SLUG = 'landing-pages'

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

function createPublicClient(): SanityClient {
  const projectId = requireEnv(
    'NEXT_PUBLIC_SANITY_PROJECT_ID',
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  )
  const dataset = requireEnv('NEXT_PUBLIC_SANITY_DATASET', process.env.NEXT_PUBLIC_SANITY_DATASET)

  return createClient({
    projectId,
    dataset,
    apiVersion: API_VERSION,
    useCdn: false,
  })
}

function stripSystemFields(doc: SanityDocument): Record<string, unknown> {
  const {
    _id: _omitId,
    _rev: _omitRev,
    _createdAt: _omitCreatedAt,
    _updatedAt: _omitUpdatedAt,
    ...rest
  } = doc
  return rest
}

async function main() {
  const client = createWriteClient()
  const publicClient = createPublicClient()

  // 1–2. Fetch current doc; abort if missing
  let existing: SanityDocument | undefined
  try {
    console.log(`Fetching document ${OLD_ID}…`)
    existing = await client.getDocument(OLD_ID)
  } catch (err: unknown) {
    console.error('Failed to fetch old document:')
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  }

  if (!existing) {
    console.error(`Document not found: ${OLD_ID}`)
    console.error('Nothing to migrate. Exiting.')
    process.exit(1)
  }

  console.log(`  Found: ${existing._id} (${existing._type})`)

  // 3. Strip system fields
  const strippedDoc = stripSystemFields(existing)

  // 4–5. Create new UUID doc (do NOT delete old yet)
  let newId: string
  try {
    console.log('Creating replacement document with auto-generated UUID…')
    const created = await client.create(strippedDoc)
    newId = created._id
    console.log(`  New UUID: ${newId}`)
  } catch (err: unknown) {
    console.error('Failed to create replacement document. Old doc left intact.')
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  }

  // 6. Verify public readability (token-less client)
  let publiclyReadable = false
  try {
    console.log('Verifying public (token-less) readability…')
    const publicDoc = await publicClient.fetch<{ _id: string; slug?: string } | null>(
      `*[_id == $id][0]{ _id, "slug": slug.current }`,
      { id: newId }
    )

    if (publicDoc?._id === newId && publicDoc.slug === SLUG) {
      publiclyReadable = true
      console.log('  Public verification: SUCCESS')
      console.log(`  Public fetch: ${JSON.stringify(publicDoc)}`)
    } else {
      console.error('  Public verification: FAILURE')
      console.error(`  Expected _id=${newId} slug=${SLUG}, got: ${JSON.stringify(publicDoc)}`)
    }
  } catch (err: unknown) {
    console.error('  Public verification: FAILURE (request error)')
    console.error(err instanceof Error ? err.message : err)
  }

  if (!publiclyReadable) {
    console.error('')
    console.error('Aborting delete. Both documents remain:')
    console.error(`  Old: ${OLD_ID}`)
    console.error(`  New: ${newId}`)
    console.error('Investigate ACL / visibility before deleting the old doc.')
    process.exit(1)
  }

  // 7. Delete old dotted-ID doc
  try {
    console.log(`Deleting old document ${OLD_ID}…`)
    await client.delete(OLD_ID)
    console.log('  Deleted.')
  } catch (err: unknown) {
    console.error(`Failed to delete old document ${OLD_ID}. New doc remains.`)
    console.error(`  New UUID: ${newId}`)
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  }

  // 8–9. Final state
  let oldStillExists = false
  try {
    const leftover = await client.getDocument(OLD_ID)
    oldStillExists = Boolean(leftover)
  } catch (err: unknown) {
    console.error('Warning: could not confirm old doc deletion:')
    console.error(err instanceof Error ? err.message : err)
  }

  console.log('')
  console.log('=== Migration complete ===')
  console.log(`  New UUID: ${newId}`)
  console.log(`  Old doc gone: ${oldStillExists ? 'NO — still present' : 'YES'}`)
  console.log(`  Verify URL: /services/${SLUG}`)
}

main().catch((err: unknown) => {
  console.error('Migration failed:')
  if (err instanceof Error) {
    console.error(err.message)
    if (err.stack) console.error(err.stack)
  } else {
    console.error(err)
  }
  process.exit(1)
})
