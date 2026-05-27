import { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import LasVegasWebDesignPage from '@/components/pages/las-vegas-web-design'
import { lasVegasPageData } from '@/data/las-vegas-web-design'

const canonicalUrl = 'https://www.vizantir.com/las-vegas-web-design'

export const metadata: Metadata = {
  title: 'Las Vegas Web Design Studio | Vizantir Design Studio',
  description:
    'Custom web design and Next.js development for Las Vegas businesses. Fixed-scope projects from a local studio serving Henderson, Summerlin, Paradise, and clients nationwide.',
  alternates: {
    canonical: canonicalUrl,
  },
  openGraph: {
    title: 'Las Vegas Web Design Studio | Vizantir Design Studio',
    description:
      'Custom web design and Next.js development for Las Vegas businesses. Fixed-scope projects from a local studio serving Henderson, Summerlin, Paradise, and clients nationwide.',
    url: canonicalUrl,
    siteName: 'Vizantir',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Vizantir - Las Vegas Web Design Studio',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
}

const professionalServiceSchema = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'Las Vegas Web Design',
  description:
    'Custom web design and Next.js development for established businesses in Las Vegas and Southern Nevada.',
  url: canonicalUrl,
  areaServed: [
    { '@type': 'City', name: 'Las Vegas' },
    { '@type': 'City', name: 'Henderson' },
    { '@type': 'City', name: 'Summerlin' },
    { '@type': 'City', name: 'Paradise' },
    { '@type': 'State', name: 'Nevada' },
  ],
  serviceType: 'Web design and development',
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: lasVegasPageData.faqs.items.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
}

export default function Page() {
  return (
    <>
      <JsonLd id="ld-professional-service" data={professionalServiceSchema} />
      <JsonLd id="ld-faq" data={faqSchema} />
      <LasVegasWebDesignPage />
    </>
  )
}
