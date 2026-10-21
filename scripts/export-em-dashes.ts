/**
 * Read-only export of every published-post field or body span containing an
 * em dash (U+2014) or a sentence-break en dash, for rewriting by hand.
 * Writes scripts/data/em-dash-rewrites.json; `rewritten` starts equal to
 * `original`. Does not write to Sanity.
 *
 * Usage: pnpm export-em-dashes
 */

import { config as loadEnv } from 'dotenv'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { hasDashHit } from './lib/em-dash'

const STRING_FIELDS = ['title', 'excerpt', 'metaTitle', 'metaDescription'] as const

type RewriteEntry = {
  docId: string
  slug: string
  field: (typeof STRING_FIELDS)[number] | 'body'
  blockKey: string | null
  spanKey: string | null
  original: string
  rewritten: string
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_PATH = join(root, 'scripts', 'data', 'em-dash-rewrites.json')
loadEnv({ path: join(root, '.env.local'), quiet: true })

const POSTS_QUERY = `*[_type == "post" && !(_id in path("drafts.**"))] | order(slug.current asc) {
  _id,
  "slug": slug.current,
  title,
  excerpt,
  "metaTitle": seo.metaTitle,
  "metaDescription": seo.metaDescription,
  body
}`

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function entriesForPost(post: Record<string, unknown>): RewriteEntry[] {
  const docId = readString(post._id)
  const slug = readString(post.slug) || '(missing slug)'
  const entries: RewriteEntry[] = []

  for (const field of STRING_FIELDS) {
    const text = readString(post[field])
    if (!hasDashHit(text)) continue
    entries.push({ docId, slug, field, blockKey: null, spanKey: null, original: text, rewritten: text })
  }

  if (Array.isArray(post.body)) {
    for (const block of post.body) {
      if (!isRecord(block) || !Array.isArray(block.children)) continue
      for (const child of block.children) {
        if (!isRecord(child)) continue
        const text = readString(child.text)
        if (!hasDashHit(text)) continue
        const blockKey = readString(block._key)
        const spanKey = readString(child._key)
        if (blockKey.length === 0 || spanKey.length === 0) {
          console.warn(`Skipping span without _key in ${slug}: ${text.slice(0, 60)}`)
          continue
        }
        entries.push({ docId, slug, field: 'body', blockKey, spanKey, original: text, rewritten: text })
      }
    }
  }

  return entries
}

async function main(): Promise<void> {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim() ?? ''
  if (projectId.length === 0) {
    console.error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID')
    process.exit(1)
  }

  const { sanityFetch } = await import('../lib/sanity/client')
  const posts = await sanityFetch<unknown>(POSTS_QUERY, {}, { tags: ['post'], fresh: true })
  if (!Array.isArray(posts)) {
    throw new Error('Sanity query did not return a list of posts')
  }

  const entries = posts.flatMap((post) => (isRecord(post) ? entriesForPost(post) : []))

  mkdirSync(dirname(OUT_PATH), { recursive: true })
  writeFileSync(OUT_PATH, `${JSON.stringify(entries, null, 2)}\n`)
  console.log(`Wrote ${entries.length} entries to ${OUT_PATH}`)
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err)
  console.error(message)
  process.exit(1)
})
