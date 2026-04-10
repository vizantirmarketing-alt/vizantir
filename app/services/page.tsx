import { Metadata } from 'next'
import { sanityFetch } from '@/lib/sanity/client'
import { allServicesQuery, siteSettingsQuery } from '@/lib/sanity/queries'
import { JsonLd } from '@/components/seo/JsonLd'
import { collectionPageSchema, breadcrumbSchema, graphSchema } from '@/lib/schema'
import type { ServiceListItem, SiteSettings } from '@/lib/sanity/types'
import ServicesPageClient from './ServicesPageClient'

const servicesPageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: 'Website Design and Development',
  areaServed: {
    '@type': 'Country',
    name: 'United States',
  },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Website Design Services',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Website Strategy',
          description:
            'Before we design anything, we map the site to your business goals, your buyers, and the trust signals that convert them.',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Web Design',
          description:
            'Original, custom design built around your brand. No templates. No shortcuts. Every layout decision made with your buyer in mind.',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Web Development',
          description:
            'Custom Next.js builds that load fast and hold up over time',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Website Refreshes',
          description:
            "Already have a site? We rebuild the structure, design, and performance without starting from scratch where it isn't needed.",
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'CMS Integrations',
          description:
            'Sanity, WordPress, and custom CMS setups that give your team control over content without depending on a developer for every change.',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Website Care',
          description:
            'Monthly retainers for updates, monitoring, performance improvements, and ongoing support after launch.',
        },
      },
    ],
  },
  offers: [
    {
      '@type': 'Offer',
      name: 'Essentials',
      price: '15000',
      priceCurrency: 'USD',
      description: 'Focused custom website build',
    },
    {
      '@type': 'Offer',
      name: 'Growth',
      price: '30000',
      priceCurrency: 'USD',
      description: 'Full custom website with advanced features',
    },
    {
      '@type': 'Offer',
      name: 'Enterprise',
      price: '60000',
      priceCurrency: 'USD',
      description: 'Enterprise-level custom website build',
    },
  ],
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await sanityFetch<SiteSettings | null>(siteSettingsQuery, {}, { tags: ['settings'] })
  
  if (!settings) {
    return {
      title: 'Website Strategy, Design & Development Services | Vizantir',
      description:
        'Explore our services including strategy, design, development, CMS integrations and ongoing care tailored for hospitality, legal and luxury brands.',
    }
  }

  return {
    title: 'Website Strategy, Design & Development Services | Vizantir',
    description:
      'Explore our services including strategy, design, development, CMS integrations and ongoing care tailored for hospitality, legal and luxury brands.',
    alternates: { canonical: `${settings.siteUrl}/services` },
  }
}

export default async function ServicesPage() {
  const [services, settings] = await Promise.all([
    sanityFetch<ServiceListItem[]>(allServicesQuery, {}, { tags: ['services'] }),
    sanityFetch<SiteSettings | null>(siteSettingsQuery, {}, { tags: ['settings'] }),
  ])

  if (!settings) {
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesPageJsonLd) }}
        />
        <ServicesPageClient />
      </>
    )
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesPageJsonLd) }}
      />
      <JsonLd id="ld-services-index" data={pageGraph} />
      <ServicesPageClient />
    </>
  )
}