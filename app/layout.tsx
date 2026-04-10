import type { Metadata } from 'next'
import localFont from 'next/font/local'

import { sanityFetch } from '@/lib/sanity/client'
import { siteSettingsQuery } from '@/lib/sanity/queries'
import type { SiteSettings } from '@/lib/sanity/types'

import { ThemeProvider } from '@/contexts/ThemeContext'
import ThemeWrapper from '@/components/ThemeWrapper'

import Navbar from '@/components/navbar/Navbar'

import Footer from '@/components/footer/Footer'

import SmoothScroll from '@/components/SmoothScroll'

import ScrollProgress from '@/components/ScrollProgress'

import { ScrollToTop } from '@/components/ScrollToTop'

import GoogleAnalytics from '@/components/GoogleAnalytics'
import MicrosoftClarity from '@/components/MicrosoftClarity'
import DeferredChatbase from '@/components/DeferredChatbase'

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

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Why do clients choose Vizantir over larger agencies?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Larger agencies come with overhead, junior account teams, and slow turnarounds. At Vizantir you get senior-level execution, direct communication, and faster delivery without the agency markup.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does the engagement model work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We start with a strategy call, scope the engagement, and deliver value before asking for anything long-term. Retainers come after we have earned them, not before.',
      },
    },
    {
      '@type': 'Question',
      name: 'What does the timeline look like from kickoff to launch?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Most website projects take 4 to 6 weeks from kickoff to launch. Timeline depends on scope and how quickly feedback is provided.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can you work with an existing site or brand?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. We can audit and improve an existing site without starting over. If a full rebuild is the better move we will say so honestly.',
      },
    },
    {
      '@type': 'Question',
      name: 'What industries do you specialize in?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We specialize in hospitality, restaurants, law firms, commercial real estate, and luxury lifestyle brands — high-stakes markets where design and performance directly affect revenue.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is your philosophy on design and results?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Every design decision is tied to an outcome. Layout, copy, and speed are built for conversion. We measure what moves the business, not vanity metrics.',
      },
    },
  ],
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
          url: 'https://www.vizantir.com/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Vizantir Design Studio - Premium Web Design Las Vegas',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Vizantir | Web Design Agency Las Vegas',
      description: 'Custom Next.js development for businesses ready to scale. Built for speed, designed for results.',
      images: [settingsWithFallback.ogImageUrl || 'https://www.vizantir.com/og-image.png'],
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
  (function() {
    try {
      var stored = localStorage.getItem('theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var isDark = stored === 'dark' || (!stored && prefersDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    } catch(e) {}
  })();
`,
          }}
        />
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqJsonLd),
          }}
        />
        <meta name="msvalidate.01" content="2CBE6E049F1819DD41157125787904CB" />
        <meta name="google-site-verification" content="9fHYiqVv9NBxjFJVchlxgtrDMuObpUK8eKuUEsGTkFo" />
        
        {/* Preconnect hints for third-party scripts */}
        <link rel="dns-prefetch" href="https://www.chatbase.co" />
      </head>
      <body className={satoshi.variable} suppressHydrationWarning>
        <GoogleAnalytics />
        <MicrosoftClarity />
        <ThemeProvider>
          <SmoothScroll>
            <ScrollToTop />
            <ScrollProgress />
            <Navbar />
            <main>
              <ThemeWrapper>{children}</ThemeWrapper>
            </main>
            <Footer />
          </SmoothScroll>
        </ThemeProvider>
        <DeferredChatbase />
      </body>
    </html>
  )
}