/**
 * Round one: correct the two checkably false claim patterns in Sanity posts.
 * Pattern A — "attack surface is zero" / no server to exploit / budget near zero
 * Pattern B — undisclosed in-house PageSpeed test (45 vs 98)
 *
 * Default: dry run. Pass --execute to write.
 * Aborts without writing if any target string matches zero or more than one
 * place in its post.
 *
 * Run: pnpm correct:wordpress-claims
 *      pnpm correct:wordpress-claims -- --execute
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
    id: 'a-2026',
    slug: 'wordpress-vs-nextjs-2026',
    label: 'Pattern A — functionally zero',
    find:
      'Next.js sites deployed statically on Vercel have no server runtime, no database queries on page load, and no plugin ecosystem. The attack surface is functionally zero. There is no comparable Next.js vulnerability registry because there is almost nothing to attack.',
    replace:
      'A Next.js marketing site on Vercel has no public WordPress admin, no plugin marketplace installing code on production, and content sitting in a separate CMS. Fewer dependencies execute on every request. The public surface is smaller, not gone. Next.js still publishes advisories. Dependencies and server routes still need updates.',
  },
  {
    id: 'a-honest',
    slug: 'wordpress-vs-nextjs-honest-comparison',
    label: 'Pattern A — essentially zero',
    find:
      "Next.js sites deployed statically have no server runtime, no database queries, and no plugin ecosystem. The attack surface is essentially zero. There's no equivalent vulnerability registry because there's almost nothing to exploit.",
    replace:
      "There's no WordPress admin on the live origin, no plugin directory executing on production, and the CMS is a separate system. Fewer dependencies execute on every request. The public surface is smaller. Next.js still has a vulnerability registry. npm packages and server routes still need updates. Fewer doors facing the internet, not zero doors.",
  },
  {
    id: 'a-hacked',
    slug: 'why-wordpress-gets-hacked',
    label: 'Pattern A — nothing to attack at the framework level',
    find:
      'There is no comparable Next.js vulnerability registry because there is almost nothing to attack at the framework level.',
    replace:
      'Next.js has a vulnerability registry. What it does not have is a public WordPress admin, a plugin marketplace installing code on production, or content managed on the same origin as the site. That is a smaller surface at the framework level, not an empty one. Dependencies and server routes still need updates.',
  },
  {
    id: 'a-dont-build',
    slug: 'why-we-dont-build-wordpress-sites',
    label: 'Pattern A — static files, nothing to attack',
    find:
      "With Next.js, we deploy static files to Vercel's edge network. No database to inject. No PHP server to exploit. No plugins to compromise. No admin login to brute force.",
    replace:
      'With Next.js, the live site has no WordPress admin, no plugin marketplace installing code on production, and content managed in a separate CMS. That is why we build this way. It is not because we ship a folder of static files with nothing behind them. Next.js still publishes advisories, and our sites still have dependencies and server routes that need updates.',
  },
  {
    id: 'a-secure',
    slug: 'is-wordpress-secure',
    label: 'Pattern A — near zero attack surface',
    find:
      'No database to attack. No plugins to exploit. No PHP vulnerabilities. No admin login to brute force. The architecture itself reduces the attack surface to near zero',
    replace:
      'There is no public WordPress admin, no plugin marketplace on production, and content lives in a separate CMS. Fewer dependencies execute on every request. The architecture leaves a smaller public surface, not a missing one. Dependencies and server routes still need updates',
  },
  {
    id: 'a-vercel',
    slug: 'vercel-vs-wp-engine',
    label: 'Pattern A — no server-side attack surface',
    find: 'Static file hosting has essentially no server-side attack surface.',
    replace:
      'A Next.js site on Vercel is not a folder of static files with no server. The public origin has no WordPress admin and no plugin marketplace. Content is in a separate CMS. That cuts what faces the internet. Next.js still has advisories, and production sites still have dependencies and server routes that need updates.',
  },
  {
    id: 'a-3year',
    slug: 'wordpress-vs-nextjs-3-year-cost-comparison',
    label: 'Pattern A — security budget near zero',
    find: 'Security incidents: budget near zero',
    replace:
      'Security incidents: no plugin-recovery line item. Dependency updates still belong in the budget',
  },
  {
    id: 'a-15k',
    slug: 'why-15000-website-cheaper-than-5000',
    label: 'Pattern A — security budget near zero',
    find: 'Security incidents: budget near zero',
    replace:
      'Security incidents: you still pay to keep packages current. You do not pay to clean up after a plugin that opened the site',
  },
  {
    id: 'b-pagespeed',
    slug: 'why-we-dont-build-wordpress-sites',
    label: 'Pattern B — in-house PageSpeed test',
    find:
      "We ran the same content through WordPress and Next.js as a comparison exercise. WordPress scored 45 on Google's mobile PageSpeed. Next.js scored 98.",
    replace: '',
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
