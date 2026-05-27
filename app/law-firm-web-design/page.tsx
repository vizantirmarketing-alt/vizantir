import { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import LawFirmWebDesignClient from './LawFirmWebDesignClient'
import { lawFirmPricingFaqs } from '@/data/industry-pricing-faqs'

export const metadata: Metadata = {
  title: 'Law Firm Web Design That Builds Trust | Vizantir',
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

const lawFirmServiceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Law Firm Web Design',
  description:
    'Custom websites for law firms and legal practices. Built to establish credibility, generate consultations, and present firms at the highest level.',
  url: 'https://www.vizantir.com/law-firm-web-design',
  areaServed: {
    '@type': 'Country',
    name: 'United States',
  },
  serviceType: 'Web design and development for law firms and legal practices',
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How much does a law firm website cost?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: lawFirmPricingFaqs.cost,
      },
    },
    {
      '@type': 'Question',
      name: 'How long does it take to build a law firm website?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: lawFirmPricingFaqs.timeline,
      },
    },
    {
      '@type': 'Question',
      name: 'Do you build practice area pages?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. We structure practice area pages to clearly communicate expertise and improve search visibility for relevant legal queries.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can you work with an existing brand or logo?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. We can build around an existing brand identity or help refine it as part of the project.',
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
      name: 'Law Firm Web Design',
      item: 'https://www.vizantir.com/law-firm-web-design',
    },
  ],
}

export default function LawFirmWebDesignPage() {
  return (
    <>
      <JsonLd id="ld-law-firm-service" data={lawFirmServiceSchema} />
      <JsonLd id="ld-faq" data={faqSchema} />
      <JsonLd id="ld-breadcrumb" data={breadcrumbSchema} />
      <LawFirmWebDesignClient />
    </>
  )
}
