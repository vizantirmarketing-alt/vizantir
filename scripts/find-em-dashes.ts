/**
 * Read-only scan of published Sanity posts for em dashes (U+2014)
 * and en dashes used as sentence breaks (U+2013 with a space on each side).
 * Prints one tab-separated line per hit: slug, field, sentence.
 * Does not write to Sanity.
 *
 * Usage: pnpm find-em-dashes
 */

import { config as loadEnv } from 'dotenv'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { isDashHit, isSpace } from './lib/em-dash'

const STRING_FIELDS = ['title', 'excerpt', 'metaTitle', 'metaDescription'] as const

type StringField = (typeof STRING_FIELDS)[number]
type FieldName = StringField | 'body'

type PostDoc = {
  slug: string
  title: string
  excerpt: string
  metaTitle: string
  metaDescription: string
  body: unknown
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
loadEnv({ path: join(root, '.env.local'), quiet: true })

const POSTS_QUERY = `*[_type == "post" && !(_id in path("drafts.**"))] | order(slug.current asc) {
  "slug": slug.current,
  title,
  excerpt,
  "metaTitle": seo.metaTitle,
  "metaDescription": seo.metaDescription,
  body
}`

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isDecimalPoint(text: string, index: number): boolean {
  const prev = text[index - 1]
  const next = text[index + 1]
  return prev !== undefined && next !== undefined && /\d/.test(prev) && /\d/.test(next)
}

function isAbbreviation(text: string, index: number): boolean {
  const before = text.slice(Math.max(0, index - 10), index)
  return /(?:^|[\s(])(?:Dr|Mr|Mrs|Ms|Prof|Sr|Jr|vs|etc|Inc|Ltd|St|No|e\.g|i\.e)$/i.test(before)
}

const CLOSERS = new Set(['"', "'", '\u201D', '\u2019', ')', ']', '\u00BB'])

function terminatorEnd(text: string, index: number): number | null {
  const punct = text[index]
  if (punct !== '.' && punct !== '?' && punct !== '!') return null
  if (punct === '.' && (isDecimalPoint(text, index) || isAbbreviation(text, index))) return null

  let cursor = index + 1
  while (cursor < text.length && CLOSERS.has(text[cursor] ?? '')) cursor += 1
  if (cursor >= text.length) return cursor

  const next = text[cursor]
  if (next === '\n' || next === '\r' || isSpace(next)) return cursor
  return null
}

function isGap(char: string | undefined): boolean {
  return char === '\n' || char === '\r' || char === '\t' || isSpace(char)
}

function sentenceAt(text: string, index: number): string {
  let start = 0
  for (let i = index - 1; i >= 0; i -= 1) {
    const end = terminatorEnd(text, i)
    if (end !== null && end <= index) {
      start = end
      break
    }
  }
  while (start < text.length && isGap(text[start])) start += 1

  let end = text.length
  for (let i = index; i < text.length; i += 1) {
    const boundary = terminatorEnd(text, i)
    if (boundary !== null) {
      end = boundary
      break
    }
  }

  return text.slice(start, end).replace(/\s+/g, ' ').trim()
}

function matchingSentences(text: string): string[] {
  const sentences: string[] = []
  const seen = new Set<string>()

  for (let i = 0; i < text.length; i += 1) {
    if (!isDashHit(text, i)) continue
    const sentence = sentenceAt(text, i)
    if (sentence.length === 0 || seen.has(sentence)) continue
    seen.add(sentence)
    sentences.push(sentence)
  }

  return sentences
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function readPosts(value: unknown): PostDoc[] {
  if (!Array.isArray(value)) {
    throw new Error('Sanity query did not return a list of posts')
  }

  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`Post at index ${index} was not an object`)
    }
    return {
      slug: readString(item.slug),
      title: readString(item.title),
      excerpt: readString(item.excerpt),
      metaTitle: readString(item.metaTitle),
      metaDescription: readString(item.metaDescription),
      body: item.body,
    }
  })
}

function bodyChunks(body: unknown): string[] {
  if (!Array.isArray(body)) return []

  const chunks: string[] = []
  for (const block of body) {
    if (!isRecord(block)) continue

    if (Array.isArray(block.children)) {
      const text = block.children
        .map((child) => (isRecord(child) ? readString(child.text) : ''))
        .join('')
      if (text.length > 0) chunks.push(text)
    }

    if (block._type === 'codeBlock' && typeof block.code === 'string' && block.code.length > 0) {
      chunks.push(block.code)
    }
  }

  return chunks
}

function pushHits(lines: string[], slug: string, field: FieldName, text: string): void {
  for (const sentence of matchingSentences(text)) {
    lines.push(`${slug}\t${field}\t${sentence}`)
  }
}

function hitsForPost(post: PostDoc): string[] {
  const slug = post.slug.length > 0 ? post.slug : '(missing slug)'
  const lines: string[] = []

  for (const field of STRING_FIELDS) {
    pushHits(lines, slug, field, post[field])
  }
  for (const chunk of bodyChunks(post.body)) {
    pushHits(lines, slug, 'body', chunk)
  }

  return lines
}

async function main(): Promise<void> {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim() ?? ''
  if (projectId.length === 0) {
    console.error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID')
    process.exit(1)
  }

  const { sanityFetch } = await import('../lib/sanity/client')
  const posts = readPosts(
    await sanityFetch<unknown>(POSTS_QUERY, {}, { tags: ['post'], fresh: true }),
  )

  for (const line of posts.flatMap((post) => hitsForPost(post))) {
    console.log(line)
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err)
  console.error(message)
  process.exit(1)
})
