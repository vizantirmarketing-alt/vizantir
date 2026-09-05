/**
 * Report indefensible WordPress-cluster claims still live in Sanity posts.
 * Read-only. Never writes. There is no --execute flag.
 *
 * Run: pnpm audit:wordpress-claims
 */

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
  text?: string
}

type PortableBlock = {
  _type?: string
  style?: string
  children?: Span[]
}

type PostDoc = {
  _id: string
  title: string
  slug: string
  publishedAt: string
  body: PortableBlock[] | null
}

type ClaimPattern = {
  id: number
  label: string
  matchers: RegExp[]
}

type ClaimMatch = {
  slug: string
  title: string
  patternId: number
  patternLabel: string
  matched: string
  excerpt: string
}

const PATTERNS: ClaimPattern[] = [
  {
    id: 1,
    label: 'Attack surface is zero / no server to exploit',
    matchers: [
      /attack surface is (functionally|essentially|near) zero/i,
      /attack surface to near zero/i,
      /essentially no server-side attack surface/i,
      /no database to inject/i,
      /no PHP server to exploit/i,
      /almost nothing to attack/i,
      /no comparable Next\.js vulnerability registry/i,
      /no server runtime/i,
      /no database quer(?:y|ies) on (?:every )?page load/i,
      /Security incidents:\s*budget near zero/i,
    ],
  },
  {
    id: 2,
    label: 'Performance by default / PageSpeed bands',
    matchers: [
      /routinely hit(?:s| that tier| this)? by default/i,
      /hits? (?:that tier |this )?by default/i,
      /without (?:any )?optimization work/i,
      /without plugin management or caching/i,
      /no ongoing optimization required/i,
      /Faster default performance/i,
      /Fast Core Web Vitals by default/i,
      /Core Web Vitals optimized by default/i,
      /sub-second load times/i,
      /load in under 1 second/i,
      /load in under 100ms/i,
      /typically load in under 100ms/i,
      /Typical mobile PageSpeed:\s*95/i,
      /PageSpeed:\s*95\s*[–-]\s*100/i,
    ],
  },
  {
    id: 3,
    label: 'Hostinger averages paired with Chrome LCP',
    matchers: [
      /Hostinger/i,
      /13\.25\s*s/i,
      /1,?220\s*ms/i,
      /4-second gap between a typical WordPress site and a typical Next\.js site/i,
    ],
  },
  {
    id: 4,
    label: 'In-house PageSpeed test (45 vs 98)',
    matchers: [
      /WordPress scored 45/i,
      /Next\.js scored 98/i,
      /scored 45 on Google'?s mobile PageSpeed/i,
    ],
  },
  {
    id: 5,
    label: 'Vulnerability data used as incident rates',
    matchers: [
      /Patchstack/i,
      /11,?334/i,
      /91%\s+(?:from|of|in)\s+(?:those\s+)?(?:vulnerabilities|plugins)/i,
      /Melapress/i,
      /64%\s+of WordPress professionals/i,
      /Codeable[^.]*64%/i,
      /64%[^.]*Codeable/i,
    ],
  },
  {
    id: 6,
    label: 'Three-year cost favors Next.js',
    matchers: [
      /often costs less than a WordPress/i,
      /total cost of ownership often favou?rs Next\.js/i,
      /often favou?rs Next\.js/i,
      /might even be slightly more expensive/i,
      /over three years(?:[^.]*?)often ends up lower/i,
      /total cost of ownership often converges/i,
    ],
  },
  {
    id: 7,
    label: 'Zero maintenance / deploy once forever / updates optional',
    matchers: [
      /Zero Maintenance/i,
      /Next\.js sites just run/i,
      /deploy once[^.]*forever/i,
      /serve static HTML from the edge, forever/i,
      /updates optional/i,
      /without ongoing intervention/i,
      /for 5\+ years without starting over/i,
    ],
  },
  {
    id: 8,
    label: 'Vercel Hobby tier in a commercial context',
    matchers: [
      /Hobby tier/i,
      /\bfree Hobby\b/i,
    ],
  },
]

function requireEnv(name: string, value: string | undefined): string {
  if (!value || !String(value).trim()) {
    console.error(`Missing required environment variable: ${name}`)
    process.exit(1)
  }
  return value.trim()
}

function createReadClient(): SanityClient {
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

function blockToPlainText(block: PortableBlock): string {
  if (block._type !== 'block' || !Array.isArray(block.children)) {
    return ''
  }

  return block.children
    .map((child) => child.text ?? '')
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}

function isSentenceEnd(text: string, index: number): boolean {
  const char = text[index]
  if (char !== '.' && char !== '?' && char !== '!') return false

  const next = text[index + 1]
  if (next && next !== ' ' && next !== '\n') return false

  const before = text.slice(Math.max(0, index - 12), index)
  if (/\d$/.test(before) && /^\d/.test(text.slice(index + 1))) return false
  if (/(?:Next|js|Dr|Mr|Ms|Mrs|vs|e\.g|i\.e)$/i.test(before)) return false

  return true
}

function excerptAround(paragraph: string, matchIndex: number, matchLength: number): string {
  const startLimit = 0
  const endLimit = paragraph.length
  let start = matchIndex
  let end = matchIndex + matchLength

  for (let i = matchIndex - 1; i >= startLimit; i--) {
    if (isSentenceEnd(paragraph, i)) {
      start = i + 1
      while (start < endLimit && paragraph[start] === ' ') start += 1
      break
    }
    if (i === startLimit) start = startLimit
  }

  for (let i = matchIndex + matchLength; i < endLimit; i++) {
    if (isSentenceEnd(paragraph, i)) {
      end = i + 1
      break
    }
    if (i === endLimit - 1) end = endLimit
  }

  let excerpt = paragraph.slice(start, end).trim()

  const prevStart = (() => {
    if (start <= 0) return start
    let cursor = start - 1
    while (cursor > 0 && paragraph[cursor] === ' ') cursor -= 1
    for (let i = cursor - 1; i >= 0; i--) {
      if (isSentenceEnd(paragraph, i)) {
        let next = i + 1
        while (next < start && paragraph[next] === ' ') next += 1
        return next
      }
    }
    return 0
  })()

  const nextEnd = (() => {
    if (end >= paragraph.length) return end
    for (let i = end; i < paragraph.length; i++) {
      if (isSentenceEnd(paragraph, i)) return i + 1
    }
    return paragraph.length
  })()

  if (excerpt.length < 80 || excerpt.length < matchLength + 40) {
    excerpt = paragraph.slice(prevStart, nextEnd).trim()
  }

  if (excerpt.length < 120 && paragraph.length <= 500) {
    return paragraph
  }

  return excerpt
}

function firstMatcherHit(text: string, matchers: RegExp[]): { matched: string; index: number } | null {
  for (const matcher of matchers) {
    const flags = matcher.flags.includes('g') ? matcher.flags : `${matcher.flags}g`
    const copy = new RegExp(matcher.source, flags)
    const found = copy.exec(text)
    if (found && found[0] && found.index !== undefined) {
      return { matched: found[0], index: found.index }
    }
  }
  return null
}

function withNeighborContext(paragraphs: string[], index: number, excerpt: string): string {
  if (excerpt.length >= 80) return excerpt

  const next = paragraphs[index + 1]
  if (next) {
    return `${excerpt} ${next}`.trim()
  }

  const prev = paragraphs[index - 1]
  if (prev) {
    return `${prev} ${excerpt}`.trim()
  }

  return excerpt
}

function scanPost(post: PostDoc): ClaimMatch[] {
  const blocks = Array.isArray(post.body) ? post.body : []
  const paragraphs = blocks.map(blockToPlainText)
  const matches: ClaimMatch[] = []
  const seen = new Set<string>()

  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i]
    if (!paragraph) continue

    for (const pattern of PATTERNS) {
      const hit = firstMatcherHit(paragraph, pattern.matchers)
      if (!hit) continue

      const excerpt = withNeighborContext(
        paragraphs,
        i,
        excerptAround(paragraph, hit.index, hit.matched.length),
      )
      const key = `${post.slug}\0${pattern.id}\0${excerpt}`
      if (seen.has(key)) continue
      seen.add(key)

      matches.push({
        slug: post.slug,
        title: post.title,
        patternId: pattern.id,
        patternLabel: pattern.label,
        matched: hit.matched,
        excerpt,
      })
    }
  }

  return matches
}

function padCount(value: number, width = 3): string {
  return String(value).padStart(width, ' ')
}

async function main() {
  if (process.argv.includes('--execute') || process.argv.includes('--live')) {
    console.error('This script is read-only. It never writes. Drop --execute / --live.')
    process.exit(1)
  }

  const client = createReadClient()
  const posts = await client.fetch<PostDoc[]>(
    `*[_type == "post" && defined(publishedAt) && !(_id in path("drafts.**"))] | order(publishedAt desc){
      _id,
      title,
      "slug": slug.current,
      publishedAt,
      body
    }`,
  )

  const matches = posts.flatMap((post) => scanPost(post))
  const slugsWithMatches = new Set(matches.map((match) => match.slug))

  console.log('READ-ONLY — no documents written')
  console.log('')
  console.log(`Published posts:     ${posts.length}`)
  console.log(`Posts with matches:  ${slugsWithMatches.size}`)
  console.log(`Matches:             ${matches.length}`)
  console.log('')

  if (matches.length === 0) {
    console.log('No indefensible-claim patterns found.')
    return
  }

  let index = 0
  let currentSlug = ''

  for (const match of matches) {
    if (match.slug !== currentSlug) {
      currentSlug = match.slug
      console.log('---')
      console.log(`${match.slug}`)
      console.log(`  ${match.title}`)
      console.log('')
    }

    index += 1
    console.log(`  [${index}] Pattern ${match.patternId} — ${match.patternLabel}`)
    console.log(`      Matched: ${match.matched}`)
    console.log(`      ${match.excerpt}`)
    console.log('')
  }

  console.log('---')
  console.log('Summary by pattern')
  for (const pattern of PATTERNS) {
    const count = matches.filter((match) => match.patternId === pattern.id).length
    console.log(`  ${pattern.id}  ${padCount(count)}  ${pattern.label}`)
  }

  const postsBySlug = new Map(posts.map((post) => [post.slug, post]))
  console.log('')
  console.log('Posts with matches')
  for (const slug of [...slugsWithMatches].sort()) {
    const post = postsBySlug.get(slug)
    const count = matches.filter((match) => match.slug === slug).length
    console.log(`  ${padCount(count)}  ${slug}${post ? ` — ${post.title}` : ''}`)
  }
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
