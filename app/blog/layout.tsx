import { Metadata } from 'next'

const PAGE_TITLE = 'Web Design Insights for Business Owners'
const PAGE_DESCRIPTION =
  'Practical answers to the questions business owners ask most about websites, SEO, performance, and choosing the right platform.'

export const metadata: Metadata = {
  title: { absolute: `${PAGE_TITLE} | Vizantir` },
  description: PAGE_DESCRIPTION,
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    type: 'website',
    images: [{ url: 'https://www.vizantir.com/og-image.png', width: 1200, height: 630, alt: 'Vizantir Design Studio - Premium Web Design Las Vegas' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: ['https://www.vizantir.com/og-image.png'],
  },
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children
}

