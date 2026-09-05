import type { Metadata } from 'next'
import type { Faq } from '@/components/homepage/FAQSection'
import { JsonLd } from '@/components/seo/JsonLd'
import { sanityFetch } from '@/lib/sanity/client'
import { faqPageFaqsQuery } from '@/lib/sanity/queries'
import { breadcrumbSchema, faqSchema, graphSchema, webPageSchema } from '@/lib/schema'
import { refFaq } from '@/lib/schema/ids'
import FAQPageClient from './FAQPageClient'

const SITE_URL = 'https://www.vizantir.com'
const PAGE_URL = `${SITE_URL}/faq`
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

export default async function FAQPage() {
  const faqs = await sanityFetch<Faq[]>(faqPageFaqsQuery, {}, { tags: ['faq'] })

  const faqNode = faqSchema(faqs, PAGE_URL)
  const pageGraph = graphSchema([
    webPageSchema({
      url: PAGE_URL,
      name: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      siteUrl: SITE_URL,
      mainEntity: faqNode ? refFaq(PAGE_URL) : undefined,
    }),
    faqNode,
    breadcrumbSchema([
      { name: 'Home', url: SITE_URL },
      { name: 'FAQ', url: PAGE_URL },
    ]),
  ])

  return (
    <>
      <JsonLd id="ld-faq" data={pageGraph} />
      <FAQPageClient faqs={faqs} />
    </>
  )
}
