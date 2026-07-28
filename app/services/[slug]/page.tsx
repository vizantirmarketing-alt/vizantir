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
import { getOgImage, getCanonicalUrl } from '@/lib/utils/metadata'
import type { Service, SiteSettings } from '@/lib/sanity/types'

import ServicePageContent from './ServicePageContent'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const services = await sanityFetch<{ slug: string }[]>(
    allServicesQuery,
    {},
    { tags: ['service'] }
  )
  return services.map((service) => ({ slug: service.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  const [service, settings] = await Promise.all([
    sanityFetch<Service>(serviceBySlugQuery, { slug }, { tags: ['service'] }),
    sanityFetch<SiteSettings | null>(siteSettingsQuery, {}, { tags: ['siteSettings'] }),
  ])

  if (!service || !settings) return {}

  const url = getCanonicalUrl(settings, `/services/${service.slug}`)
  const baseTitle = service.metaTitle || service.title
  const siteName = settings.siteName || 'Vizantir'
  const socialTitle = baseTitle.endsWith(siteName)
    ? baseTitle
    : `${baseTitle} | ${siteName}`

  return {
    title: baseTitle,
    description: service.metaDescription || service.description,
    alternates: { canonical: url },
    openGraph: {
      title: socialTitle,
      description: service.metaDescription || service.description,
      url,
      type: 'website',
      images: getOgImage({ pageImage: service.ogImageUrl, settings, alt: service.title }),
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description: service.metaDescription || service.description,
      images: getOgImage({ pageImage: service.ogImageUrl, settings, alt: service.title }),
    },
  }
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params

  const [service, settings] = await Promise.all([
    sanityFetch<Service>(serviceBySlugQuery, { slug }, { tags: ['service'] }),
    sanityFetch<SiteSettings | null>(siteSettingsQuery, {}, { tags: ['siteSettings'] }),
  ])

  if (!service || !settings) notFound()

  const url = getCanonicalUrl(settings, `/services/${service.slug}`)

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
      <ServicePageContent service={service} />
    </>
  )
}
