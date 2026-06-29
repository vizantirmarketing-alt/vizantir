import { Metadata } from 'next'
import LasVegasWebDesignPage from '@/components/pages/las-vegas-web-design'
import { FAQ_ITEMS, LasVegasPageSchema } from './_schema'

export const metadata: Metadata = {
  title: {
    absolute: 'Las Vegas Web Design Studio — Custom Next.js Websites | Vizantir',
  },
  description:
    'Custom Next.js web design for Las Vegas, Henderson, Summerlin, and Paradise businesses. Fixed-scope projects from $15,000. Built by a local studio, no templates.',
  alternates: {
    canonical: 'https://www.vizantir.com/las-vegas-web-design',
  },
  openGraph: {
    type: 'website',
    url: 'https://www.vizantir.com/las-vegas-web-design',
    siteName: 'Vizantir',
    locale: 'en_US',
    title: 'Las Vegas Web Design Studio — Custom Next.js Websites',
    description:
      'Custom Next.js web design for Las Vegas businesses. Fixed-scope builds from a local studio serving Henderson, Summerlin, and Paradise.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Vizantir — Las Vegas Web Design Studio',
      },
    ],
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

export default function Page() {
  return (
    <>
      <LasVegasPageSchema />
      <LasVegasWebDesignPage faqItems={FAQ_ITEMS} />
    </>
  )
}
