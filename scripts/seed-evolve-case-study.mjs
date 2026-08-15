#!/usr/bin/env node
/**
 * One-off seed: Evolve Dance Center case study.
 * Idempotent via createIfNotExists with a fixed _id.
 *
 * USAGE
 *   node --env-file=.env.local scripts/seed-evolve-case-study.mjs
 *
 * REQUIRES SANITY_API_WRITE_TOKEN in .env.local.
 */

import { randomBytes } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient } from '@sanity/client'
import { config as loadEnv } from 'dotenv'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
loadEnv({ path: join(ROOT, '.env.local') })

const DOCUMENT_ID = 'caseStudy-evolve-dance-center'

const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-12-05'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const token = process.env.SANITY_API_WRITE_TOKEN

if (!token) {
  console.error(
    'Missing SANITY_API_WRITE_TOKEN. Add it to .env.local and re-run this script.'
  )
  process.exit(1)
}

if (projectId === undefined) {
  console.error('Missing environment variable: NEXT_PUBLIC_SANITY_PROJECT_ID')
  process.exit(1)
}

if (dataset === undefined) {
  console.error('Missing environment variable: NEXT_PUBLIC_SANITY_DATASET')
  process.exit(1)
}

function uniqueKey() {
  return randomBytes(6).toString('hex')
}

function toPortableText(paragraphs) {
  return paragraphs.map((text) => ({
    _type: 'block',
    _key: uniqueKey(),
    style: 'normal',
    children: [
      {
        _type: 'span',
        _key: uniqueKey(),
        text,
      },
    ],
  }))
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
})

const doc = {
  _id: DOCUMENT_ID,
  _type: 'caseStudy',
  title: 'Evolve Dance Center',
  slug: { _type: 'slug', current: 'evolve-dance-center' },
  client: 'Evolve Dance Center',
  industry: 'Dance & Performing Arts',
  siteUrl: 'https://evolvedancecenter.com',
  featured: false,
  stack: ['Next.js', 'TypeScript', 'Sanity CMS', 'Tailwind CSS', 'Resend', 'Vercel'],
  summary:
    'A Las Vegas dance studio had outgrown Wix. Pages loaded slowly, the site was invisible in search, and updating anything meant fighting the editor. We rebuilt it on Next.js and Sanity, moved the domain, and their email never went down.',
  challenge: toPortableText([
    'Evolve had been running on Wix for years. The site worked, but it was slow, and every page carried close to half a megabyte of framework code before a single word of their content loaded. The faculty page took nearly four seconds to open.',
    'Search was the bigger problem. Almost none of the pages had a meta description or a proper heading, so Google had very little to work with. Ten instructor bios sat at the top level of the site with about eleven words on each one. Page titles were a single word.',
    'Behind the scenes, the content had drifted. Pages built by duplicating older ones kept the old URLs, so a page titled "2026 Summer Schedule" lived at an address referencing season eight.',
  ]),
  solution: toPortableText([
    'We rebuilt the site on Next.js and Sanity. Nineteen pages against a twelve-page scope, every one with a real page title, a meta description, and a single clear heading.',
    'The mobile hero video was re-encoded from 22MB to 1.1MB, so phones stopped downloading a desktop-sized file. Contact and free-trial forms were rebuilt with spam protection and reliable email delivery.',
    'Content now lives in Sanity, which means the studio updates schedules and staff without touching code or waiting on a developer.',
  ]),
  results: toPortableText([
    'The site moved to the new platform on the same domain, so everything Evolve had built up in search over the years came with it. Every old address redirects to its new home in a single hop.',
    'Email never went down. The mail and verification records were left untouched through both the initial move and a later change of DNS provider, so Google Workspace and Search Console kept working throughout.',
    'The studio now has a site that loads quickly, reads clearly to search engines, and can be updated by the people who run it.',
  ]),
}

try {
  const created = await client.createIfNotExists(doc)
  console.log(`Created case study _id: ${created._id}`)
} catch (err) {
  console.error('Failed to seed Evolve Dance Center case study:')
  if (err instanceof Error) {
    console.error(err.message)
  } else {
    console.error(err)
  }
  process.exit(1)
}
