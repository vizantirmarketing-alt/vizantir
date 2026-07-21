import { MetadataRoute } from 'next'
import { CORE_STACK, SPECIALIZED_TOOLS } from '@/app/technology/_data'
import { sanityFetch } from '@/lib/sanity/client'
import { sitemapQuery, siteSettingsQuery } from '@/lib/sanity/queries'
import type { SitemapData, SiteSettings } from '@/lib/sanity/types'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, data] = await Promise.all([
    sanityFetch<Pick<SiteSettings, 'siteUrl'>>(siteSettingsQuery, {}, { tags: ['siteSettings'] }),
    sanityFetch<SitemapData>(sitemapQuery, {}, {
      tags: ['post', 'service', 'caseStudy', 'location'],
    }),
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
    { url: `${baseUrl}/las-vegas-web-design`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/hospitality-web-design`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/law-firm-web-design`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/commercial-real-estate-web-design`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/website-redesign-las-vegas`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/landing-pages`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/landing-pages/for-google-ads`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/landing-pages/for-product-launches`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/case-studies`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/how-we-work`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/are-we-a-fit`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.75 },
    { url: `${baseUrl}/get-started`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/cookies`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/copyright`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/industries`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/technology`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ]

  const technologyPages: MetadataRoute.Sitemap = [...CORE_STACK, ...SPECIALIZED_TOOLS].map(
    (tech) => ({
      url: `${baseUrl}/technology/${tech.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }),
  )

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

  const caseStudyPages: MetadataRoute.Sitemap = (data?.caseStudies || []).map((c) => ({
    url: `${baseUrl}/case-studies/${c.slug}`,
    lastModified: new Date(c._updatedAt),
    changeFrequency: 'monthly',
    priority: 0.75,
  }))

  const locationPages: MetadataRoute.Sitemap = (data?.locations || []).map((l) => ({
    url: `${baseUrl}/locations/${l.slug}`,
    lastModified: new Date(l._updatedAt),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  return [
    ...staticPages,
    ...technologyPages,
    ...postPages,
    ...servicePages,
    ...caseStudyPages,
    ...locationPages,
  ]
}
