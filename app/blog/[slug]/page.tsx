import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { sanityFetch } from '@/lib/sanity/client'
import { allPostsQuery, postBySlugQuery, relatedPostsQuery, siteSettingsQuery } from '@/lib/sanity/queries'
import { pickRelatedPosts, type RelatedPostsQueryResult } from '@/lib/blog-related'
import { resolveArticleCta } from '@/data/blog-commercial-links'
import { getCanonicalUrl, getOgImage } from '@/lib/utils/metadata'
import type { SiteSettings } from '@/lib/sanity/types'
import { ShareBar } from '@/components/blog/ShareBar'
import { ArticleCta } from '@/components/blog-page/ArticleCta'
import BlogPostContent, { type SanityBlogPost } from '@/components/blog-page/BlogPostContent'
import { RelatedPosts } from '@/components/blog-page/RelatedPosts'
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
      title: { absolute: 'Post Not Found | Vizantir' },
    }
  }

  const description = post.metaDescription || post.excerpt || ''
  const url = getCanonicalUrl(settings, `/blog/${post.slug}`)
  const pageTitle = post.metaTitle || post.title
  const ogImage = getOgImage({
    pageImage: post.ogImageUrl,
    settings: settings ?? null,
    alt: post.title,
  }) ?? [
    {
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: post.title,
    },
  ]

  return {
    title: { absolute: `${pageTitle} | Vizantir` },
    description,
    alternates: { canonical: url },
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
      url,
      images: ogImage,
      authors: post.author?.name ? [post.author.name] : undefined,
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      images: ogImage,
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

  const relatedBundle = await sanityFetch<RelatedPostsQueryResult>(
    relatedPostsQuery,
    { slug: post.slug, category: post.category ?? '' },
    { tags: ['post'] },
  )
  const relatedPosts = pickRelatedPosts(relatedBundle)
  const articleCta = resolveArticleCta(post.slug, post.category)

  const canonicalUrl = getCanonicalUrl(settings, `/blog/${post.slug}`)
  const siteUrl = getCanonicalUrl(settings, '')

  const postGraph = graphSchema([
    webPageSchema({
      url: canonicalUrl,
      name: post.title,
      description: post.metaDescription || post.excerpt,
      siteUrl,
      mainEntity: { '@id': `${canonicalUrl}#article` },
      imageUrl: post.ogImageUrl,
      datePublished: post.publishedAt,
      dateModified: post._updatedAt,
    }),
    blogPostSchema(post, siteUrl),
    breadcrumbSchema([
      { name: 'Home', url: siteUrl },
      { name: 'Blog', url: `${siteUrl}/blog` },
      { name: post.title, url: canonicalUrl },
    ]),
  ])

  return (
    <>
      <JsonLd id="ld-blog-post" data={postGraph} />
      <BlogPostContent post={post}>
        <ShareBar title={post.metaTitle || post.title} url={canonicalUrl} />
        <ArticleCta href={articleCta.href} label={articleCta.label} />
        <RelatedPosts posts={relatedPosts} />
      </BlogPostContent>
    </>
  )
}
