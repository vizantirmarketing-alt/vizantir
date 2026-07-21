import { Metadata } from 'next'
import ForGoogleAdsClient from './ForGoogleAdsClient'
import { ForGoogleAdsPageSchema } from './_schema'
import { variants } from '../_data/variants'
import { getProofBandClients } from '../_lib/get-proof-clients'

const v = variants.googleAds
const META_TITLE = v.metaTitle
const META_DESCRIPTION = v.metaDescription
const CANONICAL = 'https://www.vizantir.com/landing-pages/for-google-ads'

export const metadata: Metadata = {
  title: {
    absolute: META_TITLE,
  },
  description: META_DESCRIPTION,
  keywords: [
    'google ads landing pages',
    'ppc landing page design',
    'next.js landing pages',
    'conversion landing pages',
  ],
  alternates: {
    canonical: CANONICAL,
  },
  openGraph: {
    type: 'website',
    url: CANONICAL,
    siteName: 'Vizantir',
    locale: 'en_US',
    title: META_TITLE,
    description: META_DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Vizantir. Google Ads Landing Pages',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: META_TITLE,
    description: META_DESCRIPTION,
    images: ['/og-image.png'],
  },
}

export default async function ForGoogleAdsPage() {
  const proofClients = await getProofBandClients()

  return (
    <>
      <ForGoogleAdsPageSchema />
      <ForGoogleAdsClient proofClients={proofClients} />
    </>
  )
}
