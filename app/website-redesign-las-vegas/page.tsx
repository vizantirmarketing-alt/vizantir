import { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { redesignPageData } from '@/data/website-redesign-las-vegas'
import WebsiteRedesignLasVegasPage from '@/components/pages/website-redesign-las-vegas'

const canonicalUrl = 'https://www.vizantir.com/website-redesign-las-vegas'

export const metadata: Metadata = {
  title: 'Website Redesign Las Vegas | Vizantir Design Studio',
  description:
    'Las Vegas website redesign studio. We rebuild underperforming sites on Next.js 16 — faster, better structured, and built to convert. Fixed-scope projects for established businesses.',
  alternates: {
    canonical: canonicalUrl,
  },
  openGraph: {
    title: 'Website Redesign Las Vegas | Vizantir Design Studio',
    description:
      'Las Vegas website redesign studio. We rebuild underperforming sites on Next.js 16 — faster, better structured, and built to convert.',
    url: canonicalUrl,
    siteName: 'Vizantir',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Vizantir - Website Redesign Las Vegas',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
}

const professionalServiceSchema = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'Website Redesign Las Vegas',
  description:
    'Website redesign and rebuild service for established businesses in Las Vegas and Southern Nevada. Custom Next.js development, fixed-scope projects.',
  url: canonicalUrl,
  areaServed: [
    { '@type': 'City', name: 'Las Vegas' },
    { '@type': 'City', name: 'Henderson' },
    { '@type': 'City', name: 'Summerlin' },
    { '@type': 'City', name: 'Paradise' },
    { '@type': 'State', name: 'Nevada' },
  ],
  serviceType: 'Website redesign and development',
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: redesignPageData.faqs.items.map((faq) => ({
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
      <WebsiteRedesignLasVegasPage />
    </>
  )
}
