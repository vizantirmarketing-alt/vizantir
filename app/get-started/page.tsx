import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { getStartedDescription, getStartedSteps, getStartedTitle } from '@/data/get-started'
import {
  breadcrumbSchema,
  graphSchema,
  howToSchema,
  webPageSchema,
} from '@/lib/schema'
import { howToId } from '@/lib/schema/ids'
import GetStartedPageClient from './GetStartedPageClient'

const SITE_URL = 'https://www.vizantir.com'
const PAGE_URL = `${SITE_URL}/get-started`

export const metadata: Metadata = {
  title: getStartedTitle,
  description: getStartedDescription,
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    title: `${getStartedTitle} | Vizantir`,
    description: getStartedDescription,
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

const pageGraph = graphSchema([
  webPageSchema({
    url: PAGE_URL,
    name: getStartedTitle,
    description: getStartedDescription,
    siteUrl: SITE_URL,
    mainEntity: { '@id': howToId(PAGE_URL) },
  }),
  howToSchema({
    url: PAGE_URL,
    name: getStartedTitle,
    description: getStartedDescription,
    siteUrl: SITE_URL,
    steps: getStartedSteps.map((step) => ({
      name: step.title,
      text: step.description,
    })),
  }),
  breadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: getStartedTitle, url: PAGE_URL },
  ]),
])

export default function GetStartedPage() {
  return (
    <>
      <JsonLd id="ld-get-started" data={pageGraph} />
      <GetStartedPageClient />
    </>
  )
}
