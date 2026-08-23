import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type MetricDeltaDirection = 'up' | 'down' | 'flat'

export type MetricAccent = 'cobalt' | 'cobalt-tint' | 'warning'

type MetricCardProps = {
  label: string
  value: string
  icon?: ReactNode
  accent?: MetricAccent
  deltaLabel?: string
  deltaDirection?: MetricDeltaDirection
  lowerIsBetter?: boolean
  sparkline?: ReactNode
  context?: string
  contextTone?: 'meta' | 'warning' | 'warning-severe'
  failed?: boolean
  action?: ReactNode
}

type DeltaTone = 'positive' | 'warning' | 'neutral'

const ICON_CHIP: Record<MetricAccent, string> = {
  cobalt: 'bg-cobalt-soft text-cobalt-primary',
  'cobalt-tint': 'bg-cobalt-muted-subtle text-cobalt-primary',
  warning: 'bg-warning-soft text-warning',
}

function deltaTone(
  direction: MetricDeltaDirection,
  lowerIsBetter: boolean,
): DeltaTone {
  if (direction === 'flat') {
    return 'neutral'
  }
  const improved = lowerIsBetter ? direction === 'down' : direction === 'up'
  return improved ? 'positive' : 'warning'
}

function DeltaChip({
  label,
  direction,
  lowerIsBetter,
}: {
  label: string
  direction: MetricDeltaDirection
  lowerIsBetter: boolean
}) {
  const tone = deltaTone(direction, lowerIsBetter)
  const arrow = direction === 'up' ? '▲' : direction === 'down' ? '▼' : null
  const judgment =
    tone === 'positive'
      ? 'Improved'
      : tone === 'warning'
        ? 'Declined'
        : 'Unchanged'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[0.65rem] font-semibold tabular-nums',
        tone === 'positive' && 'bg-positive-soft text-positive',
        tone === 'warning' && 'bg-warning-soft text-warning',
        tone === 'neutral' && 'bg-black/[0.05] text-meta',
      )}
      aria-label={`${judgment} ${label}`}
    >
      {arrow ? <span aria-hidden>{arrow}</span> : null}
      {label}
    </span>
  )
}

export function MetricCard({
  label,
  value,
  icon,
  accent = 'cobalt',
  deltaLabel,
  deltaDirection,
  lowerIsBetter = false,
  sparkline,
  context,
  contextTone = 'meta',
  failed = false,
  action,
}: MetricCardProps) {
  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-black/8 bg-white px-3 py-2 md:px-3.5 md:py-2.5">
      <div className="flex items-center gap-2">
        {icon ? (
          <span
            className={cn(
              'flex size-5 shrink-0 items-center justify-center rounded-md',
              failed ? 'bg-warning-soft text-warning' : ICON_CHIP[accent],
            )}
            aria-hidden
          >
            {icon}
          </span>
        ) : null}
        <p className="text-[0.7rem] leading-4 text-meta">{label}</p>
      </div>
      {failed ? (
        <>
          <p className="mt-1 text-sm leading-relaxed text-warning" role="alert">
            {context ?? 'Could not load this metric.'}
          </p>
          {action ? <div className="mt-1.5">{action}</div> : null}
        </>
      ) : (
        <>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-2xl leading-none font-medium tabular-nums tracking-tight text-foreground">
              {value}
            </p>
            {deltaLabel !== undefined && deltaDirection !== undefined ? (
              <DeltaChip
                label={deltaLabel}
                direction={deltaDirection}
                lowerIsBetter={lowerIsBetter}
              />
            ) : null}
          </div>
          {sparkline ? <div className="mt-1.5">{sparkline}</div> : null}
          {context ? (
            <p
              className={cn(
                'mt-1 truncate text-[0.7rem] leading-4',
                contextTone === 'warning' && 'text-warning',
                contextTone === 'warning-severe' && 'text-warning-severe',
                contextTone === 'meta' && 'text-meta',
              )}
            >
              {context}
            </p>
          ) : null}
          {action ? <div className="mt-1.5">{action}</div> : null}
        </>
      )}
    </div>
  )
}
