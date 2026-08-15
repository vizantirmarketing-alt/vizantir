import { Metadata } from 'next'
import WebsiteRedesignLasVegasClient from './WebsiteRedesignLasVegasClient'
import { WebsiteRedesignPageSchema } from './_schema'

const META_TITLE = 'Website Redesign Las Vegas | Vizantir Design Studio'
const META_DESCRIPTION =
  'SEO-safe website redesigns in Las Vegas. Every URL mapped, rankings preserved, content migrated cleanly. Fixed-scope Next.js rebuilds for established businesses that can\'t afford to lose traffic.'

export const metadata: Metadata = {
  title: {
    absolute: META_TITLE,
  },
  description: META_DESCRIPTION,
  keywords: [
    'website redesign las vegas',
    'wordpress migration las vegas',
    'next.js redesign',
    'website migration nevada',
  ],
  alternates: {
    canonical: 'https://www.vizantir.com/website-redesign-las-vegas',
  },
  openGraph: {
    type: 'website',
    url: 'https://www.vizantir.com/website-redesign-las-vegas',
    siteName: 'Vizantir',
    locale: 'en_US',
    title: META_TITLE,
    description: META_DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Vizantir – Website Redesign Las Vegas',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: META_TITLE,
    description: META_DESCRIPTION,
    images: ['/og-image.png'],
  },
  other: {
    'og:locality': 'Las Vegas',
    'og:region': 'Nevada',
    'og:postal_code': '89139',
    'og:street_address': 'Las Vegas, NV',
    'og:country_name': 'United States',
    'og:phone_number': '+17022890758',
    'place:location:latitude': '36.0395',
    'place:location:longitude': '-115.2511',
    'geo.region': 'US-NV',
    'geo.placename': 'Las Vegas',
    'geo.position': '36.0395;-115.2511',
    ICBM: '36.0395, -115.2511',
  },
}

export default function WebsiteRedesignLasVegasPage() {
  return (
    <>
      <WebsiteRedesignPageSchema />
      <WebsiteRedesignLasVegasClient />
    </>
  )
}
