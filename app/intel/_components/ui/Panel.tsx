import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type PanelAccent = 'warning-severe' | 'cobalt' | 'positive' | 'neutral'

type PanelProps = {
  title?: string
  headerAction?: ReactNode
  accent?: PanelAccent
  className?: string
  children: ReactNode
}

const ACCENT_BORDER: Record<PanelAccent, string> = {
  'warning-severe': 'border-l-[3px] border-l-warning-severe',
  cobalt: 'border-l-[3px] border-l-cobalt-primary',
  positive: 'border-l-[3px] border-l-positive',
  neutral: 'border-l-[3px] border-l-black/20',
}

const ACCENT_TITLE: Record<PanelAccent, string> = {
  'warning-severe': 'text-warning-severe',
  cobalt: 'text-cobalt-primary',
  positive: 'text-positive',
  neutral: 'text-meta',
}

export function Panel({
  title,
  headerAction,
  accent,
  className,
  children,
}: PanelProps) {
  const hasHeader = title !== undefined || headerAction !== undefined

  return (
    <section
      className={cn(
        'min-w-0 rounded-xl border border-black/8 bg-white px-4 py-3 md:px-5 md:py-4',
        accent ? ACCENT_BORDER[accent] : null,
        className,
      )}
    >
      {hasHeader ? (
        <div className="mb-2.5 flex items-center justify-between gap-4">
          {title ? (
            <h2
              className={cn(
                'text-[0.7rem] font-medium uppercase tracking-[0.18em]',
                accent ? ACCENT_TITLE[accent] : 'text-meta',
              )}
            >
              {title}
            </h2>
          ) : (
            <span />
          )}
          {headerAction ? (
            <div className="shrink-0">{headerAction}</div>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}
