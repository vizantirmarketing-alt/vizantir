import 'server-only'

/**
 * Extracts positioned text items from a PDF with unpdf (a serverless build of
 * Mozilla pdf.js). Only text content is read; nothing is rendered.
 */

import { getDocumentProxy } from 'unpdf'

import type { PositionedPage } from '@/lib/new-businesses/parse'

export async function extractPositionedPages(bytes: Uint8Array): Promise<PositionedPage[]> {
  // verbosity 0: silence pdf.js font warnings, which say nothing about the text.
  const pdf = await getDocumentProxy(bytes, { verbosity: 0 })
  try {
    const pages: PositionedPage[] = []
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber)
      const content = await page.getTextContent()
      const items: PositionedPage['items'] = []
      for (const item of content.items) {
        if (!('str' in item) || typeof item.str !== 'string') continue
        const transform = item.transform as number[]
        items.push({ str: item.str, x: transform[4] ?? 0, y: transform[5] ?? 0 })
      }
      pages.push({ items })
    }
    return pages
  } finally {
    await pdf.cleanup()
  }
}
