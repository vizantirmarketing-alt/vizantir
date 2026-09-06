/**
 * Correct Core Web Vitals and PageSpeed ranking-causation claims in
 * published Sanity posts.
 *
 * Google uses Core Web Vitals in ranking systems and recommends good
 * scores. Good results in the Core Web Vitals report or third-party tools
 * do not guarantee top rankings. Page experience is more than CWV scores.
 * Google uses CrUX field data for ranking assessments, not Lighthouse lab
 * scores. Performance still matters for conversion and is still a signal.
 *
 * Searched every published post (51), including excerpt and SEO fields.
 *
 * Required instances (full live sentences):
 *
 * 1. why-your-website-needs-to-work-in-every-direction
 *    "Google's Core Web Vitals and mobile usability scoring are based on
 *    real user data across devices. A site that performs well on desktop
 *    but poorly on tablet or landscape mobile will see that reflected in
 *    its search rankings over time."
 * 2. faster-website-makes-you-more-money
 *    "Beyond the direct conversion impact, slow sites rank lower in Google
 *    search results."
 * 3. faster-website-makes-you-more-money
 *    "Google uses Core Web Vitals as a ranking factor. Sites that pass all
 *    three metrics (LCP, INP, CLS) receive a ranking boost; sites that
 *    fail them get demoted, all else being equal."
 * 4. faster-website-makes-you-more-money
 *    "This compounds: a slow site converts fewer of the visitors it gets,
 *    and gets fewer visitors in the first place because Google ranks it
 *    lower."
 * 5. faster-website-makes-you-more-money
 *    "A Las Vegas restaurant with a WordPress website loading in 8 seconds
 *    on mobile is losing most of its mobile traffic before anyone sees the
 *    menu. It's also ranking lower than competitors with faster sites for
 *    searches like "restaurants near me" — because Google's Core Web
 *    Vitals signal is working against them."
 * 6. faster-website-makes-you-more-money
 *    "The same restaurant with a Next.js site loading in under 2 seconds:
 *    more visitors stay, more reach the reservation flow, more complete
 *    the booking. Google ranks them higher. The marketing spend goes
 *    further because the site actually converts."
 * 7. faster-website-makes-you-more-money
 *    "Go to pagespeed.web.dev and run your website right now — on mobile.
 *    If your mobile performance score is below 70, your site is actively
 *    costing you customers and rankings."
 * 8. las-vegas-hospitality-website-speed excerpt
 *    "Las Vegas diners and hotel guests research online before they
 *    commit. A slow website does not just frustrate visitors — it costs
 *    you reservations, rankings, and revenue. Here is the data."
 * 9. las-vegas-hospitality-website-speed
 *    "Beyond the direct conversion impact, slow sites rank lower in Google
 *    search results."
 * 10. las-vegas-hospitality-website-speed
 *     "Google uses Core Web Vitals as a ranking factor — specifically
 *     Largest Contentful Paint (LCP), Interaction to Next Paint (INP),
 *     and Cumulative Layout Shift (CLS). A hospitality website with poor
 *     scores will rank below faster competitors for searches like
 *     "restaurants in Las Vegas" or "boutique hotels Las Vegas.""
 * 11. las-vegas-hospitality-website-speed
 *     "This compounds the problem: a slow site gets fewer visitors from
 *     search and converts a smaller percentage of the visitors it does
 *     get."
 * 12. las-vegas-hospitality-website-speed
 *     "Better Core Web Vitals scores improve Google rankings, which drive
 *     more organic traffic. More organic traffic means more potential
 *     guests entering the booking funnel. A higher conversion rate means
 *     more of those guests complete a reservation."
 * 13. las-vegas-hospitality-website-speed
 *     "Go to pagespeed.web.dev and run your hospitality website right now
 *     — on mobile. If your performance score is below 70, your site is
 *     actively costing you reservations and rankings."
 * 14. what-should-a-hotel-website-include
 *     "Google uses three Core Web Vitals as ranking signals: LCP (Largest
 *     Contentful Paint), INP (Interaction to Next Paint), and CLS
 *     (Cumulative Layout Shift). Hotels with strong scores rank higher for
 *     terms like "hotels near [landmark]" or "[city] boutique hotel" —
 *     which are the high-intent searches that drive direct bookings."
 * 15. what-should-a-hotel-website-include
 *     "A slow hotel website ranks lower AND converts worse. Both signals
 *     work against direct booking revenue simultaneously."
 * 16. how-las-vegas-businesses-rank-higher-google
 *     "Make sure your site loads fast — Core Web Vitals (LCP, INP, CLS)
 *     directly affect rankings"
 * 17. website-speed-matters-business excerpt
 *     "A slow website is not just annoying — it is actively losing you
 *     customers and hurting your Google rankings. Here is what you need
 *     to know."
 * 18. website-speed-matters-business seo.metaDescription
 *     "A slow website costs you customers and hurts your Google rankings.
 *     Learn why website speed matters and what to do about it in 2026."
 * 19. website-speed-matters-business
 *     "And it gets worse: Google uses Core Web Vitals as a ranking factor.
 *     A slow site doesn't just lose visitors — it loses rankings, which
 *     means fewer visitors in the first place."
 * 20. website-speed-matters-business
 *     "These are the signals Google uses to rank pages on real user
 *     experience, not just subjective quality. A site that fails on any of
 *     them loses ranking and conversions simultaneously."
 * 21. law-firm-website-design-las-vegas
 *     "Speed. Google uses Core Web Vitals as a ranking signal. A slow site
 *     ranks lower and loses clients who won't wait for a page to render —
 *     especially on mobile, which is where most legal searches happen
 *     now."
 * 22. webflow-vs-nextjs
 *     "Competitive SEO where Core Web Vitals decide rankings"
 * 23. webflow-vs-nextjs
 *     "SEO competition requires every Core Web Vital point"
 * 24. do-i-need-a-custom-website
 *     "If you're investing in content marketing and organic search, page
 *     speed and Core Web Vitals directly affect your rankings in 2026.
 *     Template sites typically score 40–60 on mobile PageSpeed. Custom
 *     sites score 90–100. Chrome team data puts top-performing sites at
 *     around 1,220ms LCP — a tier only custom sites hit consistently."
 * 25. do-i-need-a-custom-website
 *     "That gap can mean the difference between page one and page two of
 *     Google results, and page two gets almost no clicks. For ChatGPT,
 *     Claude, and Perplexity, structural server rendering matters even
 *     more."
 * 26. why-we-dont-build-wordpress-sites
 *     "Speed is not vanity. It is money. Akamai's online retail research
 *     found a 1-second delay was associated with conversion rates up to
 *     22% lower. Google uses Core Web Vitals as a ranking signal. Slow
 *     sites lose both rankings and revenue."
 * 27. wordpress-vs-nextjs-2026
 *     "Sites where AI crawler visibility and Core Web Vitals rankings
 *     matter"
 * 28. when-wix-makes-sense-and-when-youve-outgrown-it
 *     "This is Wix's Achilles heel. The platform loads a heavy JavaScript
 *     runtime regardless of how simple your site is. Typical mobile
 *     PageSpeed scores land between 35–55 — well below Google's "good"
 *     threshold."
 * 29. when-wix-makes-sense-and-when-youve-outgrown-it
 *     "Google has said page speed is a ranking factor, and Core Web
 *     Vitals are baked into 2026 search ranking. Your visitors experience
 *     the slowness as sluggishness. Neither is good for business."
 *
 * Related mentions left alone: accurate "Google uses Core Web Vitals as a
 * ranking signal/factor" lines that do not add a boost, demotion, or
 * guarantee; "Page speed is a ranking factor"; "Core Web Vitals are an
 * active Google ranking signal in 2026"; PageSpeed used as a diagnostic
 * ("here's where to start"); hotel PageSpeed below 70 tied to bookings
 * rather than rankings; "Page speed is measurably affecting conversions
 * or SEO rankings" as a switch-platform criterion; nextjs-seo-guide and
 * hospitality SEO fields that name CWV as a topic; the website-speed CTA
 * "what's costing you rankings and revenue."
 *
 * "Performance fixes that improve search rankings immediately" is not in
 * any post. It lives on the Website Refreshes service benefits array.
 * /llms-full.txt is built from getKnowledgeBlob() in lib/chat/knowledge.ts,
 * which reads Sanity services, FAQs, case studies, author, and site
 * settings, plus local data files. It does not read blog posts. Correcting
 * the source posts does not fix that line.
 *
 * Rewrites keep performance as a conversion factor and as one ranking
 * signal. Lab scores stay diagnostic. Field data stays the ranking input.
 * No sentence explaining the correction.
 *
 * Default: dry run. Pass --execute to write.
 * Aborts without writing if any target string matches zero or more than one
 * place in its post, or if a required scan hit has no matching fix.
 *
 * Run: pnpm correct:cwv-ranking-claims
 *      pnpm correct:cwv-ranking-claims -- --execute
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
    id: 'every-direction-reflected',
    slug: 'why-your-website-needs-to-work-in-every-direction',
    field: 'body',
    label: 'CWV / mobile usability reflected in rankings over time',
    find:
      'A site that performs well on desktop but poorly on tablet or landscape mobile will see that reflected in its search rankings over time.',
    replace:
      'A site that performs well on desktop but poorly on tablet or landscape mobile can show weaker Core Web Vitals field data. That is one ranking signal among many, not a guarantee of where you appear.',
  },
  {
    id: 'faster-slow-rank-lower',
    slug: 'faster-website-makes-you-more-money',
    field: 'body',
    label: 'Slow sites rank lower, stated as a rule',
    find: 'Beyond the direct conversion impact, slow sites rank lower in Google search results.',
    replace:
      'Beyond the direct conversion impact, slow sites can also be weaker on the page-experience signal Google uses in ranking.',
  },
  {
    id: 'faster-demoted',
    slug: 'faster-website-makes-you-more-money',
    field: 'body',
    label: 'Pass CWV gets a boost; fail gets demoted',
    find:
      'Sites that pass all three metrics (LCP, INP, CLS) receive a ranking boost; sites that fail them get demoted, all else being equal.',
    replace:
      'Sites that pass LCP, INP, and CLS are stronger on that signal. Passing does not guarantee a boost, and failing does not guarantee a demotion.',
  },
  {
    id: 'faster-compounds',
    slug: 'faster-website-makes-you-more-money',
    field: 'body',
    label: 'Google ranks a slow site lower',
    find: 'gets fewer visitors in the first place because Google ranks it lower.',
    replace:
      'can get fewer visitors when field data is weak, though Core Web Vitals do not decide the ranking on their own.',
  },
  {
    id: 'faster-restaurants',
    slug: 'faster-website-makes-you-more-money',
    field: 'body',
    label: 'Faster competitors rank higher because of CWV',
    find:
      'It\'s also ranking lower than competitors with faster sites for searches like "restaurants near me" \u2014 because Google\'s Core Web Vitals signal is working against them.',
    replace:
      'It can also sit behind faster competitors for searches like "restaurants near me" when field data is weak. Core Web Vitals alone do not decide those rankings.',
  },
  {
    id: 'faster-ranks-higher',
    slug: 'faster-website-makes-you-more-money',
    field: 'body',
    label: 'Faster version of the same site ranks higher',
    find: 'Google ranks them higher. The marketing spend goes further because the site actually converts.',
    replace:
      'Stronger field data can support visibility, but speed alone does not guarantee a higher ranking. The marketing spend goes further because the site actually converts.',
  },
  {
    id: 'faster-below-70',
    slug: 'faster-website-makes-you-more-money',
    field: 'body',
    label: 'PageSpeed below 70 costing rankings',
    find:
      'If your mobile performance score is below 70, your site is actively costing you customers and rankings.',
    replace:
      'If your mobile performance score is below 70, the lab result is a diagnostic, not a ranking input. Slow pages still cost conversions; Google uses CrUX field data for Core Web Vitals.',
  },
  {
    id: 'hospitality-slow-rank-lower',
    slug: 'las-vegas-hospitality-website-speed',
    field: 'body',
    label: 'Slow sites rank lower, stated as a rule',
    find: 'Beyond the direct conversion impact, slow sites rank lower in Google search results.',
    replace:
      'Beyond the direct conversion impact, slow sites can also be weaker on the page-experience signal Google uses in ranking.',
  },
  {
    id: 'hospitality-rank-below',
    slug: 'las-vegas-hospitality-website-speed',
    field: 'body',
    label: 'Poor scores will rank below faster competitors',
    find:
      'A hospitality website with poor scores will rank below faster competitors for searches like "restaurants in Las Vegas" or "boutique hotels Las Vegas."',
    replace:
      'A hospitality website with poor Core Web Vitals field data is weaker on that signal than faster competitors for searches like "restaurants in Las Vegas" or "boutique hotels Las Vegas." Good scores still do not guarantee those rankings.',
  },
  {
    id: 'hospitality-compounds',
    slug: 'las-vegas-hospitality-website-speed',
    field: 'body',
    label: 'Slow site gets fewer visitors from search',
    find:
      'This compounds the problem: a slow site gets fewer visitors from search and converts a smaller percentage of the visitors it does get.',
    replace:
      'This compounds the problem: a slow site converts a smaller percentage of the visitors it does get, and weak field data can also weigh against you in search without deciding the ranking.',
  },
  {
    id: 'hospitality-improve-rankings',
    slug: 'las-vegas-hospitality-website-speed',
    field: 'body',
    label: 'Better CWV scores improve Google rankings',
    find: 'Better Core Web Vitals scores improve Google rankings, which drive more organic traffic.',
    replace:
      'Better Core Web Vitals field data can support organic visibility, but good scores do not guarantee ranking gains.',
  },
  {
    id: 'hospitality-below-70',
    slug: 'las-vegas-hospitality-website-speed',
    field: 'body',
    label: 'PageSpeed below 70 costing rankings',
    find: 'If your performance score is below 70, your site is actively costing you reservations and rankings.',
    replace:
      'If your performance score is below 70, the lab result is a diagnostic, not a ranking input. Slow pages still cost reservations; Google uses CrUX field data for Core Web Vitals.',
  },
  {
    id: 'hospitality-excerpt',
    slug: 'las-vegas-hospitality-website-speed',
    field: 'excerpt',
    label: 'Slow site costs rankings',
    find: 'it costs you reservations, rankings, and revenue',
    replace: 'it costs you reservations and revenue, and weak field data can weigh against you in search',
  },
  {
    id: 'hotel-rank-higher',
    slug: 'what-should-a-hotel-website-include',
    field: 'body',
    label: 'Hotels with strong CWV scores rank higher',
    find:
      'Hotels with strong scores rank higher for terms like "hotels near [landmark]" or "[city] boutique hotel" \u2014 which are the high-intent searches that drive direct bookings.',
    replace:
      'Hotels with strong Core Web Vitals field data are in a better position on that signal for terms like "hotels near [landmark]" or "[city] boutique hotel," which are the high-intent searches that drive direct bookings. Strong scores still do not guarantee those rankings.',
  },
  {
    id: 'hotel-ranks-lower',
    slug: 'what-should-a-hotel-website-include',
    field: 'body',
    label: 'Slow hotel site ranks lower',
    find: 'A slow hotel website ranks lower AND converts worse.',
    replace:
      'A slow hotel website converts worse, and weak field data can weigh against you in search without deciding the ranking.',
  },
  {
    id: 'las-vegas-directly-affect',
    slug: 'how-las-vegas-businesses-rank-higher-google',
    field: 'body',
    label: 'CWV directly affect rankings',
    find:
      'Make sure your site loads fast \u2014 Core Web Vitals (LCP, INP, CLS) directly affect rankings',
    replace:
      'Make sure your site loads fast. Core Web Vitals (LCP, INP, CLS) are one ranking signal among many, not a decisive factor',
  },
  {
    id: 'speed-excerpt',
    slug: 'website-speed-matters-business',
    field: 'excerpt',
    label: 'Slow site hurting Google rankings',
    find: 'hurting your Google rankings',
    replace: 'can weaken a page-experience signal Google uses in ranking',
  },
  {
    id: 'speed-seo',
    slug: 'website-speed-matters-business',
    field: 'seo.metaDescription',
    label: 'Slow site hurts Google rankings',
    find: 'hurts your Google rankings',
    replace: 'can weaken a page-experience signal Google uses in ranking',
  },
  {
    id: 'speed-loses-rankings',
    slug: 'website-speed-matters-business',
    field: 'body',
    label: 'Slow site loses rankings',
    find:
      "A slow site doesn't just lose visitors \u2014 it loses rankings, which means fewer visitors in the first place.",
    replace:
      'A slow site loses visitors to bounce. Weak field data can also weigh against you in search, but it does not guarantee lost rankings.',
  },
  {
    id: 'speed-fails-loses-ranking',
    slug: 'website-speed-matters-business',
    field: 'body',
    label: 'Failing any CWV loses ranking',
    find: 'A site that fails on any of them loses ranking and conversions simultaneously.',
    replace:
      'A site that fails on any of them can lose conversions and can be weaker on that ranking signal, without a guaranteed ranking drop.',
  },
  {
    id: 'law-firm-ranks-lower',
    slug: 'law-firm-website-design-las-vegas',
    field: 'body',
    label: 'Slow site ranks lower',
    find:
      "A slow site ranks lower and loses clients who won't wait for a page to render \u2014 especially on mobile, which is where most legal searches happen now.",
    replace:
      "A slow site loses clients who won't wait for a page to render, especially on mobile, which is where most legal searches happen now. Weak Core Web Vitals field data can weigh against you in search; it does not decide the ranking.",
  },
  {
    id: 'webflow-decide',
    slug: 'webflow-vs-nextjs',
    field: 'body',
    label: 'CWV decide rankings',
    find: 'Competitive SEO where Core Web Vitals decide rankings',
    replace: 'Competitive SEO where Core Web Vitals are one signal among many',
  },
  {
    id: 'webflow-every-point',
    slug: 'webflow-vs-nextjs',
    field: 'body',
    label: 'SEO requires every Core Web Vital point',
    find: 'SEO competition requires every Core Web Vital point',
    replace: 'SEO competition where Core Web Vitals are one signal among many',
  },
  {
    id: 'custom-directly-affect',
    slug: 'do-i-need-a-custom-website',
    field: 'body',
    label: 'CWV and PageSpeed scores directly affect rankings',
    find:
      'page speed and Core Web Vitals directly affect your rankings in 2026. Template sites typically score 40\u201360 on mobile PageSpeed. Custom sites score 90\u2013100.',
    replace:
      'page speed and Core Web Vitals are ranking signals in 2026, not decisive ones. Template sites typically score 40\u201360 on mobile PageSpeed. Custom sites score 90\u2013100. Those Lighthouse numbers are diagnostics; Google uses CrUX field data when it assesses Core Web Vitals.',
  },
  {
    id: 'custom-page-one',
    slug: 'do-i-need-a-custom-website',
    field: 'body',
    label: 'PageSpeed gap as page-one vs page-two outcome',
    find:
      'That gap can mean the difference between page one and page two of Google results, and page two gets almost no clicks.',
    replace:
      'A lab-score gap does not by itself move you from page two to page one, and page two still gets almost no clicks.',
  },
  {
    id: 'dont-build-lose-rankings',
    slug: 'why-we-dont-build-wordpress-sites',
    field: 'body',
    label: 'Slow sites lose rankings',
    find: 'Slow sites lose both rankings and revenue.',
    replace:
      'Slow sites lose revenue, and weak field data can weigh against you in search without deciding the ranking.',
  },
  {
    id: 'wp-2026-cwv-rankings',
    slug: 'wordpress-vs-nextjs-2026',
    field: 'body',
    label: 'Core Web Vitals rankings as a use case',
    find: 'Sites where AI crawler visibility and Core Web Vitals rankings matter',
    replace: 'Sites where AI crawler visibility and Core Web Vitals matter',
  },
  {
    id: 'wix-good-threshold',
    slug: 'when-wix-makes-sense-and-when-youve-outgrown-it',
    field: 'body',
    label: 'PageSpeed 35–55 tied to Google good threshold',
    find:
      'Typical mobile PageSpeed scores land between 35\u201355 \u2014 well below Google\'s "good" threshold.',
    replace:
      'Typical mobile PageSpeed scores land between 35\u201355, well below a strong lab result. That Lighthouse number is a diagnostic, not a ranking input.',
  },
  {
    id: 'wix-baked-in',
    slug: 'when-wix-makes-sense-and-when-youve-outgrown-it',
    field: 'body',
    label: 'CWV baked into 2026 search ranking',
    find: 'Core Web Vitals are baked into 2026 search ranking.',
    replace: 'Core Web Vitals are one signal among many in 2026 search ranking.',
  },
]

function isRequiredHit(text: string): boolean {
  return (
    /get demoted/i.test(text) ||
    /ranking boost/i.test(text) ||
    /rank below faster/i.test(text) ||
    /rank higher for terms/i.test(text) ||
    /improve Google rankings/i.test(text) ||
    /costing you (?:customers and rankings|reservations and rankings)/i.test(text) ||
    /costs you reservations, rankings/i.test(text) ||
    /decide rankings/i.test(text) ||
    /directly affect(?:s)? (?:your )?rankings/i.test(text) ||
    /reflected in its search rankings/i.test(text) ||
    /it loses rankings/i.test(text) ||
    /slow site ranks lower/i.test(text) ||
    /slow sites rank lower/i.test(text) ||
    /slow hotel website ranks lower/i.test(text) ||
    /lose both rankings/i.test(text) ||
    /Core Web Vitals rankings/i.test(text) ||
    /difference between page one and page two/i.test(text) ||
    /hurting your Google rankings/i.test(text) ||
    /hurts your Google rankings/i.test(text) ||
    /baked into 2026 search ranking/i.test(text) ||
    /well below Google's "good" threshold/i.test(text) ||
    /Google ranks (?:it|them) (?:lower|higher)/i.test(text) ||
    /loses ranking and conversions/i.test(text) ||
    /every Core Web Vital point/i.test(text) ||
    /gets fewer visitors from search/i.test(text)
  )
}

function isRelatedHit(text: string): boolean {
  if (isRequiredHit(text)) return false
  return (
    /core web vitals/i.test(text) && /rank/i.test(text) ||
    /page ?speed/i.test(text) && /rank/i.test(text) ||
    /page speed is a ranking factor/i.test(text)
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
