import { NextResponse } from 'next/server'

export const dynamic = 'force-static'

const manifest = {
  name: 'Vizantir Arcade',
  short_name: 'Arcade',
  start_url: '/play',
  // `/play/` is not a prefix of start_url `/play`. Chrome would ignore it and
  // fall back to `/`. `/play` keeps the lobby in scope without covering /services.
  scope: '/play',
  display: 'standalone',
  orientation: 'any',
  background_color: '#090B1A',
  theme_color: '#090B1A',
  description: 'A small collection of retro inspired browser games built by Vizantir.',
  icons: [
    {
      src: '/play/icons/icon-192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/play/icons/icon-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/play/icons/icon-512-maskable.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
}

export function GET() {
  return new NextResponse(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
    },
  })
}
