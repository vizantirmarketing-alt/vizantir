import { Metadata } from 'next'
import { sanityFetch } from '@/lib/sanity/client'
import { allCaseStudiesQuery, siteSettingsQuery } from '@/lib/sanity/queries'
import { JsonLd } from '@/components/seo/JsonLd'
import { collectionPageSchema, breadcrumbSchema, graphSchema } from '@/lib/schema'

const caseStudiesBreadcrumbGraph = graphSchema([
  breadcrumbSchema([
    { name: 'Home', url: 'https://www.vizantir.com' },
    { name: 'Our Work', url: 'https://www.vizantir.com/case-studies' },
  ]),
])
import type { SiteSettings } from '@/lib/sanity/types'
import { getCanonicalUrl } from '@/lib/utils/metadata'
import CaseStudiesClient from './CaseStudiesClient'
import type { CaseStudyListItem } from '@/lib/sanity/types'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await sanityFetch<SiteSettings | null>(siteSettingsQuery, {}, { tags: ['siteSettings'] })
  
  if (!settings) {
    return {
      title: 'Website Case Studies & Success Stories | Vizantir',
      description:
        'See how we transform restaurant, legal and real estate brands with custom Next.js websites that deliver results and elevate their digital presence.',
    }
  }

  const url = getCanonicalUrl(settings, '/case-studies')

  return {
    title: 'Website Case Studies & Success Stories | Vizantir',
    description:
      'See how we transform restaurant, legal and real estate brands with custom Next.js websites that deliver results and elevate their digital presence.',
    alternates: { canonical: url },
    openGraph: {
      title: 'Website Case Studies & Success Stories | Vizantir',
      description:
        'See how we transform restaurant, legal and real estate brands with custom Next.js websites that deliver results and elevate their digital presence.',
      url,
      type: 'website',
      images: settings.ogImageUrl ? [{ url: settings.ogImageUrl }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Website Case Studies & Success Stories | Vizantir',
      description:
        'See how we transform restaurant, legal and real estate brands with custom Next.js websites that deliver results and elevate their digital presence.',
      images: settings.ogImageUrl ? [settings.ogImageUrl] : undefined,
    },
  }
}

export default async function CaseStudiesPage() {
  const [settings, caseStudies] = await Promise.all([
    sanityFetch<SiteSettings | null>(siteSettingsQuery, {}, { tags: ['siteSettings'] }),
    sanityFetch<CaseStudyListItem[]>(allCaseStudiesQuery, {}, { tags: ['caseStudy'] }),
  ])

  console.log('[case-studies] Sanity titles:', caseStudies.map((cs) => cs.title))

  if (!settings) {
    return (
      <>
        <JsonLd id="ld-breadcrumb" data={caseStudiesBreadcrumbGraph} />
        <CaseStudiesClient caseStudies={caseStudies} />
      </>
    )
  }

  const url = getCanonicalUrl(settings, '/case-studies')

  const pageGraph = graphSchema([
    collectionPageSchema({
      url,
      name: 'Websites We Have Launched',
      description: 'Modern websites built to load fast, rank well, and convert visitors',
      siteUrl: settings.siteUrl,
      items: caseStudies.map(cs => ({
        name: cs.title,
        url: `${settings.siteUrl}/case-studies/${cs.slug}`,
      })),
    }),
  ])

  return (
    <>
      <JsonLd id="ld-breadcrumb" data={caseStudiesBreadcrumbGraph} />
      {pageGraph && <JsonLd id="ld-case-studies" data={pageGraph} />}
      <CaseStudiesClient caseStudies={caseStudies} />
    </>
  )
}
