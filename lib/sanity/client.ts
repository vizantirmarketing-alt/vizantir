import { createClient } from 'next-sanity'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = '2024-01-01'

// Standard client (uses CDN in production)
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === 'production',
})

// Fresh client (bypasses CDN — use for sitemap, critical paths)
export const freshClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
})

interface FetchOptions {
  tags?: string[]
  revalidate?: number | false
  fresh?: boolean
}

/**
 * Primary fetch function with cache tag support
 * Tags enable instant on-demand revalidation via webhook
 */
export async function sanityFetch<T>(
  query: string,
  params: Record<string, unknown> = {},
  options: FetchOptions = {}
): Promise<T> {
  const { tags = [], revalidate = 3600, fresh = false } = options
  const selectedClient = fresh ? freshClient : client

  return selectedClient.fetch<T>(query, params, {
    next: {
      revalidate: revalidate === false ? 0 : revalidate,
      tags,
    },
  })
}

/**
 * Always-fresh fetch (bypasses all caching)
 * Use for sitemap, robots.txt, and dev debugging
 */
export async function sanityFetchFresh<T>(
  query: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  return freshClient.fetch<T>(query, params, {
    next: { revalidate: 0 },
  })
}

