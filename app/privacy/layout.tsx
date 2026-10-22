import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Privacy Policy | Vizantir' },
  description: 'How Vizantir Design Studio collects, uses, and protects personal information.',
  alternates: { canonical: 'https://www.vizantir.com/privacy' },
  openGraph: {
    title: 'Privacy Policy | Vizantir',
    description: 'How Vizantir Design Studio collects, uses, and protects personal information.',
    url: 'https://www.vizantir.com/privacy',
    type: 'website',
    images: [{ url: 'https://www.vizantir.com/og-image.png', width: 1200, height: 630, alt: 'Vizantir Design Studio - Premium Web Design Las Vegas' }],
  },
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children
}
