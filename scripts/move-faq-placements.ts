/**
 * Move the cost and timeline FAQs to placement "both" so they appear on
 * the homepage and in its FAQPage schema. Default: dry run. Pass --execute
 * to write. Aborts if any question does not match exactly one document.
 *
 * Run: pnpm move:faq-placements
 *      pnpm move:faq-placements -- --execute
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient, type SanityClient } from '@sanity/client'
import { config as loadEnv } from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

const API_VERSION = '2025-12-05'

type Placement = 'homepage' | 'faqPage' | 'both'

type FaqDoc = {
  _id: string
  question: string
  answer: string
  placement: string
  sortOrder: number
}

type FaqPlacementMove = {
  question: string
  placement: Placement
}

const FAQ_PLACEMENT_MOVES: FaqPlacementMove[] = [
  {
    question: 'How much does a website project cost?',
    placement: 'both',
  },
  {
    question: 'How long does a website project take?',
    placement: 'both',
  },
]

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
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  )
  const dataset = requireEnv('NEXT_PUBLIC_SANITY_DATASET', process.env.NEXT_PUBLIC_SANITY_DATASET)
  const token = requireEnv(
    'SANITY_API_WRITE_TOKEN',
    process.env.SANITY_API_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
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
  console.log(isExecute ? 'EXECUTE' : 'DRY RUN')
  console.log('')

  const client = createWriteClient()
  const faqs = await client.fetch<FaqDoc[]>(
    `*[_type == "faq"] | order(sortOrder asc){ _id, question, answer, placement, sortOrder }`,
  )

  console.log(`Live FAQ documents: ${faqs.length}`)
  console.log('')

  const resolved: Array<{ move: FaqPlacementMove; doc: FaqDoc }> = []
  const matchErrors: string[] = []

  for (const move of FAQ_PLACEMENT_MOVES) {
    const matches = faqs.filter((faq) => faq.question === move.question)

    if (matches.length !== 1) {
      const found =
        matches.length === 0
          ? 'none'
          : matches.map((match) => `${match._id} ("${match.question}")`).join(', ')
      matchErrors.push(
        `Expected exactly one document for "${move.question}", found ${matches.length}: ${found}`,
      )
      continue
    }

    resolved.push({ move, doc: matches[0] })
  }

  if (matchErrors.length > 0) {
    console.error('Aborting — no documents written.')
    for (const error of matchErrors) {
      console.error(`  ${error}`)
    }
    process.exit(1)
  }

  console.log('Matched documents:')
  for (const { doc } of resolved) {
    console.log(`  ${doc._id} — ${doc.question}`)
  }
  console.log('')

  const total = resolved.length
  const updatedIds: string[] = []
  const unchangedIds: string[] = []
  let index = 0

  for (const { move, doc } of resolved) {
    index++
    const placementChanged = doc.placement !== move.placement

    console.log(`[${index}/${total}] ${doc._id}`)
    console.log(`  Question: ${doc.question}`)
    console.log(`  Current placement: ${doc.placement} · sortOrder: ${doc.sortOrder}`)
    console.log(`  New placement:     ${move.placement}`)

    if (placementChanged && isExecute) {
      await client.patch(doc._id).set({ placement: move.placement }).commit()
    }

    if (!placementChanged) {
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
  }
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
