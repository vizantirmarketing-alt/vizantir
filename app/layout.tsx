import type { Metadata } from 'next'
import localFont from 'next/font/local'

import { sanityFetch } from '@/lib/sanity/client'
import { siteSettingsQuery } from '@/lib/sanity/queries'
import type { SiteSettings } from '@/lib/sanity/types'

import Navbar from '@/components/navbar/Navbar'

import Footer from '@/components/footer/Footer'

import SmoothScroll from '@/components/SmoothScroll'

import ScrollProgress from '@/components/ScrollProgress'

import { ScrollToTop } from '@/components/ScrollToTop'

import DeferredChatbase from '@/components/DeferredChatbase'

import { Analytics } from '@vercel/analytics/next'

import './globals.css'

const organizationLocalBusinessJsonLd = {
  '@context': 'https://schema.org',
  '@type': ['Organization', 'LocalBusiness'],
  name: 'Vizantir',
  url: 'https://www.vizantir.com',
  logo: 'https://www.vizantir.com/logo/logo-light.svg',
  image: 'https://www.vizantir.com/assets/aboutstory.jpeg',
  description:
    'Premium website design studio based in Las Vegas building custom websites for hospitality groups, law firms, commercial real estate firms, and established businesses nationwide.',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Las Vegas',
    addressRegion: 'NV',
    postalCode: '89139',
    addressCountry: 'US',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 36.1699,
    longitude: -115.1398,
  },
  telephone: '+17022890758',
  email: 'info@vizantir.com',
  priceRange: '$$$',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '5.0',
    reviewCount: '2',
    bestRating: '5',
    worstRating: '1',
  },
  review: [
    {
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '5',
        bestRating: '5',
      },
      author: {
        '@type': 'Person',
        name: 'Eloraé Nails',
      },
      reviewBody: 'Highly recommend if you want a stress free, high quality website.',
    },
    {
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '5',
        bestRating: '5',
      },
      author: {
        '@type': 'Person',
        name: 'Elorae',
      },
      reviewBody:
        'I previously had a WordPress website and was constantly dealing with malware issues, slow performance, and maintenance headaches. Working with Vizantir completely changed that. They rebuilt my site and now it\'s clean, fast, secure, and actually reflects my brand. The process was easy and professional from start to finish. Highly recommend if you want a stress free, high quality website.',
    },
  ],
  serviceArea: {
    '@type': 'Country',
    name: 'United States',
  },
  sameAs: [
    'https://www.linkedin.com/company/vizantir/',
    'https://www.instagram.com/vizantirdesignstudio',
    'https://maps.google.com/?cid=7927126809305841776',
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Website Design Services',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Website Strategy' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Web Design' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Web Development' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Website Refreshes' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'CMS Integrations' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Website Care' } },
    ],
  },
}

// Load Satoshi font family
const satoshi = localFont({
  src: [
    {
      path: '../public/assets/fonts/Satoshi-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/assets/fonts/Satoshi-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/assets/fonts/Satoshi-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../public/assets/fonts/Satoshi-Black.woff2',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-satoshi',
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
})

async function getSettings(): Promise<SiteSettings | null> {
  return sanityFetch<SiteSettings | null>(siteSettingsQuery, {}, { tags: ['siteSettings'] })
}

function getSettingsWithFallback(settings: SiteSettings | null): SiteSettings {
  if (settings) return settings

  return {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://vizantir.com',
    siteName: 'Vizantir',
    defaultMetaTitle: 'Vizantir | Premium Digital Marketing Agency',
    defaultMetaDescription: 'Premium web design and development agency',
    organizationDescription: 'Premium web design and development agency',
    hasPhysicalLocation: false,
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  const settingsWithFallback = getSettingsWithFallback(settings)

  return {
    metadataBase: new URL(settingsWithFallback.siteUrl || 'https://www.vizantir.com'),
    applicationName: settingsWithFallback.siteName,
    title: {
      default: settingsWithFallback.defaultMetaTitle || 'Vizantir | Premium Digital Marketing Agency',
      template: `%s | ${settingsWithFallback.siteName}`,
    },
    description: settingsWithFallback.defaultMetaDescription || settingsWithFallback.organizationDescription,
    authors: [{ name: settingsWithFallback.siteName }],
    creator: settingsWithFallback.siteName,
    publisher: settingsWithFallback.siteName,
    alternates: {
      canonical: 'https://www.vizantir.com',
    },
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: settingsWithFallback.siteUrl || 'https://www.vizantir.com',
      siteName: settingsWithFallback.siteName,
      title: 'Premium Web Design Studio in Las Vegas | Vizantir',
      description: 'Custom Next.js websites for hospitality, law, and commercial real estate brands. Built for speed, performance, and conversion.',
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
      title: 'Premium Web Design Studio in Las Vegas | Vizantir',
      description: 'Custom Next.js websites for hospitality, law, and commercial real estate brands. Built for speed, performance, and conversion.',
      images: ['https://www.vizantir.com/og-image.png'],
    },
    icons: {
      icon: '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
    ...(settingsWithFallback.googleVerification && {
      verification: {
        google: settingsWithFallback.googleVerification,
      },
    }),
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta property="og:image" content="https://www.vizantir.com/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:image" content="https://www.vizantir.com/og-image.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationLocalBusinessJsonLd),
          }}
        />
        <meta name="msvalidate.01" content="2CBE6E049F1819DD41157125787904CB" />
        <meta name="google-site-verification" content="9fHYiqVv9NBxjFJVchlxgtrDMuObpUK8eKuUEsGTkFo" />
        
        {/* Preconnect hints for third-party scripts */}
        <link rel="dns-prefetch" href="https://www.chatbase.co" />
      </head>
      <body className={satoshi.variable}>
        <SmoothScroll>
          <ScrollToTop />
          <ScrollProgress />
          <Navbar />
          <main>{children}</main>
          <Footer />
        </SmoothScroll>
        <DeferredChatbase />
        <Analytics />
      </body>
    </html>
  )
}