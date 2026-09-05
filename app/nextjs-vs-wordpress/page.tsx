import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import {
  NEXTJS_VS_WORDPRESS_DATE,
  NEXTJS_VS_WORDPRESS_PATH,
  nextjsVsWordpressComparison,
  nextjsVsWordpressDescription,
  nextjsVsWordpressFaqs,
  nextjsVsWordpressTitle,
} from '@/data/nextjs-vs-wordpress'
import {
  breadcrumbSchema,
  faqSchema,
  graphSchema,
  itemListSchema,
  webPageSchema,
} from '@/lib/schema'
import NextJsVsWordpressClient from './NextJsVsWordpressClient'

const SITE_URL = 'https://www.vizantir.com'
const PAGE_URL = `${SITE_URL}${NEXTJS_VS_WORDPRESS_PATH}`

export const metadata: Metadata = {
  title: nextjsVsWordpressTitle,
  description: nextjsVsWordpressDescription,
  keywords: [
    'next.js vs wordpress',
    'nextjs vs wordpress',
    'should I use next.js or wordpress',
    'wordpress vs next.js',
  ],
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    title: `${nextjsVsWordpressTitle} | Vizantir`,
    description: nextjsVsWordpressDescription,
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
  twitter: {
    card: 'summary_large_image',
    title: nextjsVsWordpressTitle,
    description: nextjsVsWordpressDescription,
    images: ['https://www.vizantir.com/og-image.png'],
  },
}

const faqNode = faqSchema(nextjsVsWordpressFaqs)
const comparisonNode = itemListSchema({
  name: 'Next.js vs WordPress comparison',
  items: nextjsVsWordpressComparison.rows.map((row) => ({
    name: row.criterion,
    description: `Next.js: ${row.nextjs} WordPress: ${row.wordpress}`,
  })),
})
const breadcrumbNode = breadcrumbSchema([
  { name: 'Home', url: SITE_URL },
  { name: 'Next.js vs WordPress', url: PAGE_URL },
])

const pageGraph = graphSchema([
  webPageSchema({
    url: PAGE_URL,
    name: nextjsVsWordpressTitle,
    description: nextjsVsWordpressDescription,
    siteUrl: SITE_URL,
    mainEntity: { '@id': `${PAGE_URL}#comparison` },
    datePublished: NEXTJS_VS_WORDPRESS_DATE,
    dateModified: NEXTJS_VS_WORDPRESS_DATE,
  }),
  faqNode ? { ...faqNode, '@id': `${PAGE_URL}#faq` } : null,
  { ...comparisonNode, '@id': `${PAGE_URL}#comparison` },
  { ...breadcrumbNode, '@id': `${PAGE_URL}#breadcrumb` },
])

export default function NextJsVsWordpressPage() {
  return (
    <>
      <JsonLd id="ld-nextjs-vs-wordpress" data={pageGraph} />
      <NextJsVsWordpressClient />
    </>
  )
}
