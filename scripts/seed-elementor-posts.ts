/**
 * Generate (and optionally import) draft Elementor / page-builder comparison posts.
 *
 * Default: write data/seed/elementor-posts.ndjson only (no Sanity writes).
 * Import:  npm run seed:elementor-posts -- --import
 *          Imports to the development dataset by default.
 *          To import when NEXT_PUBLIC_SANITY_DATASET is production:
 *            npm run seed:elementor-posts -- --import --allow-production
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'

import { createClient, type SanityClient } from '@sanity/client'
import { config as loadEnv } from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')
const OUT_DIR = join(ROOT, 'data', 'seed')
const OUT_FILE = join(OUT_DIR, 'elementor-posts.ndjson')

const API_VERSION = '2025-12-05'
const DEVELOPMENT_DATASET = 'development'

type Span = {
  _type: 'span'
  _key: string
  text: string
  marks: string[]
}

type Block = {
  _type: 'block'
  _key: string
  style: 'normal' | 'h2'
  markDefs: []
  children: Span[]
  listItem?: 'bullet'
  level?: number
}

type PostDoc = {
  _id: string
  _type: 'post'
  title: string
  slug: { _type: 'slug'; current: string }
  publishedAt: null
  excerpt: string
  category: string
  tags: string[]
  readTime: string
  body: Block[]
  seo: {
    metaTitle: string
    metaDescription: string
    noIndex: boolean
  }
}

function key(): string {
  return randomBytes(6).toString('hex')
}

/**
 * Collapse soft line wraps / runs of whitespace inside a paragraph.
 * Markdown-style wraps must become a single space, never `''`.
 */
function normalizeParagraph(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/** Split markdown-ish inline **bold** into Portable Text spans. */
function spansFromText(text: string): Span[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter((p) => p.length > 0)
  return parts.map((part) => {
    const bold = part.startsWith('**') && part.endsWith('**')
    return {
      _type: 'span' as const,
      _key: key(),
      text: bold ? part.slice(2, -2) : part,
      marks: bold ? ['strong'] : [],
    }
  })
}

function block(style: 'normal' | 'h2', text: string, listItem?: 'bullet'): Block {
  const base: Block = {
    _type: 'block',
    _key: key(),
    style,
    markDefs: [],
    children: spansFromText(normalizeParagraph(text)),
  }
  if (listItem) {
    base.listItem = listItem
    base.level = 1
  }
  return base
}

function normal(text: string): Block {
  return block('normal', text)
}

function h2(text: string): Block {
  return block('h2', text)
}

function bullet(text: string): Block {
  return block('normal', text, 'bullet')
}

function draftId(slug: string): string {
  return `drafts.post-${slug}`
}

const POSTS: PostDoc[] = [
  {
    _id: draftId('the-elementor-renewal-charge-that-wasnt-supposed-to-happen'),
    _type: 'post',
    title: "The Elementor Renewal Charge That Wasn't Supposed to Happen",
    slug: {
      _type: 'slug',
      current: 'the-elementor-renewal-charge-that-wasnt-supposed-to-happen',
    },
    publishedAt: null,
    excerpt:
      "Elementor Pro auto-renews by default. Refunds on renewals are not offered. The forums have years of the same complaint. Here's what actually happens when a renewal charge you didn't want shows up on your card.",
    category: 'Business',
    tags: ['elementor', 'wordpress', 'subscriptions', 'billing'],
    readTime: '6 min read',
    seo: {
      metaTitle: "The Elementor Pro Renewal Charge That Wasn't Supposed to Happen",
      metaDescription:
        "Elementor Pro auto-renews by default and refunds on renewals aren't offered. A look at the pattern behind years of forum complaints and what it means for your site.",
      noIndex: false,
    },
    body: [
      normal(
        'Search "Elementor" on the WordPress support forums and sort by reviews. You\'ll find years of the same story. A user gets charged for a renewal they thought they\'d cancelled. They try to get a refund. They hit a wall.'
      ),
      normal(
        'One thread from November 2023 opens with the line "similar to many other complaints." A reply from a month later, in all caps for effect: "I DID TURN OFF THIS AUTOMATIC RENEW SINCE MY FIRST PURCHASE." Another reviewer, four years into using the product: "Only purchase if you never want to cancel."'
      ),
      normal(
        "This isn't a critique of the software. Elementor works as a page builder. It's a critique of the billing pattern attached to it, and the fact that most small business owners never had this conversation before their site was built on it."
      ),
      h2('How the renewal is designed'),
      normal(
        "Elementor's official policy: 30-day refund on new subscriptions, no refunds on renewals or upgrades. Auto-renewal is on by default. To turn it off, you have to log into your Elementor account, find the subscription, and disable it manually. A pre-billing email is supposed to go out 30 days before charge. Reviewers say it often doesn't arrive, or lands in an inbox they no longer check."
      ),
      normal(
        'If the credit card on file expired, that\'s not always a save. Multiple users report being charged on cards they thought were dead.'
      ),
      normal(
        "If you dispute the charge, the response you'll get is that credit card processing goes through a third-party provider and refund decisions are out of Elementor's hands."
      ),
      h2('What "your site stays up" actually means'),
      normal(
        'When you ask what happens if you don\'t renew, the standard answer is "your site keeps working." That\'s technically true and practically misleading.'
      ),
      normal("Here's the state you're in after the license lapses:"),
      bullet('Existing pages render. Content stays put. Visitors see the same site.'),
      bullet('You lose access to Pro templates, Pro widget updates, and support.'),
      bullet('The free Elementor plugin keeps updating. The Pro plugin stops updating.'),
      bullet(
        "Elementor's own docs warn that updating the free version without the Pro version can lead to compatibility problems over time."
      ),
      normal(
        "So yes, the site works today. What's actually happening is you're carrying a frozen premium plugin on a WordPress core that's still moving forward. Six months later, PHP gets bumped by your host, or WordPress core updates a security API, and your unpatched Pro plugin starts throwing conflicts. Or worse, a public CVE drops for Elementor Pro and there's no update to install because your license is inactive."
      ),
      normal(
        "That's not a broken site the day the license expires. That's a broken site nine months later, at 2am, on a Saturday, when nobody is answering the phone."
      ),
      h2('How Vizantir handles this differently'),
      normal(
        "When Vizantir builds a site on Next.js, there's no license validation call to a third-party server, no page builder subscription to keep active, no renewal date on the calendar. The code is yours. The CMS is a real one, and content is stored as structured data you can export and move whenever you want. Updates are things your developer runs when a dependency ships a patch, not an annual reason to worry about invoices."
      ),
      normal(
        "If you're on Elementor Pro right now and this post has you looking at the renewal date, Vizantir can walk you through what a migration would actually look like. Sometimes the site is fine and just needs to stay on auto-renewal for another year. Sometimes it's time to stop paying rent on your own homepage."
      ),
    ],
  },
  {
    _id: draftId('the-page-builder-stack-your-wordpress-agency-didnt-explain'),
    _type: 'post',
    title: "The Page Builder Stack Your WordPress Agency Didn't Explain",
    slug: {
      _type: 'slug',
      current: 'the-page-builder-stack-your-wordpress-agency-didnt-explain',
    },
    publishedAt: null,
    excerpt:
      "Agencies usually quote the build and maybe the hosting. What they rarely walk through is the multi-vendor plugin stack, the annual renewals, and the lock-in that makes leaving a rebuild.",
    category: 'Cost',
    tags: ['wordpress', 'page-builder', 'elementor', 'lock-in', 'agency'],
    readTime: '7 min read',
    seo: {
      metaTitle: "The Page Builder Stack Your WordPress Agency Didn't Explain",
      metaDescription:
        'Typical WordPress agency builds run six or seven paid plugins a year. The layouts lock you in. A clear look at the stack, the renewals, and what ownership looks like on Next.js.',
      noIndex: false,
    },
    body: [
      normal(
        "Somewhere in the pitch for your WordPress site, an agency told you the build cost. Maybe they told you the hosting cost. What they usually didn't walk through is the software stack sitting underneath the site, the annual renewals attached to that stack, and what happens the day you decide to leave."
      ),
      normal(
        "That stack is where most of the surprise costs live. It's also where the lock-in lives."
      ),
      h2("What's actually running under a typical WordPress build"),
      normal(
        'Most agency-built WordPress sites in 2026 are running some version of this:'
      ),
      bullet(
        'A page builder (Elementor Pro, Divi, Bricks, or WPBakery)'
      ),
      bullet(
        'A premium theme (Astra Pro, GeneratePress Premium, Divi theme, or Hello Theme with add-ons)'
      ),
      bullet(
        'A page builder add-on library (Essential Addons, Ultimate Addons, Divi Supreme)'
      ),
      bullet('A form plugin (WPForms Pro or Gravity Forms)'),
      bullet('An SEO plugin (Rank Math Pro or Yoast Premium)'),
      bullet('A caching plugin (WP Rocket or similar)'),
      bullet('A backup plugin (UpdraftPlus Premium or similar)'),
      normal(
        'Every one of these is a separate vendor. Every one has its own annual renewal. Every one auto-renews by default. Every one becomes a compatibility risk the moment it stops updating.'
      ),
      normal(
        'Rough annual cost for that stack: $400 to $800 a year, before hosting or maintenance. Distributed across six or seven vendors, staggered across the calendar, none of them talking to each other.'
      ),
      h2('The lock-in that lives inside the page builder'),
      normal(
        "Every page built with Elementor Pro widgets is tied to the Elementor Pro plugin. Same for Divi. Same for Bricks. Same for WPBakery. The content is in the WordPress database. The layouts aren't."
      ),
      normal(
        "Deactivate the page builder and those pages stop rendering their advanced designs. You can move the text somewhere else. You can't move the layout."
      ),
      normal(
        'That means "moving off Elementor" or "moving off Divi" is not an export. It\'s a rebuild.'
      ),
      h2('Why this matters more the longer the site exists'),
      normal(
        'Month one: three pages, one landing page. Migrating them elsewhere is a Saturday project.'
      ),
      normal(
        "Year two: 40 pages, a custom header built with the page builder's theme editor, a footer tied to the plugin, three landing pages linked to running ads, a blog template with dynamic tags. Every one of those is a builder-specific build."
      ),
      normal(
        "By year three, most business owners don't leave. Not because the page builder got better. Because the exit cost got higher. That outcome is built into the tooling."
      ),
      h2('What a Vizantir Next.js site does differently'),
      normal(
        'A Vizantir Next.js site has no page builder plugin. No premium theme. No add-on library. No six-vendor renewal calendar.'
      ),
      normal(
        "Content sits in a headless CMS you can export in a single command. Layouts sit in code you own, in a Git repository any developer can pick up. There's no license validation call to a third-party server, and no annual invoice that has to clear for the design to keep rendering."
      ),
      normal(
        "The build cost is higher up front. That's the trade. What you pay for is a site that doesn't require six annual subscriptions to keep looking the way it looked the day it launched, and doesn't require a rebuild to move off in year five."
      ),
      normal(
        "If you're running a WordPress site built by an agency and the renewal stack has quietly grown every year, Vizantir can build the actual number against your current subscriptions. Sometimes the math says stay. Sometimes it doesn't."
      ),
    ],
  },
  {
    _id: draftId(
      'what-a-vizantir-engagement-discloses-that-a-wordpress-agency-engagement-usually-doesnt'
    ),
    _type: 'post',
    title:
      "What a Vizantir Engagement Discloses That a WordPress Agency Engagement Usually Doesn't",
    slug: {
      _type: 'slug',
      current:
        'what-a-vizantir-engagement-discloses-that-a-wordpress-agency-engagement-usually-doesnt',
    },
    publishedAt: null,
    excerpt:
      'Most website conversations quote a build cost and stop. A year later, renewal invoices show up from vendors the client never signed with. Here\'s what Vizantir puts on the table up front.',
    category: 'Philosophy',
    tags: ['vizantir', 'wordpress', 'agency', 'transparency', 'nextjs'],
    readTime: '6 min read',
    seo: {
      metaTitle:
        "What a Vizantir Engagement Discloses That a WordPress Agency Usually Doesn't",
      metaDescription:
        'Two definitions of a website: rent from a vendor stack, or buy a product you own. What Vizantir discloses before the invoice, and what WordPress agency pitches usually leave out.',
      noIndex: false,
    },
    body: [
      normal(
        'Most website conversations happen in the wrong order. The client asks how much. The agency answers with a build cost. The site gets built. A year later, the invoices start showing up from vendors the client never signed a contract with directly.'
      ),
      normal(
        'Nobody had the second conversation on purpose. It just happens.'
      ),
      normal(
        "Here's what a Vizantir engagement puts on the table up front, and what a typical WordPress agency engagement doesn't."
      ),
      h2('What a Vizantir engagement discloses'),
      bullet('Build cost, one time, itemized'),
      bullet('Hosting cost per month (Vercel or Cloudflare, usually $0 to $20)'),
      bullet('CMS cost per month (Sanity, usually $0 to $15)'),
      bullet('Domain renewal per year (around $15)'),
      bullet('Optional maintenance retainer (only if the client wants one)'),
      normal(
        'Everything on that list is disclosed before the project starts. Nothing on that list auto-renews on a third-party card without a clear notice. Nothing on that list creates a dependency between the site rendering and someone else\'s license being active.'
      ),
      normal(
        "If a client wants to cancel the maintenance retainer, the site keeps working. If a client wants to leave Vizantir entirely, the code and content go with them. That's not a favor. That's what the deal was from day one."
      ),
      h2("What a WordPress agency engagement usually doesn't"),
      normal(
        "Most WordPress builds ship with a stack of premium software the agency picked. The client rarely sees a line item for any of it. The client also rarely finds out how it's licensed until a renewal charge shows up on a card they don't remember giving out."
      ),
      normal('Common items missing from the up-front conversation:'),
      bullet(
        'The page builder (Elementor Pro, Divi, Bricks, WPBakery) auto-renews annually on the account the agency set up during the build.'
      ),
      bullet(
        'The premium theme has its own annual renewal on its own account.'
      ),
      bullet('The page builder add-on library has its own annual renewal.'),
      bullet(
        'The form plugin, the caching plugin, the backup plugin, and the SEO plugin each have their own annual renewals.'
      ),
      bullet(
        'If the page builder license lapses, the pages built with its widgets stop getting updates. Over time, they stop being compatible with WordPress core and become a security risk.'
      ),
      bullet(
        "If the client decides to leave, the layouts built with the page builder don't export. Only the text does. Everything else is a rebuild."
      ),
      bullet(
        'If a renewal charge is disputed, the refund policies on most of these products say no refunds on renewals. Support will point the client at the payment processor.'
      ),
      normal(
        "None of that is hidden. It's all in the terms of service, the refund policies, and the plugin documentation. It's just not usually in the conversation when the site is being sold."
      ),
      h2('Two different definitions of a website'),
      normal(
        'The typical WordPress build treats a website as an ongoing service the client rents from a stack of vendors the agency chose. Every year the site stays online, the client is paying for the right to keep the design rendering. Miss a renewal on the wrong plugin and things start degrading.'
      ),
      normal(
        "A Vizantir build treats a website as a product the client buys. The client pays to have it built. The client pays a small amount to keep it hosted. The client doesn't pay to keep the design rendering, because the design isn't gated behind a license somebody else controls."
      ),
      normal(
        'Both are legitimate business models. Only one of them is usually explained to the client before the invoice is signed.'
      ),
      h2('The conversation Vizantir wants to have'),
      normal(
        "If you're currently on a WordPress site built by an agency, and you're not sure how many vendors your site depends on, Vizantir will build the actual list against your current setup. What you're paying now, what a custom build would cost, what the three-year and five-year numbers look like side by side."
      ),
      normal(
        "Sometimes the honest answer is that the current site is fine and switching doesn't make sense yet. Sometimes it's that the renewal stack has quietly outgrown the value it delivers. Either way, the conversation happens before the invoice, not after."
      ),
    ],
  },
]

function writeNdjson(posts: PostDoc[]): void {
  mkdirSync(OUT_DIR, { recursive: true })
  const lines = posts.map((p) => JSON.stringify(p))
  writeFileSync(OUT_FILE, `${lines.join('\n')}\n`, 'utf8')
  console.log(`Wrote ${posts.length} documents to ${OUT_FILE}`)
}

function requireEnv(name: string, value: string | undefined): string {
  if (!value || !String(value).trim()) {
    console.error(`Missing required environment variable: ${name}`)
    process.exit(1)
  }
  return value.trim()
}

function createWriteClient(dataset: string): SanityClient {
  loadEnv({ path: join(ROOT, '.env.local') })

  const projectId = requireEnv(
    'NEXT_PUBLIC_SANITY_PROJECT_ID',
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  )
  const token = requireEnv(
    'SANITY_API_WRITE_TOKEN',
    process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_TOKEN
  )

  return createClient({
    projectId,
    dataset,
    token,
    apiVersion: API_VERSION,
    useCdn: false,
  })
}

function resolveImportDataset(): string {
  loadEnv({ path: join(ROOT, '.env.local') })

  const envDataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim()
  const allowProduction = process.argv.includes('--allow-production')

  if (envDataset === 'production') {
    if (!allowProduction) {
      console.error(
        'Refusing import: NEXT_PUBLIC_SANITY_DATASET is production. Pass --allow-production to proceed.'
      )
      process.exit(1)
    }
    console.warn(
      'WARNING: Importing into the production dataset (--allow-production was passed).'
    )
    return 'production'
  }

  return DEVELOPMENT_DATASET
}

async function importPosts(posts: PostDoc[]): Promise<void> {
  const dataset = resolveImportDataset()
  const client = createWriteClient(dataset)
  console.log(`Importing ${posts.length} draft posts to dataset "${dataset}"...`)

  for (const post of posts) {
    const existing = await client.fetch<{ _id: string } | null>(
      `*[_type == "post" && slug.current == $slug][0]{ _id }`,
      { slug: post.slug.current }
    )
    if (existing) {
      console.log(`Skip (already exists): ${post.slug.current} (${existing._id})`)
      continue
    }

    const created = await client.create(post)
    console.log(`Created: ${post.slug.current} -> ${created._id}`)
  }
}

async function main() {
  const shouldImport = process.argv.includes('--import')

  writeNdjson(POSTS)

  if (!shouldImport) {
    console.log('NDJSON only. To import, run:')
    console.log('  npm run seed:elementor-posts -- --import')
    console.log('  npm run seed:elementor-posts -- --import --allow-production')
    return
  }

  await importPosts(POSTS)
}

main().catch((err: unknown) => {
  console.error('seed-elementor-posts failed:')
  if (err instanceof Error) {
    console.error(err.message)
    if (err.stack) console.error(err.stack)
  } else {
    console.error(err)
  }
  process.exit(1)
})
