import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { sanityFetch } from '@/lib/sanity/client'
import { allPostsQuery, postBySlugQuery, siteSettingsQuery } from '@/lib/sanity/queries'
import { getCanonicalUrl, getOgImage } from '@/lib/utils/metadata'
import type { SiteSettings } from '@/lib/sanity/types'
import BlogPostContent, { type SanityBlogPost } from '@/components/blog-page/BlogPostContent'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const posts = await sanityFetch<{ slug: string }[]>(allPostsQuery, {}, { tags: ['post', 'author'] })
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params

  const [post, settings] = await Promise.all([
    sanityFetch<SanityBlogPost | null>(postBySlugQuery, { slug }, { tags: ['post', 'author'] }),
    sanityFetch<SiteSettings | null>(siteSettingsQuery, {}, { tags: ['siteSettings'] }),
  ])

  if (!post) {
    return {
      title: 'Post Not Found | Vizantir Blog',
    }
  }

  const description = post.metaDescription || post.excerpt || ''
  const url = getCanonicalUrl(settings, `/blog/${post.slug}`)

  return {
    title: post.metaTitle || `${post.title} | Vizantir Blog`,
    description,
    alternates: settings ? { canonical: url } : undefined,
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
      url,
      images: getOgImage({ pageImage: post.ogImageUrl, settings: settings ?? null, alt: post.title }),
      authors: post.author?.name ? [post.author.name] : undefined,
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      images: getOgImage({ pageImage: post.ogImageUrl, settings: settings ?? null, alt: post.title }),
    },
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = await sanityFetch<SanityBlogPost | null>(postBySlugQuery, { slug }, { tags: ['post', 'author'] })

  if (!post) {
    notFound()
  }

  return <BlogPostContent post={post} />
}
