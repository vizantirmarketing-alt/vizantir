import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbSchema, graphSchema } from '@/lib/schema'
import HowWeWorkPageClient from './HowWeWorkPageClient'

const PAGE_URL = 'https://www.vizantir.com/how-we-work'
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

const breadcrumbGraph = graphSchema([
  breadcrumbSchema([
    { name: 'Home', url: 'https://www.vizantir.com' },
    { name: 'How We Work', url: PAGE_URL },
  ]),
])

export default function HowWeWorkPage() {
  return (
    <>
      <JsonLd id="ld-breadcrumb" data={breadcrumbGraph} />
      <HowWeWorkPageClient />
    </>
  )
}
