/**
 * Patch live Sanity FAQ answers that drifted from current positioning.
 * Prices and tier names are interpolated from carePricing — not hand-authored.
 * Default: dry run. Pass --execute to write.
 *
 * Run: pnpm patch:faq-corrections
 *      pnpm patch:faq-corrections -- --execute
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient, type SanityClient } from '@sanity/client'
import { config as loadEnv } from 'dotenv'

import {
  afterLaunchFaqAnswer,
  COMPETITOR_RESEARCH_FAQ_ANSWER,
  EXISTING_SITE_FAQ_ANSWER,
  PHILOSOPHY_FAQ_ANSWER,
  REDESIGN_FAQ_ANSWER,
  WORDPRESS_FAQ_ANSWER,
  WORDPRESS_REFRESH_FAQ_ANSWER,
} from './faq-correction-copy'

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

type ServiceFaqItem = {
  _key: string
  question: string
  answer: string
}

type ServiceDoc = {
  _id: string
  title: string
  slug: string
  faqs: ServiceFaqItem[] | null
}

type StandaloneFaqPatch = {
  kind: 'faq'
  id: string
  expectedId: string
  label: string
  phrase: string
  getAnswer: () => string
}

type ServiceFaqPatch = {
  kind: 'serviceFaq'
  id: string
  expectedServiceId: string
  expectedSlug: string
  expectedKey: string
  label: string
  phrase: string
  getAnswer: () => string
}

type FaqPatch = StandaloneFaqPatch | ServiceFaqPatch

const FAQ_PATCHES: FaqPatch[] = [
  {
    kind: 'faq',
    id: 'after-site-launches',
    expectedId: 'faq-50-what-happens-after-the',
    label: 'After the site launches',
    phrase: 'what happens after the site launches',
    getAnswer: afterLaunchFaqAnswer,
  },
  {
    kind: 'faq',
    id: 'nextjs-or-wordpress',
    expectedId: 'faq-30-do-you-build-in',
    label: 'Next.js or WordPress',
    phrase: 'do you build in next.js or wordpress',
    getAnswer: () => WORDPRESS_FAQ_ANSWER,
  },
  {
    kind: 'faq',
    id: 'competitor-research',
    expectedId: 'faq-36-do-you-research-my',
    label: 'Category and market research',
    phrase: 'do you research my competitors',
    getAnswer: () => COMPETITOR_RESEARCH_FAQ_ANSWER,
  },
  {
    kind: 'faq',
    id: 'redesign-existing',
    expectedId: 'faq-40-do-you-redesign-existing',
    label: 'Redesign existing websites',
    phrase: 'do you redesign existing websites',
    getAnswer: () => REDESIGN_FAQ_ANSWER,
  },
  {
    kind: 'faq',
    id: 'philosophy',
    expectedId: 'faq-60-whats-your-philosophy-on',
    label: 'Philosophy on design and results',
    phrase: "what's your philosophy on design",
    getAnswer: () => PHILOSOPHY_FAQ_ANSWER,
  },
  {
    kind: 'faq',
    id: 'existing-site',
    expectedId: 'faq-40-can-you-work-with',
    label: 'Work with an existing site or brand',
    phrase: 'can you work with an existing site',
    getAnswer: () => EXISTING_SITE_FAQ_ANSWER,
  },
  {
    kind: 'serviceFaq',
    id: 'wordpress-refresh',
    expectedServiceId: 'ef261073-0e74-4ada-9cba-413030169848',
    expectedSlug: 'website-refreshes',
    expectedKey: '910349623402',
    label: 'Refresh a WordPress site',
    phrase: 'can you refresh a wordpress site',
    getAnswer: () => WORDPRESS_REFRESH_FAQ_ANSWER,
  },
]

const FORBIDDEN_ANSWER_PATTERNS: { label: string; pattern: RegExp }[] = [
  {
    label: 'claims Vizantir runs ad campaigns',
    pattern: /run ads that track/i,
  },
  {
    label: 'claims in-place WordPress work',
    pattern: /on an existing wordpress (site|install)/i,
  },
  {
    label: 'treats WordPress migration as optional',
    pattern: /not a requirement/i,
  },
  {
    label: 'implies editing the existing platform',
    pattern: /improve from there/i,
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

function questionMatchesPhrase(question: string, phrase: string): boolean {
  return question.toLowerCase().includes(phrase.toLowerCase())
}

function applyPatchStatus(
  isExecute: boolean,
  id: string,
  changed: boolean,
  updatedIds: string[],
  unchangedIds: string[],
): void {
  if (!changed) {
    unchangedIds.push(id)
    console.log('  Status: unchanged')
    console.log('')
    return
  }

  updatedIds.push(id)
  console.log(isExecute ? '  Status: updated' : '  Status: would update')
  console.log('')
}

async function verifyNoForbiddenClaims(
  client: SanityClient,
): Promise<void> {
  const faqs = await client.fetch<
    Array<{ _id: string; question: string; answer: string }>
  >(`*[_type == "faq"]{ _id, question, answer }`)

  const services = await client.fetch<
    Array<{
      _id: string
      title: string
      slug: string
      faqs: Array<{ question: string; answer: string }> | null
    }>
  >(
    `*[_type == "service"]{ _id, title, "slug": slug.current, faqs[]{ question, answer } }`,
  )

  const hits: string[] = []

  for (const faq of faqs) {
    for (const rule of FORBIDDEN_ANSWER_PATTERNS) {
      if (rule.pattern.test(faq.answer)) {
        hits.push(`${faq._id} (${faq.question}): ${rule.label}`)
      }
    }
  }

  for (const service of services) {
    for (const faq of service.faqs ?? []) {
      for (const rule of FORBIDDEN_ANSWER_PATTERNS) {
        if (rule.pattern.test(faq.answer)) {
          hits.push(
            `${service._id} / ${service.slug} (${faq.question}): ${rule.label}`,
          )
        }
      }
    }
  }

  console.log('Live claim scan')
  if (hits.length > 0) {
    console.error('  Failed:')
    for (const hit of hits) {
      console.error(`  - ${hit}`)
    }
    process.exit(1)
  }

  console.log(
    '  Passed: no FAQ or service FAQ claims ad campaign management or in-place WordPress work.',
  )
}

async function main() {
  const isExecute = process.argv.includes('--execute')
  console.log(isExecute ? 'EXECUTE' : 'DRY RUN')
  console.log('')

  const client = createWriteClient()
  const faqs = await client.fetch<FaqDoc[]>(
    `*[_type == "faq"] | order(sortOrder asc){ _id, question, answer, placement, sortOrder }`,
  )
  const services = await client.fetch<ServiceDoc[]>(
    `*[_type == "service"]{ _id, title, "slug": slug.current, faqs[]{ _key, question, answer } }`,
  )

  console.log(`Live FAQ documents: ${faqs.length}`)
  console.log(`Live service documents: ${services.length}`)
  console.log('')

  const total = FAQ_PATCHES.length
  const updatedIds: string[] = []
  const unchangedIds: string[] = []
  const notFound: FaqPatch[] = []
  let index = 0

  for (const patch of FAQ_PATCHES) {
    index++

    if (patch.kind === 'faq') {
      const matches = faqs.filter((faq) =>
        questionMatchesPhrase(faq.question, patch.phrase),
      )

      if (matches.length === 0) {
        notFound.push(patch)
        console.warn(`[${index}/${total}] Warning: no document found for "${patch.label}"`)
        continue
      }

      if (matches.length > 1) {
        console.error(
          `[${index}/${total}] Error: multiple documents matched "${patch.label}": ${matches.map((m) => m._id).join(', ')}`,
        )
        process.exit(1)
      }

      const doc = matches[0]
      if (doc._id !== patch.expectedId) {
        console.error(
          `[${index}/${total}] Error: expected _id ${patch.expectedId} for "${patch.label}", found ${doc._id}`,
        )
        process.exit(1)
      }

      const nextAnswer = patch.getAnswer()
      const answerChanged = doc.answer !== nextAnswer

      console.log(`[${index}/${total}] ${doc._id}`)
      console.log(`  Question: ${doc.question}`)
      console.log(`  Placement: ${doc.placement} · sortOrder: ${doc.sortOrder}`)
      console.log(`  Current: ${doc.answer}`)
      console.log(`  New:     ${nextAnswer}`)

      if (answerChanged && isExecute) {
        await client.patch(doc._id).set({ answer: nextAnswer }).commit()
      }

      applyPatchStatus(isExecute, doc._id, answerChanged, updatedIds, unchangedIds)
      continue
    }

    const serviceMatches = services.filter((service) =>
      (service.faqs ?? []).some((faq) =>
        questionMatchesPhrase(faq.question, patch.phrase),
      ),
    )

    if (serviceMatches.length === 0) {
      notFound.push(patch)
      console.warn(`[${index}/${total}] Warning: no document found for "${patch.label}"`)
      continue
    }

    if (serviceMatches.length > 1) {
      console.error(
        `[${index}/${total}] Error: multiple services matched "${patch.label}": ${serviceMatches.map((m) => m._id).join(', ')}`,
      )
      process.exit(1)
    }

    const service = serviceMatches[0]
    const faqMatches = (service.faqs ?? []).filter((faq) =>
      questionMatchesPhrase(faq.question, patch.phrase),
    )

    if (faqMatches.length !== 1) {
      console.error(
        `[${index}/${total}] Error: expected one FAQ on "${service.slug}" for "${patch.label}", found ${faqMatches.length}`,
      )
      process.exit(1)
    }

    const faq = faqMatches[0]
    if (service._id !== patch.expectedServiceId) {
      console.error(
        `[${index}/${total}] Error: expected service _id ${patch.expectedServiceId} for "${patch.label}", found ${service._id}`,
      )
      process.exit(1)
    }
    if (service.slug !== patch.expectedSlug) {
      console.error(
        `[${index}/${total}] Error: expected slug ${patch.expectedSlug} for "${patch.label}", found ${service.slug}`,
      )
      process.exit(1)
    }
    if (faq._key !== patch.expectedKey) {
      console.error(
        `[${index}/${total}] Error: expected FAQ _key ${patch.expectedKey} for "${patch.label}", found ${faq._key}`,
      )
      process.exit(1)
    }

    const nextAnswer = patch.getAnswer()
    const currentAnswer = faq.answer.trim()
    const answerChanged = currentAnswer !== nextAnswer
    const patchId = `${service._id}#${faq._key}`

    console.log(`[${index}/${total}] ${service._id}`)
    console.log(`  Service: ${service.title} (${service.slug})`)
    console.log(`  FAQ _key: ${faq._key}`)
    console.log(`  Question: ${faq.question}`)
    console.log(`  Current: ${faq.answer.trim()}`)
    console.log(`  New:     ${nextAnswer}`)

    if (answerChanged && isExecute) {
      await client
        .patch(service._id)
        .set({ [`faqs[_key=="${faq._key}"].answer`]: nextAnswer })
        .commit()
    }

    applyPatchStatus(isExecute, patchId, answerChanged, updatedIds, unchangedIds)
  }

  console.log('Summary')
  console.log(`  Patches:            ${total}`)
  console.log(`  ${isExecute ? 'Updated' : 'Would update'}:       ${updatedIds.length}`)
  console.log(`  Unchanged:          ${unchangedIds.length}`)
  console.log(`  Not found:          ${notFound.length}`)

  if (notFound.length > 0) {
    console.log('')
    console.log('Not found:')
    for (const patch of notFound) {
      console.log(`  - ${patch.label} ("${patch.phrase}")`)
    }
    process.exit(1)
  }

  if (!isExecute) {
    console.log('')
    console.log('Dry run complete — no writes. Pass --execute to patch documents in Sanity.')
    return
  }

  console.log('')
  await verifyNoForbiddenClaims(client)
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
