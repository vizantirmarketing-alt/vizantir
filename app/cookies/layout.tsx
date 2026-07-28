import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy | Vizantir Design Studio',
  description: 'How Vizantir Design Studio uses cookies and similar technologies.',
  robots: { index: false, follow: true },
}

export default function CookiesLayout({ children }: { children: React.ReactNode }) {
  return children
}
