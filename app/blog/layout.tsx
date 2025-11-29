import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog | Vizantir - Web Development Insights & Guides',
  description:
    'Practical answers to the questions business owners ask most about websites, SEO, WordPress, Next.js, performance, and security.',
  keywords:
    'web development blog, WordPress vs Next.js, website SEO, web performance, business website tips',
  openGraph: {
    title: 'Blog | Vizantir',
    description:
      'Practical answers to the questions business owners ask most about websites, SEO, and choosing the right platform.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog | Vizantir',
    description:
      'Practical answers to the questions business owners ask most about websites, SEO, and choosing the right platform.',
  },
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children
}

