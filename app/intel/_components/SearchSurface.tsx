import Link from 'next/link'
import {
  ChartNoAxesColumn,
  Eye,
  MousePointerClick,
  Percent,
} from 'lucide-react'

import { MetricCard } from '@/app/intel/_components/ui/MetricCard'
import type { MetricDeltaDirection } from '@/app/intel/_components/ui/MetricCard'
import { PanelQueryError } from '@/app/intel/_components/ui/PanelRetry'
import { Sparkline } from '@/app/intel/_components/ui/Sparkline'
import { StatStrip } from '@/app/intel/_components/ui/StatStrip'
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
  DailyPoint,
  MetricTotals,
  SearchComparison,
} from '@/lib/intel/search'
import { cn } from '@/lib/utils'

export function SearchHeader() {
  return (
    <h1 className="text-base font-semibold tracking-tight text-foreground">
      Search
    </h1>
  )
}

export function SearchQueryError() {
  return (
    <PanelQueryError message="Unable to load search data. Data could not be loaded." />
  )
}

type EmptyStateProps = {
  title: string
  body: string
}

export function SearchEmptyState({ title, body }: EmptyStateProps) {
  return (
    <div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-body">{body}</p>
    </div>
  )
}

export function SearchRangeNav({ range }: { range: SearchRange }) {
  return (
    <nav aria-label="Date range" className="flex flex-wrap gap-x-4 gap-y-1">
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
  const prior = comparison.available
    ? `vs ${formatSpanLabel(comparison.span)}`
    : comparison.coverageStartedOn
      ? `Prior unavailable — coverage starts ${formatDisplayDate(comparison.coverageStartedOn)}`
      : 'Prior unavailable'

  return (
    <p className="text-xs text-meta">
      {formatSpanLabel(span)}
      <span aria-hidden className="px-1.5">
        ·
      </span>
      {prior}
    </p>
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

function numericDirection(
  current: number,
  previous: number,
): MetricDeltaDirection {
  if (current > previous) {
    return 'up'
  }
  if (current < previous) {
    return 'down'
  }
  return 'flat'
}

type DeltaFields = {
  deltaLabel: string
  deltaDirection: MetricDeltaDirection
  context: string
}

function countDelta(current: number, previous: number): DeltaFields {
  const relative = formatPercentAgainstMeaningfulBase(current, previous)
  const deltaLabel =
    current === previous
      ? '0'
      : (relative ?? formatSigned(current - previous))
  return {
    deltaLabel,
    deltaDirection: numericDirection(current, previous),
    context: `Prior ${formatCount(previous)}`,
  }
}

function ctrDelta(
  current: number | null,
  previous: number | null,
): DeltaFields | null {
  if (current === null || previous === null) {
    return null
  }
  const deltaPoints = (current - previous) * 100
  return {
    deltaLabel:
      deltaPoints === 0 ? '0' : `${formatSigned(deltaPoints, 1)} pt`,
    deltaDirection: numericDirection(current, previous),
    context: `Prior ${formatCtr(previous)}`,
  }
}

function positionDelta(
  current: number | null,
  previous: number | null,
): DeltaFields | null {
  if (current === null || previous === null) {
    return null
  }
  const delta = current - previous
  return {
    deltaLabel: delta === 0 ? '0' : formatSigned(delta, 1),
    deltaDirection: numericDirection(current, previous),
    context: `Prior ${formatPosition(previous)}`,
  }
}

type SummaryCardsProps = {
  totals: MetricTotals
  comparison: SearchComparison
  daily: readonly DailyPoint[]
}

export function SearchSummaryCards({
  totals,
  comparison,
  daily,
}: SummaryCardsProps) {
  const prior = comparison.available ? comparison.totals : null
  const clickDelta = prior ? countDelta(totals.clicks, prior.clicks) : null
  const impressionDelta = prior
    ? countDelta(totals.impressions, prior.impressions)
    : null
  const ctrChange = prior ? ctrDelta(totals.ctr, prior.ctr) : null
  const positionChange = prior
    ? positionDelta(totals.position, prior.position)
    : null
  const clickPoints = daily.map((point) => point.clicks)
  const impressionPoints = daily.map((point) => point.impressions)

  return (
    <StatStrip>
      <MetricCard
        label="Clicks"
        value={formatCount(totals.clicks)}
        icon={<MousePointerClick className="size-3" />}
        accent="cobalt-tint"
        deltaLabel={clickDelta?.deltaLabel}
        deltaDirection={clickDelta?.deltaDirection}
        sparkline={
          clickPoints.length > 0 ? (
            <Sparkline points={clickPoints} />
          ) : undefined
        }
        context={clickDelta?.context}
      />
      <MetricCard
        label="Impressions"
        value={formatCount(totals.impressions)}
        icon={<Eye className="size-3" />}
        accent="cobalt-tint"
        deltaLabel={impressionDelta?.deltaLabel}
        deltaDirection={impressionDelta?.deltaDirection}
        sparkline={
          impressionPoints.length > 0 ? (
            <Sparkline points={impressionPoints} />
          ) : undefined
        }
        context={impressionDelta?.context}
      />
      <MetricCard
        label="CTR"
        value={formatCtr(totals.ctr)}
        icon={<Percent className="size-3" />}
        accent="cobalt-tint"
        deltaLabel={ctrChange?.deltaLabel}
        deltaDirection={ctrChange?.deltaDirection}
        context={ctrChange?.context}
      />
      <MetricCard
        label="Average position"
        value={formatPosition(totals.position)}
        icon={<ChartNoAxesColumn className="size-3" />}
        accent="cobalt-tint"
        deltaLabel={positionChange?.deltaLabel}
        deltaDirection={positionChange?.deltaDirection}
        lowerIsBetter
        context={positionChange?.context}
      />
    </StatStrip>
  )
}

export function SearchPositionCaveat() {
  return (
    <p className="text-sm leading-relaxed text-meta">
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
    <p className="text-sm leading-relaxed text-meta">
      {coverageStartedOn
        ? `Query movers are omitted because the prior period starts before trustworthy coverage (${formatDisplayDate(coverageStartedOn)}).`
        : 'Query movers are omitted because the prior period cannot be verified against coverage.'}
    </p>
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
