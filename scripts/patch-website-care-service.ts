/**
 * Patch the existing Website Care service document in Sanity with
 * updated tier names, overview, offerings, benefits, deliverables, FAQs, and SEO.
 *
 * Run: pnpm patch:website-care-service
 * Looks up by slug (website-care) and patches only the fields listed below.
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

  console.log(`  found _id: ${existing._id}`)
  console.log('Patching overview, offerings, benefits, deliverables, faqs, seo…')

  const result = await client
    .patch(existing._id)
    .set({
      overview: [
        textBlock(
          'Your website is live — now it needs to stay fast, secure, and current. Website Care keeps the infrastructure healthy: hosting oversight, monitoring, dependency updates, and quick turnarounds on small changes.'
        ),
        textBlock(
          'For teams treating their site as a growth engine, Growth Partner and Campaign Partner tiers add reserved design and development capacity — including included landing pages, quarterly reviews, and priority scheduling.'
        ),
      ],
      offerings: [
        {
          _type: 'serviceOffering' as const,
          _key: key(),
          name: 'Website Care',
          description:
            'Hosting, monitoring, and up to 2 hours of monthly changes. For teams whose site is stable and just needs to stay that way.',
        },
        {
          _type: 'serviceOffering' as const,
          _key: key(),
          name: 'Growth Partner',
          description:
            'Everything in Website Care plus 4 hours of monthly improvements and 1 Campaign Landing Page per quarter.',
        },
        {
          _type: 'serviceOffering' as const,
          _key: key(),
          name: 'Campaign Partner',
          description:
            'Everything in Growth Partner plus 1 custom landing page per month and ongoing conversion strategy support.',
        },
      ],
      benefits: [
        'Predictable monthly cost with reserved design and development time',
        'Faster response than one-off project work',
        'Security patches, dependency updates, and uptime monitoring included',
        'Preferred rates on landing pages and new project work',
        'Optional included landing pages at higher tiers',
        'No surprise invoices — everything scoped monthly',
      ],
      deliverables: [
        'Hosting and deployment oversight',
        'Uptime and broken-link monitoring',
        'Dependency and security updates',
        'Monthly change hours (2–6 depending on tier)',
        'Included landing pages at Growth Partner and Campaign Partner',
        'Quarterly or monthly performance and analytics review at higher tiers',
      ],
      faqs: [
        {
          _type: 'serviceFaqItem' as const,
          _key: key(),
          question: "What's the difference between the three tiers?",
          answer:
            'Website Care ($650/mo) is maintenance-only with 2 hours of monthly changes. Growth Partner ($1,500/mo) adds 4 hours of improvements and 1 landing page per quarter. Campaign Partner ($3,000/mo) includes 1 landing page per month and ongoing conversion strategy.',
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
            "Additional hours are billed at your preferred client rate (15–30% off standard project pricing depending on your tier). No surprises — you'll always get an estimate before work starts.",
        },
        {
          _type: 'serviceFaqItem' as const,
          _key: key(),
          question: 'Can I upgrade or downgrade tiers?',
          answer:
            'Yes. Upgrades take effect immediately. Downgrades take effect the following billing cycle.',
        },
      ],
      seo: {
        _type: 'seo' as const,
        metaTitle: 'Website Care & Growth Retainers | Vizantir',
        metaDescription:
          'Ongoing website care starting at $650/mo. Growth Partner and Campaign Partner tiers include monthly design and development capacity plus landing pages.',
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
  console.log('')
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
