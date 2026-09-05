import type { Metadata } from 'next'
import { sanityFetch } from '@/lib/sanity/client'
import { sitemapPageQuery } from '@/lib/sanity/queries'
import type { SitemapPageData } from '@/lib/sanity/types'
import {
  sitemapIndustryPages,
  sitemapLandingPages,
  sitemapLegalPages,
  sitemapMainPages,
  sitemapTechnologyPages,
} from '@/data/sitemap-page'
import SitemapPageClient from './SitemapPageClient'

const PAGE_URL = 'https://www.vizantir.com/sitemap-page'
const PAGE_TITLE = 'Sitemap'
const PAGE_DESCRIPTION =
  'Browse every page on the Vizantir website. Services, industries, case studies, blog posts, and more.'

export const metadata: Metadata = {
  title: { absolute: `${PAGE_TITLE} | Vizantir` },
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    title: `${PAGE_TITLE} | Vizantir`,
    description: PAGE_DESCRIPTION,
    url: PAGE_URL,
    siteName: 'Vizantir',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://www.vizantir.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Vizantir Design Studio - Premium Web Design Las Vegas',
      },
    ],
  },
}

export const revalidate = 3600

export default async function SitemapPage() {
  const data = await sanityFetch<SitemapPageData>(sitemapPageQuery, {}, {
    tags: ['post', 'service', 'caseStudy'],
  })

  return (
    <SitemapPageClient
      mainPages={sitemapMainPages}
      industryPages={sitemapIndustryPages}
      landingPages={sitemapLandingPages}
      technologyPages={sitemapTechnologyPages}
      legalPages={sitemapLegalPages}
      services={data.services ?? []}
      caseStudies={data.caseStudies ?? []}
      posts={data.posts ?? []}
    />
  )
}
