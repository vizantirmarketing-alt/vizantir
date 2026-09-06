import type { Metadata, Viewport } from 'next'
import { Press_Start_2P } from 'next/font/google'
import type { ReactNode } from 'react'

import { ArcadeProvider } from '@/components/arcade/ArcadeProvider'
import { ArcadeServiceWorker } from '@/components/arcade/ArcadeServiceWorker'
import { ArcadeShell } from '@/components/arcade/ArcadeShell'

import './arcade.css'

const arcadePixel = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-arcade-pixel',
  preload: false,
})

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
    <div className={`arcade-play-root ${arcadePixel.variable}`}>
      <ArcadeProvider>
        <ArcadeServiceWorker />
        <ArcadeShell>{children}</ArcadeShell>
      </ArcadeProvider>
    </div>
  )
}
