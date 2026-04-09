import { MetadataRoute } from 'next'
import { sanityFetchFresh } from '@/lib/sanity/client'
import { sitemapQuery, siteSettingsQuery } from '@/lib/sanity/queries'
import type { SitemapData, SiteSettings } from '@/lib/sanity/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, data] = await Promise.all([
    sanityFetchFresh<Pick<SiteSettings, 'siteUrl'>>(siteSettingsQuery),
    sanityFetchFresh<SitemapData>(sitemapQuery),
  ])

  const baseUrl = settings?.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://vizantir.com'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/services`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: 'https://www.vizantir.com/las-vegas-web-design', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: 'https://www.vizantir.com/hospitality-web-design', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: 'https://www.vizantir.com/law-firm-web-design', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: 'https://www.vizantir.com/commercial-real-estate-web-design', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: 'https://www.vizantir.com/our-work', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://www.vizantir.com/how-we-work', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: 'https://www.vizantir.com/get-started', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  ]

  // Dynamic pages from Sanity
  const postPages: MetadataRoute.Sitemap = (data?.posts || []).map((p) => ({
    url: `${baseUrl}/blog/${p.slug}`,
    lastModified: new Date(p._updatedAt),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const servicePages: MetadataRoute.Sitemap = (data?.services || []).map((s) => ({
    url: `${baseUrl}/services/${s.slug}`,
    lastModified: new Date(s._updatedAt),
    changeFrequency: 'monthly',
    priority: 0.9,
  }))

  const locationPages: MetadataRoute.Sitemap = (data?.locations || []).map((l) => ({
    url: `${baseUrl}/locations/${l.slug}`,
    lastModified: new Date(l._updatedAt),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  return [...staticPages, ...postPages, ...servicePages, ...locationPages]
}





