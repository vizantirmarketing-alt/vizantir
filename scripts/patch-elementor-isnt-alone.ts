/**
 * One-off: insert the "Elementor isn't alone" section into the published
 * Elementor renewal post, immediately before the existing H2
 * "How Vizantir handles this differently".
 *
 * Prefer draft if it exists; otherwise patch the published document.
 * Requires --allow-production.
 * Run: npm run patch:elementor-isnt-alone -- --allow-production
 */

import { randomBytes } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient, type SanityClient } from '@sanity/client'
import { config as loadEnv } from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

const API_VERSION = '2025-12-05'
const PRODUCTION_DATASET = 'production'

const PUBLISHED_ID =
  'post-the-elementor-renewal-charge-that-wasnt-supposed-to-happen'
const DRAFT_ID = `drafts.${PUBLISHED_ID}`
const TARGET_H2 = 'How Vizantir handles this differently'

type Span = {
  _type: 'span'
  _key: string
  text: string
  marks: string[]
}

type Block = {
  _type: 'block'
  _key: string
  style: 'normal' | 'h2'
  markDefs: []
  children: Span[]
  listItem?: 'bullet'
  level?: number
}

type PostDoc = {
  _id: string
  _type: 'post'
  body?: Block[]
  [key: string]: unknown
}

function key(): string {
  return randomBytes(6).toString('hex')
}

function block(style: 'normal' | 'h2', text: string): Block {
  return {
    _type: 'block',
    _key: key(),
    style,
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: key(),
        text,
        marks: [],
      },
    ],
  }
}

function h2(text: string): Block {
  return block('h2', text)
}

function normal(text: string): Block {
  return block('normal', text)
}

function blockPlainText(b: Block): string {
  return (b.children ?? []).map((c) => c.text ?? '').join('')
}

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

function newBlocks(): Block[] {
  return [
    h2("Elementor isn't alone"),
    normal(
      "The auto-renewal pattern isn't specific to Elementor. Divi, Bricks, and Beaver Builder all auto-renew annual licenses by default. WPBakery, sold through Envato, auto-renews its support license through Envato's checkout. Every one of them has a documented complaint history around unexpected renewal charges."
    ),
    normal(
      "What makes Elementor the case study is two things. It has the largest install base, so the complaint volume is public and searchable. And it doesn't offer a lifetime license option, which is how Divi, Bricks, and Beaver defuse most of the renewal frustration. On Elementor, the annual charge is the only version of the deal."
    ),
    normal(
      "If your WordPress site was built by an agency and you don't remember which page builder they used, the renewal is probably already on your card, on a schedule you don't control. This isn't a page builder problem. It's a page builder business model problem."
    ),
  ]
}

async function resolveTarget(
  client: SanityClient
): Promise<{ id: string; doc: PostDoc }> {
  const draft = (await client.getDocument(DRAFT_ID)) as PostDoc | undefined
  if (draft) {
    return { id: DRAFT_ID, doc: draft }
  }

  const published = (await client.getDocument(PUBLISHED_ID)) as
    | PostDoc
    | undefined
  if (published) {
    return { id: PUBLISHED_ID, doc: published }
  }

  console.error(
    `Neither draft (${DRAFT_ID}) nor published (${PUBLISHED_ID}) document found.`
  )
  process.exit(1)
}

async function main() {
  if (!process.argv.includes('--allow-production')) {
    console.error(
      'Refusing to run: pass --allow-production to write to the production dataset.'
    )
    process.exit(1)
  }

  console.warn(
    'WARNING: Writing to the production dataset (--allow-production was passed).'
  )

  const client = createWriteClient(PRODUCTION_DATASET)
  const { id, doc } = await resolveTarget(client)

  const body = Array.isArray(doc.body) ? [...doc.body] : []
  const insertIndex = body.findIndex(
    (b) => b._type === 'block' && b.style === 'h2' && blockPlainText(b) === TARGET_H2
  )

  if (insertIndex === -1) {
    console.error(
      `Target H2 "${TARGET_H2}" not found in body of ${id}. Aborting without write.`
    )
    process.exit(1)
  }

  const toInsert = newBlocks()
  body.splice(insertIndex, 0, ...toInsert)

  const updated: PostDoc = {
    ...doc,
    _id: id,
    body,
  }

  console.log(`Updating document: ${id}`)
  console.log(`Insert index: ${insertIndex}`)
  console.log(`Blocks added: ${toInsert.length}`)

  const result = await client.createOrReplace(updated)
  console.log('Sanity response:')
  console.log(JSON.stringify(result, null, 2))
  console.log('Done.')
}

main().catch((err: unknown) => {
  console.error('patch-elementor-isnt-alone failed:')
  if (err instanceof Error) {
    console.error(err.message)
    if (err.stack) console.error(err.stack)
  } else {
    console.error(err)
  }
  process.exit(1)
})
