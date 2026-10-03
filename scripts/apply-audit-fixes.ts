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

const EDITS: Edit[] = [
  ...BATCH_1.map((e) => ({ ...e, batch: 1 })),
  ...BATCH_2.map((e) => ({ ...e, batch: 2 })),
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
  if (typeof value !== 'string') return { edit, docId, reason: `field ${edit.field} is not a string` }
  const k = `${docId}|${edit.field}`
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
    console.log(`OLD   ${show(p.edit.old)}`)
    console.log(`NEW   ${show(p.edit.new)}`)
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
