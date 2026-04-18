import { Metadata } from 'next'
import { sanityFetch } from '@/lib/sanity/client'
import { allPostsQuery, siteSettingsQuery } from '@/lib/sanity/queries'
import { JsonLd } from '@/components/seo/JsonLd'
import { collectionPageSchema, breadcrumbSchema, graphSchema } from '@/lib/schema'
import type { SiteSettings } from '@/lib/sanity/types'
import BlogPageClient, { type SanityBlogPostPreview } from './BlogPageClient'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await sanityFetch<SiteSettings | null>(siteSettingsQuery, {}, { tags: ['settings'] })

  if (!settings) {
    return {
      title: 'Insights & Resources on Web Design & Strategy | Vizantir Blog',
      description:
        'Read articles on website strategy, design trends, technology and best practices for hospitality, legal and luxury brands written by our experts.',
    }
  }

  return {
    title: 'Insights & Resources on Web Design & Strategy | Vizantir Blog',
    description:
      'Read articles on website strategy, design trends, technology and best practices for hospitality, legal and luxury brands written by our experts.',
    alternates: { canonical: `${settings.siteUrl}/blog` },
  }
}

export default async function BlogPage() {
  const [posts, settings] = await Promise.all([
    sanityFetch<SanityBlogPostPreview[]>(allPostsQuery, {}, { tags: ['posts'] }),
    sanityFetch<SiteSettings | null>(siteSettingsQuery, {}, { tags: ['settings'] }),
  ])

  const postList = posts ?? []

  if (!settings) {
    return <BlogPageClient posts={postList} />
  }

  const url = `${settings.siteUrl}/blog`
  const pageGraph = graphSchema([
    collectionPageSchema({
      url,
      name: 'Blog',
      description: 'Latest articles and insights.',
      siteUrl: settings.siteUrl,
      items: postList.map((p) => ({ name: p.title, url: `${settings.siteUrl}/blog/${p.slug}` })),
    }),
    breadcrumbSchema([
      { name: 'Home', url: settings.siteUrl },
      { name: 'Blog', url },
    ]),
  ])

  return (
    <>
      <JsonLd id="ld-blog-index" data={pageGraph} />
      <BlogPageClient posts={postList} />
    </>
  )
}
