/**
 * Export one Sanity post body to content-updates/{slug}.html
 * in the format scripts/update-blog-posts.ts parses.
 * Usage: npm run export:post -- some-slug
 * Falls back to SLUG if no argument is given.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient, type SanityClient } from '@sanity/client'
import { config as loadEnv } from 'dotenv'

const SLUG = 'how-to-speed-up-wordpress'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')
const CONTENT_DIR = join(ROOT, 'content-updates')

const API_VERSION = '2025-12-05'

const KNOWN_DECORATORS = new Set(['strong', 'em', 'code', 'underline', 'strike-through'])
const DECORATOR_TAG: Record<string, string> = {
  strong: 'strong',
  em: 'em',
  code: 'code',
  underline: 'u',
  'strike-through': 's',
}
const STYLE_TAG: Record<string, string> = {
  normal: 'p',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  blockquote: 'blockquote',
}

type MarkDef = {
  _type: string
  _key: string
  href?: string
}

type Span = {
  _type: string
  _key?: string
  text?: string
  marks?: string[]
}

type PortableBlock = {
  _type: string
  _key?: string
  style?: string
  listItem?: string
  level?: number
  children?: Span[]
  markDefs?: MarkDef[]
  language?: string
  code?: string
  filename?: string
}

function requireEnv(name: string, value: string | undefined): string {
  if (!value || !String(value).trim()) {
    console.error(`Missing required environment variable: ${name}`)
    process.exit(1)
  }
  return value.trim()
}

function createReadClient(): SanityClient {
  loadEnv({ path: join(ROOT, '.env.local') })

  const projectId = requireEnv(
    'NEXT_PUBLIC_SANITY_PROJECT_ID',
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  )
  const dataset = requireEnv('NEXT_PUBLIC_SANITY_DATASET', process.env.NEXT_PUBLIC_SANITY_DATASET)
  const token = requireEnv('SANITY_API_WRITE_TOKEN', process.env.SANITY_API_WRITE_TOKEN)

  return createClient({
    projectId,
    dataset,
    token,
    apiVersion: API_VERSION,
    useCdn: false,
  })
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeAttr(text: string): string {
  return escapeHtml(text).replace(/'/g, '&#39;')
}

function isListItem(block: PortableBlock): boolean {
  return block._type === 'block' && (block.listItem === 'bullet' || block.listItem === 'number')
}

function listTag(listItem: string): 'ul' | 'ol' {
  return listItem === 'number' ? 'ol' : 'ul'
}

function serializeSpans(children: Span[], markDefs: MarkDef[], issues: string[]): string {
  const defsByKey = new Map(markDefs.map((d) => [d._key, d]))

  return children
    .map((child) => {
      if (child._type !== 'span') {
        issues.push(`Unknown child type "${child._type}"`)
        return ''
      }

      let html = escapeHtml(child.text ?? '').replace(/\n/g, '<br>')
      const marks = child.marks ?? []
      const decorators: string[] = []
      const annotations: MarkDef[] = []

      for (const mark of marks) {
        const def = defsByKey.get(mark)
        if (def) {
          annotations.push(def)
          continue
        }
        if (KNOWN_DECORATORS.has(mark)) {
          decorators.push(mark)
          continue
        }
        issues.push(`Unknown mark "${mark}"`)
      }

      for (const name of ['code', 'em', 'strong', 'underline', 'strike-through']) {
        if (!decorators.includes(name)) continue
        const tag = DECORATOR_TAG[name]
        html = `<${tag}>${html}</${tag}>`
      }

      for (const def of annotations) {
        if (def._type === 'link') {
          const href = typeof def.href === 'string' ? def.href : ''
          html = `<a href="${escapeAttr(href)}">${html}</a>`
          continue
        }
        issues.push(`Unknown annotation type "${def._type}"`)
      }

      return html
    })
    .join('')
}

function serializeNonListBlock(block: PortableBlock, issues: string[]): string {
  if (block._type === 'codeBlock') {
    const language = typeof block.language === 'string' && block.language.trim()
      ? block.language.trim()
      : 'text'
    const code = typeof block.code === 'string' ? block.code : ''
    if (typeof block.filename === 'string' && block.filename.trim()) {
      issues.push(
        `codeBlock filename "${block.filename}" has no HTML equivalent (update-blog-posts.ts does not restore filename)`
      )
    }
    return `<pre><code class="language-${escapeAttr(language)}">${escapeHtml(code)}</code></pre>`
  }

  if (block._type !== 'block') {
    issues.push(`Unknown block type "${block._type}"${block._key ? ` (_key ${block._key})` : ''}`)
    return ''
  }

  const style = block.style ?? 'normal'
  const tag = STYLE_TAG[style]
  if (!tag) {
    issues.push(`Unknown block style "${style}"${block._key ? ` (_key ${block._key})` : ''}`)
  }
  const inner = serializeSpans(block.children ?? [], block.markDefs ?? [], issues)
  return `<${tag ?? 'p'}>${inner}</${tag ?? 'p'}>`
}

function serializeListRun(items: PortableBlock[], start: number, level: number, issues: string[]): {
  html: string
  next: number
} {
  const listItem = items[start]?.listItem ?? 'bullet'
  const tag = listTag(listItem)
  const lis: string[] = []
  let i = start

  while (i < items.length) {
    const item = items[i]
    const itemLevel = item.level ?? 1
    if (itemLevel < level) break
    if (itemLevel === level && item.listItem !== listItem) break

    if (itemLevel > level) {
      const nested = serializeListRun(items, i, itemLevel, issues)
      if (lis.length > 0) {
        lis[lis.length - 1] = `${lis[lis.length - 1].slice(0, -5)}\n${nested.html}</li>`
      } else {
        lis.push(`<li>\n${nested.html}</li>`)
      }
      i = nested.next
      continue
    }

    const inner = serializeSpans(item.children ?? [], item.markDefs ?? [], issues)
    i += 1

    if (i < items.length && isListItem(items[i]) && (items[i].level ?? 1) > level) {
      const nested = serializeListRun(items, i, items[i].level ?? level + 1, issues)
      lis.push(`<li>${inner}\n${nested.html}</li>`)
      i = nested.next
    } else {
      lis.push(`<li>${inner}</li>`)
    }
  }

  return { html: `<${tag}>\n${lis.join('\n')}\n</${tag}>`, next: i }
}

function serializeBody(blocks: PortableBlock[]): { html: string; issues: string[] } {
  const issues: string[] = []
  const parts: string[] = []
  let i = 0

  while (i < blocks.length) {
    const block = blocks[i]
    if (isListItem(block)) {
      const run: PortableBlock[] = []
      while (i < blocks.length && isListItem(blocks[i])) {
        run.push(blocks[i])
        i += 1
      }
      const serialized = serializeListRun(run, 0, run[0]?.level ?? 1, issues)
      if (serialized.html) parts.push(serialized.html)
      continue
    }

    const html = serializeNonListBlock(block, issues)
    if (html) parts.push(html)
    i += 1
  }

  return { html: parts.join('\n') + (parts.length > 0 ? '\n' : ''), issues }
}

async function main() {
  const arg = process.argv[2]
  const slug = (typeof arg === 'string' && arg.trim() ? arg : SLUG).trim()
  if (!slug) {
    console.error('Slug is empty — pass one as an argument or set SLUG in scripts/export-post-body.ts')
    process.exit(1)
  }

  const outPath = join(CONTENT_DIR, `${slug}.html`)
  const relativePath = `content-updates/${slug}.html`

  if (existsSync(outPath)) {
    console.error(`${relativePath} already exists — aborting to avoid overwrite`)
    process.exit(1)
  }

  const client = createReadClient()
  const post = await client.fetch<{ body: PortableBlock[] | null } | null>(
    `*[_type == "post" && slug.current == $slug][0]{ body }`,
    { slug }
  )

  if (!post) {
    console.error(`Post with slug "${slug}" not found in Sanity`)
    process.exit(1)
  }

  const body = Array.isArray(post.body) ? post.body : []
  const { html, issues } = serializeBody(body)

  if (!existsSync(CONTENT_DIR)) {
    mkdirSync(CONTENT_DIR, { recursive: true })
  }

  writeFileSync(outPath, html, 'utf8')
  console.log(outPath)
  console.log(`${body.length} blocks`)

  if (issues.length > 0) {
    console.error('Serializer could not represent:')
    for (const issue of issues) {
      console.error(`- ${issue}`)
    }
  }
}

main().catch((err: unknown) => {
  console.error('Failed to export post body:')
  if (err instanceof Error) {
    console.error(err.message)
    if (err.stack) console.error(err.stack)
  } else {
    console.error(err)
  }
  process.exit(1)
})
