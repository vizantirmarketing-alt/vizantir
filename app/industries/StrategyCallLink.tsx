'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { trackBookStrategyCall } from '@/lib/analytics'

export function StrategyCallLink({ children }: { children: ReactNode }) {
  return (
    <Link href="/contact" onClick={() => trackBookStrategyCall('industries')}>
      {children}
    </Link>
  )
}
