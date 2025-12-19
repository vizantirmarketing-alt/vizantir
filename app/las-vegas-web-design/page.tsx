import { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import LasVegasWebDesignClient from './LasVegasWebDesignClient'

export const metadata: Metadata = {
  title: 'Las Vegas Web Design & Development | Custom Next.js Websites | Vizantir',
  description: 'Premium web design agency in Las Vegas. We build fast, conversion-focused websites on Next.js for businesses ready to scale. Get a site that actually performs.',
  keywords: ['las vegas web design', 'web design las vegas', 'las vegas web developer', 'next.js agency las vegas', 'custom website las vegas', 'web development las vegas'],
  alternates: {
    canonical: 'https://www.vizantir.com/las-vegas-web-design',
  },
  openGraph: {
    title: 'Las Vegas Web Design & Development | Vizantir',
    description: 'Premium web design agency in Las Vegas. Custom Next.js websites built for speed and conversions.',
    url: 'https://www.vizantir.com/las-vegas-web-design',
    siteName: 'Vizantir',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Vizantir - Las Vegas Web Design Agency',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Las Vegas Web Design & Development | Vizantir',
    description: 'Premium web design agency in Las Vegas. Custom Next.js websites built for speed and conversions.',
    images: ['/og-image.png'],
  },
}

const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': 'https://www.vizantir.com/#organization',
  name: 'Vizantir',
  description: 'Premium web design and development agency in Las Vegas specializing in custom Next.js websites.',
  url: 'https://www.vizantir.com',
  telephone: '+1-702-604-6177',
  email: 'info@vizantir.com',
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
  areaServed: [
    {
      '@type': 'City',
      name: 'Las Vegas',
      '@id': 'https://www.wikidata.org/wiki/Q23768',
    },
    {
      '@type': 'City',
      name: 'Henderson',
    },
    {
      '@type': 'City',
      name: 'North Las Vegas',
    },
    {
      '@type': 'City',
      name: 'Summerlin',
    },
  ],
  priceRange: '$$$',
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '09:00',
    closes: '18:00',
  },
  sameAs: [
    'https://www.linkedin.com/company/vizantir',
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Web Design Services',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Custom Web Design',
          description: 'Bespoke website design tailored to your brand',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Next.js Development',
          description: 'High-performance websites built on Next.js',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'SEO Optimization',
          description: 'Search engine optimization for local and national rankings',
        },
      },
    ],
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How much does web design cost in Las Vegas?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Web design costs in Las Vegas vary widely. Template-based sites start around $2,500-5,000. Custom WordPress sites run $5,000-15,000. Premium custom Next.js sites like we build at Vizantir start at $15,000 and go up based on complexity. The investment depends on your needs, but our clients typically see ROI within 6-12 months through improved conversions.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why should I choose a Las Vegas web design agency?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A local Las Vegas agency understands the unique market dynamics of Southern Nevada—from the tourism-heavy economy to the growing tech and professional services sectors. We know what resonates with Las Vegas customers and can meet in person when needed. Plus, we are in your timezone for responsive communication.',
      },
    },
    {
      '@type': 'Question',
      name: 'What makes Vizantir different from other Las Vegas web designers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Unlike most Las Vegas agencies that use WordPress templates, we build custom sites on Next.js—the same technology used by Nike, Netflix, and TikTok. Our sites load in under 1 second, score 90+ on Google PageSpeed, and are built for long-term performance. We focus on results, not just aesthetics.',
      },
    },
    {
      '@type': 'Question',
      name: 'How long does it take to build a website?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Most of our Las Vegas web design projects take 6-10 weeks from kickoff to launch. This includes discovery, design, development, content integration, and testing. Rush timelines are possible for an additional fee. We prioritize getting it right over getting it fast.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do you offer ongoing website maintenance?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'One of the advantages of our Next.js approach is minimal maintenance requirements—no plugin updates, no security patches, no database optimization. We offer optional support packages for content updates and strategic improvements, but your site will not break if you do not maintain it monthly.',
      },
    },
  ],
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
      name: 'Las Vegas Web Design',
      item: 'https://www.vizantir.com/las-vegas-web-design',
    },
  ],
}

export default function LasVegasWebDesignPage() {
  return (
    <>
      <JsonLd id="ld-local-business" data={localBusinessSchema} />
      <JsonLd id="ld-faq" data={faqSchema} />
      <JsonLd id="ld-breadcrumb" data={breadcrumbSchema} />
      <LasVegasWebDesignClient />
    </>
  )
}
