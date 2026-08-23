import type { ReactNode } from 'react'
import {
  ChevronDown,
  Eye,
  MousePointerClick,
  ScanSearch,
  UserRound,
} from 'lucide-react'

import { DecisionStatusControls } from '@/app/intel/_components/DecisionStatusControls'
import { MetricCard } from '@/app/intel/_components/ui/MetricCard'
import { Panel, type PanelAccent } from '@/app/intel/_components/ui/Panel'
import { Sparkline } from '@/app/intel/_components/ui/Sparkline'
import {
  ConfidenceChip,
  DecisionStatusChip,
} from '@/app/intel/_components/ui/StatusChip'
import { StatStrip } from '@/app/intel/_components/ui/StatStrip'
import { DECISION_CATEGORY_LABELS, type DecisionCategory } from '@/lib/intel/decision-params'
import { formatHeadlineFact } from '@/lib/intel/decisions/headline-fact'
import type {
  DecisionFeedItem,
  DecisionFeedSection,
} from '@/lib/intel/decisions/feed'
import { formatSpanLabel } from '@/lib/intel/search-params'

export function DecisionHeader() {
  return (
    <h1 className="text-base font-semibold tracking-tight text-foreground">
      Overview
    </h1>
  )
}

export function DecisionQueryError() {
  return (
    <p className="text-sm leading-relaxed text-body" role="alert">
      Unable to load the decision feed. Try again shortly.
    </p>
  )
}

export function DecisionEmptyState() {
  return (
    <div>
      <p className="text-sm font-medium text-foreground">No findings yet</p>
      <p className="mt-2 text-sm leading-relaxed text-body">
        Detectors run daily after Search Console sync. Findings that need a
        look will appear here.
      </p>
    </div>
  )
}

function formatCount(value: number | null): string {
  if (value === null) {
    return '—'
  }
  return new Intl.NumberFormat('en-US').format(value)
}

function lastTwoDayContext(values: readonly number[]): string | undefined {
  if (values.length < 2) {
    return undefined
  }
  const lastDay = values[values.length - 1]
  const priorDay = values[values.length - 2]
  if (lastDay === undefined || priorDay === undefined) {
    return undefined
  }
  if (lastDay === 0 && priorDay === 0) {
    return 'Quiet last two days'
  }
  return `${formatCount(lastDay)} last day · ${formatCount(priorDay)} prior day`
}

type OverviewStatStripProps = {
  findingsNeedingAttention: number | null
  leadsLast28Days: number | null
  leadsDaily: number[]
  clicks28d: number | null
  clicksDaily: number[]
  impressions28d: number | null
  impressionsDaily: number[]
}

export function OverviewStatStrip({
  findingsNeedingAttention,
  leadsLast28Days,
  leadsDaily,
  clicks28d,
  clicksDaily,
  impressions28d,
  impressionsDaily,
}: OverviewStatStripProps) {
  return (
    <StatStrip>
      <MetricCard
        label="Findings needing attention"
        value={formatCount(findingsNeedingAttention)}
        icon={<ScanSearch className="size-3" />}
        accent="cobalt"
      />
      <MetricCard
        label="Leads this 28 days"
        value={formatCount(leadsLast28Days)}
        icon={<UserRound className="size-3" />}
        accent="cobalt"
        sparkline={
          leadsDaily.length > 0 ? <Sparkline points={leadsDaily} /> : undefined
        }
        context={lastTwoDayContext(leadsDaily)}
      />
      <MetricCard
        label="Clicks 28d"
        value={formatCount(clicks28d)}
        icon={<MousePointerClick className="size-3" />}
        accent="cobalt-tint"
        sparkline={
          clicksDaily.length > 0 ? (
            <Sparkline points={clicksDaily} />
          ) : undefined
        }
        context={lastTwoDayContext(clicksDaily)}
      />
      <MetricCard
        label="Impressions 28d"
        value={formatCount(impressions28d)}
        icon={<Eye className="size-3" />}
        accent="cobalt-tint"
        sparkline={
          impressionsDaily.length > 0 ? (
            <Sparkline points={impressionsDaily} />
          ) : undefined
        }
        context={lastTwoDayContext(impressionsDaily)}
      />
    </StatStrip>
  )
}

const CATEGORY_ACCENT: Record<DecisionCategory, PanelAccent> = {
  needs_attention: 'warning-severe',
  opportunity: 'cobalt',
  working: 'positive',
  system: 'neutral',
}

export function DecisionFeed({ sections }: { sections: DecisionFeedSection[] }) {
  return (
    <div className="flex flex-col gap-3">
      {sections.map((section) => (
        <Panel
          key={section.category}
          title={DECISION_CATEGORY_LABELS[section.category]}
          accent={CATEGORY_ACCENT[section.category]}
        >
          <ul className="divide-y divide-black/8">
            {section.items.map((item) => (
              <li key={item.findingKey}>
                <DecisionItem item={item} />
              </li>
            ))}
          </ul>
        </Panel>
      ))}
    </div>
  )
}

function DecisionItem({ item }: { item: DecisionFeedItem }) {
  const fact = formatHeadlineFact(item.detector, item.evidence)

  return (
    <article className="min-w-0">
      <details className="group">
        <summary className="flex h-12 cursor-pointer list-none items-center gap-2.5 overflow-hidden [&::-webkit-details-marker]:hidden">
          <h3 className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
            {item.title}
          </h3>
          <span className="shrink-0">
            <ConfidenceChip confidence={item.confidence} />
          </span>
          <span className="shrink-0">
            <DecisionStatusChip status={item.status} />
          </span>
          {fact ? (
            <span className="min-w-0 max-w-[8rem] truncate text-xs font-medium tabular-nums text-body sm:max-w-[16rem]">
              {fact}
            </span>
          ) : null}
          <span className="ml-auto flex size-5 shrink-0 items-center justify-center rounded-md bg-cobalt-soft text-cobalt-primary">
            <ChevronDown
              className="size-3.5 transition-transform group-open:rotate-180"
              aria-hidden
            />
          </span>
        </summary>
        <div className="space-y-3 border-t border-black/8 pb-3 pt-3">
          <p className="text-xs text-meta">
            {formatSpanLabel({ start: item.periodStart, end: item.periodEnd })}
          </p>
          <p className="text-sm leading-relaxed text-body">{item.description}</p>
          {item.recommendedAction ? (
            <p className="text-sm leading-relaxed text-body">
              <span className="font-medium text-foreground">Recommended. </span>
              {item.recommendedAction}
            </p>
          ) : null}
          {item.relatedUrl ? <RelatedUrl href={item.relatedUrl} /> : null}
          <EvidenceBlock evidence={item.evidence} />
          <DecisionStatusControls
            findingKey={item.findingKey}
            currentStatus={item.status}
          />
        </div>
      </details>
    </article>
  )
}

function RelatedUrl({ href }: { href: string }) {
  const label = href.replace(/^https?:\/\//, '')
  if (!/^https?:\/\//i.test(href)) {
    return <p className="text-sm text-body">{href}</p>
  }

  return (
    <p className="text-sm">
      <a
        href={href}
        className="text-cobalt-primary transition-colors hover:text-[#1E85FF]"
      >
        {label}
      </a>
    </p>
  )
}

function EvidenceBlock({ evidence }: { evidence: Record<string, unknown> }) {
  const entries = Object.entries(evidence)
  if (entries.length === 0) {
    return null
  }

  return (
    <details>
      <summary className="cursor-pointer text-sm text-meta transition-colors hover:text-foreground">
        Evidence
      </summary>
      <dl className="mt-3 space-y-3">
        {entries.map(([key, value]) => (
          <div key={key}>
            <dt className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-meta">
              {humanizeKey(key)}
            </dt>
            <dd className="mt-1 text-sm text-body">
              <EvidenceValue fieldKey={key} value={value} />
            </dd>
          </div>
        ))}
      </dl>
    </details>
  )
}

function humanizeKey(key: string): string {
  const spaced = key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
  if (spaced.length === 0) {
    return key
  }
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

function EvidenceValue({
  fieldKey,
  value,
}: {
  fieldKey: string
  value: unknown
}): ReactNode {
  if (value === null || value === undefined) {
    return '—'
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }
  if (typeof value === 'number') {
    return (
      <span className="tabular-nums">
        {formatEvidenceNumber(fieldKey, value)}
      </span>
    )
  }
  if (typeof value === 'string') {
    if (value.length === 0) {
      return '—'
    }
    return value
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '—'
    }
    return (
      <ul className="space-y-2">
        {value.map((entry, index) => (
          <li key={index}>
            <EvidenceValue fieldKey={fieldKey} value={entry} />
          </li>
        ))}
      </ul>
    )
  }
  if (typeof value === 'object') {
    const entries: Array<[string, unknown]> = []
    for (const key of Object.keys(value)) {
      entries.push([key, Reflect.get(value, key)])
    }
    if (entries.length === 0) {
      return '—'
    }
    return (
      <ul className="space-y-1">
        {entries.map(([key, nested]) => (
          <li key={key}>
            <span className="text-meta">{humanizeKey(key)}: </span>
            <EvidenceValue fieldKey={key} value={nested} />
          </li>
        ))}
      </ul>
    )
  }
  return '—'
}

function formatEvidenceNumber(fieldKey: string, value: number): string {
  const key = fieldKey.toLowerCase()
  if (key === 'ctr' || key.endsWith('ctr')) {
    return `${(value * 100).toFixed(1)}%`
  }
  if (key === 'position' || key.endsWith('position')) {
    return value.toFixed(1)
  }
  if (Number.isInteger(value) || Math.abs(value - Math.round(value)) < 1e-9) {
    return new Intl.NumberFormat('en-US').format(Math.round(value))
  }
  return value.toFixed(2)
}
