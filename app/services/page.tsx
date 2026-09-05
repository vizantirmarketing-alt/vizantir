import { Metadata } from 'next'
import { sanityFetch } from '@/lib/sanity/client'
import { allServicesQuery, siteSettingsQuery } from '@/lib/sanity/queries'
import { JsonLd } from '@/components/seo/JsonLd'
import { collectionPageSchema, breadcrumbSchema, graphSchema, servicesOfferCatalogSchema } from '@/lib/schema'
import type { ServiceListItem, SiteSettings } from '@/lib/sanity/types'
import { getCanonicalUrl } from '@/lib/utils/metadata'
import ServicesPageClient from './ServicesPageClient'

const PAGE_TITLE = 'Website Strategy, Design & Development'
const PAGE_DESCRIPTION =
  'Custom website strategy, design, and development for established businesses, with ongoing growth after launch.'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await sanityFetch<SiteSettings | null>(siteSettingsQuery, {}, { tags: ['siteSettings'] })
  const url = getCanonicalUrl(settings, '/services')

  return {
    title: PAGE_TITLE,
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

export default async function ServicesPage() {
  const [services, settings] = await Promise.all([
    sanityFetch<ServiceListItem[]>(allServicesQuery, {}, { tags: ['service'] }),
    sanityFetch<SiteSettings | null>(siteSettingsQuery, {}, { tags: ['siteSettings'] }),
  ])

  // Order matches `allServicesQuery` only (GROQ `order(...)`). No sorting in React.
  const list = services ?? []

  if (!settings) {
    return <ServicesPageClient services={list} />
  }

  const url = `${settings.siteUrl}/services`
  const pageGraph = graphSchema([
    collectionPageSchema({
      url,
      name: 'Website Strategy, Design & Development',
      description:
        'Custom website strategy, design, development, and ongoing growth for established businesses.',
      siteUrl: settings.siteUrl,
      items: list.map((s) => ({ name: s.title, url: `${settings.siteUrl}/services/${s.slug}` })),
    }),
    servicesOfferCatalogSchema(settings.siteUrl),
    breadcrumbSchema([
      { name: 'Home', url: settings.siteUrl },
      { name: 'Services', url },
    ]),
  ])

  return (
    <>
      <JsonLd id="ld-services-index" data={pageGraph} />
      <ServicesPageClient services={list} />
    </>
  )
}
