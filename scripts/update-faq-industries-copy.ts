/**
 * One-off migration: replace hospitality/law/CRE overclaim copy in FAQ answers.
 * Default: dry run. Pass --execute to write.
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

const OLD_PHRASE = 'hospitality and restaurants, law firms, commercial real estate'

const NEW_ANSWER =
  'We work with established businesses across many sectors — beauty and wellness, creative studios, professional services, retail, luxury, and financial services. The common thread is established businesses where presentation and trust affect revenue.'

const GROQ_QUERY = `*[_type == "faq" && answer match $phrase]{ _id, question, answer }`

type FaqDoc = {
  _id: string
  question: string
  answer: unknown
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

function answerContainsOldPhrase(answer: unknown): boolean {
  return answerToPlainText(answer).includes(OLD_PHRASE)
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

  const groqMatches = await client.fetch<FaqDoc[]>(GROQ_QUERY, { phrase: OLD_PHRASE })

  // Defensive: GROQ match only works on plain string fields; re-check and catch any PT edge cases.
  const faqs = groqMatches.filter((faq) => answerContainsOldPhrase(faq.answer))

  if (faqs.length === 0) {
    console.log('No FAQs needed updating')
    return
  }

  let updated = 0

  for (const doc of faqs) {
    const label = truncate(doc.question, 80)
    const nextAnswer = formatAnswerForPatch(NEW_ANSWER, doc.answer)

    if (isExecute) {
      await client.patch(doc._id).set({ answer: nextAnswer }).commit()
      updated++
      console.log(`Updated: ${doc._id} — ${label}`)
    } else {
      updated++
      console.log(`Would update: ${doc._id} — ${label}`)
      console.log(`  Current: ${truncate(answerToPlainText(doc.answer), 120)}`)
      console.log(`  New:     ${truncate(NEW_ANSWER, 120)}`)
    }
  }

  console.log('')
  console.log(`Summary: ${updated} FAQ${updated === 1 ? '' : 's'} ${isExecute ? 'updated' : 'would be updated'}`)

  if (!isExecute) {
    console.log('')
    console.log('Dry run complete — no writes. Pass --execute to patch documents in Sanity.')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
