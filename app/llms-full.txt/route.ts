import { NextResponse } from 'next/server'

import { getKnowledgeBlob } from '@/lib/chat/knowledge'

const MODEL_INSTRUCTION_LINE =
  /^(use only the information below\b|do not (quote|present|use|invent|mention)\b|plan detail only \(not public products\))/i

function isModelInstruction(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed) return false
  if (MODEL_INSTRUCTION_LINE.test(trimmed)) return true
  return /\bto answer questions about vizantir\b/i.test(trimmed)
}

function toPublicKnowledgeBlob(blob: string): string {
  const body = blob
    .split('\n')
    .filter((line) => !isModelInstruction(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd()

  return `${body}\n`
}

export async function GET() {
  const body = toPublicKnowledgeBlob(await getKnowledgeBlob())
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, must-revalidate',
    },
  })
}
