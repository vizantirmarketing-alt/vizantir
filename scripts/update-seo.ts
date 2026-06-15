/**
 * One-off: patch homepage and siteSettings SEO metadata in Sanity.
 * Run: npx tsx scripts/update-seo.ts
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient, type SanityClient } from '@sanity/client'
import { config as loadEnv } from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

const API_VERSION = '2025-12-05'

const WRITE_TOKEN_VARS = [
  'SANITY_API_WRITE_TOKEN',
  'SANITY_API_TOKEN',
  'SANITY_WRITE_TOKEN',
] as const

function requireEnv(name: string, value: string | undefined): string {
  if (!value || !String(value).trim()) {
    console.error(`Missing required environment variable: ${name}`)
    process.exit(1)
  }
  return value.trim()
}

function resolveWriteToken(): { name: string; value: string } {
  for (const name of WRITE_TOKEN_VARS) {
    const value = process.env[name]?.trim()
    if (value) {
      return { name, value }
    }
  }

  console.error(
    'No Sanity write token found in .env.local.\n' +
      'Create an Editor token at https://sanity.io/manage → API → Tokens,\n' +
      'then add it as SANITY_API_WRITE_TOKEN in .env.local and run `vercel env pull .env.local`.'
  )
  process.exit(1)
}

function createWriteClient(): SanityClient {
  loadEnv({ path: join(ROOT, '.env.local') })

  const projectId = requireEnv(
    'NEXT_PUBLIC_SANITY_PROJECT_ID',
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  )
  const dataset = requireEnv('NEXT_PUBLIC_SANITY_DATASET', process.env.NEXT_PUBLIC_SANITY_DATASET)
  const { name: tokenVar, value: token } = resolveWriteToken()
  console.log(`Using write token from ${tokenVar}`)

  return createClient({
    projectId,
    dataset,
    token,
    apiVersion: API_VERSION,
    useCdn: false,
  })
}

function warnIfDraft(id: string, label: string): void {
  if (id.startsWith('drafts.')) {
    console.warn(
      `WARNING: ${label} _id "${id}" is a draft. Patches may not appear on the live site until published.`
    )
  }
}

;(async () => {
  const client = createWriteClient()

  const homepageId = await client.fetch<string | null>(
    `*[_type == "page" && slug.current == "home"][0]._id`
  )

  if (!homepageId) {
    console.error('Homepage not found: no page with slug "home".')
    process.exit(1)
  }

  console.log(`\nHomepage _id: ${homepageId}`)
  warnIfDraft(homepageId, 'Homepage')

  const homepagePatch = await client
    .patch(homepageId)
    .set({
      'seo.metaTitle': 'Custom Websites for Established Brands | Vizantir',
      'seo.metaDescription':
        "We build custom websites for established businesses that care how they're perceived. Hand-built in Next.js by a Las Vegas studio, for clients nationwide.",
    })
    .commit()

  console.log(`Homepage patched — _id: ${homepagePatch._id}, _rev: ${homepagePatch._rev}`)

  const homepageAfter = await client.fetch<{
    _id: string
    _rev: string
    seo?: {
      metaTitle?: string
      metaDescription?: string
      canonicalUrl?: string
      noIndex?: boolean
      ogImage?: unknown
    }
  }>(`*[_id == $id][0]{ _id, _rev, seo }`, { id: homepageId })

  console.log('Homepage seo after patch:', JSON.stringify(homepageAfter?.seo, null, 2))

  const siteSettingsId = await client.fetch<string | null>(`*[_type == "siteSettings"][0]._id`)

  if (!siteSettingsId) {
    console.error('siteSettings singleton not found.')
    process.exit(1)
  }

  console.log(`\nSite settings _id: ${siteSettingsId}`)
  warnIfDraft(siteSettingsId, 'siteSettings')

  const siteSettingsPatch = await client
    .patch(siteSettingsId)
    .set({
      defaultMetaTitle: 'Vizantir | Custom Website Design Studio in Las Vegas',
      defaultMetaDescription:
        'A Las Vegas studio that designs and builds custom websites for established businesses. No templates, no plugins — built by hand in Next.js.',
    })
    .commit()

  console.log(
    `Site settings patched — _id: ${siteSettingsPatch._id}, _rev: ${siteSettingsPatch._rev}`
  )

  const siteSettingsAfter = await client.fetch<{
    _id: string
    _rev: string
    defaultMetaTitle?: string
    defaultMetaDescription?: string
  }>(
    `*[_id == $id][0]{ _id, _rev, defaultMetaTitle, defaultMetaDescription }`,
    { id: siteSettingsId }
  )

  console.log('Site settings defaults after patch:', {
    _id: siteSettingsAfter?._id,
    _rev: siteSettingsAfter?._rev,
    defaultMetaTitle: siteSettingsAfter?.defaultMetaTitle,
    defaultMetaDescription: siteSettingsAfter?.defaultMetaDescription,
  })
})().catch((err: unknown) => {
  console.error('Failed to update SEO metadata:')
  if (err instanceof Error) {
    console.error(err.message)
    if (err.stack) console.error(err.stack)
  } else {
    console.error(err)
  }
  process.exit(1)
})
