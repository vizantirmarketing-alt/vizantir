import type { Metadata } from 'next'

import { JsonLd } from '@/components/seo/JsonLd'
import {
  areWeAFitFaqs,
  areWeAFitMetadata,
  areWeAFitPageContent,
  areWeAFitPageDescription,
  areWeAFitPageTitle,
} from '@/data/are-we-a-fit'
import { breadcrumbSchema, faqSchema, graphSchema, webPageSchema } from '@/lib/schema'
import { faqId } from '@/lib/schema/ids'

import AreWeAFitPageClient from './AreWeAFitPageClient'

const SITE_URL = 'https://www.vizantir.com'
const PAGE_URL = `${SITE_URL}/are-we-a-fit`

export const metadata: Metadata = {
  ...areWeAFitMetadata,
  title: { absolute: `${areWeAFitPageTitle} | Vizantir` },
  description: areWeAFitPageDescription,
  openGraph: {
    ...(typeof areWeAFitMetadata.openGraph === 'object' && areWeAFitMetadata.openGraph !== null
      ? areWeAFitMetadata.openGraph
      : {}),
    title: `${areWeAFitPageTitle} | Vizantir`,
    description: areWeAFitPageDescription,
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
  twitter:
    typeof areWeAFitMetadata.twitter === 'object' && areWeAFitMetadata.twitter !== null
      ? {
          ...areWeAFitMetadata.twitter,
          title: `${areWeAFitPageTitle} | Vizantir`,
          description: areWeAFitPageDescription,
        }
      : areWeAFitMetadata.twitter,
}

const pageGraph = graphSchema([
  webPageSchema({
    url: PAGE_URL,
    name: areWeAFitPageTitle,
    description: areWeAFitPageDescription,
    siteUrl: SITE_URL,
    mainEntity: { '@id': faqId(PAGE_URL) },
  }),
  faqSchema(areWeAFitFaqs, PAGE_URL),
  breadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: areWeAFitPageTitle, url: PAGE_URL },
  ]),
])

export default function AreWeAFitPage() {
  return (
    <>
      <JsonLd id="ld-are-we-a-fit" data={pageGraph} />
      <AreWeAFitPageClient content={areWeAFitPageContent} />
    </>
  )
}
