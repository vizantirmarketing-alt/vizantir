import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

import { ArcadeProvider } from '@/components/arcade/ArcadeProvider'
import { ArcadeShell } from '@/components/arcade/ArcadeShell'

import './arcade.css'

export const metadata: Metadata = {
  title: { absolute: 'Vizantir Arcade | Play' },
  description: 'A small collection of retro inspired browser games built by Vizantir.',
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
      <ArcadeShell>{children}</ArcadeShell>
    </ArcadeProvider>
  )
}
