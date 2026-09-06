/**
 * Add one contextual pillar link from each remaining WordPress cluster
 * spoke to /nextjs-vs-wordpress. Finds a phrase that already exists in
 * the post, splits the span if needed, and applies a Portable Text link
 * mark. Never substitutes different words for the matched text.
 *
 * Default: dry run. Pass --execute to write.
 * Aborts without writing if any target phrase matches zero or more than
 * one place in its post, or if applying the mark would change sentence
 * text. Posts that already link to the pillar, or that have no suitable
 * existing phrase, are reported and skipped.
 *
 * Run: pnpm link:wordpress-cluster-pillar
 *      pnpm link:wordpress-cluster-pillar -- --execute
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
const PILLAR_HREF = '/nextjs-vs-wordpress'
const PILLAR_HREF_MARKERS = ['/nextjs-vs-wordpress', 'nextjs-vs-wordpress']
const MAX_PHRASE_REUSE = 2

type Span = {
  _type?: string
  _key?: string
  text?: string
  marks?: string[]
}

type LinkMarkDef = {
  _type: 'link'
  _key: string
  href: string
}

type PortableBlock = {
  _type?: string
  _key?: string
  style?: string
  listItem?: string
  level?: number
  children?: Span[]
  markDefs?: unknown[]
}

type PostDoc = {
  _id: string
  title: string
  slug: string
  body: PortableBlock[] | null
}

type Target = {
  id: string
  slug: string
  phrase: string | null
}

const TARGETS: Target[] = [
  {
    id: 'pillar-3year',
    slug: 'wordpress-vs-nextjs-3-year-cost-comparison',
    phrase: '$15K Next.js build',
  },
  {
    id: 'pillar-hidden',
    slug: 'hidden-wordpress-costs-agencies-dont-tell-you',
    phrase: 'We build on Next.js',
  },
  {
    id: 'pillar-page-builder',
    slug: 'the-page-builder-stack-your-wordpress-agency-didnt-explain',
    phrase: 'A Vizantir Next.js site',
  },
  {
    id: 'pillar-elementor',
    slug: 'the-elementor-renewal-charge-that-wasnt-supposed-to-happen',
    phrase: 'builds a site on Next.js',
  },
  {
    id: 'pillar-engagement',
    slug: 'what-a-vizantir-engagement-discloses-that-a-wordpress-agency-engagement-usually-doesnt',
    phrase: null,
  },
  {
    id: 'pillar-secure',
    slug: 'is-wordpress-secure',
    phrase: 'WordPress vs Next.js',
  },
  {
    id: 'pillar-breach',
    slug: 'real-cost-wordpress-security-breach',
    phrase: 'Custom Next.js sites',
  },
  {
    id: 'pillar-slow',
    slug: 'why-wordpress-site-slow',
    phrase: 'A Next.js site',
  },
  {
    id: 'pillar-speedup',
    slug: 'how-to-speed-up-wordpress',
    phrase: 'a Next.js rebuild',
  },
  {
    id: 'pillar-agencies',
    slug: 'why-most-agencies-still-use-wordpress',
    phrase: 'We moved to Next.js',
  },
  {
    id: 'pillar-dont-build',
    slug: 'why-we-dont-build-wordpress-sites',
    phrase: 'Next.js pre-builds pages at deploy time',
  },
  {
    id: 'pillar-relevant',
    slug: 'is-wordpress-still-relevant-2026',
    phrase: 'Next.js for performance, premium brand expression, and long-term scalability',
  },
  {
    id: 'pillar-yoast',
    slug: 'do-you-need-yoast-seo',
    phrase: "Next.js doesn't use WordPress plugins",
  },
  {
    id: 'pillar-vercel',
    slug: 'vercel-vs-wp-engine',
    phrase: 'WordPress vs. Next.js',
  },
  {
    id: 'pillar-builders',
    slug: 'website-builders-vs-custom-development',
    phrase: 'We build custom Next.js sites at Vizantir',
  },
  {
    id: 'pillar-true-cost',
    slug: 'true-cost-of-wordpress-website',
    phrase: 'A custom Next.js build',
  },
]

const NO_SUITABLE_PHRASE =
  'no suitable existing phrase that refers to the platform comparison or the Next.js choice'

function requireEnv(name: string, value: string | undefined): string {
  if (!value || !String(value).trim()) {
    console.error(`Missing required environment variable: ${name}`)
    process.exit(1)
  }
  return value.trim()
}

function createWriteClient(): SanityClient {
  loadEnv({ path: join(ROOT, '.env.local'), quiet: true })

  const projectId = requireEnv(
    'NEXT_PUBLIC_SANITY_PROJECT_ID',
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  )
  const dataset = requireEnv('NEXT_PUBLIC_SANITY_DATASET', process.env.NEXT_PUBLIC_SANITY_DATASET)
  const token = requireEnv(
    'SANITY_API_WRITE_TOKEN',
    process.env.SANITY_API_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
  )

  return createClient({
    projectId,
    dataset,
    token,
    apiVersion: API_VERSION,
    useCdn: false,
  })
}

function newKey(): string {
  return randomBytes(6).toString('hex')
}

function rawBlockText(block: PortableBlock): string {
  if (block._type !== 'block' || !Array.isArray(block.children)) {
    return ''
  }
  return block.children.map((child) => child.text ?? '').join('')
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0
  let count = 0
  let from = 0
  while (from <= haystack.length) {
    const index = haystack.indexOf(needle, from)
    if (index === -1) break
    count += 1
    from = index + needle.length
  }
  return count
}

function countInPost(post: Pick<PostDoc, 'body'>, find: string): number {
  const blocks = Array.isArray(post.body) ? post.body : []
  return blocks.reduce((sum, block) => sum + countOccurrences(rawBlockText(block), find), 0)
}

function hrefLooksLikePillar(href: string): boolean {
  const trimmed = href.trim().toLowerCase()
  return PILLAR_HREF_MARKERS.some((marker) => trimmed.includes(marker))
}

function postAlreadyLinksToPillar(post: PostDoc): boolean {
  const blocks = Array.isArray(post.body) ? post.body : []
  for (const block of blocks) {
    const defs = Array.isArray(block.markDefs) ? block.markDefs : []
    for (const def of defs) {
      if (!def || typeof def !== 'object') continue
      const record = def as { _type?: unknown; href?: unknown }
      if (record._type !== 'link') continue
      if (typeof record.href !== 'string') continue
      if (hrefLooksLikePillar(record.href)) return true
    }
  }
  return false
}

function existingMarkKeys(markDefs: unknown[] | undefined): Set<string> {
  const keys = new Set<string>()
  if (!Array.isArray(markDefs)) return keys
  for (const def of markDefs) {
    if (!def || typeof def !== 'object') continue
    const key = (def as { _key?: unknown })._key
    if (typeof key === 'string' && key) keys.add(key)
  }
  return keys
}

function isLinkMarkKey(markDefs: unknown[] | undefined, mark: string): boolean {
  if (!Array.isArray(markDefs)) return false
  for (const def of markDefs) {
    if (!def || typeof def !== 'object') continue
    const record = def as { _type?: unknown; _key?: unknown }
    if (record._key === mark && record._type === 'link') return true
  }
  return false
}

function markPhrase(sentence: string, phrase: string): string {
  const index = sentence.indexOf(phrase)
  if (index === -1) return sentence
  return `${sentence.slice(0, index)}«${phrase}»${sentence.slice(index + phrase.length)}`
}

function linkPhraseInChildren(
  children: Span[],
  phrase: string,
  markKey: string,
  markDefs: unknown[] | undefined,
): Span[] {
  const joined = children.map((child) => child.text ?? '').join('')
  const matchStart = joined.indexOf(phrase)
  if (matchStart === -1) {
    throw new Error('linkPhraseInChildren called without a match')
  }
  const matchEnd = matchStart + phrase.length

  const next: Span[] = []
  let offset = 0

  for (const span of children) {
    const text = span.text ?? ''
    const start = offset
    const end = offset + text.length
    offset = end

    const overlaps = start < matchEnd && end > matchStart
    if (!overlaps) {
      next.push({ ...span, text })
      continue
    }

    const marks = Array.isArray(span.marks) ? span.marks : []
    for (const mark of marks) {
      if (isLinkMarkKey(markDefs, mark)) {
        throw new Error('phrase already has a link mark')
      }
    }

    const prefix = text.slice(0, Math.max(0, matchStart - start))
    const mid = text.slice(Math.max(0, matchStart - start), Math.max(0, matchEnd - start))
    const suffix = text.slice(Math.max(0, matchEnd - start))

    if (prefix) {
      next.push({
        ...span,
        _key: span._key ?? newKey(),
        text: prefix,
        marks: [...marks],
      })
    }

    if (mid) {
      next.push({
        _type: span._type ?? 'span',
        _key: newKey(),
        text: mid,
        marks: [...marks, markKey],
      })
    }

    if (suffix) {
      next.push({
        ...span,
        _key: newKey(),
        text: suffix,
        marks: [...marks],
      })
    }
  }

  const reconstructed = next.map((span) => span.text ?? '').join('')
  if (reconstructed !== joined) {
    throw new Error('linkPhraseInChildren changed span text')
  }

  return next
}

function applyLinkToBody(
  body: PortableBlock[],
  phrase: string,
): { body: PortableBlock[]; before: string; after: string } {
  const next: PortableBlock[] = []
  let before = ''
  let after = ''
  let applied = false

  for (const block of body) {
    const text = rawBlockText(block)
    const hits = countOccurrences(text, phrase)
    if (hits === 0) {
      next.push(block)
      continue
    }
    if (applied || hits > 1) {
      throw new Error('applyLinkToBody expected exactly one match in the working body')
    }

    applied = true
    before = text

    const existingKeys = existingMarkKeys(block.markDefs)
    let markKey = newKey()
    while (existingKeys.has(markKey)) {
      markKey = newKey()
    }

    const linkedChildren = linkPhraseInChildren(block.children ?? [], phrase, markKey, block.markDefs)
    const linkDef: LinkMarkDef = {
      _type: 'link',
      _key: markKey,
      href: PILLAR_HREF,
    }
    const markDefs = [...(Array.isArray(block.markDefs) ? block.markDefs : []), linkDef]
    const linked: PortableBlock = { ...block, children: linkedChildren, markDefs }
    after = rawBlockText(linked)
    if (before !== after) {
      throw new Error('applyLinkToBody changed sentence text')
    }
    next.push(linked)
  }

  if (!applied) {
    throw new Error('applyLinkToBody did not find the target phrase')
  }

  return { body: next, before, after }
}

function describePhrase(phrase: string): string {
  if (phrase.length <= 96) return `"${phrase}"`
  return `"${phrase.slice(0, 93)}..."`
}

async function main() {
  const isExecute = process.argv.includes('--execute')
  console.log(isExecute ? 'EXECUTE' : 'DRY RUN')
  console.log('')

  const configErrors: string[] = []
  const phraseUses = new Map<string, number>()
  for (const target of TARGETS) {
    if (target.phrase === null) continue
    if (!target.phrase) {
      configErrors.push(`${target.slug}: empty phrase`)
      continue
    }
    const uses = (phraseUses.get(target.phrase) ?? 0) + 1
    phraseUses.set(target.phrase, uses)
    if (uses > MAX_PHRASE_REUSE) {
      configErrors.push(
        `${target.slug}: phrase ${describePhrase(target.phrase)} used in more than ${MAX_PHRASE_REUSE} posts`,
      )
    }
  }
  if (configErrors.length > 0) {
    console.error('Aborting — no documents written.')
    for (const error of configErrors) {
      console.error(`  ${error}`)
    }
    process.exit(1)
  }

  const slugs = [...new Set(TARGETS.map((target) => target.slug))]
  const client = createWriteClient()
  const posts = await client.fetch<PostDoc[]>(
    `*[_type == "post" && defined(publishedAt) && !(_id in path("drafts.**")) && slug.current in $slugs]{
      _id,
      title,
      "slug": slug.current,
      body
    }`,
    { slugs },
  )

  const postsBySlug = new Map(posts.map((post) => [post.slug, post]))

  console.log(`Target slugs:     ${slugs.length}`)
  console.log(`Published posts:  ${posts.length}`)
  console.log(`Targets:          ${TARGETS.length}`)
  console.log('')

  const matchErrors: string[] = []
  const skipped: Array<{ target: Target; post: PostDoc | null; reason: string }> = []
  const resolved: Array<{ target: Target; post: PostDoc; phrase: string }> = []

  for (const target of TARGETS) {
    const post = postsBySlug.get(target.slug)
    if (!post) {
      matchErrors.push(
        `${target.slug}: post not found${target.phrase ? ` (${describePhrase(target.phrase)})` : ''}`,
      )
      continue
    }

    if (target.phrase === null) {
      skipped.push({ target, post, reason: NO_SUITABLE_PHRASE })
      continue
    }

    if (postAlreadyLinksToPillar(post)) {
      skipped.push({ target, post, reason: 'already links to /nextjs-vs-wordpress' })
      continue
    }

    const phraseCount = countInPost(post, target.phrase)
    if (phraseCount !== 1) {
      matchErrors.push(
        `${target.slug}: expected exactly one match for ${describePhrase(target.phrase)}, found ${phraseCount}`,
      )
      continue
    }

    resolved.push({ target, post, phrase: target.phrase })
  }

  if (matchErrors.length > 0) {
    console.error('Aborting — no documents written.')
    for (const error of matchErrors) {
      console.error(`  ${error}`)
    }
    process.exit(1)
  }

  const workingBodies = new Map<string, PortableBlock[]>()
  for (const post of posts) {
    workingBodies.set(post.slug, structuredClone(post.body ?? []))
  }

  const total = TARGETS.length
  const updatedSlugs = new Set<string>()
  const textChangedIds: string[] = []
  let index = 0

  for (const target of TARGETS) {
    index += 1
    const skippedRow = skipped.find((row) => row.target.id === target.id)
    if (skippedRow) {
      const post = skippedRow.post
      console.log(`[${index}/${total}] ${target.slug}`)
      if (post) {
        console.log(`  ${post._id}`)
        console.log(`  ${post.title}`)
      }
      console.log(`  Phrase: (none)`)
      console.log(`  Status: skipped — ${skippedRow.reason}`)
      console.log('')
      continue
    }

    const resolvedRow = resolved.find((row) => row.target.id === target.id)
    if (!resolvedRow) {
      throw new Error(`Missing resolved row for ${target.slug}`)
    }

    const { post, phrase } = resolvedRow
    const currentBody = workingBodies.get(post.slug)
    if (!currentBody) {
      throw new Error(`Missing working body for ${post.slug}`)
    }

    const applied = applyLinkToBody(currentBody, phrase)
    if (applied.before !== applied.after) {
      textChangedIds.push(`${post.slug}#${target.id}`)
    }

    const phraseCount = applied.body.reduce(
      (sum, block) => sum + countOccurrences(rawBlockText(block), phrase),
      0,
    )
    if (phraseCount !== 1) {
      console.error('Aborting — no documents written.')
      console.error(
        `  ${target.slug}: phrase ${describePhrase(phrase)} is not unique after apply (found ${phraseCount})`,
      )
      process.exit(1)
    }

    workingBodies.set(post.slug, applied.body)
    updatedSlugs.add(post.slug)

    console.log(`[${index}/${total}] ${post.slug}`)
    console.log(`  ${post._id}`)
    console.log(`  ${post.title}`)
    console.log(`  Phrase: ${phrase}`)
    console.log(`  Href: ${PILLAR_HREF}`)
    console.log(`  Before: ${markPhrase(applied.before, phrase)}`)
    console.log(`  After:  ${markPhrase(applied.after, phrase)}`)
    console.log(`  Text identical: ${applied.before === applied.after ? 'yes' : 'NO'}`)
    console.log(isExecute ? '  Status: updated' : '  Status: would update')
    console.log('')
  }

  if (textChangedIds.length > 0) {
    console.error('Aborting — no documents written.')
    for (const id of textChangedIds) {
      console.error(`  ${id}: sentence text changed`)
    }
    process.exit(1)
  }

  if (isExecute) {
    for (const slug of updatedSlugs) {
      const post = postsBySlug.get(slug)
      const body = workingBodies.get(slug)
      if (!post || !body) {
        throw new Error(`Cannot patch ${slug}: missing post or body`)
      }
      await client.patch(post._id).set({ body }).commit()
    }
  }

  console.log('Summary')
  console.log(`  Links:              ${resolved.length}`)
  console.log(`  Skipped:            ${skipped.length}`)
  console.log(`  ${isExecute ? 'Updated' : 'Would update'}:       ${updatedSlugs.size} post(s)`)
  console.log(`  Sentence text changed: 0`)

  if (!isExecute) {
    console.log('')
    console.log('Dry run complete — no writes. Pass --execute to patch documents in Sanity.')
  }
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
