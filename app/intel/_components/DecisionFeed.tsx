import type { ReactNode } from 'react'

import { DecisionStatusControls } from '@/app/intel/_components/DecisionStatusControls'
import {
  DECISION_CATEGORY_LABELS,
  DECISION_CONFIDENCE_LABELS,
  DECISION_STATUS_LABELS,
  type DecisionConfidence,
  type DecisionStatus,
} from '@/lib/intel/decision-params'
import type {
  DecisionFeedItem,
  DecisionFeedSection,
} from '@/lib/intel/decisions/feed'
import { formatSpanLabel } from '@/lib/intel/search-params'
import { cn } from '@/lib/utils'

export function DecisionHeader() {
  return (
    <div>
      <p className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-cobalt-primary">
        Intel
      </p>
      <h1 className="mt-6 text-3xl font-black tracking-tight text-foreground md:text-4xl">
        Overview
      </h1>
    </div>
  )
}

export function DecisionQueryError() {
  return (
    <p
      className="mt-16 max-w-md text-base leading-relaxed text-body"
      role="alert"
    >
      Unable to load the decision feed. Try again shortly.
    </p>
  )
}

export function DecisionEmptyState() {
  return (
    <div className="mt-16 max-w-md">
      <p className="text-base font-medium text-foreground">No findings yet</p>
      <p className="mt-3 text-base leading-relaxed text-body">
        Detectors run daily after Search Console sync. Findings that need a
        look will appear here.
      </p>
    </div>
  )
}

export function DecisionFeed({ sections }: { sections: DecisionFeedSection[] }) {
  return (
    <div className="mt-14 space-y-16">
      {sections.map((section) => (
        <section key={section.category}>
          <h2 className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-meta">
            {DECISION_CATEGORY_LABELS[section.category]}
          </h2>
          <ul className="mt-6 divide-y divide-black/8">
            {section.items.map((item) => (
              <li key={item.id} className="py-8 first:pt-0">
                <DecisionItem item={item} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function DecisionItem({ item }: { item: DecisionFeedItem }) {
  return (
    <article>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
        <h3 className="text-base font-medium text-foreground">{item.title}</h3>
        <ConfidenceLabel confidence={item.confidence} />
        <StatusLabel status={item.status} />
      </div>
      <p className="mt-2 text-sm text-meta">
        {formatSpanLabel({ start: item.periodStart, end: item.periodEnd })}
      </p>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-body">
        {item.description}
      </p>
      {item.recommendedAction ? (
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-body">
          <span className="font-medium text-foreground">Recommended. </span>
          {item.recommendedAction}
        </p>
      ) : null}
      {item.relatedUrl ? <RelatedUrl href={item.relatedUrl} /> : null}
      <EvidenceBlock evidence={item.evidence} />
      <DecisionStatusControls itemId={item.id} currentStatus={item.status} />
    </article>
  )
}

function ConfidenceLabel({ confidence }: { confidence: DecisionConfidence }) {
  return (
    <span
      className={cn(
        'text-xs tracking-wide',
        confidence === 'exploratory' ? 'text-meta' : 'text-body',
      )}
    >
      {DECISION_CONFIDENCE_LABELS[confidence]}
    </span>
  )
}

function StatusLabel({ status }: { status: DecisionStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs tracking-wide',
        status === 'new'
          ? 'bg-cobalt-muted-subtle text-foreground'
          : 'text-meta',
      )}
    >
      {DECISION_STATUS_LABELS[status]}
    </span>
  )
}

function RelatedUrl({ href }: { href: string }) {
  const label = href.replace(/^https?:\/\//, '')
  if (!/^https?:\/\//i.test(href)) {
    return <p className="mt-3 text-sm text-body">{href}</p>
  }

  return (
    <p className="mt-3 text-sm">
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
    <details className="mt-5 max-w-2xl">
      <summary className="cursor-pointer text-sm text-meta transition-colors hover:text-foreground">
        Evidence
      </summary>
      <dl className="mt-4 space-y-3">
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
    return formatEvidenceNumber(fieldKey, value)
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
