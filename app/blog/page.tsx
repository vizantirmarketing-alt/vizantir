import { Metadata } from 'next'
import { sanityFetch } from '@/lib/sanity/client'
import { allPostsQuery, siteSettingsQuery } from '@/lib/sanity/queries'
import { JsonLd } from '@/components/seo/JsonLd'
import { collectionPageSchema, breadcrumbSchema, graphSchema } from '@/lib/schema'
import type { SiteSettings } from '@/lib/sanity/types'
import { getCanonicalUrl } from '@/lib/utils/metadata'
import BlogPageClient, { type SanityBlogPostPreview } from './BlogPageClient'

const PAGE_TITLE = 'Insights & Guides'
const PAGE_DESCRIPTION =
  'Practical answers to the questions business owners ask most about websites, SEO, performance, and choosing the right platform.'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await sanityFetch<SiteSettings | null>(siteSettingsQuery, {}, { tags: ['siteSettings'] })
  const url = getCanonicalUrl(settings, '/blog')

  return {
    title: { absolute: `${PAGE_TITLE} | Vizantir` },
    description: PAGE_DESCRIPTION,
    alternates: { canonical: url },
    openGraph: {
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      url,
      type: 'website',
    },
  }
}

export default async function BlogPage() {
  const [posts, settings] = await Promise.all([
    sanityFetch<SanityBlogPostPreview[]>(allPostsQuery, {}, { tags: ['post', 'author'] }),
    sanityFetch<SiteSettings | null>(siteSettingsQuery, {}, { tags: ['siteSettings'] }),
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
