/**
 * Round two: correct statistics that are real but misrepresented.
 * Pattern C — Patchstack 91% presented as an incident rate
 * Pattern D — Melapress 64% with an invented maintenance clause
 * Pattern E — Hostinger averages paired with Chrome LCP as a head-to-head
 *
 * Default: dry run. Pass --execute to write.
 * Aborts without writing if any target string matches zero or more than one
 * place in its post.
 *
 * Run: pnpm correct:wordpress-claims-r2
 *      pnpm correct:wordpress-claims-r2 -- --execute
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
    id: 'c-hacked',
    slug: 'why-wordpress-gets-hacked',
    label: 'Pattern C — 91% as the number one cause',
    find:
      'This is the number one cause by a massive margin. Patchstack\'s data shows 91% of WordPress vulnerabilities come from plugins.',
    replace:
      'Patchstack counts disclosed vulnerabilities, not compromises. Their data shows 91% of those disclosures come from plugins. That is the extension layer, not a share of actual breaches. Risk still grows with every plugin you add and every update you delay.',
  },
  {
    id: 'c-breach',
    slug: 'real-cost-wordpress-security-breach',
    label: 'Pattern C — 91% plus invented breach share',
    find:
      'Patchstack\'s 2026 report found that 91% of vulnerabilities are in plugins, and most breaches happen on sites where plugins aren\'t being updated.',
    replace:
      'Patchstack\'s 2026 report found that 91% of disclosed WordPress vulnerabilities are in plugins. That is a count of known holes, not a count of sites that got hacked. The plugin layer is where most of those holes sit, and each delayed update leaves them open longer.',
  },
  {
    id: 'c-relevant',
    slug: 'is-wordpress-still-relevant-2026',
    label: 'Pattern C — 91% as the biggest attack vector',
    find:
      '91% came from plugins. Median exploitation time after public disclosure: 5 hours. Outdated plugins are the single biggest attack vector.',
    replace:
      '91% of those were plugin disclosures, not a tally of breaches. Median time to a public exploit after disclosure: 5 hours. The extension ecosystem is where most of the known holes sit. Risk grows with each plugin and each delayed update. The figure does not prove outdated plugins account for most hacks.',
  },
  {
    id: 'c-care',
    slug: 'what-is-a-website-care-plan',
    label: 'Pattern C — 91% as the number one cause of compromises',
    find:
      'Outdated plugins and themes are the number one cause of WordPress compromises. Patchstack documented 11,334 new WordPress vulnerabilities in 2025, with 91% originating from plugins and a 5-hour median exploitation window.',
    replace:
      'Patchstack documented 11,334 new WordPress vulnerabilities in 2025, with 91% originating from plugins and a 5-hour median exploitation window. That is a disclosure count, not a breach count. The plugin layer is still where most of the known holes sit, so an unpatched site stays exposed.',
  },
  {
    id: 'd-hidden',
    slug: 'hidden-wordpress-costs-agencies-dont-tell-you',
    label: 'Pattern D — Melapress 64% invented clause',
    find:
      'A Melapress industry survey cited by Codeable found that 64% of WordPress professionals had experienced a breach — most on sites without structured maintenance.',
    replace:
      'A Melapress industry survey cited by Codeable found that 64% of WordPress professionals had experienced a breach.',
  },
  {
    id: 'd-breach',
    slug: 'real-cost-wordpress-security-breach',
    label: 'Pattern D — Melapress 64% invented clause',
    find:
      'A Melapress industry survey cited by Codeable found that 64% of WordPress professionals had experienced a security breach at some point, with the overwhelming majority occurring on sites without structured maintenance.',
    replace:
      'A Melapress industry survey cited by Codeable found that 64% of WordPress professionals had experienced a security breach at some point.',
  },
  {
    id: 'd-15k',
    slug: 'why-15000-website-cheaper-than-5000',
    label: 'Pattern D — Melapress 64% invented clause',
    find:
      'A Melapress industry survey found 64% of WordPress professionals had experienced a breach, with most on sites without structured maintenance',
    replace:
      'A Melapress industry survey found 64% of WordPress professionals had experienced a breach',
  },
  {
    id: 'd-3year',
    slug: 'wordpress-vs-nextjs-3-year-cost-comparison',
    label: 'Pattern D — Melapress 64% invented clause',
    find:
      'Codeable cites a Melapress industry survey finding that 64% of WordPress professionals had experienced a breach, with most occurring on sites without structured maintenance.',
    replace:
      'Codeable cites a Melapress industry survey finding that 64% of WordPress professionals had experienced a breach.',
  },
  {
    id: 'd-true',
    slug: 'true-cost-of-wordpress-website',
    label: 'Pattern D — Melapress 64% invented clause',
    find:
      'A Melapress industry survey cited by Codeable found that 64% of WordPress professionals had experienced a breach, with most occurring on sites without structured maintenance.',
    replace:
      'A Melapress industry survey cited by Codeable found that 64% of WordPress professionals had experienced a breach.',
  },
  {
    id: 'e-faster-pair',
    slug: 'faster-website-makes-you-more-money',
    label: 'Pattern E — Hostinger paired with Chrome as 10x',
    find:
      'As noted above, Hostinger\'s data puts the average WordPress site at 13.25 seconds on mobile. According to Chrome team data reported across performance research, top-performing sites average around 1,220 milliseconds for Largest Contentful Paint — roughly 10x faster than the average WordPress mobile experience.',
    replace:
      'Hostinger\'s dataset average for WordPress on mobile is 13.25 seconds. Chrome\'s research on top-performing sites puts Largest Contentful Paint around 1,220 milliseconds.',
  },
  {
    id: 'e-faster-default',
    slug: 'faster-website-makes-you-more-money',
    label: 'Pattern E — Next.js in the 1,220ms tier by default',
    find:
      'A well-built Next.js site typically lives in that top-performing range by default. Not because Next.js is magic, but because the architecture eliminates most of what makes WordPress slow — no plugin stack, no database query per page view, static HTML served from a CDN.',
    replace:
      'Next.js controls what reaches the browser: HTML on the first response, no plugin stack assembling the page per request, no database query per page view, assets served from the edge.',
  },
  {
    id: 'e-faster-gap',
    slug: 'faster-website-makes-you-more-money',
    label: 'Pattern E — leftover 10-second head-to-head',
    find:
      'Based on the Akamai research, 10+ seconds of additional load time doesn\'t just reduce conversions — it effectively eliminates them for the mobile traffic that makes up most of your audience.',
    replace:
      'Akamai\'s research found that extra seconds of load time on mobile don\'t just reduce conversions — they eliminate them for the traffic that makes up most of your audience. Next.js keeps the plugin stack and the per-request database query out of that first load.',
  },
  {
    id: 'e-vegas-pair',
    slug: 'las-vegas-hospitality-website-speed',
    label: 'Pattern E — Hostinger paired with Chrome as 10x',
    find:
      'As noted above, Hostinger\'s data puts the average WordPress site at 13.25 seconds on mobile. Chrome team data reported across performance research shows that top-performing sites average around 1,220 milliseconds for Largest Contentful Paint — roughly 10x faster than the average WordPress mobile experience.',
    replace:
      'Hostinger puts the average WordPress site at 13.25 seconds on mobile. Chrome team data puts Largest Contentful Paint for top-performing sites around 1,220 milliseconds.',
  },
  {
    id: 'e-vegas-default',
    slug: 'las-vegas-hospitality-website-speed',
    label: 'Pattern E — Next.js in the 1,220ms tier by default',
    find:
      'A well-built Next.js site typically sits in that top-performing range by default. Not because Next.js is magic, but because the architecture eliminates most of what makes WordPress slow on mobile — no plugin stack, no database query per page view, static HTML served from a CDN.',
    replace:
      'Next.js sends HTML on the first response and serves assets from the edge, with no plugin stack assembling the page per request.',
  },
  {
    id: 'e-speed-matters',
    slug: 'website-speed-matters-business',
    label: 'Pattern E — Next.js sits in the Chrome tier vs WordPress average',
    find:
      'Chrome team data reports that top-performing sites average around 1,220ms for Largest Contentful Paint. A well-built Next.js site typically sits in that range — roughly half the time of the average WordPress site on desktop, and dramatically faster on mobile.',
    replace:
      'Chrome team data reports that top-performing sites average around 1,220ms for Largest Contentful Paint. Next.js ships HTML in the first response, with no plugin stack assembling the page and no database query per page view.',
  },
  {
    id: 'e-dont-build',
    slug: 'why-we-dont-build-wordpress-sites',
    label: 'Pattern E — Hostinger paired with Chrome default tier',
    find:
      'Hostinger\'s 2025 research analyzing real WordPress performance data found the average WordPress site loads in 2.5 seconds on desktop and 13.25 seconds on mobile. Chrome team data puts top-performing sites at around 1,220ms Largest Contentful Paint — a tier Next.js on Vercel routinely hits by default.',
    replace:
      'Hostinger\'s 2025 research analyzing real WordPress performance data found the average WordPress site loads in 2.5 seconds on desktop and 13.25 seconds on mobile. Chrome team data puts top-performing sites at around 1,220ms Largest Contentful Paint. Next.js has no plugin stack assembling the page per request and no database query per page view. The HTML is already built when it reaches the browser.',
  },
  {
    id: 'e-2026-default',
    slug: 'wordpress-vs-nextjs-2026',
    label: 'Pattern E — routinely hits 1,220ms without optimization',
    find:
      'Chrome\'s internal data puts top-performing sites at around 1,220ms Largest Contentful Paint. Next.js sites deployed on Vercel routinely hit that tier by default, without optimization work.',
    replace:
      'Chrome\'s data on top-performing sites puts Largest Contentful Paint around 1,220ms. Next.js controls the payload: HTML in the first response, no per-request database query, assets served from the edge.',
  },
  {
    id: 'e-2026-gap',
    slug: 'wordpress-vs-nextjs-2026',
    label: 'Pattern E — 4-second typical-site gap',
    find:
      'A 4-second gap between a typical WordPress site and a typical Next.js site isn\'t a technical detail — it\'s lost revenue every day.',
    replace:
      'Lost seconds are lost revenue every day. Next.js ships HTML on the first response and keeps plugin work and per-request database queries out of the page view.',
  },
  {
    id: 'e-relevant',
    slug: 'is-wordpress-still-relevant-2026',
    label: 'Pattern E — fast by default plus 1,220ms baseline',
    find:
      'Modern frameworks like Next.js are fast by default. Chrome team data puts top-performing sites at around 1,220ms LCP — a baseline Next.js on Vercel routinely hits without any optimization work.',
    replace:
      'Next.js puts the HTML on the first response and keeps a plugin stack from assembling the page per request. Chrome team data puts top-performing sites at around 1,220ms LCP.',
  },
  {
    id: 'e-honest-pair',
    slug: 'wordpress-vs-nextjs-honest-comparison',
    label: 'Pattern E — Hostinger paired with Chrome default tier',
    find:
      'Hostinger\'s 2025 research found the average WordPress site loads in 2.5 seconds on desktop and 13.25 seconds on mobile. Chrome team data puts top-performing sites at around 1,220ms LCP — a tier Next.js sites routinely hit by default on Vercel.',
    replace:
      'Hostinger\'s 2025 research found the average WordPress site loads in 2.5 seconds on desktop and 13.25 seconds on mobile. Chrome team data puts top-performing sites at around 1,220ms LCP.',
  },
  {
    id: 'e-honest-gap',
    slug: 'wordpress-vs-nextjs-honest-comparison',
    label: 'Pattern E — leftover performance-gap head-to-head',
    find:
      'Akamai\'s research found a 1-second delay reduces conversions by up to 22%. That performance gap isn\'t academic — it shows up in your conversion rate every day the site is live.',
    replace:
      'Akamai\'s research found a 1-second delay reduces conversions by up to 22%. Next.js keeps the first payload free of a plugin stack and a database round-trip per view.',
  },
  {
    id: 'e-vercel-default',
    slug: 'vercel-vs-wp-engine',
    label: 'Pattern E — Vercel Next.js hits 1,220ms by default',
    find:
      'Chrome team data puts top-performing sites at around 1,220ms LCP — Vercel-hosted Next.js sites routinely hit this by default',
    replace:
      'Chrome team data puts top-performing sites at around 1,220ms LCP. Next.js on Vercel sends HTML on the first response and serves assets from the edge',
  },
  {
    id: 'e-vercel-magnitude',
    slug: 'vercel-vs-wp-engine',
    label: 'Pattern E — leftover order-of-magnitude pairing',
    find: 'Winner: Vercel by architecture. Different order of magnitude.',
    replace:
      'Winner: Vercel. The architecture puts HTML on the first response and assets at the edge.',
  },
  {
    id: 'e-react',
    slug: 'nextjs-vs-react-business-website',
    label: 'Pattern E — Next.js hits 1,220ms by default',
    find:
      'Chrome team data puts top-performing sites at around 1,220ms Largest Contentful Paint. Next.js on Vercel routinely hits this tier by default. Plain React SPAs typically take 2–4 seconds longer to show content on mobile.',
    replace:
      'Chrome team data puts top-performing sites at around 1,220ms Largest Contentful Paint. Next.js sends HTML on the first response. A plain React SPA waits on JavaScript before anything shows.',
  },
  {
    id: 'e-speedup',
    slug: 'how-to-speed-up-wordpress',
    label: 'Pattern E — Next.js hits 1,220ms by default',
    find:
      'Chrome team data puts top-performing sites at around 1,220ms LCP — a tier Next.js on Vercel hits by default, without plugin management or caching configuration.',
    replace:
      'Chrome team data puts top-performing sites at around 1,220ms LCP. Next.js serves HTML from the edge without a plugin-and-cache stack assembling the page per request.',
  },
  {
    id: 'e-builders',
    slug: 'website-builders-vs-custom-development',
    label: 'Pattern E — performance gap plus 1,220ms by default',
    find:
      'Over three years, the total cost of ownership often converges — but the performance gap does not. Chrome team data shows top-performing sites at ~1,220ms LCP. Next.js on Vercel hits that tier by default. No builder in 2026 does.',
    replace:
      'Over three years, the total cost of ownership often converges. Chrome team data shows top-performing sites at around 1,220ms LCP. Next.js puts HTML on the first response and assets at the edge. A builder still assembles the page through its own stack on every request.',
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
