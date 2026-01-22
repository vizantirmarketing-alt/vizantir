import type { Metadata } from 'next'
import localFont from 'next/font/local'

import { sanityFetch } from '@/lib/sanity/client'
import { siteSettingsQuery } from '@/lib/sanity/queries'
import { JsonLd } from '@/components/seo/JsonLd'
import {
  websiteSchema,
  organizationSchema,
  localBusinessSchema,
  graphSchema,
} from '@/lib/schema'
import type { SiteSettings } from '@/lib/sanity/types'

import { ThemeProvider } from '@/contexts/ThemeContext'

import Navbar from '@/components/navbar/Navbar'

import Footer from '@/components/footer/Footer'

import SmoothScroll from '@/components/SmoothScroll'

import ScrollProgress from '@/components/ScrollProgress'

import { ScrollToTop } from '@/components/ScrollToTop'

import GoogleAnalytics from '@/components/GoogleAnalytics'
import MicrosoftClarity from '@/components/MicrosoftClarity'
import ChatbaseWidget from '@/components/ChatbaseWidget'

import './globals.css'

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
  return sanityFetch<SiteSettings | null>(siteSettingsQuery, {}, { tags: ['settings'] })
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
      title: 'Vizantir | Web Design Agency Las Vegas',
      description: 'Custom Next.js development for businesses ready to scale. Built for speed, designed for results.',
      images: [
        {
          url: settingsWithFallback.ogImageUrl || '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Vizantir - Premium Web Design Agency Las Vegas',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Vizantir | Web Design Agency Las Vegas',
      description: 'Custom Next.js development for businesses ready to scale. Built for speed, designed for results.',
      images: [settingsWithFallback.ogImageUrl || '/og-image.png'],
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
  const settings = await getSettings()

  // Global schemas (appear on every page) - only render if settings exists
  let globalGraph = null
  if (settings) {
    globalGraph = graphSchema([
      websiteSchema(settings),
      organizationSchema(settings),
      localBusinessSchema(settings), // Returns null if no physical location
    ])
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="msvalidate.01" content="2CBE6E049F1819DD41157125787904CB" />
        <meta name="google-site-verification" content="9fHYiqVv9NBxjFJVchlxgtrDMuObpUK8eKuUEsGTkFo" />
        
        {/* Preconnect hints for third-party scripts */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.clarity.ms" />
        <link rel="dns-prefetch" href="https://www.chatbase.co" />
        
        {/* Theme script - simplified to prevent hydration mismatch */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                document.documentElement.style.backgroundColor = '#000000';
                document.documentElement.setAttribute('data-theme', 'dark');
              })();
            `,
          }}
        />
      </head>
      <body className={satoshi.variable} suppressHydrationWarning>
        {globalGraph && <JsonLd id="ld-global" data={globalGraph} />}
        <GoogleAnalytics />
        <MicrosoftClarity />
        <ThemeProvider>
          <SmoothScroll>
            <ScrollToTop />
            <ScrollProgress />
            <Navbar />
            <main>{children}</main>
            <Footer />
          </SmoothScroll>
        </ThemeProvider>
        <ChatbaseWidget />
      </body>
    </html>
  )
}