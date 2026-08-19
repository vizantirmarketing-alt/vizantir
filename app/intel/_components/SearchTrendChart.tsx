import type { ReactNode } from 'react'

import { formatPercentAgainstMeaningfulBase } from '@/lib/intel/format-change'
import { SEARCH_RANGE_LABELS, type SearchRange } from '@/lib/intel/search-params'
import type { DailyPoint, SearchComparison } from '@/lib/intel/search'

import { formatQueryCount } from '@/app/intel/_components/SearchSurface'
import { Panel } from '@/app/intel/_components/ui/Panel'

const WIDTH = 720
const HEIGHT = 220
const PAD = { top: 4, right: 0, bottom: 18, left: 0 }
/** Dual-series rendering starts once a day actually occupies the clicks axis. */
const CLICKS_SERIES_MIN = 5
const CLICK_MARKER_RADIUS = 5
const CLICK_MARKER_RING = 2
const LINE_CORNER_RADIUS = 12
const FILLED_STROKE = 2
const SECONDARY_STROKE = 1.5

type PlotBox = {
  left: number
  top: number
  width: number
  height: number
}

const PLOT: PlotBox = {
  left: PAD.left,
  top: PAD.top,
  width: WIDTH - PAD.left - PAD.right,
  height: HEIGHT - PAD.top - PAD.bottom,
}

function peakOf(values: readonly number[]): number {
  let max = 0
  for (const value of values) {
    if (value > max) {
      max = value
    }
  }
  return max
}

function maxOf(values: readonly number[]): number {
  const peak = peakOf(values)
  return peak === 0 ? 1 : peak
}

function xAt(index: number, count: number): number {
  if (count <= 1) {
    return PLOT.left + PLOT.width / 2
  }
  return PLOT.left + (index / (count - 1)) * PLOT.width
}

function yAt(value: number, max: number): number {
  return PLOT.top + (1 - value / max) * PLOT.height
}

function toPoints(
  values: readonly number[],
  max: number,
): { x: number; y: number }[] {
  return values.map((value, index) => ({
    x: xAt(index, values.length),
    y: yAt(value, max),
  }))
}

function pct(value: number, total: number): string {
  return `${((value / total) * 100).toFixed(3)}%`
}

function roundedLinePath(
  points: readonly { x: number; y: number }[],
  radius: number = LINE_CORNER_RADIUS,
): string {
  if (points.length === 0) {
    return ''
  }
  if (points.length === 1) {
    const only = points[0]
    if (!only) return ''
    return `M${only.x.toFixed(2)} ${only.y.toFixed(2)}`
  }
  if (points.length === 2) {
    const first = points[0]
    const last = points[1]
    if (!first || !last) return ''
    return `M${first.x.toFixed(2)} ${first.y.toFixed(2)} L${last.x.toFixed(2)} ${last.y.toFixed(2)}`
  }

  const start = points[0]
  if (!start) return ''
  let d = `M${start.x.toFixed(2)} ${start.y.toFixed(2)}`

  for (let index = 1; index < points.length - 1; index += 1) {
    const prev = points[index - 1]
    const curr = points[index]
    const next = points[index + 1]
    if (!prev || !curr || !next) continue

    const inDx = curr.x - prev.x
    const inDy = curr.y - prev.y
    const outDx = next.x - curr.x
    const outDy = next.y - curr.y
    const inLen = Math.hypot(inDx, inDy)
    const outLen = Math.hypot(outDx, outDy)

    if (inLen === 0 || outLen === 0) {
      d += ` L${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`
      continue
    }

    const corner = Math.min(radius, inLen / 2, outLen / 2)
    const beforeX = curr.x - (inDx / inLen) * corner
    const beforeY = curr.y - (inDy / inLen) * corner
    const afterX = curr.x + (outDx / outLen) * corner
    const afterY = curr.y + (outDy / outLen) * corner

    d += ` L${beforeX.toFixed(2)} ${beforeY.toFixed(2)} Q${curr.x.toFixed(2)} ${curr.y.toFixed(2)} ${afterX.toFixed(2)} ${afterY.toFixed(2)}`
  }

  const end = points[points.length - 1]
  if (!end) return d
  d += ` L${end.x.toFixed(2)} ${end.y.toFixed(2)}`
  return d
}

function areaPath(points: readonly { x: number; y: number }[]): string {
  const first = points[0]
  const last = points[points.length - 1]
  if (first === undefined || last === undefined) {
    return ''
  }
  const baseline = (PLOT.top + PLOT.height).toFixed(2)
  return `${roundedLinePath(points)} L${last.x.toFixed(2)} ${baseline} L${first.x.toFixed(2)} ${baseline} Z`
}

function compactCount(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

function directionPhrase(
  current: number,
  previous: number | null,
): string {
  if (previous === null) {
    return ''
  }
  if (current === previous) {
    return ', unchanged from the prior period'
  }
  if (previous === 0) {
    return ', up from none in the prior period'
  }

  const relative = formatPercentAgainstMeaningfulBase(current, previous)
  if (relative && relative !== '0%') {
    if (relative.startsWith('+')) {
      return `, up ${relative.slice(1)} from the prior period`
    }
    return `, down ${relative.slice(1)} from the prior period`
  }

  const delta = current - previous
  if (delta > 0) {
    return `, up ${formatQueryCount(delta)} from the prior period`
  }
  return `, down ${formatQueryCount(Math.abs(delta))} from the prior period`
}

function visibleSummary(
  clicks: number,
  impressions: number,
  comparison: SearchComparison,
  range: SearchRange,
): string {
  const priorClicks = comparison.available ? comparison.totals.clicks : null
  const priorImpressions = comparison.available
    ? comparison.totals.impressions
    : null
  const rangeLabel = SEARCH_RANGE_LABELS[range]

  if (!comparison.available) {
    return `Clicks totaled ${formatQueryCount(clicks)}. Impressions totaled ${formatQueryCount(impressions)}.`
  }

  return `Clicks totaled ${formatQueryCount(clicks)}${directionPhrase(clicks, priorClicks)} over ${rangeLabel}. Impressions totaled ${formatQueryCount(impressions)}${directionPhrase(impressions, priorImpressions)}.`
}

function accessibleDescription(
  daily: readonly DailyPoint[],
  clicks: number,
  impressions: number,
  spanLabel: string,
  markClicks: boolean,
): string {
  if (daily.length === 0) {
    return `No daily search trend for ${spanLabel}.`
  }

  let minClicks = daily[0]?.clicks ?? 0
  let maxClicks = minClicks
  let minImpressions = daily[0]?.impressions ?? 0
  let maxImpressions = minImpressions
  let markedDays = 0

  for (const point of daily) {
    if (point.clicks < minClicks) minClicks = point.clicks
    if (point.clicks > maxClicks) maxClicks = point.clicks
    if (point.impressions < minImpressions) minImpressions = point.impressions
    if (point.impressions > maxImpressions) maxImpressions = point.impressions
    if (point.clicks > 0) markedDays += 1
  }

  if (markClicks) {
    return `Line chart of daily impressions from ${spanLabel}, with circular markers on days that received clicks. Impressions totaled ${formatQueryCount(impressions)} and ranged from ${formatQueryCount(minImpressions)} to ${formatQueryCount(maxImpressions)} a day. Clicks totaled ${formatQueryCount(clicks)} across ${formatQueryCount(markedDays)} marked days, ranging from ${formatQueryCount(minClicks)} to ${formatQueryCount(maxClicks)} a day.`
  }

  return `Line chart of daily clicks and impressions from ${spanLabel}. Clicks totaled ${formatQueryCount(clicks)} and ranged from ${formatQueryCount(minClicks)} to ${formatQueryCount(maxClicks)} a day. Impressions totaled ${formatQueryCount(impressions)} and ranged from ${formatQueryCount(minImpressions)} to ${formatQueryCount(maxImpressions)} a day.`
}

function tickDates(daily: readonly DailyPoint[]): { index: number; label: string }[] {
  if (daily.length === 0) {
    return []
  }

  const first = daily[0]
  const last = daily[daily.length - 1]
  if (first === undefined || last === undefined) {
    return []
  }

  const ticks: { index: number; label: string }[] = [
    { index: 0, label: formatShortDate(first.date) },
  ]

  if (daily.length >= 3) {
    const mid = Math.floor((daily.length - 1) / 2)
    const middle = daily[mid]
    if (middle) {
      ticks.push({ index: mid, label: formatShortDate(middle.date) })
    }
  }

  if (daily.length > 1) {
    ticks.push({
      index: daily.length - 1,
      label: formatShortDate(last.date),
    })
  }

  return ticks
}

function formatShortDate(iso: string): string {
  const parts = iso.split('-')
  const year = Number(parts[0])
  const month = Number(parts[1])
  const day = Number(parts[2])
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return iso
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

function dateAnchor(
  index: number,
  count: number,
): 'start' | 'middle' | 'end' {
  if (index === 0) return 'start'
  if (index === count - 1) return 'end'
  return 'middle'
}

type ClickMarker = {
  date: string
  clicks: number
  x: number
  y: number
}

function clickMarkersOnImpressions(
  daily: readonly DailyPoint[],
  impressionPoints: readonly { x: number; y: number }[],
): ClickMarker[] {
  const markers: ClickMarker[] = []
  for (let index = 0; index < daily.length; index += 1) {
    const point = daily[index]
    const host = impressionPoints[index]
    if (!point || !host || point.clicks <= 0) {
      continue
    }
    markers.push({
      date: point.date,
      clicks: point.clicks,
      x: host.x,
      y: host.y,
    })
  }
  return markers
}

function screenDotPath(x: number, y: number): string {
  return `M${x.toFixed(2)} ${y.toFixed(2)}h0.01`
}

function StrokeSwatch({ className }: { className: string }) {
  return (
    <span
      className={`h-[3px] w-2.5 shrink-0 rounded-full ${className}`}
      aria-hidden
    />
  )
}

function MarkerSwatch() {
  return (
    <span
      className="size-2 shrink-0 rounded-full bg-cobalt-primary ring-2 ring-white shadow-[0_0_0_1px] shadow-cobalt-primary"
      aria-hidden
    />
  )
}

function LegendItem({
  swatch,
  label,
}: {
  swatch: ReactNode
  label: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-body">
      {swatch}
      {label}
    </span>
  )
}

type SearchTrendChartProps = {
  daily: readonly DailyPoint[]
  clicks: number
  impressions: number
  range: SearchRange
  spanLabel: string
  comparison: SearchComparison
}

export function SearchTrendChart({
  daily,
  clicks,
  impressions,
  range,
  spanLabel,
  comparison,
}: SearchTrendChartProps) {
  const clickValues = daily.map((point) => point.clicks)
  const impressionValues = daily.map((point) => point.impressions)
  const markClicks = peakOf(clickValues) < CLICKS_SERIES_MIN
  const clickMax = maxOf(clickValues)
  const impressionMax = maxOf(impressionValues)
  const clickPoints = toPoints(clickValues, clickMax)
  const impressionPoints = toPoints(impressionValues, impressionMax)
  const clickLine = roundedLinePath(clickPoints)
  const impressionLine = roundedLinePath(impressionPoints)
  const clickArea = areaPath(clickPoints)
  const impressionArea = areaPath(impressionPoints)
  const markers = markClicks
    ? clickMarkersOnImpressions(daily, impressionPoints)
    : []
  const baseline = PLOT.top + PLOT.height
  const axisMax = markClicks ? impressionMax : clickMax
  const dates = tickDates(daily)
  const description = accessibleDescription(
    daily,
    clicks,
    impressions,
    spanLabel,
    markClicks,
  )

  return (
    <Panel
      title="Trend"
      headerAction={
        <span className="text-xs text-meta">{SEARCH_RANGE_LABELS[range]}</span>
      }
    >
      <p className="max-w-2xl text-sm leading-relaxed text-body">
        {visibleSummary(clicks, impressions, comparison, range)}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-5">
        {markClicks ? (
          <>
            <LegendItem
              swatch={<StrokeSwatch className="bg-cobalt-primary" />}
              label="Impressions"
            />
            <LegendItem
              swatch={<MarkerSwatch />}
              label="Clicks · marked days"
            />
          </>
        ) : (
          <>
            <LegendItem
              swatch={<StrokeSwatch className="bg-cobalt-primary" />}
              label="Clicks"
            />
            <LegendItem
              swatch={<StrokeSwatch className="bg-meta" />}
              label="Impressions"
            />
          </>
        )}
      </div>
      <figure className="mt-3">
        <figcaption className="sr-only">{description}</figcaption>
        <svg
          className="block h-[180px] w-full overflow-visible md:h-[220px]"
          role="img"
          aria-labelledby="search-trend-title"
        >
          <title id="search-trend-title">
            {markClicks
              ? `Daily impressions with click markers, ${spanLabel}`
              : `Daily clicks and impressions, ${spanLabel}`}
          </title>
          <desc>{description}</desc>

          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            preserveAspectRatio="none"
            aria-hidden
          >
            <line
              x1={0}
              y1={baseline}
              x2={WIDTH}
              y2={baseline}
              className="stroke-black/10"
              strokeWidth="1"
            />

            {markClicks ? (
              <>
                {impressionArea ? (
                  <path d={impressionArea} className="fill-cobalt-primary/18" />
                ) : null}
                {impressionLine ? (
                  <path
                    d={impressionLine}
                    className="fill-none stroke-cobalt-primary"
                    strokeWidth={FILLED_STROKE}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                ) : null}
                {impressionPoints.length === 1 && impressionPoints[0] ? (
                  <path
                    d={screenDotPath(
                      impressionPoints[0].x,
                      impressionPoints[0].y,
                    )}
                    className="stroke-cobalt-primary"
                    strokeWidth={FILLED_STROKE + 3}
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                ) : null}
                {markers.map((marker) => (
                  <g key={marker.date}>
                    <path
                      d={screenDotPath(marker.x, marker.y)}
                      className="stroke-white"
                      strokeWidth={
                        CLICK_MARKER_RADIUS * 2 + CLICK_MARKER_RING * 2
                      }
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                    <path
                      d={screenDotPath(marker.x, marker.y)}
                      className="stroke-cobalt-primary"
                      strokeWidth={CLICK_MARKER_RADIUS * 2}
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>
                ))}
              </>
            ) : (
              <>
                {impressionLine ? (
                  <path
                    d={impressionLine}
                    className="fill-none stroke-meta"
                    strokeWidth={SECONDARY_STROKE}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                ) : null}
                {clickArea ? (
                  <path d={clickArea} className="fill-cobalt-primary/18" />
                ) : null}
                {clickLine ? (
                  <path
                    d={clickLine}
                    className="fill-none stroke-cobalt-primary"
                    strokeWidth={FILLED_STROKE}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                ) : null}
                {clickPoints.length === 1 && clickPoints[0] ? (
                  <path
                    d={screenDotPath(clickPoints[0].x, clickPoints[0].y)}
                    className="stroke-cobalt-primary"
                    strokeWidth={FILLED_STROKE + 3}
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                ) : null}
              </>
            )}
          </svg>

          <text
            x={8}
            y={pct(PLOT.top + 11, HEIGHT)}
            className="fill-meta text-[0.65rem]"
          >
            {compactCount(axisMax)}
          </text>
          <text
            x={8}
            y={pct(baseline - 2, HEIGHT)}
            className="fill-meta text-[0.65rem]"
          >
            0
          </text>

          {markClicks
            ? markers.map((marker) =>
                marker.clicks > 1 ? (
                  <text
                    key={`${marker.date}-count`}
                    x={pct(marker.x, WIDTH)}
                    y={pct(marker.y, HEIGHT)}
                    dy={-(CLICK_MARKER_RADIUS + CLICK_MARKER_RING + 3)}
                    textAnchor="middle"
                    className="fill-cobalt-primary text-[0.65rem]"
                  >
                    {marker.clicks}
                  </text>
                ) : null,
              )
            : null}

          {dates.map((tick) => (
            <text
              key={`${tick.index}-${tick.label}`}
              x={pct(xAt(tick.index, daily.length), WIDTH)}
              y={pct(HEIGHT - 5, HEIGHT)}
              textAnchor={dateAnchor(tick.index, daily.length)}
              className="fill-meta text-[0.65rem]"
            >
              {tick.label}
            </text>
          ))}
        </svg>
      </figure>
    </Panel>
  )
}
