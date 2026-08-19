import type { ReactNode } from 'react'
import Link from 'next/link'

import { formatPercentAgainstMeaningfulBase } from '@/lib/intel/format-change'
import {
  formatDisplayDate,
  formatSpanLabel,
  SEARCH_RANGE_LABELS,
  SEARCH_RANGES,
  searchHref,
  type DateSpan,
  type SearchRange,
} from '@/lib/intel/search-params'
import type {
  MetricTotals,
  SearchComparison,
} from '@/lib/intel/search'
import { cn } from '@/lib/utils'

export function SearchHeader() {
  return (
    <div>
      <p className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-cobalt-primary">
        Intel
      </p>
      <h1 className="mt-6 text-3xl font-black tracking-tight text-foreground md:text-4xl">
        Search
      </h1>
    </div>
  )
}

export function SearchQueryError() {
  return (
    <p
      className="mt-16 max-w-md text-base leading-relaxed text-body"
      role="alert"
    >
      Unable to load search data. Try again shortly.
    </p>
  )
}

type EmptyStateProps = {
  title: string
  body: string
}

export function SearchEmptyState({ title, body }: EmptyStateProps) {
  return (
    <div className="mt-16 max-w-md">
      <p className="text-base font-medium text-foreground">{title}</p>
      <p className="mt-3 text-base leading-relaxed text-body">{body}</p>
    </div>
  )
}

export function SearchRangeNav({ range }: { range: SearchRange }) {
  return (
    <nav aria-label="Date range" className="mt-10 flex flex-wrap gap-6">
      {SEARCH_RANGES.map((value) => {
        const active = value === range
        return (
          <Link
            key={value}
            href={searchHref(value)}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'text-sm transition-colors',
              active
                ? 'text-foreground'
                : 'text-meta hover:text-foreground',
            )}
          >
            {SEARCH_RANGE_LABELS[value]}
          </Link>
        )
      })}
    </nav>
  )
}

type DateSpansProps = {
  span: DateSpan
  comparison: SearchComparison
}

export function SearchDateSpans({ span, comparison }: DateSpansProps) {
  return (
    <div className="mt-4 space-y-1">
      <p className="text-sm text-body">{formatSpanLabel(span)}</p>
      {comparison.available ? (
        <p className="text-sm text-meta">
          Compared with {formatSpanLabel(comparison.span)}
        </p>
      ) : (
        <p className="text-sm text-meta">
          {comparison.coverageStartedOn
            ? `Prior period unavailable — coverage starts ${formatDisplayDate(comparison.coverageStartedOn)}`
            : 'Prior period unavailable — coverage start is not recorded'}
        </p>
      )}
    </div>
  )
}

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

function formatCtr(value: number | null): string {
  if (value === null) {
    return '—'
  }
  return `${(value * 100).toFixed(1)}%`
}

function formatPosition(value: number | null): string {
  if (value === null) {
    return '—'
  }
  return value.toFixed(1)
}

function formatSigned(value: number, digits?: number): string {
  const abs =
    digits === undefined
      ? formatCount(Math.abs(value))
      : Math.abs(value).toFixed(digits)
  if (value > 0) {
    return `+${abs}`
  }
  if (value < 0) {
    return `−${abs}`
  }
  return digits === undefined ? '0' : (0).toFixed(digits)
}

type ChangeTone = 'better' | 'worse' | 'flat' | 'neutral'

function toneClass(tone: ChangeTone): string {
  if (tone === 'worse') {
    return 'text-warning'
  }
  if (tone === 'better') {
    return 'text-foreground'
  }
  return 'text-meta'
}

function countTone(current: number, previous: number): ChangeTone {
  if (current > previous) {
    return 'better'
  }
  if (current < previous) {
    return 'worse'
  }
  return 'flat'
}

function positionTone(current: number, previous: number): ChangeTone {
  if (current < previous) {
    return 'better'
  }
  if (current > previous) {
    return 'worse'
  }
  return 'flat'
}

function ChangeLine({
  children,
  tone,
}: {
  children: string
  tone: ChangeTone
}) {
  return <p className={cn('mt-2 text-sm', toneClass(tone))}>{children}</p>
}

function CountChange({
  current,
  previous,
}: {
  current: number
  previous: number
}) {
  const tone = countTone(current, previous)
  const relative = formatPercentAgainstMeaningfulBase(current, previous)
  const parts = [`Prior ${formatCount(previous)}`]
  if (current !== previous) {
    parts.push(formatSigned(current - previous))
  }
  if (relative && current !== previous) {
    parts.push(relative)
  }
  if (current === previous) {
    parts.push('no change')
  }
  return <ChangeLine tone={tone}>{parts.join(' · ')}</ChangeLine>
}

function CtrChange({
  current,
  previous,
}: {
  current: number | null
  previous: number | null
}) {
  if (current === null || previous === null) {
    return <ChangeLine tone="neutral">Prior —</ChangeLine>
  }
  const deltaPoints = (current - previous) * 100
  const tone = countTone(current, previous)
  const parts = [`Prior ${formatCtr(previous)}`]
  if (deltaPoints === 0) {
    parts.push('no change')
  } else {
    parts.push(`${formatSigned(deltaPoints, 1)} pt`)
  }
  return <ChangeLine tone={tone}>{parts.join(' · ')}</ChangeLine>
}

function PositionChange({
  current,
  previous,
}: {
  current: number | null
  previous: number | null
}) {
  if (current === null || previous === null) {
    return <ChangeLine tone="neutral">Prior —</ChangeLine>
  }
  const delta = current - previous
  const tone = positionTone(current, previous)
  const parts = [`Prior ${formatPosition(previous)}`]
  if (delta === 0) {
    parts.push('no change')
  } else {
    parts.push(formatSigned(delta, 1))
    parts.push(tone === 'better' ? 'better' : 'worse')
  }
  return <ChangeLine tone={tone}>{parts.join(' · ')}</ChangeLine>
}

function MetricCard({
  label,
  value,
  change,
}: {
  label: string
  value: string
  change: ReactNode
}) {
  return (
    <div>
      <p className="text-sm text-meta">{label}</p>
      <p className="mt-2 text-2xl font-medium tracking-tight text-foreground">
        {value}
      </p>
      {change}
    </div>
  )
}

type SummaryCardsProps = {
  totals: MetricTotals
  comparison: SearchComparison
}

export function SearchSummaryCards({ totals, comparison }: SummaryCardsProps) {
  const prior = comparison.available ? comparison.totals : null

  return (
    <section className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label="Clicks"
        value={formatCount(totals.clicks)}
        change={
          prior ? (
            <CountChange current={totals.clicks} previous={prior.clicks} />
          ) : null
        }
      />
      <MetricCard
        label="Impressions"
        value={formatCount(totals.impressions)}
        change={
          prior ? (
            <CountChange
              current={totals.impressions}
              previous={prior.impressions}
            />
          ) : null
        }
      />
      <MetricCard
        label="CTR"
        value={formatCtr(totals.ctr)}
        change={
          prior ? (
            <CtrChange current={totals.ctr} previous={prior.ctr} />
          ) : null
        }
      />
      <MetricCard
        label="Average position"
        value={formatPosition(totals.position)}
        change={
          prior ? (
            <PositionChange
              current={totals.position}
              previous={prior.position}
            />
          ) : null
        }
      />
    </section>
  )
}

export function SearchPositionCaveat() {
  return (
    <p className="mt-20 max-w-2xl text-sm leading-relaxed text-meta">
      Average position is directional. Google averages it across impressions.
    </p>
  )
}

export function SearchMoversUnavailable({
  coverageStartedOn,
}: {
  coverageStartedOn: string | null
}) {
  return (
    <p className="mt-16 max-w-2xl text-sm leading-relaxed text-meta">
      {coverageStartedOn
        ? `Query movers are omitted because the prior period starts before trustworthy coverage (${formatDisplayDate(coverageStartedOn)}).`
        : 'Query movers are omitted because the prior period cannot be verified against coverage.'}
    </p>
  )
}

export function SectionHeading({ children }: { children: string }) {
  return (
    <h2 className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-meta">
      {children}
    </h2>
  )
}

export function formatQueryCount(value: number): string {
  return formatCount(value)
}

export function formatQueryCtr(value: number | null): string {
  return formatCtr(value)
}

export function formatQueryPosition(value: number | null): string {
  return formatPosition(value)
}

export function formatClickDelta(value: number): string {
  return formatSigned(value)
}
