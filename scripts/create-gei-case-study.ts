/**
 * Create the Golden Era Integra case study in Sanity.
 * Idempotent slug check — exits without overwriting if the document already exists.
 */

import { createReadStream, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'

import { createClient, type SanityClient } from '@sanity/client'
import { config as loadEnv } from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

const API_VERSION = '2025-12-05'
const SLUG = 'golden-era-integra'
const HERO_IMAGE_PATH = join(ROOT, 'public', 'g-e-i.png')

function requireEnv(name: string, value: string | undefined): string {
  if (!value || !String(value).trim()) {
    console.error(`Missing required environment variable: ${name}`)
    console.error(
      'Add a Sanity write token as SANITY_API_TOKEN in .env.local (sanity.io/manage → API → Tokens).'
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

function bulletBlock(text: string) {
  return {
    ...textBlock(text),
    listItem: 'bullet' as const,
    level: 1,
  }
}

function createWriteClient(): SanityClient {
  loadEnv({ path: join(ROOT, '.env.local') })

  const projectId = requireEnv(
    'NEXT_PUBLIC_SANITY_PROJECT_ID',
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  )
  const dataset = requireEnv('NEXT_PUBLIC_SANITY_DATASET', process.env.NEXT_PUBLIC_SANITY_DATASET)
  const token = requireEnv('SANITY_API_TOKEN', process.env.SANITY_API_TOKEN)

  return createClient({
    projectId,
    dataset,
    token,
    apiVersion: API_VERSION,
    useCdn: false,
  })
}

async function assertSlugAvailable(client: SanityClient): Promise<void> {
  const existing = await client.fetch<{ _id: string; title: string } | null>(
    `*[_type == "caseStudy" && slug.current == $slug][0]{ _id, title }`,
    { slug: SLUG }
  )

  if (existing) {
    console.error(`Case study already exists for slug "${SLUG}".`)
    console.error(`  _id: ${existing._id}`)
    console.error(`  title: ${existing.title}`)
    console.error('Refusing to overwrite. Delete the existing document in Studio if you need to recreate it.')
    process.exit(1)
  }
}

async function uploadHeroImage(client: SanityClient): Promise<string> {
  if (!existsSync(HERO_IMAGE_PATH)) {
    console.error(`Hero image not found: ${HERO_IMAGE_PATH}`)
    process.exit(1)
  }

  const asset = await client.assets.upload('image', createReadStream(HERO_IMAGE_PATH), {
    filename: 'g-e-i.png',
    contentType: 'image/png',
  })

  console.log(`Uploaded hero image asset: ${asset._id}`)
  return asset._id
}

async function main() {
  const client = createWriteClient()

  console.log('Checking for existing case study…')
  await assertSlugAvailable(client)

  console.log('Uploading hero image…')
  const heroAssetId = await uploadHeroImage(client)

  const doc = {
    _type: 'caseStudy' as const,
    title: 'Golden Era Integra',
    slug: { _type: 'slug' as const, current: SLUG },
    client: 'Golden Era Integra',
    industry: 'Automotive / Enthusiast',
    summary:
      'An editorial platform for a 1995 Acura Integra GS-R restoration — documented build journal, parts archive, and garage sale system, all running on Sanity CMS. Designed for an audience that notices the details.',
    heroImage: {
      _type: 'image' as const,
      alt: 'Golden Era Integra editorial website built by Vizantir, featuring a 1995 Acura Integra GS-R',
      asset: { _type: 'reference' as const, _ref: heroAssetId },
    },
    challenge: [
      textBlock(
        'Enthusiast brands live or die on detail. A vintage car build documented properly needs more than a blog — it needs an editorial platform that respects the subject matter. Most car project sites are afterthoughts: a few photos, no structure, no longevity. The goal here was to build something that reads like a magazine, archives like a database, and operates like a real publication.'
      ),
    ],
    solution: [
      textBlock(
        'We built Golden Era Integra as a Next.js site with Sanity CMS powering the entire content layer. Magazine-style hero treatment with chassis number, coordinates, and issue numbering. Custom typography. A documented build journal that updates as the work progresses, a searchable parts archive, and a garage sale system with inquiry forms for selling stripped components.'
      ),
      textBlock(
        'SEO foundation set from day one — proper schema, sitemap, OG image inheritance, Google Search Console verified. The site is fast, responsive, and built to grow as the build does, without ever feeling like another car blog.'
      ),
    ],
    results: [
      bulletBlock(
        'Editorial platform serving as both personal documentation and Vizantir portfolio piece'
      ),
      bulletBlock(
        'Full Sanity CMS integration across build journal, parts archive, and garage sale inventory'
      ),
      bulletBlock('Custom magazine-style design system with bespoke typography and layout'),
      bulletBlock(
        'SEO foundation with sitemap, schema markup, GSC verification, and OG images configured'
      ),
      bulletBlock('Garage sale inquiry system with Resend email integration'),
    ],
    stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Sanity CMS', 'Resend', 'Vercel'],
    siteUrl: 'https://goldeneraintegra.com',
    featured: false,
    seo: {
      _type: 'seo' as const,
      metaTitle: 'Golden Era Integra Case Study',
      metaDescription:
        'How Vizantir built an editorial platform for a 1995 Acura Integra GS-R restoration, with documented build journal, parts archive, and full Sanity CMS integration.',
      noIndex: false,
    },
  }

  console.log('Creating case study document…')
  const created = await client.create(doc)

  console.log('')
  console.log('Created case study:')
  console.log(`  _id: ${created._id}`)
  console.log(`  slug: ${SLUG}`)

  console.log('')
  console.log('Verifying published document…')
  const verified = await client.fetch(
    `*[_type == "caseStudy" && slug.current == $slug && !(_id in path("drafts.**"))][0]{
      _id,
      title,
      "slug": slug.current,
      client,
      industry,
      summary,
      featured,
      siteUrl,
      stack,
      "heroImageAsset": heroImage.asset._ref,
      "seoTitle": seo.metaTitle
    }`,
    { slug: SLUG }
  )

  if (!verified) {
    console.error('Verification failed: document not found after create.')
    process.exit(1)
  }

  console.log('Verified published document:')
  console.log(JSON.stringify(verified, null, 2))
}

main().catch((err: unknown) => {
  console.error('Failed to create Golden Era Integra case study:')
  if (err instanceof Error) {
    console.error(err.message)
    if (err.stack) console.error(err.stack)
  } else {
    console.error(err)
  }
  process.exit(1)
})
