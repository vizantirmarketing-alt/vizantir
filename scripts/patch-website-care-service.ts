/**
 * Patch the existing Website Care service document in Sanity so it matches
 * current Website Care positioning (ongoing improvement after launch).
 * Inclusion lists are not duplicated here — carePricing in data/pricing.ts
 * remains the product spec. This document is positioning only.
 *
 * Run: pnpm patch:website-care-service
 * Looks up by slug (website-care) and patches only the fields listed below.
 */

import { randomBytes } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient, type SanityClient } from '@sanity/client'
import { config as loadEnv } from 'dotenv'

import { carePricing } from '../data/pricing'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

const API_VERSION = '2025-12-05'
const SLUG = 'website-care'

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

function key(): string {
  return randomBytes(6).toString('hex')
}

function textBlock(text: string) {
  return {
    _type: 'block' as const,
    _key: key(),
    style: 'normal' as const,
    markDefs: [] as [],
    children: [
      {
        _type: 'span' as const,
        _key: key(),
        text,
        marks: [] as [],
      },
    ],
  }
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

async function main() {
  const client = createWriteClient()

  console.log(`Looking up service by slug: ${SLUG}…`)
  const existing = await client.fetch<{ _id: string } | null>(
    `*[_type == "service" && slug.current == $slug][0]{ _id }`,
    { slug: SLUG }
  )

  if (!existing) {
    console.error(`Service not found for slug: ${SLUG}`)
    process.exit(1)
  }

  const [essentialCare, websiteCare, growthCare] = carePricing

  const fieldsChanged = [
    'overview',
    'offerings',
    'benefits',
    'deliverables',
    'faqs',
    'heroSubheadline',
    'seo.metaDescription',
  ]

  console.log(`  found _id: ${existing._id}`)
  console.log(`  fields to change: ${fieldsChanged.join(', ')}`)
  console.log('Patching…')

  const result = await client
    .patch(existing._id)
    .set({
      overview: [
        textBlock(
          'Launch is the start of the relationship, not the end of the work. Website Care is the usual continuation of a Vizantir website project.'
        ),
        textBlock(
          'The work is content changes, performance and analytics review, conversion improvements, search visibility, technical upkeep, new functionality, and strategic support — so the site keeps earning after it goes live.'
        ),
      ],
      offerings: [
        {
          _type: 'serviceOffering' as const,
          _key: key(),
          name: essentialCare.name,
          description: `${essentialCare.tagline} ${essentialCare.description}`,
        },
        {
          _type: 'serviceOffering' as const,
          _key: key(),
          name: websiteCare.name,
          description: `${websiteCare.tagline} ${websiteCare.description}`,
        },
        {
          _type: 'serviceOffering' as const,
          _key: key(),
          name: growthCare.name,
          description: `${growthCare.tagline} ${growthCare.description}`,
        },
      ],
      benefits: [
        'The site keeps improving after launch, not just staying online',
        'Content, conversion, and search work without starting a new project',
        'Performance and analytics reviewed on a regular cadence',
        'Technical upkeep and room for new functionality as the business changes',
        'Strategic support as priorities shift',
      ],
      deliverables: [
        'Content changes',
        'Performance and analytics review',
        'Conversion improvements',
        'Search visibility',
        'Technical upkeep',
        'New functionality',
        'Strategic support',
      ],
      faqs: [
        {
          _type: 'serviceFaqItem' as const,
          _key: key(),
          question: "What's the difference between the three tiers?",
          answer: `${essentialCare.name} (${essentialCare.price}) is ${essentialCare.tagline.replace(/\.$/, '').toLowerCase()}: ${essentialCare.description} ${websiteCare.name} (${websiteCare.price}) is ${websiteCare.tagline.replace(/\.$/, '').toLowerCase()}: ${websiteCare.description} ${growthCare.name} (${growthCare.price}) is ${growthCare.tagline.replace(/\.$/, '').toLowerCase()}: ${growthCare.description}`,
        },
        {
          _type: 'serviceFaqItem' as const,
          _key: key(),
          question: 'Do I have to commit to a long contract?',
          answer:
            "No. All care plans are month-to-month with 30 days notice. We'd rather earn the renewal than lock you in.",
        },
        {
          _type: 'serviceFaqItem' as const,
          _key: key(),
          question: 'What happens if I need more work than my hours cover?',
          answer:
            "Additional hours are billed at your preferred client rate (10–20% off standard project pricing depending on your tier). No surprises — you'll always get an estimate before work starts.",
        },
        {
          _type: 'serviceFaqItem' as const,
          _key: key(),
          question: 'Can I upgrade or downgrade tiers?',
          answer:
            'Yes. Upgrades take effect immediately. Downgrades take effect the following billing cycle.',
        },
      ],
      heroSubheadline:
        'Ongoing improvement after launch — content changes, performance and analytics review, conversion, search visibility, and technical upkeep.',
      seo: {
        _type: 'seo' as const,
        metaTitle: 'Website Care & Growth Retainers',
        metaDescription: `Ongoing website improvement after launch. Content changes, performance and analytics review, conversion, search visibility, and technical upkeep. Plans start at ${essentialCare.price}.`,
        noIndex: false,
      },
    })
    .commit()

  console.log(`  patched: ${result._id}`)
  console.log('')
  console.log('Verifying…')

  const verified = await client.fetch(
    `*[_type == "service" && slug.current == $slug][0]{
      _id,
      title,
      "slug": slug.current,
      heroSubheadline,
      "overviewText": overview[].children[].text,
      offerings[]{ name, description },
      benefits,
      deliverables,
      faqs[]{ question, answer },
      "seoTitle": seo.metaTitle,
      "seoDescription": seo.metaDescription
    }`,
    { slug: SLUG }
  )

  if (!verified) {
    console.error('Verification failed: document not found after patch.')
    process.exit(1)
  }

  console.log(JSON.stringify(verified, null, 2))

  const blob = JSON.stringify(verified).toLowerCase()
  const forbidden = [
    'security patch',
    'security updates',
    'dependency update',
    'dependency and security',
    'plugin',
    'backup',
  ]
  const hits = forbidden.filter((term) => blob.includes(term))
  if (hits.length > 0) {
    console.error(`Verification failed: stale maintenance language still present: ${hits.join(', ')}`)
    process.exit(1)
  }

  console.log('')
  console.log('Verified: no security, dependency, plugin, or backup maintenance language.')
  console.log('Done. Page URL: /services/website-care')
}

main().catch((err: unknown) => {
  console.error('Failed to patch Website Care service:')
  if (err instanceof Error) {
    console.error(err.message)
    if (err.stack) console.error(err.stack)
  } else {
    console.error(err)
  }
  process.exit(1)
})
