import { Metadata } from 'next'
import ForProductLaunchesClient from './ForProductLaunchesClient'
import { ForProductLaunchesPageSchema } from './_schema'
import { variants } from '../_data/variants'
import { getProofBandClients } from '../_lib/get-proof-clients'

const v = variants.productLaunches
const META_TITLE = v.metaTitle
const META_DESCRIPTION = v.metaDescription
const CANONICAL = 'https://www.vizantir.com/landing-pages/for-product-launches'

export const metadata: Metadata = {
  title: {
    absolute: META_TITLE,
  },
  description: META_DESCRIPTION,
  keywords: [
    'product launch landing pages',
    'launch page design',
    'next.js landing pages',
    'product launch website',
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
        alt: 'Vizantir. Product Launch Landing Pages',
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

export default async function ForProductLaunchesPage() {
  const proofClients = await getProofBandClients()

  return (
    <>
      <ForProductLaunchesPageSchema />
      <ForProductLaunchesClient proofClients={proofClients} />
    </>
  )
}
