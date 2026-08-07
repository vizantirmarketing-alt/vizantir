import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { sanityFetch } from '@/lib/sanity/client'
import { allPostsQuery, postBySlugQuery, siteSettingsQuery } from '@/lib/sanity/queries'
import { getCanonicalUrl, getOgImage } from '@/lib/utils/metadata'
import type { SiteSettings } from '@/lib/sanity/types'
import BlogPostContent, { type SanityBlogPost } from '@/components/blog-page/BlogPostContent'
import { JsonLd } from '@/components/seo/JsonLd'
import { blogPostSchema, breadcrumbSchema, graphSchema, webPageSchema } from '@/lib/schema'

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
      title: 'Post Not Found',
    }
  }

  const description = post.metaDescription || post.excerpt || ''
  const url = getCanonicalUrl(settings, `/blog/${post.slug}`)

  return {
    title: post.metaTitle || post.title,
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

  const [post, settings] = await Promise.all([
    sanityFetch<SanityBlogPost | null>(postBySlugQuery, { slug }, { tags: ['post', 'author'] }),
    sanityFetch<SiteSettings | null>(siteSettingsQuery, {}, { tags: ['siteSettings'] }),
  ])

  if (!post) {
    notFound()
  }

  const postUrl = getCanonicalUrl(settings, `/blog/${post.slug}`)
  const siteUrl = getCanonicalUrl(settings, '')

  const postGraph = graphSchema([
    webPageSchema({
      url: postUrl,
      name: post.title,
      description: post.metaDescription || post.excerpt,
      siteUrl,
      mainEntity: { '@id': `${postUrl}#article` },
      imageUrl: post.ogImageUrl,
      datePublished: post.publishedAt,
      dateModified: post._updatedAt,
    }),
    blogPostSchema(post, siteUrl),
    breadcrumbSchema([
      { name: 'Home', url: siteUrl },
      { name: 'Blog', url: `${siteUrl}/blog` },
      { name: post.title, url: postUrl },
    ]),
  ])

  return (
    <>
      <JsonLd id="ld-blog-post" data={postGraph} />
      <BlogPostContent post={post} />
    </>
  )
}
