import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Vizantir Design Studio collects, uses, and protects personal information.',
  robots: { index: false, follow: true },
  alternates: { canonical: 'https://www.vizantir.com/privacy' },
  openGraph: {
    title: 'Privacy Policy | Vizantir',
    description: 'How Vizantir Design Studio collects, uses, and protects personal information.',
    url: 'https://www.vizantir.com/privacy',
    type: 'website',
  },
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children
}
