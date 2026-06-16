import { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import BlogWritingPageClient from './BlogWritingPageClient'

export const metadata: Metadata = {
  title: 'Premium Blog Writing — Human-Written, Published Live | Vizantir',
  description:
    'Human-written blog content that sounds like your brand — researched, SEO-optimized, and published directly into your site. Not AI-generated, not cheap volume content.',
  keywords: [
    'blog writing service',
    'premium blog content',
    'human-written blog posts',
    'SEO blog writing',
    'blog publishing service',
    'content writing for websites',
  ],
  alternates: {
    canonical: 'https://www.vizantir.com/blog-writing',
  },
  openGraph: {
    title: 'Premium Blog Writing — Human-Written, Published Live | Vizantir',
    description:
      'Human-written blog content that sounds like your brand — researched, SEO-optimized, and published directly into your site. Not AI-generated, not cheap volume content.',
    url: 'https://www.vizantir.com/blog-writing',
    siteName: 'Vizantir',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Vizantir - Premium Blog Writing',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Premium Blog Writing — Human-Written, Published Live | Vizantir',
    description:
      'Human-written blog content that sounds like your brand — researched, SEO-optimized, and published directly into your site.',
    images: ['/og-image.png'],
  },
}

const blogWritingServiceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Premium Blog Writing',
  description:
    'Human-written blog content researched, SEO-optimized, and published directly into client websites.',
  url: 'https://www.vizantir.com/blog-writing',
  areaServed: {
    '@type': 'Country',
    name: 'United States',
  },
  serviceType: 'Blog writing and publishing',
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://www.vizantir.com',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Blog Writing',
      item: 'https://www.vizantir.com/blog-writing',
    },
  ],
}

export default function BlogWritingPage() {
  return (
    <>
      <JsonLd id="ld-blog-writing-service" data={blogWritingServiceSchema} />
      <JsonLd id="ld-blog-writing-breadcrumb" data={breadcrumbSchema} />
      <BlogWritingPageClient />
    </>
  )
}
