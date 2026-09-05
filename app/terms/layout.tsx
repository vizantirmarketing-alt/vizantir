import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'Terms governing website design and development services from Vizantir Design Studio.',
  robots: { index: false, follow: true },
  alternates: { canonical: 'https://www.vizantir.com/terms' },
  openGraph: {
    title: 'Terms & Conditions | Vizantir',
    description: 'Terms governing website design and development services from Vizantir Design Studio.',
    url: 'https://www.vizantir.com/terms',
    type: 'website',
  },
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children
}
