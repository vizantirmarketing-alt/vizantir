import { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import CREWebDesignClient from './CREWebDesignClient'
import { commercialRealEstatePricingFaqs } from '@/data/industry-pricing-faqs'

const META_DESCRIPTION =
  'Custom websites for commercial real estate firms, brokerages, and property groups. Built to showcase listings, establish credibility, and generate qualified leads.'

export const metadata: Metadata = {
  title: 'Commercial Real Estate Web Design That Converts | Vizantir',
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

const creServiceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Commercial Real Estate Web Design',
  description:
    'Custom websites for commercial real estate firms, brokerages, and property groups. Built to showcase listings, establish credibility, and generate qualified leads.',
  url: 'https://www.vizantir.com/commercial-real-estate-web-design',
  provider: {
    '@type': 'LocalBusiness',
    '@id': 'https://www.vizantir.com/#business',
    name: 'Vizantir Design Studio',
  },
  areaServed: {
    '@type': 'Country',
    name: 'United States',
  },
  serviceType: 'Web design and development for commercial real estate firms and brokerages',
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How much does a commercial real estate website cost?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: commercialRealEstatePricingFaqs.cost,
      },
    },
    {
      '@type': 'Question',
      name: 'How long does it take to build a CRE website?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: commercialRealEstatePricingFaqs.timeline,
      },
    },
    {
      '@type': 'Question',
      name: 'How does the listings CMS work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: commercialRealEstatePricingFaqs.listingsCms,
      },
    },
    {
      '@type': 'Question',
      name: 'How do you handle broker and team pages?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: commercialRealEstatePricingFaqs.brokerTeamPages,
      },
    },
  ],
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://www.vizantir.com',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Commercial Real Estate Web Design',
      item: 'https://www.vizantir.com/commercial-real-estate-web-design',
    },
  ],
}

export default function CommercialRealEstateWebDesignPage() {
  return (
    <>
      <JsonLd id="ld-cre-service" data={creServiceSchema} />
      <JsonLd id="ld-faq" data={faqSchema} />
      <JsonLd id="ld-breadcrumb" data={breadcrumbSchema} />
      <CREWebDesignClient />
    </>
  )
}
