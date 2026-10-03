/**
 * Apply the content audit change list to Sanity.
 *
 * Default: dry run. Prints every edit it would make. Pass --apply to write.
 *
 * - Documents are located by slug (or _id) and matched on exact old text, never
 *   by array index. An edit applies only if its old text occurs exactly once in
 *   its scope (the whole `body`, or the single named field). Otherwise it is
 *   skipped and reported.
 * - Published documents and any existing `drafts.` copy are both patched.
 * - On --apply, the JSON of every affected document is saved to
 *   backups/sanity-audit-<timestamp>/ before the first write.
 * - Only the fields named below are ever touched.
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient } from '@sanity/client'
import { config as loadEnv } from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
loadEnv({ path: join(ROOT, '.env.local') })

const APPLY = process.argv.includes('--apply')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2025-12-05',
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: 'raw',
})

type Target = { type: 'post' | 'faq' | 'caseStudy' | 'page'; slug?: string; id?: string }

/** `body` edits match inside portable-text span text. Other fields are dotted paths to a string. */
type Edit = { target: Target; field: string; old: string; new: string; batch?: number }

const post = (slug: string): Target => ({ type: 'post', slug })

const body = (slug: string, old: string, next: string): Edit => ({
  target: post(slug),
  field: 'body',
  old,
  new: next,
})
const seo = (slug: string, field: 'metaTitle' | 'metaDescription', old: string, next: string): Edit => ({
  target: post(slug),
  field: `seo.${field}`,
  old,
  new: next,
})

const BATCH_1: Edit[] = [
  // 1. FAQ
  {
    target: { type: 'faq', id: 'faq-10-how-much-does-a' },
    field: 'answer',
    old: 'under $10,000',
    new: 'under $15,000',
  },

  // 2. Tier names
  body('do-i-need-a-custom-website', '$30,000 Scale-tier Vizantir build', '$30,000 Growth-tier Vizantir build'),
  body('do-i-need-a-custom-website', 'Launch ($15,000):', 'Essentials ($15,000):'),
  body('do-i-need-a-custom-website', 'without the scope of a flagship build', 'without the scope of an Enterprise build'),
  body('do-i-need-a-custom-website', 'Scale ($30,000):', 'Growth ($30,000):'),
  body('do-i-need-a-custom-website', 'Flagship ($60,000+):', 'Enterprise ($60,000+):'),

  body('how-much-does-a-website-cost-las-vegas', 'Launch ($15,000):', 'Essentials ($15,000):'),
  body('how-much-does-a-website-cost-las-vegas', 'of the top tier without the scope of a flagship build', 'of the top tier without the scope of an Enterprise build'),
  body('how-much-does-a-website-cost-las-vegas', 'Scale ($30,000):', 'Growth ($30,000):'),
  body('how-much-does-a-website-cost-las-vegas', 'Flagship ($60,000+):', 'Enterprise ($60,000+):'),
  body('how-much-does-a-website-cost-las-vegas', 'what a Launch tier build can deliver', 'what an Essentials build can deliver'),

  body('how-much-does-website-cost-2026', 'Launch ($15,000):', 'Essentials ($15,000):'),
  body('how-much-does-website-cost-2026', 'of the top tier without the scope of a flagship build', 'of the top tier without the scope of an Enterprise build'),
  body('how-much-does-website-cost-2026', 'Scale ($30,000):', 'Growth ($30,000):'),
  body('how-much-does-website-cost-2026', 'Flagship ($60,000+):', 'Enterprise ($60,000+):'),
  body('how-much-does-website-cost-2026', "Vizantir's flagship tier — $60,000 — is the entry point", "Vizantir's Enterprise tier, from $60,000, is the entry point"),

  body('squarespace-vs-custom-website', 'Launch tier build: $15,000', 'Essentials build: $15,000'),
  body('squarespace-vs-custom-website', 'Scale tier build: $30,000', 'Growth build: $30,000'),
  body('squarespace-vs-custom-website', 'Flagship build: $60,000+', 'Enterprise build: $60,000+'),

  // 3. Care prices
  body('squarespace-vs-custom-website', '$150/month = $5,400 over 3 years', '$295/month = $10,620 over 3 years'),
  body('what-is-a-website-care-plan', 'Starts at $150/month (fewer hours', 'Starts at $295/month (fewer hours'),
  body(
    'how-much-does-website-maintenance-cost-2026',
    'for equivalent support levels — typically $100–$300/month for a marketing site',
    'for equivalent support levels. Vizantir care plans start at $295/month for a marketing site',
  ),
  body(
    'true-cost-of-wordpress-website',
    "there's less surface area to patch — budget $100–$300/month depending on scope",
    "there's less surface area to patch. Vizantir care plans start at $295/month.",
  ),

  // 4. WordPress care plan statements
  body(
    'how-much-does-a-website-cost-las-vegas',
    'WordPress care plans start at $300/month; Next.js care plans start at $150/month at Vizantir.',
    'Vizantir care plans start at $295/month.',
  ),
  body(
    'how-much-does-website-maintenance-cost-2026',
    'WordPress care plans start at $300/month and scale based on complexity. Next.js care plans start at $150/month and scale similarly.',
    'Vizantir care plans start at $295/month and scale based on complexity.',
  ),

  // 5. Em-dashes in meta fields
  seo(
    'launch-website-weekend-what-it-costs',
    'metaTitle',
    "Launch a Website in a Weekend — Here's What It Actually Costs",
    'Launch a Website in a Weekend: What It Actually Costs',
  ),
  seo(
    'launch-website-weekend-what-it-costs',
    'metaDescription',
    'Website builders make it easy to go live fast. Here is what that speed actually costs your business — and when it stops being enough.',
    'Website builders make it easy to go live fast. Here is what that speed costs your business, and when it stops being enough.',
  ),
  seo(
    'why-your-website-needs-to-work-in-every-direction',
    'metaDescription',
    'Portrait, landscape, tablet, mobile — your website should work perfectly on every screen and orientation. Here is what to check and why it matters.',
    'Portrait, landscape, tablet, mobile: your website should work on every screen and orientation. Here is what to check and why it matters.',
  ),
  seo(
    'faster-website-makes-you-more-money',
    'metaDescription',
    'How does website speed affect revenue? The research on page load time and conversion rates — and what it means for your business in 2026.',
    'How does website speed affect revenue? The research on page load time and conversion rates, and what it means for your business in 2026.',
  ),
  seo(
    'real-cost-wordpress-security-breach',
    'metaDescription',
    'What does a WordPress security breach actually cost? Emergency fixes, SEO damage, lost revenue — the real financial impact of a hacked WordPress site.',
    'What does a WordPress security breach actually cost? Emergency fixes, SEO damage, and lost revenue: the real financial impact of a hacked site.',
  ),

  // 6. "dont"
  seo(
    'do-you-need-yoast-seo',
    'metaDescription',
    'when they dont, and alternatives',
    "when they don't, and alternatives",
  ),

  // 7. Meta descriptions over 160 characters
  seo(
    'how-much-does-website-cost-2026',
    'metaDescription',
    "A transparent breakdown of what business websites actually cost in 2026, where Vizantir's $15K / $30K / $60K tiers fit in the real market, and what drives the price at every level.",
    "A plain breakdown of what business websites cost in 2026, where Vizantir's $15K, $30K and $60K+ tiers fit, and what drives the price.",
  ),
  seo(
    'what-website-monitoring-actually-catches',
    'metaDescription',
    'Most website failures are silent: broken tracking, stalled data syncs, forms that stop delivering. What ongoing monitoring actually catches and why nobody notices without it.',
    'Most website failures are silent: broken tracking, stalled data syncs, forms that stop delivering. What monitoring catches that nobody notices.',
  ),
  seo(
    'why-your-competitors-website-looks-better',
    'metaDescription',
    "Why does your competitor's website look better? Understanding the difference between template sites and custom development, and what premium web presence actually costs.",
    "Why does a competitor's website look better? The difference between template sites and custom development, and what a premium web presence costs.",
  ),
  seo(
    'billion-dollar-companies-use-nextjs',
    'metaDescription',
    'Discover why enterprise companies like Nike, Netflix, TikTok, and OpenAI chose Next.js for their web platforms, and how the same technology benefits smaller brands.',
    'Why enterprise companies like Nike, Netflix, TikTok, and OpenAI chose Next.js, and how the same technology benefits smaller brands.',
  ),
  seo(
    'the-elementor-renewal-charge-that-wasnt-supposed-to-happen',
    'metaDescription',
    "Elementor Pro auto-renews by default and refunds on renewals aren't offered. A look at the pattern behind years of forum complaints and what it means for your site.",
    "Elementor Pro auto-renews by default and refunds on renewals aren't offered. The pattern behind years of forum complaints and what it means for your site.",
  ),
  seo(
    'your-analytics-can-fail-silently',
    'metaDescription',
    'A data pipeline failed with no error, no crash, and no broken page. The story of a silent analytics failure: how it was caught within hours and fixed the same day.',
    'A data pipeline failed with no error, no crash, and no broken page. How a silent analytics failure was caught within hours and fixed the same day.',
  ),
  seo(
    'website-speed-matters-business',
    'metaDescription',
    'A slow website costs you customers and can weaken a page-experience signal Google uses in ranking. Learn why website speed matters and what to do about it in 2026.',
    'A slow website costs you customers and can weaken a page-experience signal Google uses in ranking. Why speed matters and what to do in 2026.',
  ),
  seo(
    'two-searches-one-key',
    'metaDescription',
    'Two real search queries normalized to the same slug and hit a unique constraint months after shipping. A debugging walkthrough with the actual code, SQL, and fix.',
    'Two real search queries normalized to the same slug and hit a unique constraint months after shipping. A debugging walkthrough with code, SQL, and the fix.',
  ),

  // 8. Agency heading (only this block)
  body('how-to-choose-web-design-agency-las-vegas', 'A good agency:', 'A good studio:'),

  // 9. Meridian Row summary
  {
    target: { type: 'caseStudy', slug: 'meridian-row' },
    field: 'summary',
    old: 'A premium retail and dining development in Las Vegas needed a site that could attract serious tenants. We built something clean and fast that leads with the property and makes it easy for prospects to get in touch.',
    new: 'A concept project: what a premium retail and dining development in Las Vegas could look like with a site built to attract serious tenants. Clean, fast, and led by the property, with an easy way for prospects to get in touch.',
  },

  // 10. Contact page meta description
  {
    target: { type: 'page', id: '0e8bd8a9-f49c-4e35-a6a5-05746bdf94b4' },
    field: 'seo.metaDescription',
    old: 'learn how our Las Vegas studio can elevate your online presence.',
    new: 'learn how our Las Vegas studio can improve your website.',
  },
]

/** Batch 2: Vizantir pricing and tier wording missed by batch 1. */
const BATCH_2: Edit[] = [
  body(
    'what-is-a-website-care-plan',
    "That's why Vizantir's Next.js care retainers start at $150/month — there's simply less ongoing work",
    "That's why Vizantir's Next.js care retainers start at $295/month. There's simply less ongoing work",
  ),
  // The "The Flagship Tier ($50,000+)" heading in this post describes the market and is left alone.
  body(
    'why-your-competitors-website-looks-better',
    "Vizantir's Flagship tier starts at $60K.",
    "Vizantir's Enterprise tier starts at $60,000.",
  ),
  body(
    'why-your-competitors-website-looks-better',
    "at Vizantir's Launch or Scale tiers",
    "at Vizantir's Essentials or Growth tiers",
  ),
  // The $5,400 maintenance line and the totals in this post are intentionally not touched.
  body(
    'wordpress-vs-nextjs-3-year-cost-comparison',
    "(Vizantir's Launch tier)",
    "(Vizantir's Essentials tier)",
  ),
]


/**
 * Batch 3a: three-year cost math. Required costs and the optional care plan are
 * shown separately. Care: $295/month x 36 = $10,620.
 *   WordPress (unchanged, all required): $17,960 / "about $18,000"
 *   Next.js required: $15,000 + $720 = $15,720
 *   Next.js with optional care: $15,720 + $10,620 = $26,340
 */
const BATCH_3_COST: Edit[] = [
  // why-15000-website-cheaper-than-5000
  // Bold label span and text span are patched separately.
  body('why-15000-website-cheaper-than-5000', 'Maintenance:', 'Ongoing care (optional):'),
  body(
    'why-15000-website-cheaper-than-5000',
    "$100–$300/month — lower than comparable WordPress care because there's less surface area to patch. Not zero: dependencies still need updating and framework version upgrades are real work",
    "There are no plugins or database to patch, but dependencies still need updating and framework version upgrades are real work. Vizantir's Essential Care plan is $295/month ($10,620 over three years) and is not required to keep the site running",
  ),
  body(
    'why-15000-website-cheaper-than-5000',
    'Over three years, the total ownership cost is approximately $15K + $720 hosting + $5,400 maintenance = about $21,000.',
    'Over three years, the required cost is approximately $15K build + $720 hosting = about $15,720. Optional care is a separate line: Essential Care at $295/month adds $10,620, for about $26,340 with care ($15,720 + $10,620).',
  ),
  body(
    'why-15000-website-cheaper-than-5000',
    'Over three years, the $5,000 WordPress site and the $15,000 Next.js site end up in roughly the same cost neighborhood — often within a few thousand dollars of each other.',
    "Over three years, the required costs land close together: about $18,000 for the $5,000 WordPress site and about $15,720 for the $15,000 Next.js site. Add Vizantir's optional Essential Care plan and the Next.js total is about $26,340, roughly $8,300 more than WordPress.",
  ),
  body(
    'why-15000-website-cheaper-than-5000',
    'So if the total spend is comparable, why is the $15K build',
    'So if the required spend is comparable, why is the $15K build',
  ),

  // wordpress-vs-nextjs-3-year-cost-comparison
  {
    target: post('wordpress-vs-nextjs-3-year-cost-comparison'),
    field: 'excerpt',
    old: 'WordPress looks cheaper upfront, and it stays cheaper over three years. A Next.js build runs about $3,000 more. Here is what that premium buys.',
    new: 'WordPress looks cheaper upfront. Over three years the required costs come out close: about $17,960 for WordPress and $15,720 for Next.js, or $26,340 with optional care.',
  },
  seo(
    'wordpress-vs-nextjs-3-year-cost-comparison',
    'metaDescription',
    'WordPress vs Next.js 3-year total cost of ownership. WordPress costs less. Next.js runs about $3,000 more. What that premium buys.',
    'WordPress vs Next.js 3-year cost of ownership. Required costs run about $17,960 vs $15,720, or $26,340 with optional Next.js care.',
  ),
  body(
    'wordpress-vs-nextjs-3-year-cost-comparison',
    "Maintenance: $5,400 ($150/month — lower than comparable WordPress care because there's less surface area to patch, but not zero. Dependencies still need updating)",
    "Ongoing care (optional): $10,620 ($295/month for Vizantir's Essential Care plan, not required to keep the site running). There are no plugins or database to patch, but dependencies still need updating",
  ),
  body(
    'wordpress-vs-nextjs-3-year-cost-comparison',
    'Estimated 3-year total: approximately $21,120.',
    'Estimated 3-year total: approximately $15,720 required ($15,000 build + $720 hosting), or approximately $26,340 with the optional care plan ($15,720 + $10,620).',
  ),
  // Follows the bold "$15K Next.js build" span, so the old text starts mid-sentence.
  body(
    'wordpress-vs-nextjs-3-year-cost-comparison',
    "costs roughly $3,000 more over three years than the $5K WordPress build. Not less. Let's talk about what the extra cost buys and when that trade is worth it.",
    "comes to about $15,720 on required costs alone, against about $17,960 for the $5K WordPress build, about $2,200 less. WordPress includes the maintenance a site needs to stay patched, while Next.js care is optional. Adding it brings the three-year total to about $26,340, roughly $8,400 more than WordPress. Here is what the extra cost buys and when that trade is worth it.",
  ),
  body(
    'wordpress-vs-nextjs-3-year-cost-comparison',
    'WordPress is cheaper on day one. The Next.js build costs about $3,000 more over three years. That premium buys control of the frontend, performance as the site grows, and custom functionality the business actually needs.',
    "WordPress is cheaper on day one. Over three years the required costs come out close: about $17,960 for WordPress and about $15,720 for Next.js, or about $26,340 with Vizantir's optional care plan. The Next.js build buys control of the frontend, performance as the site grows, and custom functionality the business actually needs.",
  ),
  body(
    'wordpress-vs-nextjs-3-year-cost-comparison',
    'are worth the higher three-year bill.',
    'are worth the difference in cost.',
  ),
]

/** Batch 3b: meta titles. Whole new title <= 49 characters so title + " | Vizantir" <= 60. */
const UNSET = ''
const mt = (slug: string, old: string, next: string) => seo(slug, 'metaTitle', old, next)
const BATCH_3_TITLES: Edit[] = [
  mt('launch-website-weekend-what-it-costs', 'Launch a Website in a Weekend: What It Actually Costs', 'Launch a Website in a Weekend: What It Costs'),
  mt('your-analytics-can-fail-silently', 'Your Analytics Can Fail Silently. We Caught One in Hours', 'Your Analytics Can Fail Silently'),
  mt('two-searches-one-key', 'Two Searches, One Key: How Messy Search Data Breaks Clean Code', 'Two Searches, One Key: Messy Data Breaks Code'),
  mt('commercial-real-estate-website-design', UNSET, 'Commercial Real Estate Website Design Mistakes'),
  mt('do-i-need-a-custom-website', UNSET, 'Do I Need a Custom Website? An Honest Answer'),
  mt('do-you-need-yoast-seo', UNSET, 'Do You Still Need Yoast in 2026?'),
  mt('hidden-wordpress-costs-agencies-dont-tell-you', 'The WordPress Quote Looks Reasonable. Then the Bills Start.', 'WordPress Quotes Look Fine. Then the Bills Start'),
  mt('hospitality-website-design-las-vegas', UNSET, 'Why Las Vegas Restaurant Websites Lose Guests'),
  mt('how-las-vegas-businesses-rank-higher-google', UNSET, 'How Las Vegas Businesses Rank Higher on Google'),
  mt('how-much-does-a-website-cost-las-vegas', UNSET, 'How Much Does a Website Cost in Las Vegas?'),
  mt('how-much-does-website-maintenance-cost-2026', UNSET, 'How Much Does Website Maintenance Cost in 2026?'),
  mt('how-to-get-more-bookings-restaurant-website', UNSET, 'Get More Bookings From Your Restaurant Website'),
  mt('how-to-speed-up-wordpress', UNSET, 'How to Speed Up Your WordPress Site'),
  mt('is-wordpress-secure', UNSET, 'Is WordPress Secure? What Owners Should Know'),
  mt('las-vegas-hospitality-website-speed', UNSET, 'Faster Websites for Las Vegas Hospitality Brands'),
  mt('luxury-salon-spa-website-design', UNSET, 'What a Luxury Salon or Spa Website Needs'),
  mt('nextjs-seo-guide', UNSET, 'Next.js SEO: The Guide for Business Websites'),
  mt('nextjs-vs-react-business-website', UNSET, 'Next.js vs React for Business Websites'),
  mt('squarespace-vs-custom-website', UNSET, 'Squarespace vs Custom Website: Which Fits?'),
  mt('the-elementor-renewal-charge-that-wasnt-supposed-to-happen', "The Elementor Pro Renewal Charge That Wasn't Supposed to Happen", "Elementor Pro's Unexpected Renewal Charge"),
  mt('the-page-builder-stack-your-wordpress-agency-didnt-explain', 'The Page Builder Stack That Turns Leaving Into a Rebuild', 'Page Builder Stacks Turn Leaving Into a Rebuild'),
  mt('vercel-vs-wp-engine', UNSET, 'Vercel vs WP Engine: Which Hosting Is Better?'),
  mt('website-builders-vs-custom-development', UNSET, 'Website Builders vs Custom Development'),
  mt('website-speed-matters-business', UNSET, 'Why Website Speed Is Costing You Customers'),
  mt('what-a-vizantir-engagement-discloses-that-a-wordpress-agency-engagement-usually-doesnt', 'What a Vizantir Engagement Puts on the Table Up Front', 'What a Vizantir Engagement Discloses Up Front'),
  mt('what-is-a-website-care-plan', UNSET, 'What Is a Website Care Plan? Do You Need One?'),
  mt('what-should-a-hotel-website-include', UNSET, 'What a Hotel Website Needs for Direct Bookings'),
  mt('what-youre-paying-for-30k-website', UNSET, "What You're Paying For With a $30k Website"),
  mt('when-wix-makes-sense-and-when-youve-outgrown-it', UNSET, "When Wix Makes Sense and When You've Outgrown It"),
  mt('why-15000-website-cheaper-than-5000', UNSET, '$15,000 vs $5,000 Website: The 3-Year Math'),
  mt('why-most-agencies-still-use-wordpress', 'Why WordPress Is Still the Default (And Why We Build on Next.js)', "Why Agencies Default to WordPress. We Don't."),
  mt('why-wordpress-site-slow', UNSET, 'Why Is My WordPress Site So Slow?'),
  mt('why-your-competitors-website-looks-better', UNSET, "Why Your Competitor's Website Looks Better"),
  mt('wordpress-vs-nextjs-3-year-cost-comparison', UNSET, 'WordPress vs Next.js: The True 3-Year Cost'),
]

/** Batch 4: WP Engine Essential regular price (about $35/month) and one meta description. */
const BATCH_4: Edit[] = [
  body(
    'how-to-speed-up-wordpress',
    'starts at $24/month Essential plan',
    'Essential plan starts at about $35/month at the regular rate',
  ),
  body('vercel-vs-wp-engine', 'Essential: $24/month', 'Essential: about $35/month at the regular rate'),
  seo(
    'why-15000-website-cheaper-than-5000',
    'metaDescription',
    'Why a $15,000 custom website is often cheaper than a $5,000 WordPress build. The ROI argument that changes how business owners think about website investment.',
    'Required three-year costs for a $15,000 Next.js site and a $5,000 WordPress site are close, and a care plan is optional. Here is the math.',
  ),
]

const EDITS: Edit[] = [
  ...BATCH_1.map((e) => ({ ...e, batch: 1 })),
  ...BATCH_2.map((e) => ({ ...e, batch: 2 })),
  ...BATCH_3_COST.map((e) => ({ ...e, batch: 3 })),
  ...BATCH_3_TITLES.map((e) => ({ ...e, batch: 3 })),
  ...BATCH_4.map((e) => ({ ...e, batch: 4 })),
]

// ---------------------------------------------------------------------------

type Span = { _key: string; _type?: string; text?: string }
type Block = { _key: string; _type: string; children?: Span[] }
type Doc = { _id: string; _type: string; _rev: string; [k: string]: unknown }

type Planned = {
  edit: Edit
  docId: string
  /** Sanity patch path to the string that changes. */
  path: string
  before: string
  after: string
}
type Skipped = { edit: Edit; docId: string; reason: string }
type Done = { edit: Edit; docId: string; already: true }

function targetLabel(t: Target): string {
  return t.slug ?? t.id ?? '?'
}

function count(haystack: string, needle: string): number {
  if (!needle) return 0
  let n = 0
  let i = haystack.indexOf(needle)
  while (i !== -1) {
    n++
    i = haystack.indexOf(needle, i + needle.length)
  }
  return n
}

function getPath(doc: Doc, dotted: string): unknown {
  return dotted.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], doc)
}

/** Resolve one edit against one document (working copy), mutating the copy so later edits stack. */
function resolve(doc: Doc, edit: Edit, work: Map<string, string>): Planned | Skipped | Done {
  const docId = doc._id

  if (edit.field === 'body') {
    const blocks = ((doc.body as Block[] | undefined) ?? []).filter((b) => b._type === 'block' && b.children)
    let spanHits = 0
    let blockHits = 0
    let hit: { block: Block; span: Span; path: string } | null = null
    for (const b of blocks) {
      const spans = b.children!
      const current = (s: Span) => work.get(`${docId}|${b._key}|${s._key}`) ?? s.text ?? ''
      blockHits += count(spans.map(current).join(''), edit.old)
      for (const s of spans) {
        const c = count(current(s), edit.old)
        if (c) {
          spanHits += c
          hit = { block: b, span: s, path: `body[_key=="${b._key}"].children[_key=="${s._key}"].text` }
        }
      }
    }
    if (blockHits === 0) {
      const newHits = blocks.reduce(
        (n, b) => n + count(b.children!.map((s) => work.get(`${docId}|${b._key}|${s._key}`) ?? s.text ?? '').join(''), edit.new),
        0,
      )
      if (newHits >= 1) return { edit, docId, already: true }
    }
    if (blockHits !== 1) return { edit, docId, reason: `old text found ${blockHits} times in body (need exactly 1)` }
    if (spanHits !== 1 || !hit) return { edit, docId, reason: 'old text spans multiple formatted spans; cannot patch safely' }
    const k = `${docId}|${hit.block._key}|${hit.span._key}`
    const before = work.get(k) ?? hit.span.text ?? ''
    const after = before.replace(edit.old, () => edit.new)
    work.set(k, after)
    return { edit, docId, path: hit.path, before, after }
  }

  const value = getPath(doc, edit.field)
  const k = `${docId}|${edit.field}`
  if (edit.old === '') {
    // Field is expected to be unset (page falls back to the title). Create it.
    const cur = work.get(k) ?? value
    if (cur === edit.new) return { edit, docId, already: true }
    if (cur !== undefined) return { edit, docId, reason: `expected ${edit.field} to be unset but it holds ${show(String(cur))}` }
    work.set(k, edit.new)
    return { edit, docId, path: edit.field, before: '(unset)', after: edit.new }
  }
  if (typeof value !== 'string') return { edit, docId, reason: `field ${edit.field} is not a string` }
  const current = work.get(k) ?? value
  const c = count(current, edit.old)
  if (c === 0 && count(current, edit.new) >= 1) return { edit, docId, already: true }
  if (c !== 1) return { edit, docId, reason: `old text found ${c} times in ${edit.field} (need exactly 1)` }
  const after = current.replace(edit.old, () => edit.new)
  work.set(k, after)
  return { edit, docId, path: edit.field, before: current, after }
}

function show(s: string): string {
  return JSON.stringify(s)
}

async function main() {
  console.log(APPLY ? 'MODE: APPLY (writes enabled)\n' : 'MODE: DRY RUN (no writes)\n')

  // Group edits by target.
  const groups = new Map<string, { target: Target; edits: Edit[] }>()
  for (const e of EDITS) {
    const key = `${e.target.type}:${targetLabel(e.target)}`
    if (!groups.has(key)) groups.set(key, { target: e.target, edits: [] })
    groups.get(key)!.edits.push(e)
  }

  const planned: Planned[] = []
  const skipped: Skipped[] = []
  const done: Done[] = []
  const affected = new Map<string, Doc>()
  const work = new Map<string, string>()

  for (const { target, edits } of groups.values()) {
    const docs = target.slug
      ? await client.fetch<Doc[]>(`*[_type == $type && slug.current == $slug]`, { type: target.type, slug: target.slug })
      : await client.fetch<Doc[]>(`*[_type == $type && _id in [$id, "drafts." + $id]]`, { type: target.type, id: target.id })

    if (docs.length === 0) {
      for (const edit of edits) skipped.push({ edit, docId: targetLabel(target), reason: 'document not found' })
      continue
    }

    for (const doc of docs) {
      let touched = false
      for (const edit of edits) {
        const r = resolve(doc, edit, work)
        if ('reason' in r) skipped.push(r)
        else if ('already' in r) done.push(r)
        else {
          planned.push(r)
          touched = true
        }
      }
      if (touched) affected.set(doc._id, doc)
    }
  }

  for (const p of planned) {
    console.log(`BATCH ${p.edit.batch}`)
    console.log(`DOC   ${p.docId}   (${targetLabel(p.edit.target)})`)
    console.log(`FIELD ${p.edit.field}`)
    console.log(`OLD   ${p.edit.old === '' ? '(unset: falls back to post title)' : show(p.edit.old)}`)
    console.log(`NEW   ${show(p.edit.new)}${p.edit.field === 'seo.metaTitle' ? `  [${p.edit.new.length} chars, ${p.edit.new.length + 11} with suffix]` : ''}${/—/.test(p.edit.new) ? '  [WARNING: em-dash in new text]' : ''}`)
    console.log('')
  }

  if (done.length) {
    console.log('--- ALREADY APPLIED (new text present, nothing to do) ---')
    for (const d of done) {
      console.log(`batch ${d.edit.batch} | ${d.docId} | ${d.edit.field} | ${show(d.edit.new.slice(0, 80))}`)
    }
    console.log('')
  }

  if (skipped.length) {
    console.log('--- SKIPPED ---')
    for (const s of skipped) {
      console.log(`${s.docId} | ${s.edit.field} | ${show(s.edit.old.slice(0, 80))}\n   reason: ${s.reason}`)
    }
    console.log('')
  }

  console.log(`Edits already applied: ${done.length}`)
  console.log(`Edits planned: ${planned.length}`)
  console.log(`Edits skipped: ${skipped.length}`)
  console.log(`Documents affected: ${affected.size} (${[...affected.keys()].join(', ')})`)

  // Title-length check: effective title (after planned edits) + " | Vizantir" must be <= 60.
  const posts = await client.fetch<Doc[]>(`*[_type == "post" && !(_id in path("drafts.**"))]`)
  const over = posts
    .map((d) => {
      const seoObj = d.seo as { metaTitle?: string; noIndex?: boolean } | undefined
      const eff = work.get(`${d._id}|seo.metaTitle`) ?? seoObj?.metaTitle ?? (d.title as string)
      return { slug: (d.slug as { current: string }).current, eff, len: eff.length + 11, noIndex: !!seoObj?.noIndex }
    })
    .filter((x) => x.len > 60)
  console.log(`\nPosts still over 60 characters with suffix after batch 3: ${over.length}`)
  for (const x of over) console.log(`  ${x.len} | ${x.slug} | ${x.eff}${x.noIndex ? '  (noIndex)' : ''}`)

  if (!APPLY) {
    console.log('\nDry run only. Re-run with --apply to write.')
    return
  }

  if (!process.env.SANITY_API_WRITE_TOKEN) throw new Error('SANITY_API_WRITE_TOKEN is not set')

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const dir = join(ROOT, 'backups', `sanity-audit-${stamp}`)
  mkdirSync(dir, { recursive: true })
  for (const doc of affected.values()) {
    writeFileSync(join(dir, `${doc._id.replace(/[^\w.-]/g, '_')}.json`), JSON.stringify(doc, null, 2))
  }
  console.log(`\nBackups written to ${dir}`)

  for (const doc of affected.values()) {
    const sets: Record<string, string> = {}
    for (const p of planned.filter((x) => x.docId === doc._id)) sets[p.path] = p.after
    await client.transaction().patch(doc._id, (patch) => patch.ifRevisionId(doc._rev).set(sets)).commit()
    console.log(`Patched ${doc._id} (${Object.keys(sets).length} field(s))`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
