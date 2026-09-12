import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { sanityFetch } from '@/lib/sanity/client'
import { allPostsQuery, postBySlugQuery, relatedPostsQuery, siteSettingsQuery } from '@/lib/sanity/queries'
import { pickRelatedPosts, type RelatedPostsQueryResult } from '@/lib/blog-related'
import { resolveArticleCta } from '@/data/blog-commercial-links'
import { getCanonicalUrl, getOgImage } from '@/lib/utils/metadata'
import type { SiteSettings } from '@/lib/sanity/types'
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

  const relatedBundle = await sanityFetch<RelatedPostsQueryResult>(
    relatedPostsQuery,
    { slug: post.slug, category: post.category ?? '' },
    { tags: ['post'] },
  )
  const relatedPosts = pickRelatedPosts(relatedBundle)
  const articleCta = resolveArticleCta(post.slug, post.category)

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
      <BlogPostContent post={post}>
        <ArticleCta href={articleCta.href} label={articleCta.label} />
        <RelatedPosts posts={relatedPosts} />
      </BlogPostContent>
    </>
  )
}
