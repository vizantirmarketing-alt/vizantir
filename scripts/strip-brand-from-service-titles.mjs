#!/usr/bin/env node
/**
 * Strip brand suffixes from `metaTitle` on Sanity `service` documents.
 *
 * In the schema, metaTitle lives at `seo.metaTitle`. serviceBySlugQuery
 * aliases it as `"metaTitle": seo.metaTitle` — this script uses the same
 * alias when reading, and patches the nested path `seo.metaTitle` (a
 * top-level `metaTitle` patch would create an orphan field nothing reads).
 *
 * USAGE
 *   Dry run (default, writes nothing):
 *     node --env-file=.env.local scripts/strip-brand-from-service-titles.mjs
 *
 *   Apply:
 *     node --env-file=.env.local scripts/strip-brand-from-service-titles.mjs --apply
 *
 * REQUIRES a write token. Create one at sanity.io/manage -> project ->
 * API -> Tokens -> Add API token -> Editor. Add to .env.local as
 * SANITY_API_WRITE_TOKEN. Do not commit it.
 */

import { createClient } from '@sanity/client'

const APPLY = process.argv.includes('--apply')

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

const BRAND_SUFFIXES = [
  ' — Vizantir Design Studio',
  ' - Vizantir Design Studio',
  ' | Vizantir Design Studio',
  ' | Vizantir Studio',
  ' — Vizantir',
  ' - Vizantir',
  ' | Vizantir',
]

function stripBrand(value) {
  let out = String(value).trim()
  let changed = true

  while (changed) {
    changed = false
    for (const suffix of BRAND_SUFFIXES) {
      if (out.toLowerCase().endsWith(suffix.toLowerCase())) {
        out = out.slice(0, -suffix.length).trim()
        changed = true
        break
      }
    }
  }

  return out
}

const query = `*[_type == "service"]{
  _id,
  "slug": slug.current,
  title,
  "metaTitle": seo.metaTitle
} | order(slug asc)`

const docs = await client.fetch(query)

if (!docs.length) {
  console.error('No documents of type "service" found. Check the schema type name.')
  process.exit(1)
}

const changes = []
const skipped = []

for (const doc of docs) {
  if (!doc.metaTitle) {
    skipped.push({ ...doc, reason: 'no metaTitle set' })
    continue
  }

  const next = stripBrand(doc.metaTitle)

  if (next === doc.metaTitle) {
    skipped.push({ ...doc, reason: 'no brand suffix' })
    continue
  }

  if (!next) {
    skipped.push({ ...doc, reason: 'would empty the field' })
    continue
  }

  changes.push({ _id: doc._id, slug: doc.slug, from: doc.metaTitle, to: next })
}

console.log(`\nproject ${projectId} / dataset ${dataset}`)
console.log(`${docs.length} service documents, ${changes.length} to change\n`)

for (const c of changes) {
  const draft = c._id.startsWith('drafts.') ? ' (draft)' : ''
  console.log(`  ${c.slug}${draft}`)
  console.log(`    -  ${c.from}`)
  console.log(`    +  ${c.to}`)
}

if (skipped.length) {
  console.log(`\nskipped:`)
  for (const s of skipped) {
    console.log(`  ${s.slug ?? s._id} — ${s.reason}`)
  }
}

if (!changes.length) {
  console.log('\nNothing to do.')
  process.exit(0)
}

if (!APPLY) {
  console.log(`\nDry run. Re-run with --apply to commit these ${changes.length} changes.`)
  process.exit(0)
}

const tx = changes.reduce(
  (t, c) => t.patch(c._id, (p) => p.set({ 'seo.metaTitle': c.to })),
  client.transaction(),
)

await tx.commit()

console.log(`\nCommitted ${changes.length} patches.`)
console.log('Published documents update immediately. Drafts need publishing in Studio.')
console.log('Front end reflects changes after ISR revalidate (up to 1h) or a redeploy.')
