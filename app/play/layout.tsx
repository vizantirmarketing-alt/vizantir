import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

import { ArcadeProvider } from '@/components/arcade/ArcadeProvider'
import { ArcadeServiceWorker } from '@/components/arcade/ArcadeServiceWorker'
import { ArcadeShell } from '@/components/arcade/ArcadeShell'

import './arcade.css'

export const metadata: Metadata = {
  title: { absolute: 'Vizantir Arcade | Play' },
  description: 'A small collection of retro inspired browser games built by Vizantir.',
  manifest: '/play/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Arcade',
  },
  icons: {
    apple: [{ url: '/play/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'Vizantir Arcade | Play',
    description: 'A small collection of retro inspired browser games built by Vizantir.',
  },
}

export const viewport: Viewport = {
  themeColor: '#090B1A',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function PlayLayout({ children }: { children: ReactNode }) {
  return (
    <ArcadeProvider>
      <ArcadeServiceWorker />
      <ArcadeShell>{children}</ArcadeShell>
    </ArcadeProvider>
  )
}
