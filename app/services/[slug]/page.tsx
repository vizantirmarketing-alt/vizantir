import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { sanityFetch } from '@/lib/sanity/client'
import { serviceBySlugQuery, allServicesQuery, siteSettingsQuery } from '@/lib/sanity/queries'
import { JsonLd } from '@/components/seo/JsonLd'
import {
  webPageSchema,
  serviceSchema,
  faqSchema,
  breadcrumbSchema,
  graphSchema,
} from '@/lib/schema'
import { serviceId } from '@/lib/schema/ids'
import type { Service, SiteSettings } from '@/lib/sanity/types'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const services = await sanityFetch<{ slug: string }[]>(
    allServicesQuery,
    {},
    { tags: ['services'] }
  )
  return services.map((service) => ({ slug: service.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  const [service, settings] = await Promise.all([
    sanityFetch<Service>(serviceBySlugQuery, { slug }, { 
      tags: ['services', `service-${slug}`] 
    }),
    sanityFetch<SiteSettings | null>(siteSettingsQuery, {}, { tags: ['settings'] }),
  ])

  if (!service || !settings) return {}

  const url = `${settings.siteUrl}/services/${service.slug}`

  return {
    title: service.metaTitle || service.title,
    description: service.metaDescription || service.description,
    alternates: { canonical: url },
    openGraph: {
      title: service.metaTitle || service.title,
      description: service.metaDescription || service.description,
      url,
      type: 'website',
      images: service.ogImageUrl 
        ? [{ url: service.ogImageUrl }]
        : settings.ogImageUrl 
        ? [{ url: settings.ogImageUrl }]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: service.metaTitle || service.title,
      description: service.metaDescription || service.description,
    },
  }
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params

  const [service, settings] = await Promise.all([
    sanityFetch<Service>(serviceBySlugQuery, { slug }, { 
      tags: ['services', `service-${slug}`] 
    }),
    sanityFetch<SiteSettings | null>(siteSettingsQuery, {}, { tags: ['settings'] }),
  ])

  if (!service || !settings) notFound()

  const url = `${settings.siteUrl}/services/${service.slug}`

  // Build page-specific schema graph
  const pageGraph = graphSchema([
    webPageSchema({
      url,
      name: service.title,
      description: service.metaDescription || service.description,
      siteUrl: settings.siteUrl,
      mainEntity: { '@id': serviceId(settings.siteUrl, service.slug) },
      imageUrl: service.ogImageUrl || settings.ogImageUrl,
    }),
    serviceSchema(service, settings.siteUrl),
    breadcrumbSchema([
      { name: 'Home', url: settings.siteUrl },
      { name: 'Services', url: `${settings.siteUrl}/services` },
      { name: service.title, url },
    ]),
    faqSchema(service.faqs),
  ])

  return (
    <>
      <JsonLd id={`ld-page-${service.slug}`} data={pageGraph} />
      
      <main>
        {/* Your page content here */}
        <h1>{service.heroHeadline || service.title}</h1>
        {/* ... */}
      </main>
    </>
  )
}
