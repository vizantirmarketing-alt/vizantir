import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'How Vizantir Design Studio uses cookies and similar technologies.',
  robots: { index: false, follow: true },
  alternates: { canonical: 'https://www.vizantir.com/cookies' },
  openGraph: {
    title: 'Cookie Policy | Vizantir',
    description: 'How Vizantir Design Studio uses cookies and similar technologies.',
    url: 'https://www.vizantir.com/cookies',
    type: 'website',
  },
}

export default function CookiesLayout({ children }: { children: React.ReactNode }) {
  return children
}
