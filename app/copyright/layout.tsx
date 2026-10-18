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
    images: [{ url: 'https://www.vizantir.com/og-image.png', width: 1200, height: 630, alt: 'Vizantir Design Studio - Premium Web Design Las Vegas' }],
  },
}

export default function CopyrightLayout({ children }: { children: React.ReactNode }) {
  return children
}
