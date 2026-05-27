import { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import CREWebDesignClient from './CREWebDesignClient'
import { commercialRealEstatePricingFaqs } from '@/data/industry-pricing-faqs'

export const metadata: Metadata = {
  title: 'Commercial Real Estate Web Design | Vizantir',
  description:
    'Custom websites for commercial real estate firms, brokerages, and property groups. Built to showcase listings, establish credibility, and generate qualified leads.',
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
    title: 'Commercial Real Estate Web Design | Vizantir',
    description:
      'Custom websites for commercial real estate firms, brokerages, and property groups. Built to showcase listings, establish credibility, and generate qualified leads.',
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
    title: 'Commercial Real Estate Web Design | Vizantir',
    description:
      'Custom websites for commercial real estate firms, brokerages, and property groups. Built to showcase listings, establish credibility, and generate qualified leads.',
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
      name: 'Can you integrate property listings into the site?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. We build CMS-driven listing pages so your team can add, update, and remove properties without touching code.',
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
      name: 'Do you work with developers and property management firms as well as brokerages?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. We work with brokerages, developers, property management groups, and investment firms across the US.',
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
