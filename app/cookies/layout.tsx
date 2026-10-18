import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Cookie Policy | Vizantir' },
  description: 'How Vizantir Design Studio uses cookies and similar technologies.',
  robots: { index: false, follow: true },
  alternates: { canonical: 'https://www.vizantir.com/cookies' },
  openGraph: {
    title: 'Cookie Policy | Vizantir',
    description: 'How Vizantir Design Studio uses cookies and similar technologies.',
    url: 'https://www.vizantir.com/cookies',
    type: 'website',
    images: [{ url: 'https://www.vizantir.com/og-image.png', width: 1200, height: 630, alt: 'Vizantir Design Studio - Premium Web Design Las Vegas' }],
  },
}

export default function CookiesLayout({ children }: { children: React.ReactNode }) {
  return children
}
