/**
 * Round three: last claims pass. Align posts with the revised pillar and
 * correct maintenance overclaims.
 * Pattern F — Next.js wins on three-year cost
 * Pattern G — zero maintenance / deploy once forever / updates optional
 *
 * wordpress-vs-nextjs-3-year-cost-comparison already states Next.js costs
 * about $3,000 more. Leave that cost framing. Pattern G still applies there.
 *
 * Default: dry run. Pass --execute to write.
 * Aborts without writing if any target string matches zero or more than one
 * place in its post.
 *
 * Run: pnpm correct:wordpress-claims-r3
 *      pnpm correct:wordpress-claims-r3 -- --execute
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
    id: 'f-2026',
    slug: 'wordpress-vs-nextjs-2026',
    label: 'Pattern F — three-year cost favors Next.js',
    find:
      'Higher upfront with Next.js. Lower ongoing. Over three years, a premium Next.js site often costs less than a WordPress site maintained properly — and costs dramatically less than a WordPress site maintained poorly (which is where the security breach rebuilds happen).',
    replace:
      'WordPress usually costs less to launch and can cost less over three years. The Next.js case is control over the frontend, performance as the site grows, custom functionality, and how changes reach production.',
  },
  {
    id: 'f-honest',
    slug: 'wordpress-vs-nextjs-honest-comparison',
    label: 'Pattern F — TCO favors Next.js',
    find:
      'Higher upfront investment. Near-zero ongoing costs. No premium plugin renewals, no managed hosting fees in the $300+/month range, no maintenance hours. Over 3 years, total cost of ownership often favors Next.js — especially when you factor in the cost of one preventable security breach.',
    replace:
      'WordPress usually wins on the first invoice. Next.js costs more to build because the frontend is designed around the business. You buy control of the page, room for custom functionality, and a release path that goes through a reviewed build.',
  },
  {
    id: 'f-true',
    slug: 'true-cost-of-wordpress-website',
    label: 'Pattern F — WordPress slightly more expensive',
    find:
      'The $3,500 WordPress site and the $15,000 Next.js site end up in the same cost neighborhood over three years. The WordPress site might even be slightly more expensive once you factor in one security incident and realistic maintenance.',
    replace:
      'WordPress usually costs less to launch. The $15,000 Next.js build is the higher invoice. You pay for a frontend you control and a site that ships when the build is ready.',
  },
  {
    id: 'f-true-spend',
    slug: 'true-cost-of-wordpress-website',
    label: 'Pattern F — same-spend intro',
    find: 'What you get for roughly the same total spend:',
    replace: 'What the higher Next.js build buys:',
  },
  {
    id: 'f-secure',
    slug: 'is-wordpress-secure',
    label: 'Pattern F — TCO ends up lower',
    find:
      'The architecture is inherently more secure, and the total cost of ownership over three years often ends up lower.',
    replace:
      'WordPress usually costs less to launch. Next.js is the buy when a smaller public surface and a controlled release path matter more than the first invoice.',
  },
  {
    id: 'g-honest-heading',
    slug: 'wordpress-vs-nextjs-honest-comparison',
    label: 'Pattern G — Zero Maintenance heading',
    find: 'Zero Maintenance',
    replace: 'Who Does the Work',
  },
  {
    id: 'g-honest-run',
    slug: 'wordpress-vs-nextjs-honest-comparison',
    label: 'Pattern G — deploy once forever',
    find:
      'Next.js sites just run. Deploy once, serve static HTML from the edge, forever. The only "updates" are when you intentionally ship new features or content.',
    replace:
      'Content changes go to the client\'s team in the CMS. Framework and dependency upgrades are scheduled engineering work. A developer bumps the version, fixes what the build breaks, and ships a reviewed release.',
  },
  {
    id: 'g-secure',
    slug: 'is-wordpress-secure',
    label: 'Pattern G — updates optional',
    find: 'Maintenance: Minimal — updates optional, framework handles security',
    replace:
      'Maintenance: Content edits stay in the CMS. Framework upgrades land when a developer opens the work.',
  },
  {
    id: 'g-dont-build-prev',
    slug: 'why-we-dont-build-wordpress-sites',
    label: 'Pattern G — no constant maintenance',
    find: 'That don\'t require constant maintenance.',
    replace:
      'That put content edits in the CMS and framework upgrades on an engineering calendar.',
  },
  {
    id: 'g-dont-build',
    slug: 'why-we-dont-build-wordpress-sites',
    label: 'Pattern G — without ongoing intervention',
    find:
      'That\'s what we build now. Custom Next.js sites, hand-coded, deployed on Vercel, built to last without ongoing intervention.',
    replace:
      'That\'s what we build now. Custom Next.js sites, hand-coded, deployed on Vercel. Editors publish from the CMS. When Next.js ships a breaking release, a developer opens the upgrade and takes it to production.',
  },
  {
    id: 'g-15k',
    slug: 'why-15000-website-cheaper-than-5000',
    label: 'Pattern G — 5+ years without starting over',
    find:
      'A clean, documented Next.js codebase extends that cycle. Framework upgrades are real work but incremental. The core architecture reliably serves a business for 5+ years without starting over. One rebuild cycle avoided is $5,000–$15,000 saved.',
    replace:
      'A clean, documented Next.js codebase keeps the upgrade path in version control. Editors change copy in the CMS. A developer handles framework and dependency upgrades on a schedule, then deploys.',
  },
  {
    id: 'g-3year',
    slug: 'wordpress-vs-nextjs-3-year-cost-comparison',
    label: 'Pattern G — 5+ years without starting over',
    find:
      'A clean, documented Next.js codebase doesn\'t have this problem in the same way. Framework upgrades (Next.js 16 → 17 → 18) are real work, but they\'re incremental. The core architecture keeps serving you for 5+ years without starting over.',
    replace:
      'On Next.js, content changes go to the client\'s team in the CMS. Framework upgrades from one major version to the next are scheduled engineering work. A developer bumps the framework, fixes what the build breaks, and ships.',
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
