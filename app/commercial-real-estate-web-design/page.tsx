import { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import CREWebDesignClient from './CREWebDesignClient'
import { commercialRealEstatePricingFaqItems } from '@/data/industry-pricing-faqs'
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
  'Custom websites for commercial real estate firms, brokerages, and property groups. Built to showcase listings, establish credibility, and generate qualified leads.'

export const metadata: Metadata = {
  title: { absolute: 'Commercial Real Estate Web Design That Converts | Vizantir' },
  description: META_DESCRIPTION,
  keywords: [
    'commercial real estate web design',
    'CRE website design',
    'real estate brokerage website',
    'next.js commercial real estate websites',
    'property listing website design',
    'CRE web development',
  ],
  alternates: {
    canonical: 'https://www.vizantir.com/commercial-real-estate-web-design',
  },
  openGraph: {
    title: 'Commercial Real Estate Web Design That Converts | Vizantir',
    description: META_DESCRIPTION,
    url: 'https://www.vizantir.com/commercial-real-estate-web-design',
    siteName: 'Vizantir',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Vizantir - Commercial Real Estate Web Design',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Commercial Real Estate Web Design That Converts | Vizantir',
    description: META_DESCRIPTION,
    images: ['/og-image.png'],
  },
}

const SITE_URL = 'https://www.vizantir.com'
const PAGE_URL = `${SITE_URL}/commercial-real-estate-web-design`
const offerNodes = projectOfferSchemas(PAGE_URL)

const pageGraph = graphSchema([
  webPageSchema({
    url: PAGE_URL,
    name: 'Commercial Real Estate Web Design That Converts',
    description: META_DESCRIPTION,
    siteUrl: SITE_URL,
    mainEntity: { '@id': pageServiceId(PAGE_URL) },
  }),
  pageServiceSchema({
    url: PAGE_URL,
    name: 'Commercial Real Estate Web Design',
    description:
      'Custom websites for commercial real estate firms, brokerages, and property groups. Built to showcase listings, establish credibility, and generate qualified leads.',
    siteUrl: SITE_URL,
    serviceType: 'Web design and development for commercial real estate firms and brokerages',
    offers: offerNodes.map((offer) => ({ '@id': offer['@id'] })),
  }),
  ...offerNodes,
  faqSchema(commercialRealEstatePricingFaqItems, PAGE_URL),
  breadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Commercial Real Estate Web Design', url: PAGE_URL },
  ]),
])

export default function CommercialRealEstateWebDesignPage() {
  return (
    <>
      <JsonLd id="ld-commercial-real-estate-web-design" data={pageGraph} />
      <CREWebDesignClient />
    </>
  )
}
