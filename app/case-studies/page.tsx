import { Metadata } from 'next'
import { sanityFetch } from '@/lib/sanity/client'
import { siteSettingsQuery } from '@/lib/sanity/queries'
import { JsonLd } from '@/components/seo/JsonLd'
import { collectionPageSchema, breadcrumbSchema, graphSchema } from '@/lib/schema'
import type { SiteSettings } from '@/lib/sanity/types'
import { getCanonicalUrl } from '@/lib/utils/metadata'
import CaseStudiesClient from './CaseStudiesClient'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await sanityFetch<SiteSettings | null>(siteSettingsQuery, {}, { tags: ['settings'] })
  
  if (!settings) {
    return {
      title: 'Websites We Have Launched | Vizantir',
      description: 'Modern, high-performing websites designed for speed, SEO, and conversions.',
    }
  }

  const url = getCanonicalUrl(settings, '/case-studies')

  return {
    title: 'Websites We Have Launched | Vizantir',
    description: 'Modern, high-performing websites designed for speed, SEO, and conversions.',
    alternates: { canonical: url },
    openGraph: {
      title: 'Websites We Have Launched | Vizantir',
      description: 'Modern, high-performing websites designed for speed, SEO, and conversions.',
      url,
      type: 'website',
      images: settings.ogImageUrl ? [{ url: settings.ogImageUrl }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Websites We Have Launched | Vizantir',
      description: 'Modern, high-performing websites designed for speed, SEO, and conversions.',
      images: settings.ogImageUrl ? [settings.ogImageUrl] : undefined,
    },
  }
}

export default async function CaseStudiesPage() {
  const settings = await sanityFetch<SiteSettings | null>(siteSettingsQuery, {}, { tags: ['settings'] })
  
  if (!settings) {
    return <CaseStudiesClient />
  }

  const url = getCanonicalUrl(settings, '/case-studies')

  const caseStudies = [
    { name: 'Pink Salt Salon', url: 'https://pinksaltsalonandspa.com' },
    { name: 'Essence of Watches', url: 'https://essenceofwatches.com' },
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
    breadcrumbSchema([
      { name: 'Home', url: settings.siteUrl },
      { name: 'Websites We Have Launched', url },
    ]),
  ])

  return (
    <>
      {pageGraph && <JsonLd id="ld-case-studies" data={pageGraph} />}
      <CaseStudiesClient />
    </>
  )
}
