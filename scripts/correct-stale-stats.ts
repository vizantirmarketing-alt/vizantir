/**
 * Correct two stale or misstated statistics in published Sanity posts.
 * Pattern A — Patchstack five-hour exploitation window stated as a blanket
 * median. Five hours is the weighted median time to first exploit for
 * heavily exploited vulnerabilities. Roughly half of high-impact
 * vulnerabilities were exploited within 24 hours. Not a median across all
 * disclosures.
 * Pattern B — WordPress market share stated as 43.5%. W3Techs currently
 * reports 40.7% of all websites and 58.9% of sites with a known CMS.
 *
 * Searched every published post (51), including excerpt and SEO fields.
 *
 * Pattern A required instances (body only):
 *
 * 1. hidden-wordpress-costs-agencies-dont-tell-you
 *    "The median time from vulnerability disclosure to active exploitation
 *    is 5 hours."
 * 2. real-cost-wordpress-security-breach
 *    "The median time from public vulnerability disclosure to active
 *    exploitation is now 5 hours."
 * 3. real-cost-wordpress-security-breach
 *    "the 5-hour post-disclosure window when most exploitation happens"
 * 4. why-wordpress-gets-hacked
 *    "The median time between vulnerability disclosure and active
 *    exploitation in the wild is now 5 hours."
 * 5. why-wordpress-gets-hacked
 *    "The 5-hour exploitation window means waiting a week to update is
 *    effectively giving attackers free time"
 * 6. what-is-a-website-care-plan
 *    "a 5-hour median exploitation window"
 * 7. why-we-dont-build-wordpress-sites
 *    "The median time between vulnerability disclosure and active
 *    exploitation is 5 hours."
 * 8. wordpress-vs-nextjs-2026
 *    "The median time between vulnerability disclosure and active
 *    exploitation in the wild is 5 hours."
 * 9. is-wordpress-still-relevant-2026
 *    "Median time to a public exploit after disclosure: 5 hours."
 * 10. is-wordpress-secure
 *     "The median exploitation window after public disclosure is 5 hours."
 * 11. wordpress-vs-nextjs-honest-comparison
 *     "Median exploitation time after disclosure: 5 hours."
 *
 * Pattern B required instances (40.7% used in every case; every live
 * sentence is an all-websites claim, so 58.9% of known-CMS sites would
 * change the denominator):
 *
 * 12. why-wordpress-gets-hacked excerpt
 *     "WordPress powers 43.5% of the internet"
 * 13. why-wordpress-gets-hacked
 *     "WordPress powers 43.5% of all websites on the internet, according
 *     to W3Techs."
 * 14. website-speed-matters-business
 *     "It powers 43.5% of the web"
 * 15. why-most-agencies-still-use-wordpress excerpt
 *     "WordPress powers 43.5% of the web."
 * 16. why-most-agencies-still-use-wordpress
 *     "WordPress powers 43.5% of the web. Next.js powers Nike"
 * 17. why-we-dont-build-wordpress-sites
 *     "powers 43.5% of the web per W3Techs"
 * 18. why-we-dont-build-wordpress-sites
 *     "WordPress powers 43.5% of the web, which makes it the number one
 *     target"
 * 19. wordpress-vs-nextjs-2026
 *     "WordPress powers 43.5% of all websites on the internet according
 *     to W3Techs."
 * 20. is-wordpress-still-relevant-2026 excerpt
 *     "WordPress powers 43.5% of the web"
 * 21. is-wordpress-still-relevant-2026
 *     "It powers 43.5% of all websites according to W3Techs."
 * 22. is-wordpress-still-relevant-2026
 *     "because 43.5% of all websites makes it an irresistible target."
 * 23. is-wordpress-secure excerpt
 *     "WordPress powers 43.5% of the web"
 * 24. is-wordpress-secure
 *     "WordPress powers 43.5% of all websites per W3Techs."
 *
 * No instance in SEO fields. No Pattern A instance in excerpt.
 *
 * Related mentions left alone: "WordPress powers 43% of the web" on
 * real-cost-wordpress-security-breach; Patchstack 11,334 / 91% / 42%
 * counts already scoped in earlier rounds; Melapress 64%; Sucuri 95%
 * Safe Browsing traffic loss.
 *
 * Rewrites scope the five-hour figure to heavily exploited or high-impact
 * vulnerabilities. Delayed updates still leave a window open. WordPress
 * dominance still holds at 40.7%. No sentence explaining the correction.
 *
 * Default: dry run. Pass --execute to write.
 * Aborts without writing if any target string matches zero or more than one
 * place in its post, or if a required scan hit has no matching fix.
 *
 * Run: pnpm correct:stale-stats
 *      pnpm correct:stale-stats -- --execute
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

type ScanField = 'body' | 'excerpt' | 'seo.metaDescription' | 'seo.metaTitle'

type ClaimFix = {
  id: string
  slug: string
  field: ScanField
  label: string
  find: string
  replace: string
}

type ScanHit = {
  slug: string
  title: string
  field: ScanField
  text: string
  kind: 'required' | 'related'
}

const FIXES: ClaimFix[] = [
  {
    id: 'a-hidden-costs',
    slug: 'hidden-wordpress-costs-agencies-dont-tell-you',
    field: 'body',
    label: 'Pattern A — blanket five-hour median',
    find: 'The median time from vulnerability disclosure to active exploitation is 5 hours.',
    replace:
      "For heavily exploited vulnerabilities, Patchstack's weighted median time to first exploit is 5 hours.",
  },
  {
    id: 'a-breach-median',
    slug: 'real-cost-wordpress-security-breach',
    field: 'body',
    label: 'Pattern A — blanket five-hour median',
    find:
      'The median time from public vulnerability disclosure to active exploitation is now 5 hours.',
    replace:
      "For heavily exploited vulnerabilities, Patchstack's weighted median time to first exploit is 5 hours.",
  },
  {
    id: 'a-breach-window',
    slug: 'real-cost-wordpress-security-breach',
    field: 'body',
    label: 'Pattern A — five-hour window as when most exploitation happens',
    find:
      'Keeping all plugins, themes, and WordPress core updated \u2014 especially within the 5-hour post-disclosure window when most exploitation happens',
    replace:
      'Keeping all plugins, themes, and WordPress core updated, especially after high-impact disclosures, where first exploits can land in 5 hours and roughly half are exploited within 24 hours',
  },
  {
    id: 'a-hacked-median',
    slug: 'why-wordpress-gets-hacked',
    field: 'body',
    label: 'Pattern A — blanket five-hour median',
    find:
      'The median time between vulnerability disclosure and active exploitation in the wild is now 5 hours.',
    replace:
      "For heavily exploited vulnerabilities, Patchstack's weighted median time to first exploit is 5 hours.",
  },
  {
    id: 'a-hacked-window',
    slug: 'why-wordpress-gets-hacked',
    field: 'body',
    label: 'Pattern A — five-hour window as a blanket delay cost',
    find:
      'The 5-hour exploitation window means waiting a week to update is effectively giving attackers free time',
    replace:
      'That 5-hour window on heavily exploited vulnerabilities means waiting a week to update leaves the door open',
  },
  {
    id: 'a-care-plan',
    slug: 'what-is-a-website-care-plan',
    field: 'body',
    label: 'Pattern A — blanket five-hour median window',
    find: 'and a 5-hour median exploitation window',
    replace:
      'and a 5-hour weighted median time to first exploit for heavily exploited vulnerabilities',
  },
  {
    id: 'a-dont-build',
    slug: 'why-we-dont-build-wordpress-sites',
    field: 'body',
    label: 'Pattern A — blanket five-hour median',
    find: 'The median time between vulnerability disclosure and active exploitation is 5 hours.',
    replace:
      "For heavily exploited vulnerabilities, Patchstack's weighted median time to first exploit is 5 hours.",
  },
  {
    id: 'a-wp-2026',
    slug: 'wordpress-vs-nextjs-2026',
    field: 'body',
    label: 'Pattern A — blanket five-hour median',
    find:
      'The median time between vulnerability disclosure and active exploitation in the wild is 5 hours.',
    replace:
      "For heavily exploited vulnerabilities, Patchstack's weighted median time to first exploit is 5 hours.",
  },
  {
    id: 'a-relevant',
    slug: 'is-wordpress-still-relevant-2026',
    field: 'body',
    label: 'Pattern A — blanket five-hour median',
    find: 'Median time to a public exploit after disclosure: 5 hours.',
    replace:
      'Weighted median time to first exploit for heavily exploited vulnerabilities: 5 hours.',
  },
  {
    id: 'a-secure',
    slug: 'is-wordpress-secure',
    field: 'body',
    label: 'Pattern A — blanket five-hour median',
    find: 'The median exploitation window after public disclosure is 5 hours.',
    replace:
      "For heavily exploited vulnerabilities, Patchstack's weighted median time to first exploit is 5 hours.",
  },
  {
    id: 'a-honest',
    slug: 'wordpress-vs-nextjs-honest-comparison',
    field: 'body',
    label: 'Pattern A — blanket five-hour median',
    find: 'Median exploitation time after disclosure: 5 hours.',
    replace:
      'Weighted median time to first exploit for heavily exploited vulnerabilities: 5 hours.',
  },
  {
    id: 'b-hacked-excerpt',
    slug: 'why-wordpress-gets-hacked',
    field: 'excerpt',
    label: 'Pattern B — 43.5% of the internet',
    find: 'WordPress powers 43.5% of the internet',
    replace: 'WordPress powers 40.7% of the internet',
  },
  {
    id: 'b-hacked-body',
    slug: 'why-wordpress-gets-hacked',
    field: 'body',
    label: 'Pattern B — 43.5% of all websites',
    find: 'WordPress powers 43.5% of all websites on the internet, according to W3Techs.',
    replace: 'WordPress powers 40.7% of all websites on the internet, according to W3Techs.',
  },
  {
    id: 'b-speed',
    slug: 'website-speed-matters-business',
    field: 'body',
    label: 'Pattern B — 43.5% of the web',
    find: 'It powers 43.5% of the web',
    replace: 'It powers 40.7% of the web',
  },
  {
    id: 'b-agencies-excerpt',
    slug: 'why-most-agencies-still-use-wordpress',
    field: 'excerpt',
    label: 'Pattern B — 43.5% of the web',
    find: 'WordPress powers 43.5% of the web.',
    replace: 'WordPress powers 40.7% of the web.',
  },
  {
    id: 'b-agencies-body',
    slug: 'why-most-agencies-still-use-wordpress',
    field: 'body',
    label: 'Pattern B — 43.5% of the web',
    find: 'WordPress powers 43.5% of the web. Next.js powers Nike',
    replace: 'WordPress powers 40.7% of the web. Next.js powers Nike',
  },
  {
    id: 'b-dont-build-cms',
    slug: 'why-we-dont-build-wordpress-sites',
    field: 'body',
    label: 'Pattern B — 43.5% of the web',
    find: 'powers 43.5% of the web per W3Techs',
    replace: 'powers 40.7% of the web per W3Techs',
  },
  {
    id: 'b-dont-build-target',
    slug: 'why-we-dont-build-wordpress-sites',
    field: 'body',
    label: 'Pattern B — 43.5% as attack-target share',
    find: 'WordPress powers 43.5% of the web, which makes it the number one target',
    replace: 'WordPress powers 40.7% of the web, which makes it the number one target',
  },
  {
    id: 'b-wp-2026',
    slug: 'wordpress-vs-nextjs-2026',
    field: 'body',
    label: 'Pattern B — 43.5% of all websites',
    find: 'WordPress powers 43.5% of all websites on the internet according to W3Techs.',
    replace: 'WordPress powers 40.7% of all websites on the internet according to W3Techs.',
  },
  {
    id: 'b-relevant-excerpt',
    slug: 'is-wordpress-still-relevant-2026',
    field: 'excerpt',
    label: 'Pattern B — 43.5% of the web',
    find: 'WordPress powers 43.5% of the web',
    replace: 'WordPress powers 40.7% of the web',
  },
  {
    id: 'b-relevant-body',
    slug: 'is-wordpress-still-relevant-2026',
    field: 'body',
    label: 'Pattern B — 43.5% of all websites',
    find: 'It powers 43.5% of all websites according to W3Techs.',
    replace: 'It powers 40.7% of all websites according to W3Techs.',
  },
  {
    id: 'b-relevant-target',
    slug: 'is-wordpress-still-relevant-2026',
    field: 'body',
    label: 'Pattern B — 43.5% as attack-target share',
    find: 'because 43.5% of all websites makes it an irresistible target.',
    replace: 'because 40.7% of all websites makes it an irresistible target.',
  },
  {
    id: 'b-secure-excerpt',
    slug: 'is-wordpress-secure',
    field: 'excerpt',
    label: 'Pattern B — 43.5% of the web',
    find: 'WordPress powers 43.5% of the web',
    replace: 'WordPress powers 40.7% of the web',
  },
  {
    id: 'b-secure-body',
    slug: 'is-wordpress-secure',
    field: 'body',
    label: 'Pattern B — 43.5% of all websites',
    find: 'WordPress powers 43.5% of all websites per W3Techs.',
    replace: 'WordPress powers 40.7% of all websites per W3Techs.',
  },
  {
    id: 'b-breach-rounded',
    slug: 'real-cost-wordpress-security-breach',
    field: 'body',
    label: 'Pattern B — rounded 43% of the web',
    find: 'WordPress powers 43% of the web',
    replace: 'WordPress powers 40.7% of the web',
  },
]

function isRequiredHit(text: string): boolean {
  if (/43\.5\s*%/.test(text)) return true
  return /5[\s-]?hour/i.test(text) || /five hours?/i.test(text)
}

function isRelatedHit(text: string): boolean {
  if (isRequiredHit(text)) return false
  return /wordpress powers 43\s*%/i.test(text)
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

function fieldValue(post: PostDoc, field: ScanField): string {
  if (field === 'excerpt') return post.excerpt ?? ''
  if (field === 'seo.metaDescription') return post.seo?.metaDescription ?? ''
  if (field === 'seo.metaTitle') return post.seo?.metaTitle ?? ''
  return ''
}

function countInField(post: PostDoc, field: ScanField, find: string): number {
  if (field === 'body') {
    const blocks = Array.isArray(post.body) ? post.body : []
    return blocks.reduce((sum, block) => sum + countOccurrences(rawBlockText(block), find), 0)
  }
  return countOccurrences(fieldValue(post, field), find)
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

function applyPlainReplace(current: string, find: string, replace: string): string {
  const hits = countOccurrences(current, find)
  if (hits !== 1) {
    throw new Error(`applyPlainReplace expected exactly one match, found ${hits}`)
  }
  return current.replace(find, replace)
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
  return FIXES.some(
    (fix) => fix.slug === hit.slug && fix.field === hit.field && hit.text.includes(fix.find),
  )
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

    const count = countInField(post, fix.field, fix.find)
    if (count !== 1) {
      matchErrors.push(
        `${fix.slug} ${fix.field}: expected exactly one match for ${describeFind(fix.find)}, found ${count}`,
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
  const workingPlain = new Map<string, Record<Exclude<ScanField, 'body'>, string>>()
  for (const post of posts) {
    workingBodies.set(post.slug, structuredClone(post.body ?? []))
    workingPlain.set(post.slug, {
      excerpt: fieldValue(post, 'excerpt'),
      'seo.metaDescription': fieldValue(post, 'seo.metaDescription'),
      'seo.metaTitle': fieldValue(post, 'seo.metaTitle'),
    })
  }

  const total = resolved.length
  const updatedSlugs = new Set<string>()
  const unchangedIds: string[] = []
  let index = 0

  for (const { fix, post } of resolved) {
    index += 1

    let before = ''
    let after = ''
    let blockRemoved = false

    if (fix.field === 'body') {
      const currentBody = workingBodies.get(post.slug)
      if (!currentBody) {
        throw new Error(`Missing working body for ${post.slug}`)
      }
      const applied = replaceInBody(currentBody, fix.find, fix.replace)
      workingBodies.set(post.slug, applied.body)
      before = applied.before
      after = applied.after
      blockRemoved = applied.blockRemoved
    } else {
      const currentPlain = workingPlain.get(post.slug)
      if (!currentPlain) {
        throw new Error(`Missing working plain fields for ${post.slug}`)
      }
      before = currentPlain[fix.field]
      after = applyPlainReplace(before, fix.find, fix.replace)
      currentPlain[fix.field] = after
    }

    const changed = before !== after
    if (changed) {
      updatedSlugs.add(post.slug)
    } else {
      unchangedIds.push(`${post.slug}#${fix.id}`)
    }

    console.log(`[${index}/${total}] ${post.slug}`)
    console.log(`  ${post._id}`)
    console.log(`  ${post.title}`)
    console.log(`  ${fix.label}`)
    console.log(`  Field: ${fix.field}`)
    console.log(`  Find: ${fix.find}`)
    console.log(`  Before: ${before}`)
    if (blockRemoved) {
      console.log('  After:  [block removed]')
    } else {
      console.log(`  After:  ${after}`)
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
      const plain = workingPlain.get(slug)
      if (!post || !body || !plain) {
        throw new Error(`Cannot patch ${slug}: missing post or working fields`)
      }

      const set: Record<string, unknown> = {}
      const originalBody = JSON.stringify(post.body ?? [])
      if (originalBody !== JSON.stringify(body)) {
        set.body = body
      }
      if ((post.excerpt ?? '') !== plain.excerpt) {
        set.excerpt = plain.excerpt
      }
      if ((post.seo?.metaDescription ?? '') !== plain['seo.metaDescription']) {
        set['seo.metaDescription'] = plain['seo.metaDescription']
      }
      if ((post.seo?.metaTitle ?? '') !== plain['seo.metaTitle']) {
        set['seo.metaTitle'] = plain['seo.metaTitle']
      }

      if (Object.keys(set).length === 0) continue
      await client.patch(post._id).set(set).commit()
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
