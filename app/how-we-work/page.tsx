import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import {
  howWeWorkComparisonColumns,
  howWeWorkFaqs,
  howWeWorkProcess,
} from '@/data/how-we-work'
import {
  breadcrumbSchema,
  faqSchema,
  graphSchema,
  howToSchema,
  itemListSchema,
  webPageSchema,
} from '@/lib/schema'
import { howToId } from '@/lib/schema/ids'
import HowWeWorkPageClient from './HowWeWorkPageClient'

const SITE_URL = 'https://www.vizantir.com'
const PAGE_URL = `${SITE_URL}/how-we-work`
const PAGE_TITLE = 'Our Web Design Process & Collaboration'
const PAGE_DESCRIPTION =
  'Discover our collaborative process from discovery to launch that ensures high-performance websites aligned with your vision and business goals.'

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

const pageGraph = graphSchema([
  webPageSchema({
    url: PAGE_URL,
    name: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    siteUrl: SITE_URL,
    mainEntity: { '@id': howToId(PAGE_URL) },
  }),
  howToSchema({
    url: PAGE_URL,
    name: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    siteUrl: SITE_URL,
    steps: howWeWorkProcess.map((step) => ({
      name: step.title,
      text: step.description,
    })),
  }),
  faqSchema(howWeWorkFaqs, PAGE_URL),
  itemListSchema({
    items: howWeWorkComparisonColumns.map((column) => ({
      name: column.name,
      description: column.items.join(' '),
    })),
  }),
  breadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'How We Work', url: PAGE_URL },
  ]),
])

export default function HowWeWorkPage() {
  return (
    <>
      <JsonLd id="ld-how-we-work" data={pageGraph} />
      <HowWeWorkPageClient />
    </>
  )
}
