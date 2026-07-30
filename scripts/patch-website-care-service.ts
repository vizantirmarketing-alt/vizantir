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
          "Your website is live — now it needs to stay fast, secure, and current. Essential Care covers hosting oversight, monitoring, and security updates for a site that doesn't change often."
        ),
        textBlock(
          'Website Care adds more monthly change hours and faster response. Growth Partner adds reserved bandwidth, quarterly optimization on pages you already have, and the highest preferred rates on campaign work. Landing pages are purchase-only at every tier.'
        ),
      ],
      offerings: [
        {
          _type: 'serviceOffering' as const,
          _key: key(),
          name: 'Essential Care',
          description:
            "Hosting, monitoring, and security updates for a site that's stable and doesn't change often. Up to 1 hour of content changes per month.",
        },
        {
          _type: 'serviceOffering' as const,
          _key: key(),
          name: 'Website Care',
          description:
            'Everything in Essential Care, plus more monthly bandwidth and faster response. Up to 2 hours of content or layout changes per month.',
        },
        {
          _type: 'serviceOffering' as const,
          _key: key(),
          name: 'Growth Partner',
          description:
            'Everything in Website Care, plus more monthly bandwidth, quarterly optimization on the pages you already have, and preferred rates on campaign work.',
        },
      ],
      benefits: [
        'Predictable monthly cost with reserved design and development time',
        'Faster response than one-off project work',
        'Security patches, dependency updates, and uptime monitoring included',
        'Preferred rates on landing pages and new project work (10%, 15%, or 20% by tier)',
        'No surprise invoices — everything scoped monthly',
      ],
      deliverables: [
        'Hosting and deployment oversight',
        'Uptime and broken-link monitoring',
        'Dependency and security updates',
        'Monthly change hours (1–4 depending on tier)',
        'Quarterly conversion, performance, and analytics review at Growth Partner',
        'Technical SEO and schema maintenance at Growth Partner',
      ],
      faqs: [
        {
          _type: 'serviceFaqItem' as const,
          _key: key(),
          question: "What's the difference between the three tiers?",
          answer:
            'Essential Care ($295/mo) covers hosting, monitoring, security updates, and up to 1 hour of content changes with a 10% preferred rate. Website Care ($650/mo) adds more monthly bandwidth, Core Web Vitals monitoring, faster response, and a 15% preferred rate. Growth Partner ($1,500/mo) adds 4 hours of improvements, quarterly optimization on existing pages, and a 20% preferred rate. Landing pages are purchase-only at every tier.',
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
      seo: {
        _type: 'seo' as const,
        metaTitle: 'Website Care & Growth Retainers | Vizantir',
        metaDescription:
          'Ongoing website care starting at $295/mo. Essential Care, Website Care, and Growth Partner cover hosting, monthly change hours, and preferred rates on campaign work.',
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
