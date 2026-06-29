'use client'

import { LazyMotion, domAnimation } from 'framer-motion'
import type { ReactNode } from 'react'

// domAnimation enables: animations, variants, exit animations, tap/hover/focus gestures
// For drag/layout features (rarely needed), upgrade to domMax
export function MotionProvider({ children }: { children: ReactNode }) {
  return <LazyMotion features={domAnimation} strict>{children}</LazyMotion>
}
