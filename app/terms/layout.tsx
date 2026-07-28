import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms & Conditions | Vizantir Design Studio',
  description: 'Terms governing website design and development services from Vizantir Design Studio.',
  robots: { index: false, follow: true },
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children
}
