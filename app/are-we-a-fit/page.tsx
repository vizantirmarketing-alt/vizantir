import type { Metadata } from 'next'

import { JsonLd } from '@/components/seo/JsonLd'
import { areWeAFitMetadata, areWeAFitPageContent } from '@/data/are-we-a-fit'
import { breadcrumbSchema, graphSchema } from '@/lib/schema'

import AreWeAFitPageClient from './AreWeAFitPageClient'

export const metadata: Metadata = areWeAFitMetadata

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
