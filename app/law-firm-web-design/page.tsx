import { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import LawFirmWebDesignClient from './LawFirmWebDesignClient'
import { lawFirmPricingFaqItems } from '@/data/industry-pricing-faqs'
import {
  breadcrumbSchema,
  faqSchema,
  graphSchema,
  pageServiceSchema,
  projectOfferSchemas,
  webPageSchema,
} from '@/lib/schema'
import { pageServiceId } from '@/lib/schema/ids'

export const metadata: Metadata = {
  title: 'Law Firm Web Design That Builds Trust',
  description:
    'Custom websites for law firms and legal practices. Built to establish credibility, generate consultations, and present your firm at the highest level.',
  keywords: [
    'law firm web design',
    'attorney website design',
    'legal practice website',
    'next.js law firm websites',
    'law firm web development',
    'lawyer website design',
  ],
  alternates: {
    canonical: 'https://www.vizantir.com/law-firm-web-design',
  },
  openGraph: {
    title: 'Law Firm Web Design That Builds Trust | Vizantir',
    description:
      'Custom websites for law firms and legal practices. Built to establish credibility, generate consultations, and present your firm at the highest level.',
    url: 'https://www.vizantir.com/law-firm-web-design',
    siteName: 'Vizantir',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Vizantir - Law Firm Web Design',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Law Firm Web Design That Builds Trust | Vizantir',
    description:
      'Custom websites for law firms and legal practices. Built to establish credibility, generate consultations, and present your firm at the highest level.',
    images: ['/og-image.png'],
  },
}

const SITE_URL = 'https://www.vizantir.com'
const PAGE_URL = `${SITE_URL}/law-firm-web-design`
const offerNodes = projectOfferSchemas(PAGE_URL)

const pageGraph = graphSchema([
  webPageSchema({
    url: PAGE_URL,
    name: 'Law Firm Web Design That Builds Trust',
    description:
      'Custom websites for law firms and legal practices. Built to establish credibility, generate consultations, and present your firm at the highest level.',
    siteUrl: SITE_URL,
    mainEntity: { '@id': pageServiceId(PAGE_URL) },
  }),
  pageServiceSchema({
    url: PAGE_URL,
    name: 'Law Firm Web Design',
    description:
      'Custom websites for law firms and legal practices. Built to establish credibility, generate consultations, and present firms at the highest level.',
    siteUrl: SITE_URL,
    serviceType: 'Web design and development for law firms and legal practices',
    offers: offerNodes.map((offer) => ({ '@id': offer['@id'] })),
  }),
  ...offerNodes,
  faqSchema(lawFirmPricingFaqItems, PAGE_URL),
  breadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Law Firm Web Design', url: PAGE_URL },
  ]),
])

export default function LawFirmWebDesignPage() {
  return (
    <>
      <JsonLd id="ld-law-firm-web-design" data={pageGraph} />
      <LawFirmWebDesignClient />
    </>
  )
}
