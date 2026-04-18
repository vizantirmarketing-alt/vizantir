/**
 * Migrates blog posts from lib/blog-data.ts into Sanity.
 * Default: dry-run (no writes). Pass --live to write with SANITY_API_WRITE_TOKEN.
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient, type SanityClient } from '@sanity/client'
import { Schema } from '@sanity/schema'
import { htmlToBlocks, normalizeBlock, randomKey } from '@sanity/block-tools'
import type { ArraySchemaType } from '@sanity/types'
import { config as loadEnv } from 'dotenv'
import { JSDOM } from 'jsdom'
import { marked } from 'marked'

import { blogPosts, type BlogPost } from '../lib/blog-data'

const API_VERSION = '2025-12-05'
const AUTHOR_ID = 'author-vizantir'
const EXPECTED_POST_COUNT = 42

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

loadEnv({ path: join(ROOT, '.env.local') })

const isLive = process.argv.includes('--live')

/** Sanity `codeBlock.language` values from schema */
type CodeLanguage =
  | 'typescript'
  | 'javascript'
  | 'tsx'
  | 'jsx'
  | 'html'
  | 'css'
  | 'json'
  | 'php'
  | 'bash'
  | 'text'

type ExtractedCodeBlock = {
  id: string
  language: CodeLanguage
  code: string
}

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v || !v.trim()) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return v.trim()
}

function toIsoDatetime(value: string): string {
  const trimmed = value.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T12:00:00.000Z`
  }
  const d = new Date(trimmed)
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid publishedAt: ${value}`)
  }
  return d.toISOString()
}

function isHtmlContent(content: string): boolean {
  return content.trim().startsWith('<')
}

function markdownToHtml(markdown: string): string {
  const result = marked.parse(markdown, { async: false })
  if (typeof result !== 'string') {
    throw new Error('marked.parse returned a Promise; expected synchronous HTML string')
  }
  return result
}

function languageFromHighlightClass(classAttr: string): CodeLanguage {
  const classes = (classAttr || '').split(/\s+/).filter(Boolean)
  const token = classes.find((c) => c.startsWith('language-'))
  if (!token) return 'text'
  const raw = token.slice('language-'.length).toLowerCase()

  switch (raw) {
    case 'tsx':
    case 'typescript-jsx':
      return 'tsx'
    case 'jsx':
      return 'jsx'
    case 'typescript':
    case 'ts':
      return 'typescript'
    case 'javascript':
    case 'js':
      return 'javascript'
    case 'html':
      return 'html'
    case 'css':
      return 'css'
    case 'json':
      return 'json'
    case 'php':
      return 'php'
    case 'bash':
    case 'shell':
    case 'sh':
    case 'zsh':
      return 'bash'
    default:
      return 'text'
  }
}

function inferLanguageFromCodeWhenText(code: string): CodeLanguage {
  const t = code.trim()
  const firstLine = (code.split('\n')[0] ?? '').trim()

  if (t.startsWith('<?php') || /\bdefine\s*\(/.test(code)) {
    return 'php'
  }

  if (/\b(import|export)\b/.test(code)) {
    if (
      /<[A-Z][A-Za-z0-9]*[\s/>]/.test(code) ||
      /<\/>|<>/.test(code) ||
      /\{\s*[A-Za-z_$][\w$]*\s*\}/.test(code)
    ) {
      return 'tsx'
    }
    return 'typescript'
  }

  if (/<[A-Z][A-Za-z0-9]*[\s/>]/.test(code) || /\/>/.test(code)) {
    return 'tsx'
  }

  if (/User-agent:/i.test(code)) {
    return 'bash'
  }
  if (/^#!/.test(t)) {
    return 'bash'
  }
  if (/^(npm|yarn|pnpm|npx)\s/i.test(firstLine)) {
    return 'bash'
  }
  if (/^(git|curl|docker|chmod|sudo|cd)\s/i.test(firstLine)) {
    return 'bash'
  }

  return 'text'
}

function resolveCodeLanguage(classAttr: string, code: string): CodeLanguage {
  const fromClass = languageFromHighlightClass(classAttr)
  if (fromClass !== 'text') {
    return fromClass
  }
  return inferLanguageFromCodeWhenText(code)
}

/**
 * Parses HTML with jsdom, extracts each `<pre><code>` as structured data,
 * replaces it with `<p>CODE_BLOCK_PLACEHOLDER_n</p>`, and returns modified HTML + extractions.
 */
function extractPreCodeBlocks(html: string): {
  html: string
  blocks: ExtractedCodeBlock[]
} {
  const dom = new JSDOM(html)
  const doc = dom.window.document
  const body = doc.body
  if (!body) {
    return { html, blocks: [] }
  }

  const blocks: ExtractedCodeBlock[] = []
  const matches = Array.from(body.querySelectorAll('pre'))

  for (const pre of matches) {
    if (!pre.parentNode || !pre.isConnected) {
      continue
    }

    const codeEl = pre.querySelector(':scope > code') ?? pre.querySelector('code')
    if (!codeEl) {
      continue
    }

    const id = `CODE_BLOCK_PLACEHOLDER_${blocks.length}`
    const classAttr = codeEl.getAttribute('class') ?? ''
    const code = codeEl.textContent ?? ''
    const language = resolveCodeLanguage(classAttr, code)

    const p = doc.createElement('p')
    p.textContent = id

    pre.parentNode.replaceChild(p, pre)
    blocks.push({ id, language, code })
  }

  return { html: body.innerHTML, blocks }
}

function isPortableTextBlock(node: unknown): node is {
  _type: string
  children?: unknown[]
} {
  return typeof node === 'object' && node !== null && (node as { _type?: string })._type === 'block'
}

function getSingleSpanPlaceholderText(
  block: { children?: unknown[] },
  placeholderIds: Set<string>,
): string | null {
  const children = block.children
  if (!Array.isArray(children) || children.length !== 1) {
    return null
  }

  const span = children[0] as { _type?: string; text?: string; marks?: unknown[] }
  if (span._type !== 'span' || typeof span.text !== 'string') {
    return null
  }

  const marks = Array.isArray(span.marks) ? span.marks : []
  if (marks.length > 0) {
    return null
  }

  const trimmed = span.text.trim()
  if (placeholderIds.has(trimmed)) {
    return trimmed
  }
  return null
}

function injectExtractedCodeBlocks(
  blocks: ReturnType<typeof normalizeBlock>[],
  extracted: ExtractedCodeBlock[],
): unknown[] {
  if (extracted.length === 0) {
    return blocks
  }

  const byId = new Map(extracted.map((b) => [b.id, b]))
  const idSet = new Set(byId.keys())

  return blocks.flatMap((block) => {
    if (!isPortableTextBlock(block)) {
      return [block]
    }

    const match = getSingleSpanPlaceholderText(block, idSet)
    if (!match) {
      return [block]
    }

    const info = byId.get(match)
    if (!info) {
      return [block]
    }

    return [
      {
        _type: 'codeBlock' as const,
        _key: randomKey(12),
        language: info.language,
        code: info.code,
      },
    ]
  })
}

function getPostBodyBlockType(): ArraySchemaType {
  const compiled = Schema.compile({
    name: 'blogMigrate',
    types: [
      {
        name: 'postBodyStub',
        type: 'object',
        fields: [
          {
            name: 'body',
            title: 'Body',
            type: 'array',
            of: [{ type: 'block' }],
          },
        ],
      },
    ],
  })

  const stub = compiled.get('postBodyStub') as {
    fields: Array<{ name: string; type: ArraySchemaType }>
  }
  const bodyField = stub.fields.find((f) => f.name === 'body')
  if (!bodyField?.type) {
    throw new Error('Could not resolve compiled body field type for htmlToBlocks')
  }
  return bodyField.type
}

function htmlToPortableTextBlocks(html: string, blockContentType: ArraySchemaType) {
  const { html: cleanedHtml, blocks: extractedCode } = extractPreCodeBlocks(html)

  const raw = htmlToBlocks(cleanedHtml, blockContentType, {
    parseHtml: (htmlStr) => new JSDOM(htmlStr).window.document,
  })
  const normalized = raw.map((node) => normalizeBlock(node))
  return injectExtractedCodeBlocks(normalized, extractedCode)
}

function contentToBodyBlocks(content: string, blockContentType: ArraySchemaType) {
  const html = isHtmlContent(content) ? content : markdownToHtml(content)
  return htmlToPortableTextBlocks(html, blockContentType)
}

function buildAuthorDocument() {
  return {
    _id: AUTHOR_ID,
    _type: 'author' as const,
    name: 'Vizantir',
    slug: { _type: 'slug' as const, current: 'vizantir' },
    role: 'Premium Website Design Studio',
  }
}

function buildPostDocument(post: BlogPost, body: ReturnType<typeof contentToBodyBlocks>) {
  return {
    _id: `post-${post.slug}`,
    _type: 'post' as const,
    title: post.title,
    slug: { _type: 'slug' as const, current: post.slug },
    publishedAt: toIsoDatetime(post.publishedAt),
    excerpt: post.excerpt,
    category: post.category,
    tags: post.tags,
    readTime: post.readTime,
    body,
    seo: {
      _type: 'seo' as const,
      metaDescription: post.metaDescription,
    },
    author: { _type: 'reference' as const, _ref: AUTHOR_ID },
  }
}

async function main() {
  const projectId = requireEnv('NEXT_PUBLIC_SANITY_PROJECT_ID')
  const dataset = requireEnv('NEXT_PUBLIC_SANITY_DATASET')

  if (isLive) {
    requireEnv('SANITY_API_WRITE_TOKEN')
  }

  if (blogPosts.length !== EXPECTED_POST_COUNT) {
    console.warn(
      `Expected ${EXPECTED_POST_COUNT} posts but found ${blogPosts.length}. Continuing with all entries.`,
    )
  }

  if (isLive) {
    console.log(`LIVE — writing to Sanity dataset ${dataset}`)
  } else {
    console.log('DRY RUN — no changes written')
  }

  const blockContentType = getPostBodyBlockType()

  const prepared = blogPosts.map((post, index) => {
    try {
      const body = contentToBodyBlocks(post.content, blockContentType)
      return { ok: true as const, index, post, body }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      return { ok: false as const, index, post, error: message }
    }
  })

  let client: SanityClient | undefined
  if (isLive) {
    const token = requireEnv('SANITY_API_WRITE_TOKEN')
    client = createClient({
      projectId,
      dataset,
      token,
      apiVersion: API_VERSION,
      useCdn: false,
    })
    await client.createOrReplace(buildAuthorDocument())
    console.log(`Created/replaced author: ${AUTHOR_ID}`)
  }

  let successCount = 0
  for (const item of prepared) {
    const n = item.index + 1
    const total = blogPosts.length

    if (!item.ok) {
      console.error(`[${n}/${total}] ERROR slug=${item.post.slug}: ${item.error}`)
      continue
    }

    const { post, body } = item
    console.log(`[${n}/${total}] Migrating: ${post.slug} — ${post.category} — ${body.length} blocks`)
    successCount += 1

    if (client) {
      try {
        await client.createOrReplace(buildPostDocument(post, body))
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        console.error(`[${n}/${total}] ERROR slug=${post.slug}: ${message}`)
      }
    }
  }

  if (!isLive) {
    console.log('\nDry-run summary:')
    console.log(`- Author that would be written: ${AUTHOR_ID} (Vizantir)`)
    console.log(`- Posts successfully prepared: ${successCount} / ${blogPosts.length}`)
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
