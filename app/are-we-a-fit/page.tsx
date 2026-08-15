import type { Metadata } from 'next'

import { JsonLd } from '@/components/seo/JsonLd'
import { areWeAFitMetadata, areWeAFitPageContent } from '@/data/are-we-a-fit'
import { breadcrumbSchema, graphSchema } from '@/lib/schema'

import AreWeAFitPageClient from './AreWeAFitPageClient'

const areWeAFitDescription =
  'Honest criteria on whether Vizantir is the right premium web design studio for your business. Read this before booking a Strategy Call.'

export const metadata: Metadata = {
  ...areWeAFitMetadata,
  title: 'Are We a Fit?',
  description: areWeAFitDescription,
  openGraph: {
    ...(typeof areWeAFitMetadata.openGraph === 'object' && areWeAFitMetadata.openGraph !== null
      ? areWeAFitMetadata.openGraph
      : {}),
    title: 'Are We a Fit? | Vizantir',
    description: areWeAFitDescription,
    url: 'https://www.vizantir.com/are-we-a-fit',
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
          title: 'Are We a Fit? | Vizantir',
          description: areWeAFitDescription,
        }
      : areWeAFitMetadata.twitter,
}

const breadcrumbGraph = graphSchema([
  breadcrumbSchema([
    { name: 'Home', url: 'https://www.vizantir.com' },
    { name: 'Are We a Fit?', url: 'https://www.vizantir.com/are-we-a-fit' },
  ]),
])

export default function AreWeAFitPage() {
  return (
    <>
      <JsonLd id="ld-breadcrumb" data={breadcrumbGraph} />
      <AreWeAFitPageClient content={areWeAFitPageContent} />
    </>
  )
}
