import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Copyright Notice',
  description: 'Copyright and image usage terms for Vizantir Design Studio.',
  robots: { index: false, follow: true },
}

export default function CopyrightLayout({ children }: { children: React.ReactNode }) {
  return children
}
