import { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import HospitalityWebDesignClient from './HospitalityWebDesignClient'
import { hospitalityPricingFaqs } from '@/data/industry-pricing-faqs'

const META_DESCRIPTION =
  'Custom websites for restaurants, hotels, and lounges. Built on Next.js for mobile speed, bookings that convert, and a first impression that matches the venue.'

export const metadata: Metadata = {
  title: 'Hospitality Web Design for Restaurants & Hotels',
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

const hospitalityServiceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Hospitality Web Design',
  description:
    'Custom websites for restaurants, hotels, and lounges. Built on Next.js for mobile speed, bookings that convert, and a first impression that matches the venue.',
  url: 'https://www.vizantir.com/hospitality-web-design',
  provider: {
    '@type': 'LocalBusiness',
    '@id': 'https://www.vizantir.com/#business',
    name: 'Vizantir Design Studio',
  },
  areaServed: {
    '@type': 'Country',
    name: 'United States',
  },
  serviceType: 'Web design and development for hospitality businesses',
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How much does a restaurant website cost?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: hospitalityPricingFaqs.cost,
      },
    },
    {
      '@type': 'Question',
      name: 'How long does it take to build a restaurant website?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: hospitalityPricingFaqs.timeline,
      },
    },
    {
      '@type': 'Question',
      name: 'Which booking systems do you integrate with?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: hospitalityPricingFaqs.bookingIntegrations,
      },
    },
    {
      '@type': 'Question',
      name: 'Can our team update menus without a developer?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: hospitalityPricingFaqs.menuUpdates,
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
      name: 'Hospitality Web Design',
      item: 'https://www.vizantir.com/hospitality-web-design',
    },
  ],
}

export default function HospitalityWebDesignPage() {
  return (
    <>
      <JsonLd id="ld-hospitality-service" data={hospitalityServiceSchema} />
      <JsonLd id="ld-faq" data={faqSchema} />
      <JsonLd id="ld-breadcrumb" data={breadcrumbSchema} />
      <HospitalityWebDesignClient />
    </>
  )
}
