import { NextResponse } from 'next/server'

import { getKnowledgeBlob } from '@/lib/chat/knowledge'
import { sanityFetch } from '@/lib/sanity/client'
import { chatAllCaseStudiesQuery } from '@/lib/sanity/queries'

const MODEL_INSTRUCTION_LINE =
  /^(use only the information below\b|do not (quote|present|use|invent|mention)\b|plan detail only \(not public products\))/i

/** Live sites listed in /llms.txt. Case studies have no concept/client field. */
const LAUNCHED_SITE_SLUGS = [
  'elorae-nails',
  'beacon-of-light-music',
  'evolve-dance-center',
  'golden-era-integra',
  'pink-salt-salon',
] as const

type ChatCaseStudy = {
  title?: string
  slug?: string
  industry?: string
  summary?: string
  challenge?: string
  solution?: string
  results?: string
  stack?: string[]
  siteUrl?: string
}

function isModelInstruction(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed) return false
  if (MODEL_INSTRUCTION_LINE.test(trimmed)) return true
  return /\bto answer questions about vizantir\b/i.test(trimmed)
}

function launchedCaseStudies(items: ChatCaseStudy[]): ChatCaseStudy[] {
  const bySlug = new Map(
    items
      .filter((item): item is ChatCaseStudy & { slug: string } => typeof item.slug === 'string')
      .map((item) => [item.slug, item]),
  )

  return LAUNCHED_SITE_SLUGS.flatMap((slug) => {
    const item = bySlug.get(slug)
    return item ? [item] : []
  })
}

function formatLaunchedCaseStudies(items: ChatCaseStudy[]): string {
  const entries = launchedCaseStudies(items)
    .map((item) =>
      [
        `### ${item.title}`,
        item.industry && `Industry: ${item.industry}`,
        item.summary,
        item.challenge && `Challenge: ${item.challenge}`,
        item.solution && `Solution: ${item.solution}`,
        item.results && `Results: ${item.results}`,
        Array.isArray(item.stack) && item.stack.length ? `Stack: ${item.stack.join(', ')}` : '',
        item.siteUrl && `Live site: ${item.siteUrl}`,
      ]
        .filter(Boolean)
        .join('\n'),
    )
    .join('\n\n')

  return [
    '## CASE STUDIES',
    '',
    'Live sites built by the studio.',
    entries ? `\n${entries}` : '',
    '',
  ].join('\n')
}

const NEXT_CASE_STUDIES_SECTION = /^## (FREQUENTLY ASKED QUESTIONS|FOUNDER)$/m

function replaceCaseStudiesSection(blob: string, replacement: string): string {
  const start = blob.search(/^## CASE STUDIES$/m)
  if (start === -1) {
    return `${blob.trimEnd()}\n\n${replacement}`
  }

  const afterHeading = blob.slice(start + '## CASE STUDIES'.length)
  const nextRel = afterHeading.search(NEXT_CASE_STUDIES_SECTION)
  const end = nextRel === -1 ? blob.length : start + '## CASE STUDIES'.length + nextRel

  return `${blob.slice(0, start)}${replacement}${blob.slice(end)}`
}

function toPublicKnowledgeBlob(blob: string, caseStudies: ChatCaseStudy[]): string {
  const withoutInstructions = blob
    .split('\n')
    .filter((line) => !isModelInstruction(line))
    .join('\n')

  const body = replaceCaseStudiesSection(
    withoutInstructions,
    formatLaunchedCaseStudies(caseStudies),
  )
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd()

  return `${body}\n`
}

export async function GET() {
  const [blob, caseStudies] = await Promise.all([
    getKnowledgeBlob(),
    sanityFetch<ChatCaseStudy[]>(chatAllCaseStudiesQuery, {}, { tags: ['caseStudy'] }),
  ])
  const body = toPublicKnowledgeBlob(blob, caseStudies ?? [])
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, must-revalidate',
    },
  })
}
