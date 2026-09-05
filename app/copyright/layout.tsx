import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Copyright Notice | Vizantir' },
  description: 'Copyright and image usage terms for Vizantir Design Studio.',
  robots: { index: false, follow: true },
  alternates: { canonical: 'https://www.vizantir.com/copyright' },
  openGraph: {
    title: 'Copyright Notice | Vizantir',
    description: 'Copyright and image usage terms for Vizantir Design Studio.',
    url: 'https://www.vizantir.com/copyright',
    type: 'website',
  },
}

export default function CopyrightLayout({ children }: { children: React.ReactNode }) {
  return children
}
