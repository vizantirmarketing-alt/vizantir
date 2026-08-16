'use client'

import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import type { AmbientVariant } from './AmbientHeroCanvas'

export interface AmbientHeroProps {
  eyebrow: string
  headline: ReactNode
  subhead?: string
  variant?: AmbientVariant
  children?: ReactNode
  /** Shorter desktop hero (~60vh) so the following section peeks above the fold. Mobile stays padding-based. */
  compact?: boolean
}

const AmbientHeroCanvas = lazy(() => import('./AmbientHeroCanvas'))

function CanvasPlaceholder() {
  return <div className="h-full w-full" aria-hidden />
}

export function AmbientHero({
  eyebrow,
  headline,
  subhead,
  variant = 'plane',
  children,
  compact = false,
}: AmbientHeroProps) {
  const [showCanvas, setShowCanvas] = useState(false)

  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(() => setShowCanvas(true), { timeout: 500 })
      return () => cancelIdleCallback(id)
    }

    const timer = setTimeout(() => setShowCanvas(true), 300)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section
      className={`relative overflow-hidden ${compact ? 'md:min-h-[60svh]' : 'min-h-[100svh]'}`}
    >
      <div
        className={`pointer-events-none absolute inset-0 z-0 ${
          variant === 'polygons'
            ? 'opacity-[0.85]'
            : variant === 'strata'
              ? 'opacity-[0.9]'
              : variant === 'helix'
                ? 'opacity-[0.8]'
                : variant === 'contour'
                  ? 'opacity-[0.75]'
                  : 'opacity-[0.55]'
        }`}
        aria-hidden
      >
        {showCanvas ? (
          <Suspense fallback={<CanvasPlaceholder />}>
            <AmbientHeroCanvas variant={variant} />
          </Suspense>
        ) : (
          <CanvasPlaceholder />
        )}
      </div>

      <div
        className={
          compact
            ? 'relative z-10 flex items-center px-6 pt-32 pb-12 md:min-h-[60svh] md:px-12 md:pt-24 md:pb-6 lg:px-20 lg:pb-4'
            : 'relative z-10 flex min-h-[100svh] items-center px-6 md:px-12 lg:px-20'
        }
      >
        <div className="mx-auto w-full max-w-5xl">
          <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.24em] text-meta">
            {eyebrow}
          </p>
          <h1
            className={
              compact
                ? 'max-w-[40ch] text-[clamp(40px,5.2vw,72px)] font-bold leading-[0.95] tracking-[-0.035em] text-foreground lg:text-[62px]'
                : 'max-w-[17ch] text-[clamp(44px,6.4vw,92px)] font-bold leading-[0.95] tracking-[-0.035em] text-foreground'
            }
          >
            {headline}
          </h1>
          {subhead ? (
            <p className="mt-8 max-w-[46ch] text-base leading-relaxed text-muted-foreground md:text-lg">
              {subhead}
            </p>
          ) : null}
          {children}
        </div>
      </div>
    </section>
  )
}
