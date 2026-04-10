import { Metadata } from 'next'
import { sanityFetch } from '@/lib/sanity/client'
import { siteSettingsQuery } from '@/lib/sanity/queries'
import { JsonLd } from '@/components/seo/JsonLd'
import { collectionPageSchema, breadcrumbSchema, graphSchema } from '@/lib/schema'

const caseStudiesBreadcrumbGraph = graphSchema([
  breadcrumbSchema([
    { name: 'Home', url: 'https://www.vizantir.com' },
    { name: 'Our Work', url: 'https://www.vizantir.com/our-work' },
  ]),
])
import type { SiteSettings } from '@/lib/sanity/types'
import { getCanonicalUrl } from '@/lib/utils/metadata'
import CaseStudiesClient from './CaseStudiesClient'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await sanityFetch<SiteSettings | null>(siteSettingsQuery, {}, { tags: ['settings'] })
  
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
  const settings = await sanityFetch<SiteSettings | null>(siteSettingsQuery, {}, { tags: ['settings'] })
  
  if (!settings) {
    return (
      <>
        <JsonLd id="ld-breadcrumb" data={caseStudiesBreadcrumbGraph} />
        <CaseStudiesClient />
      </>
    )
  }

  const url = getCanonicalUrl(settings, '/case-studies')

  const caseStudies = [
    { name: 'Pink Salt Salon', url: 'https://pinksaltsalonandspa.com' },
    { name: 'Eloraé Nails', url: 'https://www.eloraenails.com' },
    { name: 'Essence of Watches', url: 'https://essenceofwatches.com' },
    { name: 'Éclat Lounge', url: 'https://eclatloungelv.com' },
    { name: 'Fuji Omakase', url: 'https://fujiomakase.com' },
    { name: 'Pétale & Fête', url: 'https://petaleandfete.com' },
    { name: 'High Roller Legal', url: 'https://highrollerlegal.com' },
  ]

  const pageGraph = graphSchema([
    collectionPageSchema({
      url,
      name: 'Websites We Have Launched',
      description: 'Modern, high-performing websites designed for speed, SEO, and conversions.',
      siteUrl: settings.siteUrl,
      items: caseStudies.map(cs => ({
        name: cs.name,
        url: cs.url,
      })),
    }),
  ])

  return (
    <>
      <JsonLd id="ld-breadcrumb" data={caseStudiesBreadcrumbGraph} />
      {pageGraph && <JsonLd id="ld-case-studies" data={pageGraph} />}
      <CaseStudiesClient />
    </>
  )
}
