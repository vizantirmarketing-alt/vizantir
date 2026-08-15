import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbSchema, graphSchema } from '@/lib/schema'
import GetStartedPageClient from './GetStartedPageClient'

const PAGE_URL = 'https://www.vizantir.com/get-started'
const PAGE_TITLE = 'Get Started'
const PAGE_DESCRIPTION =
  'Fixed scope, fixed price, direct access to the builder. From first call to launch, here\'s how every project runs.'

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
    { name: 'Get Started', url: PAGE_URL },
  ]),
])

export default function GetStartedPage() {
  return (
    <>
      <JsonLd id="ld-breadcrumb" data={breadcrumbGraph} />
      <GetStartedPageClient />
    </>
  )
}
