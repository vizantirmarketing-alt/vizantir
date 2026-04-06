import { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import HospitalityWebDesignClient from './HospitalityWebDesignClient'

export const metadata: Metadata = {
  title: 'Hospitality Web Design for Restaurants & Hotels | Vizantir',
  description:
    'Custom websites for restaurants, hotels, lounges and hospitality groups. Built on Next.js for speed, bookings, and a stronger first impression.',
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
    description:
      'Custom websites for restaurants, hotels, lounges and hospitality groups. Built on Next.js for speed, bookings, and a stronger first impression.',
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
    description:
      'Custom websites for restaurants, hotels, lounges and hospitality groups. Built on Next.js for speed, bookings, and a stronger first impression.',
    images: ['/og-image.png'],
  },
}

const hospitalityServiceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Hospitality Web Design',
  description:
    'Custom websites for restaurants, hotels, lounges and hospitality groups. Built on Next.js for speed, reservations, and brand presence.',
  url: 'https://www.vizantir.com/hospitality-web-design',
  provider: {
    '@type': 'Organization',
    name: 'Vizantir',
    url: 'https://www.vizantir.com',
    telephone: '+1-702-289-0758',
    email: 'info@vizantir.com',
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
        text: 'Custom restaurant websites at Vizantir start at $15,000. The investment covers strategy, design, development, and CMS integration so your team can update menus and events without a developer.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can you integrate with OpenTable or Resy?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. We build reservation integrations directly into the site so guests can book without leaving your page.',
      },
    },
    {
      '@type': 'Question',
      name: 'How long does it take to build a restaurant website?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Most hospitality projects take 6-10 weeks from kickoff to launch, depending on scope and content readiness.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do you work with hotels as well as restaurants?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. We work with restaurants, hotels, lounges, event venues, and other hospitality businesses across the US.',
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
