/**
 * Round five: metadata that still claims Next.js costs less over three
 * years. Targets excerpt and seo.metaDescription, not body blocks.
 *
 * Default: dry run. Pass --execute to write.
 * Aborts without writing if any target string matches zero or more than one
 * place in its field.
 *
 * Run: pnpm correct:wordpress-claims-r5
 *      pnpm correct:wordpress-claims-r5 -- --execute
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient, type SanityClient } from '@sanity/client'
import { config as loadEnv } from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

const API_VERSION = '2025-12-05'

type MetaField = 'excerpt' | 'seo.metaDescription'

type PostDoc = {
  _id: string
  title: string
  slug: string
  excerpt: string | null
  seo: { metaDescription?: string | null } | null
}

type ClaimFix = {
  id: string
  slug: string
  field: MetaField
  label: string
  find: string
  replace: string
}

const FIXES: ClaimFix[] = [
  {
    id: 'f-3year-excerpt',
    slug: 'wordpress-vs-nextjs-3-year-cost-comparison',
    field: 'excerpt',
    label: 'Pattern F — excerpt still claims Next.js costs less',
    find:
      'WordPress looks cheaper upfront. But when you add hosting, maintenance, security, and performance work, a Next.js build often costs significantly less over 3 years.',
    replace:
      'WordPress looks cheaper upfront, and it stays cheaper over three years. A Next.js build runs about $3,000 more. Here is what that premium buys.',
  },
  {
    id: 'f-3year-meta',
    slug: 'wordpress-vs-nextjs-3-year-cost-comparison',
    field: 'seo.metaDescription',
    label: 'Pattern F — meta description still claims Next.js costs less',
    find:
      'WordPress vs Next.js 3-year total cost of ownership. Why a more expensive custom build often costs less than WordPress over time.',
    replace:
      'WordPress vs Next.js 3-year total cost of ownership. WordPress costs less. Next.js runs about $3,000 more. What that premium buys.',
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

function fieldValue(post: PostDoc, field: MetaField): string {
  if (field === 'excerpt') return post.excerpt ?? ''
  return post.seo?.metaDescription ?? ''
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

function applyReplace(current: string, find: string, replace: string): string {
  const hits = countOccurrences(current, find)
  if (hits !== 1) {
    throw new Error(`applyReplace expected exactly one match, found ${hits}`)
  }
  return current.replace(find, replace)
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
      excerpt,
      seo
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

    const count = countOccurrences(fieldValue(post, fix.field), fix.find)
    if (count !== 1) {
      matchErrors.push(
        `${fix.slug} ${fix.field}: expected exactly one match for ${describeFind(fix.find)}, found ${count}`,
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

  const workingFields = new Map<string, Record<MetaField, string>>()
  for (const post of posts) {
    workingFields.set(post.slug, {
      excerpt: fieldValue(post, 'excerpt'),
      'seo.metaDescription': fieldValue(post, 'seo.metaDescription'),
    })
  }

  const total = resolved.length
  const updatedSlugs = new Set<string>()
  const unchangedIds: string[] = []
  let index = 0

  for (const { fix, post } of resolved) {
    index += 1
    const currentFields = workingFields.get(post.slug)
    if (!currentFields) {
      throw new Error(`Missing working fields for ${post.slug}`)
    }

    const before = currentFields[fix.field]
    const after = applyReplace(before, fix.find, fix.replace)
    currentFields[fix.field] = after

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
    console.log(`  After:  ${after}`)
    if (fix.field === 'seo.metaDescription') {
      console.log(`  After length: ${after.length} characters`)
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
      const fields = workingFields.get(slug)
      if (!post || !fields) {
        throw new Error(`Cannot patch ${slug}: missing post or fields`)
      }

      const set: Record<string, string> = {}
      for (const { fix } of resolved.filter((item) => item.post.slug === slug)) {
        if (fieldValue(post, fix.field) !== fields[fix.field]) {
          set[fix.field] = fields[fix.field]
        }
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
    console.log('Dry run complete — no writes. Pass --execute to patch documents in Sanity.')
  }
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
