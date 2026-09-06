/**
 * Correct AI Overview terminology and eligibility claims in published
 * Sanity posts.
 *
 * Searched every published post (51). Required instances:
 *
 * Generic term (AI Overviews used for non-Google assistants)
 * 1. do-you-need-yoast-seo
 *    "AI Overviews in ChatGPT Search, Claude, and Perplexity care even less"
 * 2. do-i-need-a-custom-website
 *    "For AI Overviews in ChatGPT, Claude, and Perplexity"
 * 3. why-your-competitors-website-looks-better
 *    "Overview placement in ChatGPT Search, Claude, and Perplexity"
 *
 * Schema gates AI Overview eligibility
 * 4. nextjs-seo-guide
 *    "qualifies you for rich snippets and AI Overview citations"
 * 5. nextjs-seo-guide
 *    "No structured data — Missing rich snippet and AI Overview opportunities"
 *
 * Crawler rules gate AI Overview eligibility
 * 6. nextjs-seo-guide
 *    "allow AI crawlers if you want visibility in AI Overviews, ChatGPT Search,
 *    and Perplexity"
 * 7. nextjs-seo-guide
 *    "Blocking AI crawlers in robots.txt — Default deny is costing you
 *    visibility in 2026"
 * 8. do-you-need-yoast-seo
 *    GPTBot / ClaudeBot / PerplexityBot "determine whether your content
 *    appears in AI Overviews, ChatGPT Search, and Claude responses"
 * 9. how-las-vegas-businesses-rank-higher-google
 *    Allow GPTBot / ClaudeBot / PerplexityBot, tied to AI Overviews
 * 10. squarespace-vs-custom-website
 *     crawler allowances "for AI Overview visibility"
 * 11. when-wix-makes-sense-and-when-youve-outgrown-it
 *     crawler allowances "for AI Overview visibility"
 * 12. wordpress-vs-nextjs-2026
 *     GPTBot / ClaudeBot / PerplexityBot "for visibility in AI Overviews,
 *     ChatGPT Search, and Perplexity"
 * 13. what-youre-paying-for-30k-website
 *     crawler allowances "for AI Overview visibility"
 *
 * Related mentions left alone: Google AI Overviews used as Google's product
 * name, schema or crawler advice that does not claim AIO eligibility, and
 * product lists that name AI Overviews alongside ChatGPT / Perplexity without
 * assigning those bots to Google.
 *
 * Structured data and AI crawler allow rules stay recommended. Only the
 * claimed mechanism is rewritten. Google AI Overviews and AI Mode follow
 * Googlebot and normal Search eligibility.
 *
 * Default: dry run. Pass --execute to write.
 * Aborts without writing if any target string matches zero or more than one
 * place in its post, or if a required scan hit has no matching fix.
 *
 * Run: pnpm correct:ai-overview-claims
 *      pnpm correct:ai-overview-claims -- --execute
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
    id: 'nextjs-schema-qualifies-aio',
    slug: 'nextjs-seo-guide',
    label: 'Structured data does not qualify a page for AI Overview citations',
    find:
      'Structured data helps Google and AI crawlers understand your content — and qualifies you for rich snippets and AI Overview citations.',
    replace:
      'Structured data helps AI systems and other search engines parse your content, and it can qualify you for rich snippets. It is worth implementing. It does not determine whether a page can be cited in Google AI Overviews. That depends on normal Search eligibility.',
  },
  {
    id: 'nextjs-crawler-allow-aio',
    slug: 'nextjs-seo-guide',
    label: 'AI crawler allow rules do not control AI Overviews',
    find:
      'Robots.txt: Generated from app/robots.ts. Important in 2026 — explicitly allow AI crawlers if you want visibility in AI Overviews, ChatGPT Search, and Perplexity:',
    replace:
      'Robots.txt: Generated from app/robots.ts. Allow AI crawlers if you want visibility in ChatGPT, Claude, and Perplexity. Those rules do not control Google AI Overviews or AI Mode, which use Googlebot:',
  },
  {
    id: 'nextjs-no-schema-aio-opps',
    slug: 'nextjs-seo-guide',
    label: 'Missing schema is not a missed AI Overview gate',
    find: 'No structured data — Missing rich snippet and AI Overview opportunities',
    replace:
      'No structured data: missing rich snippets, and harder for AI systems and other engines to parse. Structured data does not gate Google AI Overview eligibility.',
  },
  {
    id: 'nextjs-blocking-crawlers-visibility',
    slug: 'nextjs-seo-guide',
    label: 'Blocking AI crawlers costs non-Google visibility, not AI Overviews',
    find: 'Blocking AI crawlers in robots.txt — Default deny is costing you visibility in 2026',
    replace:
      'Blocking AI crawlers in robots.txt: that costs visibility in ChatGPT, Claude, and Perplexity. It does not control Google AI Overviews or AI Mode.',
  },
  {
    id: 'yoast-aio-in-chatgpt',
    slug: 'do-you-need-yoast-seo',
    label: 'AI Overviews is not the name for ChatGPT, Claude, or Perplexity answers',
    find:
      "Google's algorithms in 2026 are dramatically more sophisticated than Yoast's heuristics. Google doesn't care about your Yoast score. AI Overviews in ChatGPT Search, Claude, and Perplexity care even less — they extract meaning from well-structured content, not keyword density.",
    replace:
      "Google's algorithms in 2026 are dramatically more sophisticated than Yoast's heuristics. Google doesn't care about your Yoast score. ChatGPT Search, Claude, and Perplexity care even less. They extract meaning from well-structured content, not keyword density.",
  },
  {
    id: 'yoast-crawlers-determine-aio',
    slug: 'do-you-need-yoast-seo',
    label: 'Those crawlers do not determine AI Overview appearance',
    find:
      "In 2026, SEO isn't just about Google. GPTBot, ClaudeBot, PerplexityBot, and similar AI crawlers determine whether your content appears in AI Overviews, ChatGPT Search, and Claude responses — where increasingly large portions of buyer research now happen.",
    replace:
      "In 2026, SEO isn't just about Google. GPTBot, ClaudeBot, PerplexityBot, and similar AI crawlers determine whether your content appears in ChatGPT, Claude, and Perplexity, where increasingly large portions of buyer research now happen. Google AI Overviews and AI Mode use Googlebot, not those allow rules.",
  },
  {
    id: 'custom-site-aio-in-chatgpt',
    slug: 'do-i-need-a-custom-website',
    label: 'AI Overviews is not a ChatGPT, Claude, or Perplexity product',
    find:
      'That gap can mean the difference between page one and page two of Google results — and page two gets almost no clicks. For AI Overviews in ChatGPT, Claude, and Perplexity, structural server rendering matters even more.',
    replace:
      'That gap can mean the difference between page one and page two of Google results, and page two gets almost no clicks. For ChatGPT, Claude, and Perplexity, structural server rendering matters even more.',
  },
  {
    id: 'competitors-overview-placement',
    slug: 'why-your-competitors-website-looks-better',
    label: 'Overview placement is not a ChatGPT, Claude, or Perplexity term',
    find:
      'AI Overview visibility: In 2026, Overview placement in ChatGPT Search, Claude, and Perplexity increasingly decides what prospects see first. Premium sites structured for AI crawlers win that ground',
    replace:
      'Visibility in ChatGPT, Claude, and Perplexity: In 2026, those assistants increasingly decide what prospects see first. Premium sites structured for those AI crawlers win that ground',
  },
  {
    id: 'las-vegas-crawlers-aio',
    slug: 'how-las-vegas-businesses-rank-higher-google',
    label: 'GPTBot, ClaudeBot, and PerplexityBot do not control AI Overviews',
    find:
      'Allow AI crawlers (GPTBot, ClaudeBot, PerplexityBot) in robots.txt — AI Overviews are increasingly where local discovery happens',
    replace:
      'Allow AI crawlers (GPTBot, ClaudeBot, PerplexityBot) in robots.txt so ChatGPT, Claude, and Perplexity can see the site',
  },
  {
    id: 'squarespace-crawlers-aio',
    slug: 'squarespace-vs-custom-website',
    label: 'Crawler allowances are for non-Google assistants',
    find:
      'AI crawler allowances in robots.txt (which matter in 2026 for AI Overview visibility)',
    replace:
      'AI crawler allowances in robots.txt (which matter in 2026 for ChatGPT, Claude, and Perplexity visibility)',
  },
  {
    id: 'wix-crawlers-aio',
    slug: 'when-wix-makes-sense-and-when-youve-outgrown-it',
    label: 'Crawler allowances are for non-Google assistants',
    find:
      'Configure AI crawler allowances (GPTBot, ClaudeBot, PerplexityBot) for AI Overview visibility',
    replace:
      'Configure AI crawler allowances (GPTBot, ClaudeBot, PerplexityBot) for ChatGPT, Claude, and Perplexity visibility',
  },
  {
    id: 'wordpress-nextjs-crawlers-aio',
    slug: 'wordpress-vs-nextjs-2026',
    label: 'Those bots do not grant AI Overview visibility',
    find:
      'Next.js: Server-side rendering, automatic image optimization, structured data, and clean HTML are built in. Fast Core Web Vitals by default. AI crawler access (GPTBot, ClaudeBot, PerplexityBot) configured in robots.txt for visibility in AI Overviews, ChatGPT Search, and Perplexity — which is increasingly where buyer research starts in 2026.',
    replace:
      'Next.js: Server-side rendering, automatic image optimization, structured data, and clean HTML are built in. Fast Core Web Vitals by default. AI crawler access (GPTBot, ClaudeBot, PerplexityBot) configured in robots.txt for visibility in ChatGPT Search, Claude, and Perplexity, which is increasingly where buyer research starts in 2026.',
  },
  {
    id: '30k-crawlers-aio',
    slug: 'what-youre-paying-for-30k-website',
    label: 'Crawler allowances are for non-Google assistants',
    find: 'AI crawler allowances (GPTBot, ClaudeBot, PerplexityBot) for AI Overview visibility',
    replace:
      'AI crawler allowances (GPTBot, ClaudeBot, PerplexityBot) for ChatGPT, Claude, and Perplexity visibility',
  },
]

function isGenericOverview(text: string): boolean {
  return (
    /AI Overviews? in (ChatGPT|Claude|Perplexity)/i.test(text) ||
    /Overview placement in ChatGPT/i.test(text)
  )
}

function isSchemaGatesAio(text: string): boolean {
  return (
    /structured data/i.test(text) &&
    /AI Overviews?/i.test(text) &&
    /(qualif|opportunit)/i.test(text)
  )
}

function isCrawlerGatesAio(text: string): boolean {
  const hasCrawler = /AI crawler|GPTBot|ClaudeBot|PerplexityBot/i.test(text)
  const hasAio = /AI Overviews?/i.test(text)
  return hasCrawler && hasAio
}

function isBlockingCostsVisibility(text: string): boolean {
  return /Blocking AI crawlers in robots\.txt/.test(text) && /costing you visibility/.test(text)
}

function isRequiredHit(text: string): boolean {
  return (
    isGenericOverview(text) ||
    isSchemaGatesAio(text) ||
    isCrawlerGatesAio(text) ||
    isBlockingCostsVisibility(text)
  )
}

function isRelatedHit(text: string): boolean {
  return /AI Overviews?/i.test(text) && !isRequiredHit(text)
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
