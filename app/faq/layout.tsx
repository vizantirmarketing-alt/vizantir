import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Web Design FAQs & Answers | Vizantir Studio',
  description:
    'Find answers to common questions about timelines, pricing and our approach to premium website design and development, all in one place.',
}

export default function FAQLayout({ children }: { children: ReactNode }) {
  return children
}
