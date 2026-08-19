import { formatPercentAgainstMeaningfulBase } from '@/lib/intel/format-change'
import { SEARCH_RANGE_LABELS, type SearchRange } from '@/lib/intel/search-params'
import type { DailyPoint, SearchComparison } from '@/lib/intel/search'

import { formatQueryCount } from '@/app/intel/_components/SearchSurface'
import { Panel } from '@/app/intel/_components/ui/Panel'

const WIDTH = 720
const HEIGHT = 220
const PAD = { top: 14, right: 40, bottom: 28, left: 40 }
/** Dual-series rendering starts once a day actually occupies the clicks axis. */
const CLICKS_SERIES_MIN = 5
const CLICK_MARKER_RADIUS = 4

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

function linePath(points: readonly { x: number; y: number }[]): string {
  return points
    .map((point, index) => {
      const command = index === 0 ? 'M' : 'L'
      return `${command}${point.x.toFixed(2)} ${point.y.toFixed(2)}`
    })
    .join(' ')
}

function areaPath(points: readonly { x: number; y: number }[]): string {
  const first = points[0]
  const last = points[points.length - 1]
  if (first === undefined || last === undefined) {
    return ''
  }
  const baseline = (PLOT.top + PLOT.height).toFixed(2)
  return `${linePath(points)} L${last.x.toFixed(2)} ${baseline} L${first.x.toFixed(2)} ${baseline} Z`
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
  const clickLine = linePath(clickPoints)
  const impressionLine = linePath(impressionPoints)
  const clickArea = areaPath(clickPoints)
  const impressionArea = areaPath(impressionPoints)
  const markers = markClicks
    ? clickMarkersOnImpressions(daily, impressionPoints)
    : []
  const baseline = PLOT.top + PLOT.height
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
      <div className="mt-3 flex flex-wrap gap-5 text-sm">
        {markClicks ? (
          <>
            <p className="text-meta">Impressions</p>
            <p className="text-cobalt-primary">Clicks · marked days</p>
          </>
        ) : (
          <>
            <p className="text-cobalt-primary">Clicks</p>
            <p className="text-meta">Impressions</p>
          </>
        )}
      </div>
      <figure className="mt-3">
        <figcaption className="sr-only">{description}</figcaption>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-[180px] w-full md:h-[220px]"
          role="img"
          aria-labelledby="search-trend-title"
        >
          <title id="search-trend-title">
            {markClicks
              ? `Daily impressions with click markers, ${spanLabel}`
              : `Daily clicks and impressions, ${spanLabel}`}
          </title>
          <desc>{description}</desc>

          <line
            x1={PLOT.left}
            y1={baseline}
            x2={PLOT.left + PLOT.width}
            y2={baseline}
            className="stroke-black/10"
            strokeWidth="1"
          />

          {markClicks ? (
            <>
              <text
                x={PLOT.left - 8}
                y={PLOT.top + 4}
                textAnchor="end"
                className="fill-meta text-[0.65rem]"
              >
                {compactCount(impressionMax)}
              </text>
              <text
                x={PLOT.left - 8}
                y={baseline}
                textAnchor="end"
                className="fill-meta text-[0.65rem]"
              >
                0
              </text>
            </>
          ) : (
            <>
              <text
                x={PLOT.left - 8}
                y={PLOT.top + 4}
                textAnchor="end"
                className="fill-cobalt-primary text-[0.65rem]"
              >
                {compactCount(clickMax)}
              </text>
              <text
                x={PLOT.left - 8}
                y={baseline}
                textAnchor="end"
                className="fill-cobalt-primary text-[0.65rem]"
              >
                0
              </text>
              <text
                x={PLOT.left + PLOT.width + 8}
                y={PLOT.top + 4}
                textAnchor="start"
                className="fill-meta text-[0.65rem]"
              >
                {compactCount(impressionMax)}
              </text>
              <text
                x={PLOT.left + PLOT.width + 8}
                y={baseline}
                textAnchor="start"
                className="fill-meta text-[0.65rem]"
              >
                0
              </text>
            </>
          )}

          {impressionArea ? (
            <path d={impressionArea} className="fill-foreground/8" />
          ) : null}
          {impressionLine ? (
            <path
              d={impressionLine}
              className="stroke-foreground/35"
              fill="none"
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null}
          {impressionPoints.length === 1 && impressionPoints[0] ? (
            <circle
              cx={impressionPoints[0].x}
              cy={impressionPoints[0].y}
              r="3"
              className="fill-foreground/40"
            />
          ) : null}

          {markClicks ? (
            markers.map((marker) => (
              <g key={marker.date}>
                <circle
                  cx={marker.x}
                  cy={marker.y}
                  r={CLICK_MARKER_RADIUS}
                  className="fill-cobalt-primary"
                />
                {marker.clicks > 1 ? (
                  <text
                    x={marker.x}
                    y={marker.y - CLICK_MARKER_RADIUS - 4}
                    textAnchor="middle"
                    className="fill-cobalt-primary text-[0.65rem]"
                  >
                    {marker.clicks}
                  </text>
                ) : null}
              </g>
            ))
          ) : (
            <>
              {clickArea ? (
                <path d={clickArea} className="fill-cobalt-primary/12" />
              ) : null}
              {clickLine ? (
                <path
                  d={clickLine}
                  className="stroke-cobalt-primary"
                  fill="none"
                  strokeWidth="1.75"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ) : null}
              {clickPoints.length === 1 && clickPoints[0] ? (
                <circle
                  cx={clickPoints[0].x}
                  cy={clickPoints[0].y}
                  r="3"
                  className="fill-cobalt-primary"
                />
              ) : null}
            </>
          )}

          {dates.map((tick) => (
            <text
              key={`${tick.index}-${tick.label}`}
              x={xAt(tick.index, daily.length)}
              y={HEIGHT - 8}
              textAnchor="middle"
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
