import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Vertical padding for page sections. Every <section> goes through here so the
 * scale lives in globals.css (--section-y*) and cannot drift per page.
 * short-landscape tightening is built in.
 */
const sizeClasses = {
  default: {
    both: 'py-[var(--section-y)] short-landscape:py-8',
    top: 'pt-[var(--section-y)] short-landscape:pt-8',
    bottom: 'pb-[var(--section-y)] short-landscape:pb-8',
  },
  lg: {
    both: 'py-[var(--section-y-lg)] short-landscape:py-8',
    top: 'pt-[var(--section-y-lg)] short-landscape:pt-8',
    bottom: 'pb-[var(--section-y-lg)] short-landscape:pb-8',
  },
  sm: {
    both: 'py-[var(--section-y-sm)] short-landscape:py-6',
    top: 'pt-[var(--section-y-sm)] short-landscape:pt-6',
    bottom: 'pb-[var(--section-y-sm)] short-landscape:pb-6',
  },
} as const

interface SectionProps extends React.ComponentPropsWithoutRef<'section'> {
  /** default = --section-y; lg = hero and final CTA only; sm = minor sections */
  size?: keyof typeof sizeClasses
  /** Which edges carry padding. `none` for sections that own no vertical space. */
  edge?: 'both' | 'top' | 'bottom' | 'none'
  /** Page hero: top padding clears the fixed navbar (--hero-top). Bottom follows `size`. */
  hero?: boolean
}

function Section({
  size = 'default',
  edge = 'both',
  hero = false,
  className,
  children,
  ...props
}: SectionProps) {
  const edgeKey = hero ? 'bottom' : edge
  return (
    <section
      className={cn(
        hero && 'pt-[var(--hero-top)]',
        edgeKey !== 'none' && sizeClasses[size][edgeKey],
        className,
      )}
      {...props}
    >
      {children}
    </section>
  )
}

export { Section }
export type { SectionProps }
