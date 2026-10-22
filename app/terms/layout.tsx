import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Terms & Conditions | Vizantir' },
  description: 'Terms governing website design and development services from Vizantir Design Studio.',
  alternates: { canonical: 'https://www.vizantir.com/terms' },
  openGraph: {
    title: 'Terms & Conditions | Vizantir',
    description: 'Terms governing website design and development services from Vizantir Design Studio.',
    url: 'https://www.vizantir.com/terms',
    type: 'website',
    images: [{ url: 'https://www.vizantir.com/og-image.png', width: 1200, height: 630, alt: 'Vizantir Design Studio - Premium Web Design Las Vegas' }],
  },
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children
}
