/**
 * R-005 — retitle four WordPress-agency posts whose live titles speculate
 * about other firms' motives (SEO-RECON.md §5 / §15).
 *
 * Schema (sanity/schemaTypes/post.ts + sanity/schemaTypes/seo.ts):
 *   title                 string   H1
 *   excerpt               text     /blog cards + BlogPosting JSON-LD description
 *   seo                   object
 *     seo.metaTitle       string   <title> via metaTitle || title
 *     seo.metaDescription text     meta description via metaDescription || excerpt
 *     seo.canonicalUrl    url      not patched
 *     seo.noIndex         boolean  not patched
 *     seo.ogImage         image    not patched
 *
 * There is no top-level metaTitle, metaDescription, or description on post.
 * App aliases: "metaTitle": seo.metaTitle, "metaDescription": seo.metaDescription
 * (lib/sanity/queries.ts postBySlugQuery). A top-level metaTitle patch would
 * create an orphan field nothing reads.
 *
 * This script patches title, excerpt, seo.metaTitle, and seo.metaDescription.
 * title and seo.metaTitle are always set to the same proposed string so they
 * cannot drift (post 4 already has a live <title> that differs from its H1).
 * excerpt is live on /blog cards and in BlogPosting JSON-LD with no fallback
 * to seo.metaDescription (lib/schema/index.ts). That fallback is out of scope.
 *
 * Match: slug.current only. Zero or more than one published document → skip.
 * Never guess by title.
 *
 * Default: dry run. Pass --apply to write.
 *
 * Run: npx tsx scripts/r005-retitle-wordpress-posts.ts
 *      npx tsx scripts/r005-retitle-wordpress-posts.ts --apply
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient, type SanityClient } from '@sanity/client'
import { config as loadEnv } from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

const API_VERSION = '2025-12-05'

type SeoFields = {
  metaTitle?: string | null
  metaDescription?: string | null
}

type PostDoc = {
  _id: string
  title: string | null
  excerpt: string | null
  slug: string
  seo: SeoFields | null
}

type Retitle = {
  slug: string
  title: string
  excerpt: string
  meta: string
}

type FieldName = 'title' | 'excerpt' | 'seo.metaTitle' | 'seo.metaDescription'

type FieldDiff = {
  field: FieldName
  current: string
  proposed: string
  changed: boolean
}

type DocResult = {
  slug: string
  outcome: 'would-update' | 'updated' | 'unchanged' | 'skipped' | 'failed'
  reason?: string
  diffs: FieldDiff[]
}

const RETITLES: Retitle[] = [
  {
    slug: 'hidden-wordpress-costs-agencies-dont-tell-you',
    title: 'The WordPress Quote Looks Reasonable. Then the Bills Start.',
    excerpt:
      'The quote looks reasonable. Then the plugin renewals, managed hosting, maintenance, and the occasional security incident start arriving. Here is what to ask about before you sign.',
    meta: 'Plugin licenses, managed hosting, maintenance, and security incidents sit outside the WordPress build quote. Those are the costs that start after launch.',
  },
  {
    slug: 'the-page-builder-stack-your-wordpress-agency-didnt-explain',
    title: 'The Page Builder Stack That Turns Leaving Into a Rebuild',
    excerpt:
      'Most WordPress sites run six or seven paid plugins a year, and the layouts live inside the page builder. Renewals add up, and moving off is a rebuild rather than an export.',
    meta: 'Elementor, Divi, Bricks, WPBakery: the layouts live in the plugin. Annual renewals run $400 to $800 before hosting. Leaving is a rebuild, not an export.',
  },
  {
    slug: 'what-a-vizantir-engagement-discloses-that-a-wordpress-agency-engagement-usually-doesnt',
    title: 'What a Vizantir Engagement Puts on the Table Up Front',
    excerpt:
      'Build cost is the easy question. The harder one is what the site costs to run, and who you are paying. Here is what Vizantir puts on the table before a build starts.',
    meta: "None of it is hidden. It just isn't usually in the conversation when a site is being sold. Here's what Vizantir puts on the table before a build starts.",
  },
  {
    slug: 'why-most-agencies-still-use-wordpress',
    title: 'Why WordPress Is Still the Default (And Why We Build on Next.js)',
    excerpt:
      'WordPress powers 40.7% of the web because it fits volume work: reusable themes, a broad hiring pool, fast delivery. Next.js needs engineers and longer builds. Here is why we took that trade.',
    meta: 'WordPress fits volume work: reusable themes, a broad hiring pool, two to four week delivery. Next.js needs engineers and longer builds. We took that trade.',
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

function display(value: string | null | undefined): string {
  if (value == null || value === '') return '(empty)'
  return value
}

function buildDiffs(post: PostDoc, proposed: Retitle): FieldDiff[] {
  return [
    {
      field: 'title',
      current: post.title ?? '',
      proposed: proposed.title,
      changed: (post.title ?? '') !== proposed.title,
    },
    {
      field: 'excerpt',
      current: post.excerpt ?? '',
      proposed: proposed.excerpt,
      changed: (post.excerpt ?? '') !== proposed.excerpt,
    },
    {
      field: 'seo.metaTitle',
      current: post.seo?.metaTitle ?? '',
      proposed: proposed.title,
      changed: (post.seo?.metaTitle ?? '') !== proposed.title,
    },
    {
      field: 'seo.metaDescription',
      current: post.seo?.metaDescription ?? '',
      proposed: proposed.meta,
      changed: (post.seo?.metaDescription ?? '') !== proposed.meta,
    },
  ]
}

function fieldStatus(diff: FieldDiff, isApply: boolean): string {
  if (!diff.changed) return 'unchanged'
  return isApply ? 'updated' : 'would update'
}

function printSchemaReport(): void {
  console.log('Post schema fields')
  console.log('  title                    string   H1')
  console.log('  excerpt                  text     /blog cards + BlogPosting JSON-LD description')
  console.log('  seo                      object')
  console.log('    seo.metaTitle          string   <title> via metaTitle || title')
  console.log('    seo.metaDescription    text     meta description via metaDescription || excerpt')
  console.log('    seo.canonicalUrl       url      not patched')
  console.log('    seo.noIndex            boolean  not patched')
  console.log('    seo.ogImage            image    not patched')
  console.log('  No top-level metaTitle, metaDescription, or description on post.')
  console.log('  This script patches: title, excerpt, seo.metaTitle, seo.metaDescription.')
  console.log('')
}

function printDoc(index: number, total: number, result: DocResult, isApply: boolean): void {
  console.log(`[${index}/${total}] ${result.slug}`)

  if (result.outcome === 'skipped' || result.outcome === 'failed') {
    console.log(`  Result: ${result.outcome}${result.reason ? ` — ${result.reason}` : ''}`)
    console.log('')
    return
  }

  for (const diff of result.diffs) {
    console.log(`  ${diff.field}`)
    console.log(`    current:  ${display(diff.current)}`)
    console.log(`    proposed: ${display(diff.proposed)}`)
    console.log(`    status:   ${fieldStatus(diff, isApply)}`)
  }

  const changed = result.diffs.filter((diff) => diff.changed).map((diff) => diff.field)
  if (changed.length === 0) {
    console.log('  Fields changed: none')
  } else {
    console.log(`  Fields changed: ${changed.join(', ')}`)
  }
  console.log(`  Result: ${result.outcome === 'would-update' ? 'would update' : result.outcome}`)
  console.log('')
}

async function fetchPublishedBySlug(client: SanityClient, slug: string): Promise<PostDoc[]> {
  return client.fetch<PostDoc[]>(
    `*[_type == "post" && slug.current == $slug && !(_id in path("drafts.**"))]{
      _id,
      title,
      excerpt,
      "slug": slug.current,
      seo
    }`,
    { slug },
  )
}

async function main() {
  const isApply = process.argv.includes('--apply')
  console.log(isApply ? 'APPLY' : 'DRY RUN')
  console.log('')

  printSchemaReport()

  const client = createWriteClient()
  const total = RETITLES.length
  const results: DocResult[] = []
  let index = 0

  for (const proposed of RETITLES) {
    index += 1

    let matches: PostDoc[]
    try {
      matches = await fetchPublishedBySlug(client, proposed.slug)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      const result: DocResult = {
        slug: proposed.slug,
        outcome: 'failed',
        reason: message,
        diffs: [],
      }
      results.push(result)
      printDoc(index, total, result, isApply)
      continue
    }

    if (matches.length !== 1) {
      const result: DocResult = {
        slug: proposed.slug,
        outcome: 'skipped',
        reason:
          matches.length === 0
            ? '0 documents matched slug.current'
            : `${matches.length} documents matched slug.current`,
        diffs: [],
      }
      results.push(result)
      printDoc(index, total, result, isApply)
      continue
    }

    const post = matches[0]
    const diffs = buildDiffs(post, proposed)
    const changed = diffs.some((diff) => diff.changed)

    if (!changed) {
      const result: DocResult = {
        slug: proposed.slug,
        outcome: 'unchanged',
        diffs,
      }
      results.push(result)
      printDoc(index, total, result, isApply)
      continue
    }

    if (!isApply) {
      const result: DocResult = {
        slug: proposed.slug,
        outcome: 'would-update',
        diffs,
      }
      results.push(result)
      printDoc(index, total, result, isApply)
      continue
    }

    try {
      const set: Record<string, string> = {}
      for (const diff of diffs) {
        if (diff.changed) {
          set[diff.field] = diff.proposed
        }
      }
      await client.patch(post._id).set(set).commit()
      const result: DocResult = {
        slug: proposed.slug,
        outcome: 'updated',
        diffs,
      }
      results.push(result)
      printDoc(index, total, result, isApply)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      const result: DocResult = {
        slug: proposed.slug,
        outcome: 'failed',
        reason: message,
        diffs,
      }
      results.push(result)
      printDoc(index, total, result, isApply)
    }
  }

  const wouldUpdate = results.filter((r) => r.outcome === 'would-update').length
  const updated = results.filter((r) => r.outcome === 'updated').length
  const unchanged = results.filter((r) => r.outcome === 'unchanged').length
  const skipped = results.filter((r) => r.outcome === 'skipped').length
  const failed = results.filter((r) => r.outcome === 'failed').length
  const notUpdated = skipped + failed

  console.log('Summary')
  console.log(`  Intended:     ${total}`)
  console.log(`  ${isApply ? 'Updated' : 'Would update'}:  ${isApply ? updated : wouldUpdate}`)
  console.log(`  Unchanged:    ${unchanged}`)
  console.log(`  Skipped:      ${skipped}`)
  console.log(`  Failed:       ${failed}`)

  if (!isApply) {
    console.log('')
    console.log('Dry run complete. No writes. Pass --apply to patch documents in Sanity.')
  }

  if (notUpdated > 0) {
    process.exit(1)
  }
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
