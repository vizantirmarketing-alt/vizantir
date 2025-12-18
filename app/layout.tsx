import type { Metadata } from 'next'
import localFont from 'next/font/local'
import Script from 'next/script'

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
    defaultMetaDescription: 'Premium digital marketing agency',
    organizationDescription: 'Premium digital marketing agency',
    hasPhysicalLocation: false,
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  const settingsWithFallback = getSettingsWithFallback(settings)

  return {
    metadataBase: new URL(settingsWithFallback.siteUrl),
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
      url: settingsWithFallback.siteUrl,
      siteName: settingsWithFallback.siteName,
      title: settingsWithFallback.defaultMetaTitle || 'Vizantir | Premium Digital Marketing Agency',
      description: settingsWithFallback.defaultMetaDescription || settingsWithFallback.organizationDescription,
      ...(settingsWithFallback.ogImageUrl && {
        images: [
          {
            url: settingsWithFallback.ogImageUrl,
            width: 1200,
            height: 630,
            alt: settingsWithFallback.siteName,
          },
        ],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: settingsWithFallback.defaultMetaTitle || 'Vizantir | Premium Digital Marketing Agency',
      description: settingsWithFallback.defaultMetaDescription || settingsWithFallback.organizationDescription,
      ...(settingsWithFallback.ogImageUrl && { images: [settingsWithFallback.ogImageUrl] }),
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('vizantir-theme');
                  // Default to dark mode to match server-side rendering
                  var isDark = theme === 'dark' || theme === null;
                  
                  if (isDark) {
                    if (document.documentElement) {
                      document.documentElement.style.backgroundColor = '#000000';
                    }
                    if (document.body) {
                      document.body.style.backgroundColor = '#000000';
                    }
                    if (document.documentElement) {
                      document.documentElement.setAttribute('data-theme', 'dark');
                    }
                  } else {
                    if (document.documentElement) {
                      document.documentElement.style.backgroundColor = '#FAFAFA';
                    }
                    if (document.body) {
                      document.body.style.backgroundColor = '#FAFAFA';
                    }
                    if (document.documentElement) {
                      document.documentElement.setAttribute('data-theme', 'light');
                    }
                  }
                } catch (e) {
                  // Default to dark mode on error to match server
                  if (document.documentElement) {
                    document.documentElement.style.backgroundColor = '#000000';
                  }
                  if (document.body) {
                    document.body.style.backgroundColor = '#000000';
                  }
                }
              })();
            `,
          }}
        />
      </head>
      <body className={satoshi.variable} suppressHydrationWarning>
        {globalGraph && <JsonLd id="ld-global" data={globalGraph} />}
        <GoogleAnalytics />
        <ThemeProvider>
          <SmoothScroll>
            <ScrollToTop />
            <ScrollProgress />
            <Navbar />
            <main>{children}</main>
            <Footer />
          </SmoothScroll>
        </ThemeProvider>
        
        {/* Chatbase Chatbot */}
        <Script
          src="https://www.chatbase.co/embed.min.js"
          strategy="lazyOnload"
          id="chatbase-script"
          defer
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.embeddedChatbotConfig = {
                chatbotId: "FAr-BdEt5S7mZZY1pDbg-",
                domain: "www.chatbase.co"
              }
            `,
          }}
        />
      </body>
    </html>
  )
}