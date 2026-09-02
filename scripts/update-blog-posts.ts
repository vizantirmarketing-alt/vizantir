/**
 * Update existing Sanity posts from content-updates/.
 * - .html → portable body (body field only)
 * - .json → simple string fields present in the file (never body)
 * Default: dry run. Pass --live to write.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient } from '@sanity/client'
import { Schema } from '@sanity/schema'
import { htmlToBlocks, normalizeBlock, randomKey } from '@sanity/block-tools'
import type { ArraySchemaType } from '@sanity/types'
import type { TypedObject } from '@sanity/block-tools'
import { config as loadEnv } from 'dotenv'
import { JSDOM } from 'jsdom'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')
const CONTENT_DIR = join(ROOT, 'content-updates')

const API_VERSION = '2025-12-05'

/** JSON keys we accept (string values only). meta* map to seo.* on the document. */
const JSON_STRING_KEYS = ['excerpt', 'title', 'readTime', 'metaTitle', 'metaDescription'] as const

/** Matches post schema `codeBlock.language` options */
type CodeLanguage =
  | 'typescript'
  | 'javascript'
  | 'tsx'
  | 'jsx'
  | 'html'
  | 'css'
  | 'json'
  | 'sql'
  | 'php'
  | 'bash'
  | 'text'

const ALLOWED_LANGUAGES = new Set<CodeLanguage>([
  'typescript',
  'javascript',
  'tsx',
  'jsx',
  'html',
  'css',
  'json',
  'sql',
  'php',
  'bash',
  'text',
])

function requireEnv(name: string, value: string | undefined): string {
  if (!value || !String(value).trim()) {
    console.error(`Missing required environment variable: ${name}`)
    process.exit(1)
  }
  return value.trim()
}

function compileBodyBlockType(): ArraySchemaType {
  const compiled = Schema.compile({
    name: 'blogBodyUpdate',
    types: [
      {
        name: 'body',
        type: 'array',
        of: [{ type: 'block' }, { type: 'codeBlock' }],
      },
      {
        type: 'block',
        name: 'block',
        styles: [
          { title: 'Normal', value: 'normal' },
          { title: 'H1', value: 'h1' },
          { title: 'H2', value: 'h2' },
          { title: 'H3', value: 'h3' },
          { title: 'H4', value: 'h4' },
          { title: 'Quote', value: 'blockquote' },
        ],
        lists: [
          { title: 'Bullet', value: 'bullet' },
          { title: 'Numbered', value: 'number' },
        ],
        marks: {
          decorators: [
            { title: 'Strong', value: 'strong' },
            { title: 'Emphasis', value: 'em' },
            { title: 'Code', value: 'code' },
            { title: 'Underline', value: 'underline' },
            { title: 'Strike', value: 'strike-through' },
          ],
          annotations: [
            {
              name: 'link',
              type: 'object',
              title: 'Link',
              fields: [{ title: 'URL', name: 'href', type: 'url' }],
            },
          ],
        },
      },
      {
        type: 'object',
        name: 'codeBlock',
        title: 'Code Block',
        fields: [
          { name: 'language', type: 'string', title: 'Language' },
          { name: 'code', type: 'text', title: 'Code' },
          { name: 'filename', type: 'string', title: 'Filename' },
        ],
      },
    ],
  })
  return compiled.get('body') as ArraySchemaType
}

function parseHtmlWithJsdom(html: string): Document {
  return new JSDOM(html, { contentType: 'text/html' }).window.document
}

function mapClassToLanguage(raw: string): CodeLanguage {
  const key = raw.toLowerCase().replace(/^language-|^lang-/, '')
  const aliases: Record<string, CodeLanguage> = {
    ts: 'typescript',
    typescript: 'typescript',
    js: 'javascript',
    javascript: 'javascript',
    tsx: 'tsx',
    jsx: 'jsx',
    html: 'html',
    css: 'css',
    json: 'json',
    sql: 'sql',
    php: 'php',
    bash: 'bash',
    sh: 'bash',
    shell: 'bash',
    zsh: 'bash',
    text: 'text',
    plaintext: 'text',
  }
  if (aliases[key]) return aliases[key]
  if (ALLOWED_LANGUAGES.has(key as CodeLanguage)) return key as CodeLanguage
  return 'text'
}

function inferLanguage(code: string): CodeLanguage {
  const t = code.trim()
  if (t.startsWith('<?php') || t.includes('define(')) return 'php'
  if (t.startsWith('User-agent:')) return 'bash'
  if (t.startsWith('#!')) return 'bash'
  const hasImportExport = /\b(import|export)\b/.test(code)
  const hasJsx = /<[A-Za-z/!?]/.test(code)
  if (hasImportExport && hasJsx) return 'tsx'
  return 'text'
}

function resolveLanguage(codeEl: Element, code: string): CodeLanguage {
  const cls = codeEl.getAttribute('class') || ''
  const m = cls.match(/\b(?:language|lang)-([\w+-]+)\b/)
  if (m?.[1]) return mapClassToLanguage(m[1])
  return inferLanguage(code)
}

type ExtractedSnippet = { id: string; language: CodeLanguage; code: string }

/**
 * Replace each <pre><code> with <p>CODE_BLOCK_PLACEHOLDER_N</p>; return cleaned HTML and snippets.
 */
function extractPreCodeBlocks(html: string): { cleanedHtml: string; snippets: ExtractedSnippet[] } {
  const dom = new JSDOM(html, { contentType: 'text/html' })
  const doc = dom.window.document
  const snippets: ExtractedSnippet[] = []
  const pres = Array.from(doc.querySelectorAll('pre'))
  let n = 0

  for (const pre of pres) {
    const codeEl = pre.querySelector('code')
    if (!codeEl) continue
    const id = `CODE_BLOCK_PLACEHOLDER_${n}`
    n += 1
    const code = codeEl.textContent ?? ''
    const language = resolveLanguage(codeEl, code)
    snippets.push({ id, language, code })
    const p = doc.createElement('p')
    p.textContent = id
    pre.parentNode?.replaceChild(p, pre)
  }

  const body = doc.body
  const cleanedHtml = body?.innerHTML ?? ''
  return { cleanedHtml, snippets }
}

function getPlaceholderId(block: TypedObject): string | null {
  if (block._type !== 'block' || !('children' in block) || !Array.isArray(block.children)) return null
  const children = block.children as TypedObject[]
  if (children.length !== 1) return null
  const span = children[0] as { _type?: string; text?: string }
  if (span._type !== 'span' || typeof span.text !== 'string') return null
  const text = span.text.trim()
  if (/^CODE_BLOCK_PLACEHOLDER_\d+$/.test(text)) return text
  return null
}

function replacePlaceholdersWithCodeBlocks(
  blocks: TypedObject[],
  snippets: ExtractedSnippet[],
): TypedObject[] {
  const byId = new Map(snippets.map((s) => [s.id, s]))
  return blocks.map((block) => {
    const id = getPlaceholderId(block)
    if (!id) return block
    const sn = byId.get(id)
    if (!sn) return block
    return {
      _type: 'codeBlock',
      _key: randomKey(12),
      language: sn.language,
      code: sn.code,
    } as TypedObject
  })
}

function slugFromContentFile(file: string): string {
  return file.replace(/\.(html|json)$/i, '')
}

function fileKind(file: string): 'html' | 'json' | 'other' {
  const lower = file.toLowerCase()
  if (lower.endsWith('.html')) return 'html'
  if (lower.endsWith('.json')) return 'json'
  return 'other'
}

function listContentDirFiles(): string[] {
  if (!existsSync(CONTENT_DIR)) {
    return []
  }
  return readdirSync(CONTENT_DIR).filter((f) => !f.startsWith('.'))
}

function htmlToPortableBody(html: string, blockContentType: ArraySchemaType): TypedObject[] {
  const { cleanedHtml, snippets } = extractPreCodeBlocks(html)
  const rawBlocks = htmlToBlocks(cleanedHtml, blockContentType, {
    parseHtml: (h) => parseHtmlWithJsdom(h),
  }) as TypedObject[]
  const withCode = replacePlaceholdersWithCodeBlocks(rawBlocks, snippets)
  return withCode.map((b) => normalizeBlock(b) as TypedObject)
}

function formatHtmlBodySummary(blockCount: number, codeBlockCount: number): string {
  const codePart = codeBlockCount === 1 ? '1 code block' : `${codeBlockCount} code blocks`
  return `${blockCount} blocks, ${codePart}`
}

function formatJsonFieldsSummary(labelFields: string[]): string {
  if (labelFields.length === 0) return ''
  if (labelFields.length === 1) return `${labelFields[0]} only`
  return labelFields.join(', ')
}

/**
 * Build Sanity .set() payload from parsed JSON object. Only known string fields.
 * Returns label order for logging (excerpt, title, readTime, metaTitle, metaDescription).
 */
function buildPatchFromJsonObject(obj: Record<string, unknown>): { set: Record<string, unknown>; labelFields: string[] } | null {
  const set: Record<string, unknown> = {}
  const labelFields: string[] = []

  for (const key of JSON_STRING_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue
    const v = obj[key]
    if (typeof v !== 'string') {
      console.warn(`Skipping JSON field "${key}": expected string, got ${typeof v}`)
      continue
    }
    if (key === 'metaTitle') {
      set['seo.metaTitle'] = v
      labelFields.push('metaTitle')
    } else if (key === 'metaDescription') {
      set['seo.metaDescription'] = v
      labelFields.push('metaDescription')
    } else {
      set[key] = v
      labelFields.push(key)
    }
  }

  if (Object.keys(set).length === 0) return null
  return { set, labelFields }
}

async function main() {
  const allFiles = listContentDirFiles()

  for (const f of allFiles) {
    if (f === '.gitkeep') continue
    if (fileKind(f) === 'other') {
      console.warn(`Warning: skipping "${f}" (unsupported extension — use .html or .json)`)
    }
  }

  const tasks = allFiles.filter((f) => f !== '.gitkeep' && (fileKind(f) === 'html' || fileKind(f) === 'json')).sort()

  if (tasks.length === 0) {
    console.log('No .html or .json files found in content-updates/ — nothing to do')
    process.exit(0)
  }

  loadEnv({ path: join(ROOT, '.env.local') })

  const projectId = requireEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', process.env.NEXT_PUBLIC_SANITY_PROJECT_ID)
  const dataset = requireEnv('NEXT_PUBLIC_SANITY_DATASET', process.env.NEXT_PUBLIC_SANITY_DATASET)
  const token = requireEnv('SANITY_API_WRITE_TOKEN', process.env.SANITY_API_WRITE_TOKEN)

  const isLive = process.argv.includes('--live')
  if (isLive) {
    console.log(`LIVE — updating dataset ${dataset}`)
  } else {
    console.log('DRY RUN — no changes written')
  }

  const client = createClient({
    projectId,
    dataset,
    token,
    apiVersion: API_VERSION,
    useCdn: false,
  })

  const blockContentType = compileBodyBlockType()
  const total = tasks.length
  let processed = 0

  for (const file of tasks) {
    processed++
    const slug = slugFromContentFile(file)
    const filePath = join(CONTENT_DIR, file)
    const kind = fileKind(file)

    const existingId = await client.fetch<string | null>(
      `*[_type == "post" && slug.current == $slug][0]._id`,
      { slug },
    )

    if (!existingId) {
      console.error(`Post with slug ${slug} not found in Sanity — skipping`)
      continue
    }

    if (kind === 'html') {
      const html = readFileSync(filePath, 'utf8')
      let newBlocks: TypedObject[]
      try {
        newBlocks = htmlToPortableBody(html, blockContentType)
      } catch (e) {
        console.error(`[${processed}/${total}] Error converting HTML for "${slug}":`, e)
        continue
      }

      const codeBlockCount = newBlocks.filter((b) => b._type === 'codeBlock').length
      const blockCount = newBlocks.length
      const summary = formatHtmlBodySummary(blockCount, codeBlockCount)

      if (!isLive) {
        console.log(`[${processed}/${total}] Would update: ${slug} (${summary})`)
        continue
      }

      await client.patch(existingId).set({ body: newBlocks }).commit()
      console.log(`[${processed}/${total}] Updated: ${slug} (${summary})`)
      continue
    }

    // JSON: simple fields only, never body
    let parsed: unknown
    try {
      parsed = JSON.parse(readFileSync(filePath, 'utf8'))
    } catch (e) {
      console.error(`[${processed}/${total}] Invalid JSON for "${file}":`, e)
      continue
    }

    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      console.error(`[${processed}/${total}] JSON for "${slug}" must be a plain object — skipping`)
      continue
    }

    const built = buildPatchFromJsonObject(parsed as Record<string, unknown>)
    if (!built) {
      console.warn(`[${processed}/${total}] JSON for "${slug}" has no supported string fields — skipping`)
      continue
    }

    const { set, labelFields } = built
    const fieldSummary = formatJsonFieldsSummary(labelFields)

    if (!isLive) {
      console.log(`[${processed}/${total}] Would update: ${slug} (${fieldSummary})`)
      continue
    }

    await client.patch(existingId).set(set).commit()
    console.log(`[${processed}/${total}] Updated: ${slug} (${fieldSummary})`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
