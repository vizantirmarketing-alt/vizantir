/**
 * Create or replace the Landing Pages service document in Sanity,
 * and bump sort order on services that follow Web Development.
 *
 * Run: pnpm seed:landing-pages-service
 * Idempotent via slug lookup — uses an existing UUID _id when present,
 * otherwise lets Sanity generate a UUID (path("*") public ACL).
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
const SLUG = 'landing-pages'

/** Services that must sit after Landing Pages (order 4). Current IDs from production dataset. */
const ORDER_BUMPS: { slug: string; order: number }[] = [
  { slug: 'website-refreshes', order: 5 },
  { slug: 'cms-integrations', order: 6 },
  { slug: 'nextjs-development', order: 7 },
  { slug: 'sanity-cms', order: 8 },
  { slug: 'website-care', order: 9 },
]

const RELATED_SLUGS = ['web-design', 'web-development', 'website-care'] as const

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

async function resolveRelatedRefs(
  client: SanityClient
): Promise<{ _type: 'reference'; _ref: string; _key: string }[]> {
  const docs = await client.fetch<{ _id: string; slug: string }[]>(
    `*[_type == "service" && slug.current in $slugs]{ _id, "slug": slug.current }`,
    { slugs: [...RELATED_SLUGS] }
  )

  const bySlug = new Map(docs.map((d) => [d.slug, d._id]))
  const missing = RELATED_SLUGS.filter((s) => !bySlug.has(s))
  if (missing.length) {
    console.error(`Missing related services for slugs: ${missing.join(', ')}`)
    process.exit(1)
  }

  return RELATED_SLUGS.map((slug) => ({
    _type: 'reference' as const,
    _ref: bySlug.get(slug)!,
    _key: key(),
  }))
}

async function bumpOrders(client: SanityClient): Promise<void> {
  const tx = client.transaction()

  for (const { slug, order } of ORDER_BUMPS) {
    const existing = await client.fetch<{ _id: string } | null>(
      `*[_type == "service" && slug.current == $slug][0]{ _id }`,
      { slug }
    )
    if (!existing) {
      console.warn(`Skipping order bump — service not found: ${slug}`)
      continue
    }
    tx.patch(existing._id, { set: { order } })
    console.log(`  order ${order}: ${slug} (${existing._id})`)
  }

  await tx.commit()
}

async function main() {
  const client = createWriteClient()

  console.log(`Looking up existing service by slug: ${SLUG}…`)
  const existing = await client.fetch<{ _id: string } | null>(
    `*[_type == "service" && slug.current == $slug][0]{ _id }`,
    { slug: SLUG }
  )

  if (existing) {
    console.log(`  Found existing doc: ${existing._id}`)
  } else {
    console.log('  No existing doc — will create with auto-generated UUID')
  }

  console.log('Resolving related service references…')
  const relatedServices = await resolveRelatedRefs(client)

  const doc = {
    _type: 'service' as const,
    title: 'Landing Pages',
    slug: { _type: 'slug' as const, current: SLUG },
    order: 4,
    description: 'Conversion-focused pages built to turn traffic into leads.',
    heroHeadline: 'Landing pages that actually convert.',
    heroSubheadline:
      'Single-purpose pages, custom-designed for one clear goal — book a trial, capture a lead, launch an offer.',
    overview: [
      textBlock(
        "A landing page isn't a mini-website. It's a focused conversion tool built around one clear action — booking a trial, requesting information, signing up for an offer. Every element on the page exists to move the visitor toward that action."
      ),
      textBlock(
        "Vizantir builds landing pages from scratch on Next.js, matched to your brand, wired to your analytics, and ready for the traffic you're paying to bring in."
      ),
    ],
    benefits: [
      'Built for one clear conversion goal, not everything at once',
      'Custom design matched to your brand — no templates',
      'Fast load times on mobile where most traffic lands',
      'Analytics and conversion tracking configured from day one',
      'Integrated with your booking, CRM, or email system',
      'Ready to plug into Google Ads, Meta Ads, or organic traffic',
    ],
    process: [
      {
        _type: 'serviceProcessStep' as const,
        _key: key(),
        step: 1,
        title: 'Strategy',
        description: 'Clarify the offer, audience, and single conversion action.',
      },
      {
        _type: 'serviceProcessStep' as const,
        _key: key(),
        step: 2,
        title: 'Design',
        description: 'Custom brand-matched design focused on one action.',
      },
      {
        _type: 'serviceProcessStep' as const,
        _key: key(),
        step: 3,
        title: 'Build',
        description: 'Custom Next.js development, mobile-first, tracked.',
      },
      {
        _type: 'serviceProcessStep' as const,
        _key: key(),
        step: 4,
        title: 'Launch',
        description: 'Deploy live, verify tracking, hand off documentation.',
      },
    ],
    offerings: [
      {
        _type: 'serviceOffering' as const,
        _key: key(),
        name: 'Campaign Landing Page',
        description: 'One focused page for a specific service, promotion, or event.',
      },
      {
        _type: 'serviceOffering' as const,
        _key: key(),
        name: 'Conversion Landing Page',
        description: 'Deeper strategy and copy work for paid traffic or major offers.',
      },
      {
        _type: 'serviceOffering' as const,
        _key: key(),
        name: 'Campaign System',
        description: 'One page plus variants and testing infrastructure for larger campaigns.',
      },
    ],
    deliverables: [
      'Custom-designed landing page',
      'Next.js production build',
      'Form or booking integration',
      'Analytics and conversion tracking setup',
      'Metadata and technical SEO',
      'Post-launch support window (14–45 days depending on tier)',
    ],
    faqs: [
      {
        _type: 'serviceFaqItem' as const,
        _key: key(),
        question: 'How long does a landing page take?',
        answer:
          '2 to 3 weeks from kickoff for Campaign Landing Page; 3 to 4 weeks for Conversion Landing Page; 4 to 5 weeks for a Campaign System.',
      },
      {
        _type: 'serviceFaqItem' as const,
        _key: key(),
        question: 'Do you write the copy?',
        answer:
          'Copy collaboration is included at every tier — you provide the story and offer, we shape it into conversion copy. Substantial copy refinement is included at the Conversion tier and above.',
      },
      {
        _type: 'serviceFaqItem' as const,
        _key: key(),
        question: 'Can you run the ads too?',
        answer:
          'Vizantir focuses on the landing page itself and the tracking behind it. For campaign management, we can recommend trusted ad partners.',
      },
      {
        _type: 'serviceFaqItem' as const,
        _key: key(),
        question: 'What if I already have a website with Vizantir?',
        answer:
          'Existing Vizantir website clients get an existing-site page rate starting at $1,500, since we can reuse your design system, components, and brand infrastructure.',
      },
    ],
    seo: {
      _type: 'seo' as const,
      metaTitle: 'Landing Page Design & Development | Vizantir',
      metaDescription:
        'Custom landing pages built on Next.js. Strategy, design, and conversion-focused development starting at $3,000.',
      noIndex: false,
    },
    relatedServices,
  }

  let result: { _id: string }
  if (existing) {
    console.log(`Updating existing service document ${existing._id}…`)
    result = await client.createOrReplace({ ...doc, _id: existing._id })
  } else {
    console.log('Creating service document with auto-generated UUID…')
    result = await client.create(doc)
  }
  console.log(`  _id: ${result._id}`)
  console.log(`  slug: ${SLUG}`)
  console.log(`  order: 4`)

  console.log('Bumping sort order on subsequent services…')
  await bumpOrders(client)

  console.log('')
  console.log('Verifying…')
  const verified = await client.fetch(
    `*[_type == "service" && slug.current == $slug][0]{
      _id,
      title,
      "slug": slug.current,
      order,
      description,
      heroHeadline,
      "related": relatedServices[]->slug.current,
      "seoTitle": seo.metaTitle
    }`,
    { slug: SLUG }
  )

  if (!verified) {
    console.error('Verification failed: document not found after write.')
    process.exit(1)
  }

  console.log(JSON.stringify(verified, null, 2))
  console.log('')
  console.log('Done. Page URL: /services/landing-pages')
}

main().catch((err: unknown) => {
  console.error('Failed to seed Landing Pages service:')
  if (err instanceof Error) {
    console.error(err.message)
    if (err.stack) console.error(err.stack)
  } else {
    console.error(err)
  }
  process.exit(1)
})
