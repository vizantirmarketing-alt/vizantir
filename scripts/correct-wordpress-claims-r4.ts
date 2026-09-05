/**
 * Round four: final cleanup. Leftover Pattern F sentences that sat
 * outside the passages round three matched.
 * Pattern F — Next.js wins on three-year cost
 *
 * Default: dry run. Pass --execute to write.
 * Aborts without writing if any target string matches zero or more than one
 * place in its post.
 *
 * Run: pnpm correct:wordpress-claims-r4
 *      pnpm correct:wordpress-claims-r4 -- --execute
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
}

type PostDoc = {
  _id: string
  title: string
  slug: string
  body: PortableBlock[] | null
}

type ClaimFix = {
  id: string
  slug: string
  label: string
  find: string
  replace: string
}

const FIXES: ClaimFix[] = [
  {
    id: 'f-true-econ',
    slug: 'true-cost-of-wordpress-website',
    label: 'Pattern F — wins on the economics alone',
    find:
      'When you factor in total cost of ownership and performance, the premium build often wins on the economics alone. When you factor in how the site represents your brand to clients deciding whether to trust you with significant money, the argument gets stronger.',
    replace:
      'WordPress usually costs less to launch. The Next.js invoice is higher. You buy a frontend designed around the business and a site that represents the brand to clients deciding whether to trust you with significant money.',
  },
  {
    id: 'f-2026-maint',
    slug: 'wordpress-vs-nextjs-2026',
    label: 'Pattern F — Next.js wins on maintenance cost',
    find:
      'WordPress wins on speed to market and content management accessibility. Next.js wins on performance, security, maintenance cost, and long-term scalability.',
    replace:
      'WordPress wins on speed to market and an editor who already knows the admin. Next.js wins on control of the frontend, performance as the site grows, custom functionality, and a production path that goes through version control.',
  },
  {
    id: 'f-3year-heading',
    slug: 'wordpress-vs-nextjs-3-year-cost-comparison',
    label: 'Pattern F — Lower Recurring Costs heading',
    find: 'Why Next.js Has Lower Recurring Costs',
    replace: 'Where Recurring Spend Goes',
  },
  {
    id: 'f-3year-intro',
    slug: 'wordpress-vs-nextjs-3-year-cost-comparison',
    label: 'Pattern F — recurring costs as a Next.js win',
    find:
      "Next.js marketing sites are pre-built at deployment time and served from a CDN. There's no plugin ecosystem, no admin panel exposed to the public internet, and no database query on every page load. The architecture has fewer moving parts, which translates to:",
    replace:
      'WordPress recurring spend is managed hosting, plugin licenses, and the hours someone spends testing updates. Next.js recurring spend is hosting plus scheduled engineering time when the framework or a dependency needs a bump.',
  },
  {
    id: 'f-3year-plugins',
    slug: 'wordpress-vs-nextjs-3-year-cost-comparison',
    label: 'Pattern F — no plugin licenses',
    find: 'No plugin licenses (no plugins)',
    replace: 'No plugin licenses',
  },
  {
    id: 'f-3year-hosting',
    slug: 'wordpress-vs-nextjs-3-year-cost-comparison',
    label: 'Pattern F — hosting line',
    find: 'Lower hosting costs on Vercel or similar edge platforms',
    replace: 'Hosting on Vercel or similar edge platforms',
  },
  {
    id: 'f-3year-security',
    slug: 'wordpress-vs-nextjs-3-year-cost-comparison',
    label: 'Pattern F — security spend',
    find: 'Smaller security attack surface',
    replace: 'Security spend on dependency updates',
  },
  {
    id: 'f-3year-perf',
    slug: 'wordpress-vs-nextjs-3-year-cost-comparison',
    label: 'Pattern F — no ongoing optimization required',
    find: 'Faster default performance with no ongoing optimization required',
    replace: '',
  },
  {
    id: 'f-3year-bottom',
    slug: 'wordpress-vs-nextjs-3-year-cost-comparison',
    label: 'Pattern F — premium build comes out ahead',
    find:
      'WordPress is cheaper on day one. Over three years, the cost difference narrows significantly — and once you factor in performance-driven revenue impact, the premium build typically comes out ahead.',
    replace:
      'WordPress is cheaper on day one. The Next.js build costs about $3,000 more over three years. That premium buys control of the frontend, performance as the site grows, and custom functionality the business actually needs.',
  },
  {
    id: 'f-3year-question',
    slug: 'wordpress-vs-nextjs-3-year-cost-comparison',
    label: 'Pattern F — costs less to own',
    find:
      'The better question isn\'t "which website costs less to build" but "which website costs less to own over time while generating more revenue."',
    replace:
      'The better question is whether the extra control, performance, and custom functionality are worth the higher three-year bill.',
  },
]

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

async function main() {
  const isExecute = process.argv.includes('--execute')
  console.log(isExecute ? 'EXECUTE' : 'DRY RUN')
  console.log('')

  const slugs = [...new Set(FIXES.map((fix) => fix.slug))]
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
  console.log(`Fixes:            ${FIXES.length}`)
  console.log('')

  const matchErrors: string[] = []
  const resolved: Array<{ fix: ClaimFix; post: PostDoc }> = []

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
    } else if (fix.replace === '') {
      console.log(`  After:  ${applied.after}`)
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
    console.log('Dry run complete — no writes. Pass --execute to patch documents in Sanity.')
  }
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
