import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Vizantir Design Studio collects, uses, and protects personal information.',
  robots: { index: false, follow: true },
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children
}
