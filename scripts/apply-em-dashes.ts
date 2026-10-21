/**
 * Applies edited entries from scripts/data/em-dash-rewrites.json to Sanity.
 * Only entries whose `rewritten` differs from `original` are patched, and
 * only if the live value still equals `original`. One transaction per
 * document. Dry run by default.
 *
 * Usage: pnpm apply-em-dashes [--apply]
 */

import { createClient } from '@sanity/client'
import { config as loadEnv } from 'dotenv'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

type RewriteEntry = {
  docId: string
  slug: string
  field: 'title' | 'excerpt' | 'metaTitle' | 'metaDescription' | 'body'
  blockKey: string | null
  spanKey: string | null
  original: string
  rewritten: string
}

type LiveDoc = {
  _id: string
  _rev: string
  title?: string
  excerpt?: string
  metaTitle?: string
  metaDescription?: string
  body?: unknown
}

type PendingPatch = { path: string; value: string; label: string }

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const DATA_PATH = join(root, 'scripts', 'data', 'em-dash-rewrites.json')
const APPLY = process.argv.includes('--apply')
loadEnv({ path: join(root, '.env.local'), quiet: true })

const DOC_QUERY = `*[_id == $id][0]{
  _id,
  _rev,
  title,
  excerpt,
  "metaTitle": seo.metaTitle,
  "metaDescription": seo.metaDescription,
  body
}`

const FIELD_PATHS: Record<string, string> = {
  title: 'title',
  excerpt: 'excerpt',
  metaTitle: 'seo.metaTitle',
  metaDescription: 'seo.metaDescription',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requireEnv(name: string, value: string | undefined): string {
  if (!value || !value.trim()) {
    console.error(`Missing required environment variable: ${name}`)
    process.exit(1)
  }
  return value.trim()
}

function readEntries(): RewriteEntry[] {
  const parsed: unknown = JSON.parse(readFileSync(DATA_PATH, 'utf8'))
  if (!Array.isArray(parsed)) throw new Error(`${DATA_PATH} is not an array`)
  return parsed as RewriteEntry[]
}

function liveSpanText(doc: LiveDoc, blockKey: string, spanKey: string): string | null {
  if (!Array.isArray(doc.body)) return null
  const block = doc.body.find((b) => isRecord(b) && b._key === blockKey)
  if (!isRecord(block) || !Array.isArray(block.children)) return null
  const span = block.children.find((c) => isRecord(c) && c._key === spanKey)
  return isRecord(span) && typeof span.text === 'string' ? span.text : null
}

function pendingPatch(entry: RewriteEntry, doc: LiveDoc): PendingPatch | null {
  const where = `${entry.slug} ${entry.field}${entry.spanKey ? ` [${entry.blockKey}/${entry.spanKey}]` : ''}`

  if (entry.field === 'body') {
    if (!entry.blockKey || !entry.spanKey) {
      console.warn(`WARN skipped ${where}: body entry missing blockKey/spanKey`)
      return null
    }
    const live = liveSpanText(doc, entry.blockKey, entry.spanKey)
    if (live !== entry.original) {
      console.warn(`WARN skipped ${where}: live span ${live === null ? 'not found' : 'changed since export'}`)
      return null
    }
    return {
      path: `body[_key=="${entry.blockKey}"].children[_key=="${entry.spanKey}"].text`,
      value: entry.rewritten,
      label: where,
    }
  }

  const live = doc[entry.field]
  if (live !== entry.original) {
    console.warn(`WARN skipped ${where}: live value changed since export`)
    return null
  }
  return { path: FIELD_PATHS[entry.field], value: entry.rewritten, label: where }
}

async function main(): Promise<void> {
  const client = createClient({
    projectId: requireEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', process.env.NEXT_PUBLIC_SANITY_PROJECT_ID),
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || 'production',
    token: requireEnv(
      'SANITY_API_WRITE_TOKEN',
      process.env.SANITY_API_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
    ),
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-12-05',
    useCdn: false,
  })

  const changed = readEntries().filter((e) => e.rewritten !== e.original)
  const byDoc = new Map<string, RewriteEntry[]>()
  for (const entry of changed) {
    byDoc.set(entry.docId, [...(byDoc.get(entry.docId) ?? []), entry])
  }

  let patched = 0
  let skipped = 0
  let failed = 0

  for (const [docId, entries] of byDoc) {
    const slug = entries[0]?.slug ?? docId
    const doc = await client.fetch<LiveDoc | null>(DOC_QUERY, { id: docId })
    if (!doc) {
      console.warn(`WARN skipped ${slug}: document ${docId} not found`)
      skipped += entries.length
      continue
    }

    const patches = entries.flatMap((e) => pendingPatch(e, doc) ?? [])
    skipped += entries.length - patches.length
    if (patches.length === 0) continue

    console.log(`${slug}: ${patches.length} of ${entries.length} patch(es)`)
    for (const p of patches) console.log(`  ${p.label}`)

    if (!APPLY) {
      patched += patches.length
      continue
    }

    try {
      const tx = client.transaction()
      for (const p of patches) {
        tx.patch(docId, { ifRevisionID: doc._rev, set: { [p.path]: p.value } })
      }
      await tx.commit()
      patched += patches.length
    } catch (err) {
      failed += patches.length
      console.error(`ERROR ${slug}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  console.log(
    `\n${APPLY ? 'Applied' : 'Would apply'}: ${patched}  Skipped: ${skipped}  Failed: ${failed}  Documents: ${byDoc.size}`,
  )
  if (!APPLY) console.log('Dry run. Re-run with --apply to write.')
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
