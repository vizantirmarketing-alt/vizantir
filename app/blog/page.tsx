import { Metadata } from 'next'
import { sanityFetch } from '@/lib/sanity/client'
import { allPostsQuery, siteSettingsQuery } from '@/lib/sanity/queries'
import { JsonLd } from '@/components/seo/JsonLd'
import { collectionPageSchema, breadcrumbSchema, graphSchema } from '@/lib/schema'
import type { PostListItem, SiteSettings } from '@/lib/sanity/types'
import BlogPageClient from './BlogPageClient'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await sanityFetch<SiteSettings | null>(siteSettingsQuery, {}, { tags: ['settings'] })
  
  if (!settings) {
    return {
      title: 'Blog',
      description: 'Latest articles and insights.',
    }
  }

  return {
    title: 'Blog',
    description: 'Latest articles and insights.',
    alternates: { canonical: `${settings.siteUrl}/blog` },
  }
}

export default async function BlogPage() {
  const [posts, settings] = await Promise.all([
    sanityFetch<PostListItem[]>(allPostsQuery, {}, { tags: ['posts'] }),
    sanityFetch<SiteSettings | null>(siteSettingsQuery, {}, { tags: ['settings'] }),
  ])

  if (!settings) {
    return <BlogPageClient />
  }

  const url = `${settings.siteUrl}/blog`
  const pageGraph = graphSchema([
    collectionPageSchema({
      url,
      name: 'Blog',
      description: 'Latest articles and insights.',
      siteUrl: settings.siteUrl,
      items: (posts || []).map((p) => ({ name: p.title, url: `${settings.siteUrl}/blog/${p.slug}` })),
    }),
    breadcrumbSchema([
      { name: 'Home', url: settings.siteUrl },
      { name: 'Blog', url },
    ]),
  ])

  return (
    <>
      <JsonLd id="ld-blog-index" data={pageGraph} />
      <BlogPageClient />
    </>
  )
}
