/**
 * Correct dead software and tool recommendations in published Sanity posts.
 *
 * Searched every published post. Instances:
 * 1. Search Console Mobile Usability report
 *    why-your-website-needs-to-work-in-every-direction
 *    Exact passage:
 *    "Then open Google Search Console and check the Mobile Usability report.
 *    Any flagged issues there are worth addressing immediately."
 *    Related claim that GSC still flags those issue types is in the same post.
 *    Related "mobile usability scoring" line is Core Web Vitals language and
 *    is left alone.
 * 2. StackPath
 *    how-to-speed-up-wordpress, why-wordpress-site-slow
 *    Companion CDNs: Cloudflare (current), BunnyCDN (current),
 *    KeyCDN (current, speed-up post only). Drop StackPath. Do not replace it.
 * 3. PHP 8.1
 *    how-to-speed-up-wordpress, why-wordpress-gets-hacked,
 *    why-wordpress-site-slow, is-wordpress-secure
 *    Floor is a version still receiving security support, 8.3 or later.
 *
 * Default: dry run. Pass --execute to write.
 * Aborts without writing if any target string matches zero or more than one
 * place in its post, or if a required scan hit has no matching fix.
 *
 * Run: pnpm correct:dead-tool-recs
 *      pnpm correct:dead-tool-recs -- --execute
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

type Span = {
  _type?: string
  _key?: string
  text?: string
  marks?: string[]
}

type PortableBlock = {
  _type?: string
  _key?: string
  style?: string
  listItem?: string
  level?: number
  children?: Span[]
  markDefs?: unknown[]
  code?: string
}

type PostDoc = {
  _id: string
  title: string
  slug: string
  excerpt: string | null
  seo: { metaDescription?: string | null; metaTitle?: string | null } | null
  body: PortableBlock[] | null
}

type ClaimFix = {
  id: string
  slug: string
  label: string
  find: string
  replace: string
}

type ScanField = 'body' | 'excerpt' | 'seo.metaDescription' | 'seo.metaTitle'

type ScanHit = {
  slug: string
  title: string
  field: ScanField
  text: string
  kind: 'required' | 'related'
}

const FIXES: ClaimFix[] = [
  {
    id: 'gsc-mobile-report',
    slug: 'why-your-website-needs-to-work-in-every-direction',
    label: 'Search Console Mobile Usability report',
    find:
      'Then open Google Search Console and check the Mobile Usability report. Any flagged issues there are worth addressing immediately.',
    replace:
      'Then check mobile layout in Chrome DevTools device emulation, field data in the Core Web Vitals report in Search Console, and PageSpeed Insights.',
  },
  {
    id: 'gsc-mobile-flags',
    slug: 'why-your-website-needs-to-work-in-every-direction',
    label: 'Search Console still flags retired mobile usability issues',
    find:
      'Beyond rankings, Google Search Console flags specific mobile usability issues — text too small to read, clickable elements too close together, content wider than the screen. These are not just UX problems. They are signals Google uses to evaluate how much to trust your site.',
    replace:
      'Beyond rankings, text that is too small to read, tap targets that sit too close together, and content wider than the screen still fail people on phones. Check those in Chrome DevTools device emulation and PageSpeed Insights. Field data lives in the Core Web Vitals report in Search Console.',
  },
  {
    id: 'stackpath-speed-up',
    slug: 'how-to-speed-up-wordpress',
    label: 'StackPath CDN',
    find: 'StackPath',
    replace: '',
  },
  {
    id: 'stackpath-site-slow',
    slug: 'why-wordpress-site-slow',
    label: 'StackPath CDN',
    find: 'StackPath',
    replace: '',
  },
  {
    id: 'php-81-speed-up',
    slug: 'how-to-speed-up-wordpress',
    label: 'PHP 8.1+',
    find:
      'PHP 8.1+ is meaningfully faster than older versions, and 8.2/8.3 are faster still. Check with your host — most make upgrading a one-click option.',
    replace:
      'Run a PHP version that still receives security support. PHP 8.3 or later is the practical floor. Check with your host. Most make upgrading a one-click option.',
  },
  {
    id: 'php-81-hacked',
    slug: 'why-wordpress-gets-hacked',
    label: 'PHP 8.1 floor',
    find:
      'Keep PHP updated. Run at least PHP 8.1. Older versions have their own unpatched vulnerabilities',
    replace:
      'Keep PHP updated. Run a version that still receives security support, PHP 8.3 or later. Older versions have their own unpatched vulnerabilities',
  },
  {
    id: 'php-81-site-slow',
    slug: 'why-wordpress-site-slow',
    label: 'PHP 8.1 or higher',
    find: 'Update PHP to version 8.1 or higher',
    replace: 'Update PHP to a version that still receives security support, 8.3 or later',
  },
  {
    id: 'php-81-secure',
    slug: 'is-wordpress-secure',
    label: 'PHP 8.1 or higher',
    find: 'PHP: Use version 8.1 or higher',
    replace: 'PHP: Use a version that still receives security support, 8.3 or later',
  },
]

function isRequiredHit(text: string): boolean {
  return (
    /Mobile Usability report/.test(text) ||
    /flags specific mobile usability issues/.test(text) ||
    /StackPath/.test(text) ||
    /PHP 8\.1/.test(text) ||
    /version 8\.1 or higher/.test(text)
  )
}

function isRelatedHit(text: string): boolean {
  return /mobile usability/i.test(text) && !isRequiredHit(text)
}

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
  if (block._type === 'codeBlock' && typeof block.code === 'string') {
    return block.code
  }
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

function countInPost(post: PostDoc, find: string): number {
  const blocks = Array.isArray(post.body) ? post.body : []
  return blocks.reduce((sum, block) => sum + countOccurrences(rawBlockText(block), find), 0)
}

function tidySpans(spans: Span[]): Span[] {
  const next: Span[] = []

  for (const span of spans) {
    const text = (span.text ?? '').replace(/ {2,}/g, ' ')
    if (!text) continue
    next.push({ ...span, text })
  }

  if (next.length === 0) return next

  const first = next[0]
  const last = next[next.length - 1]
  first.text = (first.text ?? '').replace(/^ +/, '')
  last.text = (last.text ?? '').replace(/ +$/, '')

  for (let i = 0; i < next.length - 1; i++) {
    const current = next[i]
    const following = next[i + 1]
    const currentText = current.text ?? ''
    const followingText = following.text ?? ''
    if (currentText.endsWith(' ') && followingText.startsWith(' ')) {
      following.text = followingText.replace(/^ +/, '')
    }
  }

  return next.filter((span) => (span.text ?? '') !== '')
}

function replaceInChildren(children: Span[], find: string, replace: string): Span[] {
  const joined = children.map((child) => child.text ?? '').join('')
  const matchStart = joined.indexOf(find)
  if (matchStart === -1) {
    throw new Error('replaceInChildren called without a match')
  }
  const matchEnd = matchStart + find.length

  const next: Span[] = []
  let offset = 0
  let inserted = false

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

    const prefix = text.slice(0, Math.max(0, matchStart - start))
    const suffix = text.slice(Math.max(0, matchEnd - start))

    if (prefix) {
      next.push({
        ...span,
        _key: span._key ?? newKey(),
        text: prefix,
      })
    }

    if (!inserted) {
      if (replace) {
        next.push({
          _type: 'span',
          _key: newKey(),
          text: replace,
          marks: [],
        })
      }
      inserted = true
    }

    if (suffix) {
      next.push({
        ...span,
        _key: newKey(),
        text: suffix,
      })
    }
  }

  return tidySpans(next)
}

function replaceInBody(
  body: PortableBlock[],
  find: string,
  replace: string,
): { body: PortableBlock[]; before: string; after: string; blockRemoved: boolean } {
  const next: PortableBlock[] = []
  let before = ''
  let after = ''
  let blockRemoved = false
  let applied = false

  for (const block of body) {
    const text = rawBlockText(block)
    const hits = countOccurrences(text, find)
    if (hits === 0) {
      next.push(block)
      continue
    }
    if (applied || hits > 1) {
      throw new Error('replaceInBody expected exactly one match in the working body')
    }

    applied = true
    before = text
    const children = replaceInChildren(block.children ?? [], find, replace)
    const replaced: PortableBlock = { ...block, children }
    const nextText = rawBlockText(replaced)

    if (!nextText.trim()) {
      blockRemoved = true
      after = ''
      continue
    }

    after = nextText
    next.push(replaced)
  }

  if (!applied) {
    throw new Error('replaceInBody did not find the target string')
  }

  return { body: next, before, after, blockRemoved }
}

function describeFind(find: string): string {
  if (find.length <= 96) return `"${find}"`
  return `"${find.slice(0, 93)}..."`
}

function collectHits(post: PostDoc): ScanHit[] {
  const hits: ScanHit[] = []
  const fields: Array<[ScanField, string]> = []

  if (post.excerpt) fields.push(['excerpt', post.excerpt])
  if (post.seo?.metaDescription) {
    fields.push(['seo.metaDescription', post.seo.metaDescription])
  }
  if (post.seo?.metaTitle) fields.push(['seo.metaTitle', post.seo.metaTitle])

  for (const [field, text] of fields) {
    if (isRequiredHit(text)) {
      hits.push({ slug: post.slug, title: post.title, field, text, kind: 'required' })
    } else if (isRelatedHit(text)) {
      hits.push({ slug: post.slug, title: post.title, field, text, kind: 'related' })
    }
  }

  for (const block of post.body ?? []) {
    const text = rawBlockText(block)
    if (!text) continue
    if (isRequiredHit(text)) {
      hits.push({ slug: post.slug, title: post.title, field: 'body', text, kind: 'required' })
    } else if (isRelatedHit(text)) {
      hits.push({ slug: post.slug, title: post.title, field: 'body', text, kind: 'related' })
    }
  }

  return hits
}

function hitCoveredByFix(hit: ScanHit): boolean {
  return FIXES.some((fix) => fix.slug === hit.slug && hit.text.includes(fix.find))
}

function printHits(label: string, hits: ScanHit[]): void {
  console.log(label)
  if (hits.length === 0) {
    console.log('  none')
    console.log('')
    return
  }

  for (const hit of hits) {
    console.log(`  ${hit.slug}`)
    console.log(`    ${hit.title}`)
    console.log(`    field: ${hit.field}`)
    console.log(`    ${hit.text}`)
    console.log('')
  }
}

async function main() {
  const isExecute = process.argv.includes('--execute')
  console.log(isExecute ? 'EXECUTE' : 'DRY RUN')
  console.log('')

  const client = createWriteClient()
  const posts = await client.fetch<PostDoc[]>(
    `*[_type == "post" && defined(publishedAt) && !(_id in path("drafts.**"))] | order(publishedAt desc){
      _id,
      title,
      "slug": slug.current,
      excerpt,
      seo,
      body
    }`,
  )

  const postsBySlug = new Map(posts.map((post) => [post.slug, post]))
  const hits = posts.flatMap((post) => collectHits(post))
  const requiredHits = hits.filter((hit) => hit.kind === 'required')
  const relatedHits = hits.filter((hit) => hit.kind === 'related')

  console.log(`Published posts:  ${posts.length}`)
  console.log(`Required hits:    ${requiredHits.length}`)
  console.log(`Related hits:     ${relatedHits.length}`)
  console.log(`Fixes:            ${FIXES.length}`)
  console.log('')

  printHits('Required instances', requiredHits)
  printHits('Related instances (not rewritten)', relatedHits)

  const matchErrors: string[] = []
  const resolved: Array<{ fix: ClaimFix; post: PostDoc }> = []

  for (const hit of requiredHits) {
    if (hit.field !== 'body') {
      matchErrors.push(
        `${hit.slug}: required hit in ${hit.field}, body-only fixes cannot cover it`,
      )
      continue
    }
    if (!hitCoveredByFix(hit)) {
      matchErrors.push(`${hit.slug}: required hit has no matching fix: ${describeFind(hit.text)}`)
    }
  }

  for (const fix of FIXES) {
    const post = postsBySlug.get(fix.slug)
    if (!post) {
      matchErrors.push(`${fix.slug}: post not found (${describeFind(fix.find)})`)
      continue
    }

    const count = countInPost(post, fix.find)
    if (count !== 1) {
      matchErrors.push(
        `${fix.slug}: expected exactly one match for ${describeFind(fix.find)}, found ${count}`,
      )
      continue
    }

    resolved.push({ fix, post })
  }

  if (matchErrors.length > 0) {
    console.error('Aborting. No documents written.')
    for (const error of matchErrors) {
      console.error(`  ${error}`)
    }
    process.exit(1)
  }

  const workingBodies = new Map<string, PortableBlock[]>()
  for (const post of posts) {
    workingBodies.set(post.slug, structuredClone(post.body ?? []))
  }

  const total = resolved.length
  const updatedSlugs = new Set<string>()
  const unchangedIds: string[] = []
  let index = 0

  for (const { fix, post } of resolved) {
    index += 1
    const currentBody = workingBodies.get(post.slug)
    if (!currentBody) {
      throw new Error(`Missing working body for ${post.slug}`)
    }

    const applied = replaceInBody(currentBody, fix.find, fix.replace)
    workingBodies.set(post.slug, applied.body)

    const changed = applied.before !== applied.after
    if (changed) {
      updatedSlugs.add(post.slug)
    } else {
      unchangedIds.push(`${post.slug}#${fix.id}`)
    }

    console.log(`[${index}/${total}] ${post.slug}`)
    console.log(`  ${post._id}`)
    console.log(`  ${post.title}`)
    console.log(`  ${fix.label}`)
    console.log(`  Find: ${fix.find}`)
    console.log(`  Before: ${applied.before}`)
    if (applied.blockRemoved) {
      console.log('  After:  [block removed]')
    } else {
      console.log(`  After:  ${applied.after}`)
    }

    if (!changed) {
      console.log('  Status: unchanged')
      console.log('')
      continue
    }

    console.log(isExecute ? '  Status: updated' : '  Status: would update')
    console.log('')
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
  console.log(`  Patches:            ${total}`)
  console.log(`  ${isExecute ? 'Updated' : 'Would update'}:       ${updatedSlugs.size} post(s)`)
  console.log(`  Unchanged:          ${unchangedIds.length}`)

  if (!isExecute) {
    console.log('')
    console.log('Dry run complete. No writes. Pass --execute to patch documents in Sanity.')
  }
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
