import Link from 'next/link'

import { Panel } from '@/app/intel/_components/ui/Panel'
import { formatMonth } from '@/lib/reports/format'
import type { CareTier } from '@/lib/reports/generate'
import type { ReportStatus } from '@/lib/reports/load'
import { cn } from '@/lib/utils'

import type { QueueReportRow } from '@/app/intel/reports/data'

const STATUS_LABEL: Record<ReportStatus, string> = {
  pending: 'Pending',
  draft: 'Draft',
  sent: 'Sent',
  failed: 'Failed',
}

const TIER_LABEL: Record<CareTier, string> = {
  essential: 'Essential',
  care: 'Care',
  growth: 'Growth',
}

type StatusTone = 'new' | 'active' | 'success' | 'muted' | 'warning'

const TONE_CLASS: Record<StatusTone, string> = {
  new: 'bg-cobalt-soft font-medium text-foreground',
  active: 'bg-black/[0.08] font-medium text-foreground',
  success: 'bg-positive-soft font-medium text-positive',
  muted: 'bg-black/[0.05] font-medium text-meta',
  warning: 'bg-warning-soft font-medium text-warning',
}

const DOT_CLASS: Record<StatusTone, string> = {
  new: 'bg-cobalt-primary',
  active: 'bg-meta',
  success: 'bg-positive',
  muted: 'bg-meta/40',
  warning: 'bg-warning',
}

export function ReportsHeader() {
  return (
    <h1 className="text-base font-semibold tracking-tight text-foreground">
      Reports
    </h1>
  )
}

export function ReportsQueryError() {
  return (
    <p className="text-sm leading-relaxed text-body" role="alert">
      Unable to load reports. Try again shortly.
    </p>
  )
}

export function ReportsEmptyState() {
  return (
    <div>
      <p className="text-sm font-medium text-foreground">No reports yet</p>
      <p className="mt-2 text-sm leading-relaxed text-body">
        Monthly reports will appear here after the 4th-of-month run.
      </p>
    </div>
  )
}

export function ReportsQueue({
  rows,
  awaitingCount,
}: {
  rows: QueueReportRow[]
  awaitingCount: number
}) {
  return (
    <div className="flex flex-col gap-4">
      {awaitingCount > 0 ? (
        <Panel title="Awaiting review" accent="cobalt">
          <p className="text-sm leading-relaxed text-body">
            {awaitingCount === 1
              ? '1 Care report is waiting for a narrative before send.'
              : `${awaitingCount} Care reports are waiting for a narrative before send.`}
          </p>
        </Panel>
      ) : null}

      <Panel title="Recent">
        <ul className="divide-y divide-black/8 lg:hidden">
          {rows.map((row) => (
            <li key={row.id} className="py-3">
              <div className="flex items-start justify-between gap-4">
                <Link
                  href={`/intel/reports/${row.id}`}
                  className="min-w-0 text-sm font-medium text-foreground transition-colors hover:text-cobalt-primary"
                >
                  {row.clientName}
                </Link>
                <ReportStatusBadge
                  status={row.status}
                  awaitingReview={row.awaitingReview}
                />
              </div>
              <p className="mt-1 text-sm text-body">{formatMonth(row.period)}</p>
              <p className="mt-2 text-sm text-meta">
                {TIER_LABEL[row.tier]}
                <span aria-hidden className="px-2">
                  ·
                </span>
                {row.hasPdf ? 'PDF ready' : 'No PDF'}
              </p>
            </li>
          ))}
        </ul>

        <div className="hidden lg:block">
          <table className="w-full border-collapse text-left text-sm">
            <caption className="sr-only">Monthly reports</caption>
            <thead>
              <tr className="border-b border-black/8">
                <th className="py-1.5 pr-4 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-meta">
                  Client
                </th>
                <th className="py-1.5 pr-4 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-meta">
                  Period
                </th>
                <th className="py-1.5 pr-4 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-meta">
                  Tier
                </th>
                <th className="py-1.5 pr-4 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-meta">
                  Status
                </th>
                <th className="py-1.5 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-meta">
                  PDF
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-black/8 last:border-b-0">
                  <td className="py-2.5 pr-4">
                    <Link
                      href={`/intel/reports/${row.id}`}
                      className="font-medium text-foreground transition-colors hover:text-cobalt-primary"
                    >
                      {row.clientName}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4 text-body">{formatMonth(row.period)}</td>
                  <td className="py-2.5 pr-4 text-body">{TIER_LABEL[row.tier]}</td>
                  <td className="py-2.5 pr-4">
                    <ReportStatusBadge
                      status={row.status}
                      awaitingReview={row.awaitingReview}
                    />
                  </td>
                  <td className="py-2.5 text-body">
                    {row.hasPdf ? 'Ready' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}

function ReportStatusBadge({
  status,
  awaitingReview,
}: {
  status: ReportStatus
  awaitingReview: boolean
}) {
  const tone = statusTone(status, awaitingReview)
  const label = awaitingReview ? 'Awaiting review' : STATUS_LABEL[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[0.65rem] tracking-wide',
        TONE_CLASS[tone],
      )}
    >
      <span
        className={cn('size-1.5 shrink-0 rounded-full', DOT_CLASS[tone])}
        aria-hidden
      />
      {label}
    </span>
  )
}

function statusTone(status: ReportStatus, awaitingReview: boolean): StatusTone {
  if (awaitingReview) {
    return 'new'
  }
  if (status === 'sent') {
    return 'success'
  }
  if (status === 'failed') {
    return 'warning'
  }
  if (status === 'draft') {
    return 'muted'
  }
  return 'active'
}
