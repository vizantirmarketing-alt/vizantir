import { Metadata } from 'next'
import LandingPagesClient from './LandingPagesClient'
import { LandingPagesPageSchema } from './_schema'
import { variants } from './_data/variants'
import { getProofBandClients } from './_lib/get-proof-clients'

const v = variants.primary
const META_TITLE = v.metaTitle
const META_DESCRIPTION = v.metaDescription
const CANONICAL = 'https://www.vizantir.com/landing-pages'

export const metadata: Metadata = {
  title: {
    absolute: META_TITLE,
  },
  description: META_DESCRIPTION,
  keywords: [
    'landing page design',
    'landing page development',
    'next.js landing pages',
    'conversion landing pages',
    'campaign landing pages',
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
        alt: 'Vizantir. Landing Page Design & Development',
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

export default async function LandingPagesPage() {
  const proofClients = await getProofBandClients()

  return (
    <>
      <LandingPagesPageSchema />
      <LandingPagesClient proofClients={proofClients} />
    </>
  )
}
