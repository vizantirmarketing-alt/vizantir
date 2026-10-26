import { NextResponse } from 'next/server'

import { sanityFetch } from '@/lib/sanity/client'
import { searchPostsQuery } from '@/lib/sanity/queries'
import type { SanityBlogPostPreview } from '@/app/blog/BlogPageClient'

export const dynamic = 'force-dynamic'

const MAX_QUERY_LENGTH = 80

export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get('q') ?? '').trim().slice(0, MAX_QUERY_LENGTH)

  const posts =
    q.length < 2
      ? []
      : await sanityFetch<SanityBlogPostPreview[]>(
          searchPostsQuery,
          { q: q + '*' },
          { tags: ['post', 'author'], fresh: false },
        )

  return NextResponse.json(
    { posts },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
  )
}
