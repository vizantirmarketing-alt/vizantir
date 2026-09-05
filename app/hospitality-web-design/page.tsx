import { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import HospitalityWebDesignClient from './HospitalityWebDesignClient'
import { hospitalityPricingFaqItems } from '@/data/industry-pricing-faqs'
import {
  breadcrumbSchema,
  faqSchema,
  graphSchema,
  pageServiceSchema,
  projectOfferSchemas,
  webPageSchema,
} from '@/lib/schema'
import { pageServiceId } from '@/lib/schema/ids'

const META_DESCRIPTION =
  'Custom websites for restaurants, hotels, and lounges. Built on Next.js for mobile speed, bookings that convert, and a first impression that matches the venue.'

export const metadata: Metadata = {
  title: { absolute: 'Hospitality Web Design for Restaurants & Hotels | Vizantir' },
  description: META_DESCRIPTION,
  keywords: [
    'hospitality web design',
    'restaurant website design',
    'hotel website design',
    'next.js hospitality websites',
    'restaurant web development',
    'boutique hotel website',
  ],
  alternates: {
    canonical: 'https://www.vizantir.com/hospitality-web-design',
  },
  openGraph: {
    title: 'Hospitality Web Design for Restaurants & Hotels | Vizantir',
    description: META_DESCRIPTION,
    url: 'https://www.vizantir.com/hospitality-web-design',
    siteName: 'Vizantir',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Vizantir - Hospitality Web Design',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hospitality Web Design for Restaurants & Hotels | Vizantir',
    description: META_DESCRIPTION,
    images: ['/og-image.png'],
  },
}

const SITE_URL = 'https://www.vizantir.com'
const PAGE_URL = `${SITE_URL}/hospitality-web-design`
const offerNodes = projectOfferSchemas(PAGE_URL)

const pageGraph = graphSchema([
  webPageSchema({
    url: PAGE_URL,
    name: 'Hospitality Web Design for Restaurants & Hotels',
    description: META_DESCRIPTION,
    siteUrl: SITE_URL,
    mainEntity: { '@id': pageServiceId(PAGE_URL) },
  }),
  pageServiceSchema({
    url: PAGE_URL,
    name: 'Hospitality Web Design',
    description:
      'Custom websites for restaurants, hotels, and lounges. Built on Next.js for mobile speed, bookings that convert, and a first impression that matches the venue.',
    siteUrl: SITE_URL,
    serviceType: 'Web design and development for hospitality businesses',
    offers: offerNodes.map((offer) => ({ '@id': offer['@id'] })),
  }),
  ...offerNodes,
  faqSchema(hospitalityPricingFaqItems, PAGE_URL),
  breadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Hospitality Web Design', url: PAGE_URL },
  ]),
])

export default function HospitalityWebDesignPage() {
  return (
    <>
      <JsonLd id="ld-hospitality-web-design" data={pageGraph} />
      <HospitalityWebDesignClient />
    </>
  )
}
