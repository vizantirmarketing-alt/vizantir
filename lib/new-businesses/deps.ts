import 'server-only'

/** Production wiring for the New Businesses import. */

import { LISTING_URL } from '@/lib/new-businesses/discovery'
import { fetchSourceBytes, fetchSourceText } from '@/lib/new-businesses/fetch'
import type { ImportDeps } from '@/lib/new-businesses/import'
import { extractPositionedPages } from '@/lib/new-businesses/pdf'
import { createNewBusinessStore } from '@/lib/new-businesses/store'

export function createImportDeps(): ImportDeps {
  return {
    store: createNewBusinessStore(),
    fetchListing: () => fetchSourceText(LISTING_URL),
    fetchPdf: (url) => fetchSourceBytes(url, { accept: 'application/pdf' }),
    extractPages: extractPositionedPages,
    now: () => new Date(),
  }
}
