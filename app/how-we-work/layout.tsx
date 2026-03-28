import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'How We Work | Vizantir Web Design Agency',
  description:
    'Fixed scope, fixed price, direct access to the builder. See exactly how Vizantir runs every web design and development project from discovery to launch.',
}

export default function HowWeWorkLayout({ children }: { children: ReactNode }) {
  return children
}
