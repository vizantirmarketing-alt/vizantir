/**
 * Expand the cost and timeline FAQ answers in Sanity so they stand alone
 * as extractable passages. Prices, tier names, and timelines come from
 * projectPricing — not hand-authored. Default: dry run. Pass --execute to write.
 *
 * Run: pnpm expand:faq-answers
 *      pnpm expand:faq-answers -- --execute
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient, type SanityClient } from '@sanity/client'
import { config as loadEnv } from 'dotenv'

import { projectPricing } from '../data/pricing'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

const API_VERSION = '2025-12-05'

type FaqDoc = {
  _id: string
  question: string
  answer: string
  placement: string
  sortOrder: number
}

type FaqExpansion = {
  question: string
  getAnswer: () => string
}

const essentialsTier = projectPricing.find((tier) => tier.slug === 'essentials')
const growthTier = projectPricing.find((tier) => tier.slug === 'growth')
const enterpriseTier = projectPricing.find((tier) => tier.slug === 'enterprise')

if (!essentialsTier || !growthTier || !enterpriseTier) {
  throw new Error('projectPricing is missing essentials, growth, or enterprise')
}

function weeksProse(timeline: string): string {
  const match = timeline.match(/^(\d+)[–-](\d+)(\+)? weeks$/)
  if (!match) {
    throw new Error(`Unexpected timeline format in data/pricing.ts: ${timeline}`)
  }

  const [, start, end, plus] = match
  if (plus) {
    return `${start} to ${end} weeks or more`
  }
  return `${start} to ${end} weeks`
}

function websiteCostFaqAnswer(): string {
  return `Projects start at ${essentialsTier.price} for ${essentialsTier.name}, ${growthTier.price} for ${growthTier.name}, and ${enterpriseTier.price} for ${enterpriseTier.name}. ${essentialsTier.name} covers a custom-designed marketing site built on Next.js. ${growthTier.name} adds up to 20 custom pages, a blog, integrations, SEO service and location pages, case study templates, AEO work, and 60 days of post-launch support. ${enterpriseTier.name} is for larger builds with custom application work. Vizantir is not a fit if you need a site under $10,000 or a template customization.`
}

function websiteTimelineFaqAnswer(): string {
  return `${essentialsTier.name} projects take ${weeksProse(essentialsTier.timeline)}, ${growthTier.name} projects take ${weeksProse(growthTier.timeline)}, and ${enterpriseTier.name} projects take ${weeksProse(enterpriseTier.timeline)}. The schedule covers strategy, design, development, content integration, and launch. The most common cause of delay is content, so projects move fastest when copy, photography, and brand assets are ready, or when content production is included in scope.`
}

const FAQ_EXPANSIONS: FaqExpansion[] = [
  {
    question: 'How much does a website project cost?',
    getAnswer: websiteCostFaqAnswer,
  },
  {
    question: 'How long does a website project take?',
    getAnswer: websiteTimelineFaqAnswer,
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

  const resolved: Array<{ expansion: FaqExpansion; doc: FaqDoc }> = []
  const matchErrors: string[] = []

  for (const expansion of FAQ_EXPANSIONS) {
    const matches = faqs.filter((faq) => faq.question === expansion.question)

    if (matches.length !== 1) {
      const found =
        matches.length === 0
          ? 'none'
          : matches.map((match) => `${match._id} ("${match.question}")`).join(', ')
      matchErrors.push(
        `Expected exactly one document for "${expansion.question}", found ${matches.length}: ${found}`,
      )
      continue
    }

    resolved.push({ expansion, doc: matches[0] })
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

  for (const { expansion, doc } of resolved) {
    index++
    const nextAnswer = expansion.getAnswer()
    const answerChanged = doc.answer !== nextAnswer

    console.log(`[${index}/${total}] ${doc._id}`)
    console.log(`  Question: ${doc.question}`)
    console.log(`  Placement: ${doc.placement} · sortOrder: ${doc.sortOrder}`)
    console.log(`  Current: ${doc.answer}`)
    console.log(`  New:     ${nextAnswer}`)

    if (answerChanged && isExecute) {
      await client.patch(doc._id).set({ answer: nextAnswer }).commit()
    }

    if (!answerChanged) {
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
