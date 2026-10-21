import { groq } from 'next-sanity'
import { sanityFetch } from '@/lib/sanity/client'
import { allPostsQuery } from '@/lib/sanity/queries'
import { OG_CONTENT_TYPE, OG_SIZE, defaultOgImage, renderOgCard } from '@/lib/og/card'

export const alt = 'Vizantir blog post'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

const postOgQuery = groq`*[_type == "post" && slug.current == $slug][0]{ title, category, readTime }`

export async function generateStaticParams() {
  const posts = await sanityFetch<{ slug: string }[]>(allPostsQuery, {}, { tags: ['post'] })
  return posts.map((post) => ({ slug: post.slug }))
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await sanityFetch<{ title?: string; category?: string; readTime?: string } | null>(
    postOgQuery,
    { slug },
    { tags: ['post'] },
  )

  if (!post?.title) return defaultOgImage()

  return renderOgCard({ title: post.title, meta: { category: post.category, readTime: post.readTime } })
}
