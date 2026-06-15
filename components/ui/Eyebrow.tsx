'use client'

import { cn } from '@/lib/utils'

export interface EyebrowProps {
  children: React.ReactNode
  className?: string
  /** Default: centered rules + label (canonical /are-we-a-fit). Use `start` for left-aligned hero stacks. */
  align?: 'center' | 'start'
  /**
   * When true (default), applies Tailwind `uppercase` for canonical kickers.
   * Set false when the label must preserve mixed casing (e.g. "Who We Are").
   */
  uppercase?: boolean
}

/**
 * Canonical hero kicker: gold/amber label with thin horizontal rules above and below.
 * Matches /how-we-work and /are-we-a-fit hero treatment.
 */
export function Eyebrow({ children, className, align = 'center', uppercase = true }: EyebrowProps) {
  const accent = 'var(--gold-accent)'
  const lineColor = 'var(--gold-primary)'

  return (
    <div
      className={cn('flex flex-col gap-4', align === 'center' ? 'items-center' : 'items-start', className)}
    >
      <span
        className="h-px w-14 max-w-[35%] shrink-0 opacity-40"
        style={{ background: lineColor }}
        aria-hidden
      />
      <span
        className={cn('inline-block text-xs font-medium tracking-[0.25em]', uppercase && 'uppercase')}
        style={{ color: accent }}
      >
        {children}
      </span>
      <span
        className="h-px w-24 max-w-[45%] shrink-0 opacity-25"
        style={{ background: lineColor }}
        aria-hidden
      />
    </div>
  )
}
