import { MetadataRoute } from 'next'
import { sanityFetch } from '@/lib/sanity/client'
import { sitemapQuery, siteSettingsQuery } from '@/lib/sanity/queries'
import type { SitemapData, SiteSettings } from '@/lib/sanity/types'

export const revalidate = 3600

/**
 * Real content-modification dates for hardcoded routes.
 *
 * Sanity-backed pages derive lastModified from `_updatedAt`. These routes have
 * no CMS record, so the date lives here. Update the entry when the page's
 * content actually changes — not on every deploy.
 *
 * Do not replace these with `new Date()`. Emitting a fresh timestamp on every
 * regeneration tells Google the whole site changed every hour, which causes it
 * to discount lastmod as a scheduling signal across the entire property.
 */
const STATIC_PAGE_DATES: Record<string, string> = {
  '': '2026-07-10',
  '/about': '2026-07-10',
  '/contact': '2026-07-10',
  '/services': '2026-07-10',
  '/blog': '2026-07-10',
  '/faq': '2026-07-10',
  '/las-vegas-web-design': '2026-07-10',
  '/hospitality-web-design': '2026-07-10',
  '/law-firm-web-design': '2026-07-10',
  '/commercial-real-estate-web-design': '2026-07-10',
  '/website-redesign-las-vegas': '2026-07-10',
  '/landing-pages': '2026-07-10',
  '/landing-pages/for-google-ads': '2026-07-10',
  '/landing-pages/for-product-launches': '2026-07-10',
  '/case-studies': '2026-07-10',
  '/how-we-work': '2026-07-10',
  '/are-we-a-fit': '2026-07-10',
  '/get-started': '2026-07-10',
  '/industries': '2026-07-10',
  '/technology': '2026-07-10',
}

type StaticRoute = {
  path: string
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
  priority: number
}

/**
 * Excluded from the XML sitemap by design:
 *
 *   /privacy, /terms, /cookies, /copyright
 *     Legal boilerplate. Carries a noindex directive; submitting it wastes
 *     crawl allocation on pages that will never earn an impression.
 *
 *   /technology/{slug} (14 URLs)
 *     Stack reference pages. No commercial search intent — nobody hires a
 *     studio by searching "tailwind". Pages stay live and remain linked from
 *     /technology and /sitemap-page, so internal link equity and topical
 *     signal are preserved. Already-indexed ones will not be dropped;
 *     sitemap omission is not a deindex request.
 */
const STATIC_ROUTES: StaticRoute[] = [
  { path: '', changeFrequency: 'weekly', priority: 1 },

  // Commercial intent — highest crawl priority
  { path: '/las-vegas-web-design', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/hospitality-web-design', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/law-firm-web-design', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/commercial-real-estate-web-design', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/landing-pages', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/landing-pages/for-google-ads', changeFrequency: 'weekly', priority: 0.85 },
  { path: '/landing-pages/for-product-launches', changeFrequency: 'weekly', priority: 0.85 },

  // Conversion path
  { path: '/get-started', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/are-we-a-fit', changeFrequency: 'monthly', priority: 0.75 },

  // Hubs — these distribute crawl to their children
  { path: '/services', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/blog', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/case-studies', changeFrequency: 'monthly', priority: 0.8 },

  // Supporting
  { path: '/website-redesign-las-vegas', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/how-we-work', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/industries', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/technology', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/faq', changeFrequency: 'monthly', priority: 0.6 },
]

function staticDate(path: string): Date {
  const iso = STATIC_PAGE_DATES[path]
  return iso ? new Date(`${iso}T00:00:00Z`) : new Date('2026-07-10T00:00:00Z')
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, data] = await Promise.all([
    sanityFetch<Pick<SiteSettings, 'siteUrl'>>(siteSettingsQuery, {}, { tags: ['siteSettings'] }),
    sanityFetch<SitemapData>(sitemapQuery, {}, {
      tags: ['post', 'service', 'caseStudy', 'location'],
    }),
  ])

  const baseUrl = (
    settings?.siteUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://www.vizantir.com'
  ).replace(/\/$/, '')

  const staticPages: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: staticDate(route.path),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

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
    ...postPages,
    ...servicePages,
    ...caseStudyPages,
    ...locationPages,
  ]
}