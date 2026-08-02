import type { Metadata } from 'next'
import type { Faq } from '@/components/homepage/FAQSection'
import { JsonLd } from '@/components/seo/JsonLd'
import { sanityFetch } from '@/lib/sanity/client'
import { faqPageFaqsQuery } from '@/lib/sanity/queries'
import { breadcrumbSchema, graphSchema } from '@/lib/schema'
import FAQPageClient from './FAQPageClient'

const PAGE_URL = 'https://www.vizantir.com/faq'
const PAGE_TITLE = 'Web Design FAQs & Answers'
const PAGE_DESCRIPTION =
  'Find answers to common questions about timelines, pricing and our approach to premium website design and development, all in one place.'

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    title: `${PAGE_TITLE} | Vizantir`,
    description: PAGE_DESCRIPTION,
    url: PAGE_URL,
    siteName: 'Vizantir',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://www.vizantir.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Vizantir Design Studio - Premium Web Design Las Vegas',
      },
    ],
  },
}

const breadcrumbGraph = graphSchema([
  breadcrumbSchema([
    { name: 'Home', url: 'https://www.vizantir.com' },
    { name: 'FAQ', url: PAGE_URL },
  ]),
])

export default async function FAQPage() {
  const faqs = await sanityFetch<Faq[]>(faqPageFaqsQuery, {}, { tags: ['faq'] })

  return (
    <>
      <JsonLd id="ld-breadcrumb" data={breadcrumbGraph} />
      <FAQPageClient faqs={faqs} />
    </>
  )
}
