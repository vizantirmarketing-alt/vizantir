import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Intel',
    template: '%s | Intel',
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function IntelRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
