#!/usr/bin/env node
/**
 * Create the James Tram author document and repoint all post.author
 * references to it. Idempotent via createIfNotExists with a fixed _id.
 * Does not delete or modify the existing Vizantir author.
 *
 * USAGE
 *   Dry run (default, writes nothing):
 *     node --env-file=.env.local scripts/create-james-author.mjs
 *
 *   Apply:
 *     Set DRY_RUN to false below, then:
 *     node --env-file=.env.local scripts/create-james-author.mjs
 *
 * REQUIRES a write token. Create one at sanity.io/manage -> project ->
 * API -> Tokens -> Add API token -> Editor. Add to .env.local as
 * SANITY_API_WRITE_TOKEN. Do not commit it.
 */

import { createClient } from '@sanity/client'

const DRY_RUN = false

const AUTHOR_ID = 'author-james-tram'

const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
  process.env.SANITY_PROJECT_ID ||
  process.env.SANITY_STUDIO_PROJECT_ID

const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET ||
  process.env.SANITY_DATASET ||
  process.env.SANITY_STUDIO_DATASET ||
  'production'

const token =
  process.env.SANITY_API_WRITE_TOKEN ||
  process.env.SANITY_WRITE_TOKEN ||
  process.env.SANITY_API_TOKEN

if (!projectId) {
  console.error('Missing project id. Expected NEXT_PUBLIC_SANITY_PROJECT_ID in .env.local')
  process.exit(1)
}

if (!token) {
  console.error('Missing write token. Expected SANITY_API_WRITE_TOKEN in .env.local')
  console.error('Create one: sanity.io/manage -> project -> API -> Tokens -> Editor')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2024-10-01',
  useCdn: false,
  perspective: 'raw',
})

const authorDoc = {
  _id: AUTHOR_ID,
  _type: 'author',
  name: 'James Tram',
  slug: { _type: 'slug', current: 'james-tram' },
  role: 'Founder',
  linkedin: 'https://www.linkedin.com/in/james-tram-vizantir',
  credentials: [
    '25 years operating businesses',
    'Next.js, TypeScript, Sanity',
    'Founder, Vizantir Design Studio',
  ],
  bio: [
    {
      _type: 'block',
      _key: 'bio1',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'bio1s',
          marks: [],
          text: 'James founded Vizantir Design Studio after 25 years running businesses. He builds custom sites in Next.js, TypeScript, and Sanity, and writes about what actually breaks on WordPress and what replaces it.',
        },
      ],
    },
  ],
}

const posts = await client.fetch(`*[_type == "post"]{ _id, title, "slug": slug.current, author }`)

console.log(`\nproject ${projectId} / dataset ${dataset}`)
console.log(`Found ${posts.length} post documents`)
console.log(`Would createIfNotExists author "${authorDoc.name}" (_id: ${AUTHOR_ID})`)
console.log(`Would patch author ref on ${posts.length} posts → ${AUTHOR_ID}\n`)

for (const post of posts) {
  const draft = post._id.startsWith('drafts.') ? ' (draft)' : ''
  const prev = post.author?._ref ?? '(none)'
  console.log(`  ${post.slug ?? post._id}${draft}`)
  console.log(`    author: ${prev} → ${AUTHOR_ID}`)
}

if (DRY_RUN) {
  console.log(`\nDry run. Set DRY_RUN to false to commit (1 author + ${posts.length} post patches).`)
  process.exit(0)
}

const tx = posts.reduce(
  (t, post) =>
    t.patch(post._id, (p) =>
      p.set({
        author: { _type: 'reference', _ref: AUTHOR_ID },
      }),
    ),
  client.transaction().createIfNotExists(authorDoc),
)

await tx.commit()

console.log(`\nCreated/ensured author ${AUTHOR_ID}.`)
console.log(`Patched ${posts.length} posts.`)
console.log('Published documents update immediately. Drafts need publishing in Studio.')
console.log('Front end reflects changes after ISR revalidate (up to 1h) or a redeploy.')
