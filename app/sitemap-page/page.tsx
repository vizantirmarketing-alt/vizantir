import { sanityFetch } from '@/lib/sanity/client'
import { sitemapPageQuery } from '@/lib/sanity/queries'
import type { SitemapPageData } from '@/lib/sanity/types'
import {
  sitemapIndustryPages,
  sitemapLegalPages,
  sitemapMainPages,
} from '@/data/sitemap-page'
import SitemapPageClient from './SitemapPageClient'

export const revalidate = 3600

export default async function SitemapPage() {
  const data = await sanityFetch<SitemapPageData>(sitemapPageQuery, {}, {
    tags: ['post', 'service', 'caseStudy'],
  })

  return (
    <SitemapPageClient
      mainPages={sitemapMainPages}
      industryPages={sitemapIndustryPages}
      legalPages={sitemapLegalPages}
      services={data.services ?? []}
      caseStudies={data.caseStudies ?? []}
      posts={data.posts ?? []}
    />
  )
}
