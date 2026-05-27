/**
 * Update FAQ documents in Sanity with pricing copy from data/pricing.ts.
 * Default: dry run. Pass --execute to write.
 */

import { randomBytes } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient, type SanityClient } from '@sanity/client'
import { config as loadEnv } from 'dotenv'

import { pricingFAQs, projectPricing } from '@/data/pricing'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

const API_VERSION = '2025-12-05'

const essentialsTier = projectPricing[0]

type FaqDoc = {
  _id: string
  question: string
  answer: unknown
}

type FaqUpdateRule = {
  id: string
  label: string
  phrase: string
  getAnswer: () => string
}

type PortableTextBlock = {
  _type: 'block'
  _key: string
  style: 'normal'
  markDefs: []
  children: Array<{
    _type: 'span'
    _key: string
    text: string
    marks: []
  }>
}

const FAQ_UPDATE_RULES: FaqUpdateRule[] = [
  {
    id: 'las-vegas-cost',
    label: 'Las Vegas web design cost',
    phrase: 'how much does web design cost in las vegas',
    getAnswer: () =>
      `Template sites from local freelancers often run $3,000–$8,000. Custom WordPress builds typically land between $8,000 and $20,000. Vizantir projects start at ${essentialsTier.price} for a fixed-scope Next.js build. Price depends on page count, integrations, and content complexity. We quote after discovery, not before.`,
  },
  {
    id: 'las-vegas-after-launch',
    label: 'Las Vegas after launch',
    phrase: 'what happens after launch',
    getAnswer: () =>
      `You own the site and the codebase. ${pricingFAQs.retainer} Many clients manage day-to-day edits themselves through Sanity and call us for larger work.`,
  },
  {
    id: 'after-site-launches',
    label: 'After the site launches',
    phrase: 'what happens after the site launches',
    getAnswer: () => pricingFAQs.retainer,
  },
  {
    id: 'website-cost',
    label: 'Website project cost',
    phrase: 'how much does a website project cost',
    getAnswer: () => pricingFAQs.cost,
  },
  {
    id: 'website-timeline',
    label: 'Website project timeline',
    phrase: 'how long does a website project take',
    getAnswer: () => pricingFAQs.timeline,
  },
  {
    id: 'kickoff-timeline',
    label: 'Kickoff to launch timeline',
    phrase: 'timeline look like from kickoff',
    getAnswer: () => pricingFAQs.timeline,
  },
]

function requireEnv(name: string, value: string | undefined): string {
  if (!value || !String(value).trim()) {
    console.error(`Missing required environment variable: ${name}`)
    process.exit(1)
  }
  return value.trim()
}

function randomKey(length = 12): string {
  return randomBytes(length).toString('hex').slice(0, length)
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  return `${s.slice(0, max - 1)}…`
}

function isPortableText(value: unknown): value is PortableTextBlock[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    typeof value[0] === 'object' &&
    value[0] !== null &&
    (value[0] as { _type?: string })._type === 'block'
  )
}

function portableTextFromString(text: string): PortableTextBlock[] {
  return [
    {
      _type: 'block',
      _key: randomKey(),
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: randomKey(),
          text,
          marks: [],
        },
      ],
    },
  ]
}

function answerToPlainText(answer: unknown): string {
  if (typeof answer === 'string') return answer
  if (!isPortableText(answer)) return String(answer ?? '')

  return answer
    .flatMap((block) =>
      block.children.map((child) => child.text).filter(Boolean),
    )
    .join('\n\n')
}

function formatAnswerForPatch(text: string, existing: unknown): string | PortableTextBlock[] {
  if (isPortableText(existing)) {
    return portableTextFromString(text)
  }
  return text
}

function questionMatchesPhrase(question: string, phrase: string): boolean {
  return question.toLowerCase().includes(phrase.toLowerCase())
}

async function main() {
  loadEnv({ path: join(ROOT, '.env.local') })

  const projectId = requireEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', process.env.NEXT_PUBLIC_SANITY_PROJECT_ID)
  const dataset = requireEnv('NEXT_PUBLIC_SANITY_DATASET', process.env.NEXT_PUBLIC_SANITY_DATASET)
  const token = requireEnv('SANITY_API_WRITE_TOKEN', process.env.SANITY_API_WRITE_TOKEN)

  const isExecute = process.argv.includes('--execute')
  console.log(isExecute ? 'EXECUTE' : 'DRY RUN')
  console.log('')

  const client: SanityClient = createClient({
    projectId,
    dataset,
    token,
    apiVersion: API_VERSION,
    useCdn: false,
  })

  const faqs = await client.fetch<FaqDoc[]>(
    `*[_type == "faq"]{ _id, question, answer }`,
  )

  const totalRules = FAQ_UPDATE_RULES.length
  const matchedDocIds = new Set<string>()
  const updatedDocIds = new Set<string>()
  const unchangedDocIds = new Set<string>()
  const notFoundRules: FaqUpdateRule[] = []

  let ruleIndex = 0

  for (const rule of FAQ_UPDATE_RULES) {
    ruleIndex++
    const matches = faqs.filter((faq) => questionMatchesPhrase(faq.question, rule.phrase))
    const newAnswerText = rule.getAnswer()

    if (matches.length === 0) {
      notFoundRules.push(rule)
      console.warn(
        `[${ruleIndex}/${totalRules}] Warning: no document found for "${rule.label}" (phrase: "${rule.phrase}")`,
      )
      continue
    }

    for (const doc of matches) {
      matchedDocIds.add(doc._id)
      const label = truncate(doc.question, 60)
      const currentText = answerToPlainText(doc.answer)
      const answerChanged = currentText !== newAnswerText

      if (!answerChanged) {
        unchangedDocIds.add(doc._id)
        console.log(`[${ruleIndex}/${totalRules}] Unchanged: ${label}`)
        continue
      }

      const nextAnswer = formatAnswerForPatch(newAnswerText, doc.answer)

      if (isExecute) {
        await client.patch(doc._id).set({ answer: nextAnswer }).commit()
        updatedDocIds.add(doc._id)
        console.log(`[${ruleIndex}/${totalRules}] Updated: ${label}`)
      } else {
        updatedDocIds.add(doc._id)
        console.log(`[${ruleIndex}/${totalRules}] Would update: ${label}`)
        console.log(`  Current: ${truncate(currentText, 120)}`)
        console.log(`  New:     ${truncate(newAnswerText, 120)}`)
      }
    }
  }

  console.log('')
  console.log('Summary')
  console.log(`  Rules:              ${totalRules}`)
  console.log(`  Documents matched:  ${matchedDocIds.size}`)
  console.log(`  ${isExecute ? 'Updated' : 'Would update'}:       ${updatedDocIds.size}`)
  console.log(`  Unchanged:          ${unchangedDocIds.size}`)
  console.log(`  Rules not found:    ${notFoundRules.length}`)

  if (notFoundRules.length > 0) {
    console.log('')
    console.log('Not found:')
    for (const rule of notFoundRules) {
      console.log(`  - ${rule.label} ("${rule.phrase}")`)
    }
  }

  if (!isExecute) {
    console.log('')
    console.log('Dry run complete — no writes. Pass --execute to patch documents in Sanity.')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
