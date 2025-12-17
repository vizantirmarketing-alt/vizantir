import { Metadata } from 'next'
import { sanityFetch } from '@/lib/sanity/client'
import { allServicesQuery, siteSettingsQuery } from '@/lib/sanity/queries'
import { JsonLd } from '@/components/seo/JsonLd'
import { collectionPageSchema, breadcrumbSchema, graphSchema } from '@/lib/schema'
import type { ServiceListItem, SiteSettings } from '@/lib/sanity/types'
import ServicesPageClient from './ServicesPageClient'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await sanityFetch<SiteSettings | null>(siteSettingsQuery, {}, { tags: ['settings'] })
  
  if (!settings) {
    return {
      title: 'Services',
      description: 'Our professional services.',
    }
  }

  return {
    title: 'Services',
    description: 'Our professional services.',
    alternates: { canonical: `${settings.siteUrl}/services` },
  }
}

export default async function ServicesPage() {
  const [services, settings] = await Promise.all([
    sanityFetch<ServiceListItem[]>(allServicesQuery, {}, { tags: ['services'] }),
    sanityFetch<SiteSettings | null>(siteSettingsQuery, {}, { tags: ['settings'] }),
  ])

  if (!settings) {
    return <ServicesPageClient />
  }

  const url = `${settings.siteUrl}/services`
  const pageGraph = graphSchema([
    collectionPageSchema({
      url,
      name: 'Our Services',
      description: 'Professional services we offer.',
      siteUrl: settings.siteUrl,
      items: (services || []).map((s) => ({ name: s.title, url: `${settings.siteUrl}/services/${s.slug}` })),
    }),
    breadcrumbSchema([
      { name: 'Home', url: settings.siteUrl },
      { name: 'Services', url },
    ]),
  ])

  return (
    <>
      <JsonLd id="ld-services-index" data={pageGraph} />
      <ServicesPageClient />
    </>
  )
}