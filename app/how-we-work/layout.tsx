import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Our Web Design Process & Collaboration',
  description:
    'Discover our collaborative process from discovery to launch that ensures high-performance websites aligned with your vision and business goals.',
}

export default function HowWeWorkLayout({ children }: { children: ReactNode }) {
  return children
}
