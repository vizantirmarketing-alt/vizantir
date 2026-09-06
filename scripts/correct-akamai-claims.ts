/**
 * Correct Akamai State of Online Retail Performance citations in published
 * Sanity posts. The 22% / 7% figures are real. The errors are scope,
 * causation, and dropping "up to."
 *
 * Searched every published post (51). Required instances:
 *
 * 1. faster-website-makes-you-more-money
 *    "A 100-millisecond delay reduced conversions by up to 7%. A 1-second
 *    delay reduced conversions by up to 22%."
 * 2. faster-website-makes-you-more-money
 *    extra seconds on mobile "eliminate them"
 * 3. las-vegas-hospitality-website-speed
 *    "a 100-millisecond delay reduces conversion rates by up to 7%. A
 *    1-second delay reduces conversions by up to 22%."
 * 4. las-vegas-hospitality-website-speed
 *    "applying the conservative 7% Akamai figure" to hospitality bookings
 * 5. why-15000-website-cheaper-than-5000
 *    "A 1-second delay can cut conversions by 22%."
 * 6. wordpress-vs-nextjs-3-year-cost-comparison
 *    "A 1-second delay can cut conversions by 22%."
 * 7. how-to-get-more-bookings-restaurant-website
 *    "a 1-second delay in page load reduces conversions by up to 22%."
 * 8. hospitality-website-design-las-vegas
 *    "a 1-second delay in page load reduces conversions by up to 22%."
 * 9. squarespace-vs-custom-website
 *    "every 1-second delay reduces conversions by up to 22%"
 * 10. when-wix-makes-sense-and-when-youve-outgrown-it
 *     "a 1-second delay reduces conversions by up to 22%"
 * 11. why-we-dont-build-wordpress-sites
 *     "every 1-second delay reduces conversions by up to 22%"
 * 12. wordpress-vs-nextjs-2026
 *     "a 1-second delay reduces conversions by up to 22%"
 * 13. why-wordpress-site-slow
 *     "a 1-second delay reduces conversions by up to 22%"
 * 14. why-your-competitors-website-looks-better
 *     "every 1-second delay reduces conversions by up to 22%"
 * 15. wordpress-vs-nextjs-honest-comparison
 *     "a 1-second delay reduces conversions by up to 22%"
 * 16. how-to-speed-up-wordpress
 *     "1-second delay reduces conversions by up to 22%"
 *
 * No instance in excerpt or SEO fields. No instance in
 * law-firm-website-design-las-vegas, luxury-salon-spa-website-design, or
 * what-should-a-hotel-website-include.
 *
 * Related mentions left alone: Walmart's 2% per second of improvement,
 * Amazon's 100ms / 1% sales figure, and the Webflow post's generic
 * "every 100ms affects conversion rate" line. Those are not this claim.
 *
 * Rewrites name online retail, keep "up to," use association rather than
 * causation, and do not apply the retail magnitude to a non-retail
 * industry. Speed still matters. Direction still holds.
 *
 * Default: dry run. Pass --execute to write.
 * Aborts without writing if any target string matches zero or more than one
 * place in its post, or if a required scan hit has no matching fix.
 *
 * Run: pnpm correct:akamai-claims
 *      pnpm correct:akamai-claims -- --execute
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
    id: 'faster-money-22',
    slug: 'faster-website-makes-you-more-money',
    label: 'Retail study stated as causation',
    find:
      "Akamai's State of Online Retail Performance report analyzed 10 billion retail site visits. A 100-millisecond delay reduced conversions by up to 7%. A 1-second delay reduced conversions by up to 22%.",
    replace:
      "Akamai's State of Online Retail Performance report analyzed 10 billion retail site visits. A 100-millisecond delay was associated with conversion rates up to 7% lower. A 1-second delay was associated with conversion rates up to 22% lower.",
  },
  {
    id: 'faster-money-eliminate',
    slug: 'faster-website-makes-you-more-money',
    label: 'Retail study inflated to conversion elimination',
    find:
      "Akamai's research found that extra seconds of load time on mobile don't just reduce conversions \u2014 they eliminate them for the traffic that makes up most of your audience. Next.js keeps the plugin stack and the per-request database query out of that first load.",
    replace:
      "Akamai's online retail research associated extra seconds of mobile load time with sharply lower conversions. Next.js keeps the plugin stack and the per-request database query out of that first load.",
  },
  {
    id: 'vegas-hospitality-22',
    slug: 'las-vegas-hospitality-website-speed',
    label: 'Retail rates stated as causation on a hospitality post',
    find:
      "Akamai's State of Online Retail Performance report, analyzing 10 billion retail site visits, found that a 100-millisecond delay reduces conversion rates by up to 7%. A 1-second delay reduces conversions by up to 22%. The Portent study across 20 industries put the average conversion drop at 4.42% per additional second of load time.",
    replace:
      "Akamai's State of Online Retail Performance report, analyzing 10 billion retail site visits, found a 100-millisecond delay was associated with conversion rates up to 7% lower and a 1-second delay with rates up to 22% lower. That magnitude is retail-specific. The Portent study across 20 industries put the average conversion drop at 4.42% per additional second of load time.",
  },
  {
    id: 'vegas-hospitality-apply',
    slug: 'las-vegas-hospitality-website-speed',
    label: 'Retail 7% applied as a hospitality booking rate',
    find:
      'For a Las Vegas hospitality business, applying the conservative 7% Akamai figure per second of improvement: shaving 4 seconds off load time on a site generating 500 monthly mobile visits could realistically add 10\u201330% more completed bookings \u2014 without increasing marketing spend, without changing the offer, without running a single extra ad.',
    replace:
      'A Las Vegas hospitality site generating 500 monthly mobile visits does not inherit the retail percentage. The direction still holds. Shaving 4 seconds off load time gives more of those visits a chance to become bookings, without increasing marketing spend, without changing the offer, and without running a single extra ad.',
  },
  {
    id: '15k-cheaper-22',
    slug: 'why-15000-website-cheaper-than-5000',
    label: 'Dropped "up to" and stated as a cut',
    find:
      "Akamai's State of Online Retail Performance report, analyzing 10 billion user visits, found that a 100-millisecond delay can reduce conversion rates by up to 7%. A 1-second delay can cut conversions by 22%.",
    replace:
      "Akamai's State of Online Retail Performance report, analyzing 10 billion retail visits, found a 100-millisecond delay was associated with conversion rates up to 7% lower and a 1-second delay with rates up to 22% lower.",
  },
  {
    id: '3year-cost-22',
    slug: 'wordpress-vs-nextjs-3-year-cost-comparison',
    label: 'Dropped "up to" and stated as a cut',
    find:
      "Akamai's 2017 State of Online Retail Performance report, analyzing 10 billion user visits, found that a 100-millisecond delay in load time can reduce conversion rates by up to 7%. A 1-second delay can cut conversions by 22%.",
    replace:
      "Akamai's 2017 State of Online Retail Performance report, analyzing 10 billion retail visits, found a 100-millisecond delay was associated with conversion rates up to 7% lower and a 1-second delay with rates up to 22% lower.",
  },
  {
    id: 'restaurant-bookings-22',
    slug: 'how-to-get-more-bookings-restaurant-website',
    label: 'Retail 22% applied as a restaurant conversion rate',
    find:
      "The data is clear. Akamai's State of Online Retail Performance research found that a 1-second delay in page load reduces conversions by up to 22%. Google's mobile performance research found 53% of mobile users abandon a site that takes more than 3 seconds to load.",
    replace:
      "Akamai's State of Online Retail Performance research found a 1-second delay was associated with conversion rates up to 22% lower on retail sites. That magnitude is retail-specific. The direction holds for restaurant bookings. Google's mobile performance research found 53% of mobile users abandon a site that takes more than 3 seconds to load.",
  },
  {
    id: 'hospitality-design-22',
    slug: 'hospitality-website-design-las-vegas',
    label: 'Retail 22% applied as a hospitality conversion rate',
    find:
      "According to Akamai's State of Online Retail Performance research, a 1-second delay in page load reduces conversions by up to 22%. The Portent study across 20 industries put the average conversion drop at 4.42% per additional second.",
    replace:
      "Akamai's State of Online Retail Performance research found a 1-second delay was associated with conversion rates up to 22% lower on retail sites. That magnitude is retail-specific. The direction holds for hospitality bookings. The Portent study across 20 industries put the average conversion drop at 4.42% per additional second.",
  },
  {
    id: 'squarespace-22',
    slug: 'squarespace-vs-custom-website',
    label: 'E-commerce citation stated as causation',
    find:
      "For a portfolio site, this doesn't matter much. For an e-commerce site where Akamai research shows every 1-second delay reduces conversions by up to 22%, it adds up fast.",
    replace:
      "For a portfolio site, this doesn't matter much. For an e-commerce site, Akamai's online retail research associated a 1-second delay with conversion rates up to 22% lower, and that adds up fast.",
  },
  {
    id: 'wix-22',
    slug: 'when-wix-makes-sense-and-when-youve-outgrown-it',
    label: 'Retail 22% applied as a general Wix conversion rate',
    find:
      'For context: Akamai\'s State of Online Retail Performance research found that a 1-second delay reduces conversions by up to 22%. A Wix site loading at 5\u20136 seconds on mobile isn\'t just "slower" \u2014 it\'s losing real conversions every day.',
    replace:
      "For context: Akamai's State of Online Retail Performance research found a 1-second delay was associated with conversion rates up to 22% lower on retail sites. A Wix site loading at 5-6 seconds on mobile is losing conversions every day. The direction holds even though that 22% figure is retail-specific.",
  },
  {
    id: 'dont-build-wp-22',
    slug: 'why-we-dont-build-wordpress-sites',
    label: 'Retail 22% stated as a general conversion rate',
    find:
      "Speed isn't vanity \u2014 it's money. Akamai research found every 1-second delay reduces conversions by up to 22%. Google uses Core Web Vitals as a ranking signal. Slow sites lose both rankings and revenue.",
    replace:
      "Speed is not vanity. It is money. Akamai's online retail research found a 1-second delay was associated with conversion rates up to 22% lower. Google uses Core Web Vitals as a ranking signal. Slow sites lose both rankings and revenue.",
  },
  {
    id: 'wp-nextjs-2026-22',
    slug: 'wordpress-vs-nextjs-2026',
    label: 'Retail 22% stated as a general business rate',
    find:
      "For context on what that means for business: Akamai's State of Online Retail Performance research found a 1-second delay reduces conversions by up to 22%. Lost seconds are lost revenue every day. Next.js ships HTML on the first response and keeps plugin work and per-request database queries out of the page view.",
    replace:
      "For context on what that means for business: Akamai's State of Online Retail Performance research found a 1-second delay was associated with conversion rates up to 22% lower on retail sites. Lost seconds are still lost revenue. Next.js ships HTML on the first response and keeps plugin work and per-request database queries out of the page view.",
  },
  {
    id: 'wp-slow-22',
    slug: 'why-wordpress-site-slow',
    label: 'Retail 22% stated as a general conversion rate',
    find:
      "The performance gap costs real money. Akamai's State of Online Retail Performance research found a 1-second delay reduces conversions by up to 22%. A 4-second gap between your site and a competitor's isn't a technical detail \u2014 it's lost revenue every day.",
    replace:
      "The performance gap costs real money. Akamai's State of Online Retail Performance research found a 1-second delay was associated with conversion rates up to 22% lower on retail sites. A 4-second gap between your site and a competitor's is not a technical detail. It is lost revenue every day.",
  },
  {
    id: 'competitors-22',
    slug: 'why-your-competitors-website-looks-better',
    label: 'Retail 22% stated as a general conversion rate',
    find:
      "Chrome team data puts top-performing sites at around 1,220ms Largest Contentful Paint. Template sites often sit at 4\u20136 seconds on mobile. That gap isn't subtle \u2014 Akamai research shows every 1-second delay reduces conversions by up to 22%. Speed is perception and revenue simultaneously.",
    replace:
      "Chrome team data puts top-performing sites at around 1,220ms Largest Contentful Paint. Template sites often sit at 4-6 seconds on mobile. That gap is not subtle. Akamai's online retail research associated a 1-second delay with conversion rates up to 22% lower. Speed is perception and revenue simultaneously.",
  },
  {
    id: 'honest-comparison-22',
    slug: 'wordpress-vs-nextjs-honest-comparison',
    label: 'Unscoped Akamai 22% stated as causation',
    find:
      "Akamai's research found a 1-second delay reduces conversions by up to 22%. Next.js keeps the first payload free of a plugin stack and a database round-trip per view.",
    replace:
      "Akamai's State of Online Retail Performance research found a 1-second delay was associated with conversion rates up to 22% lower on retail sites. Next.js keeps the first payload free of a plugin stack and a database round-trip per view.",
  },
  {
    id: 'speed-up-wp-22',
    slug: 'how-to-speed-up-wordpress',
    label: 'List item stated as causation',
    find:
      "Akamai's State of Online Retail Performance research: 1-second delay reduces conversions by up to 22%",
    replace:
      "Akamai's State of Online Retail Performance research: a 1-second delay was associated with conversion rates up to 22% lower on retail sites",
  },
]

function isRequiredHit(text: string): boolean {
  if (!/akamai/i.test(text)) return false
  return (
    /22\s*%/.test(text) ||
    /7\s*%/.test(text) ||
    /1-second delay/i.test(text) ||
    /eliminate them/i.test(text) ||
    /extra seconds of load time/i.test(text)
  )
}

function isRelatedHit(text: string): boolean {
  if (isRequiredHit(text)) return false
  return (
    /akamai/i.test(text) ||
    (/22\s*%/.test(text) && /conversion/i.test(text)) ||
    (/1-second|one-second|1 second of load/i.test(text) && /conversion/i.test(text)) ||
    (/100\s*ms|100-millisecond|100ms/i.test(text) && /conversion|sales/i.test(text))
  )
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
