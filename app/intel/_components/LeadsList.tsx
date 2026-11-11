import Link from 'next/link'
import { CircleDot, Inbox, Layers, TriangleAlert } from 'lucide-react'

import {
  formatChannelLabel,
  formatSubmittedAt,
  leadDetailHref,
  leadsListHref,
  type LeadListRow,
  type LeadsListParams,
} from '@/lib/intel/lead-params'

import { LeadDeleteControl } from '@/app/intel/_components/LeadDeleteControl'
import { LeadDeliveryMark } from '@/app/intel/_components/LeadDeliveryMark'
import { LeadStatusBadge } from '@/app/intel/_components/LeadStatusBadge'
import { MetricCard } from '@/app/intel/_components/ui/MetricCard'
import { StatStrip } from '@/app/intel/_components/ui/StatStrip'
import type { LeadDashboardStats } from '@/lib/intel/leads'

type LeadsListProps = {
  rows: LeadListRow[]
  nowMs: number
  listParams: LeadsListParams
}

function SubmittedCell({ iso, nowMs }: { iso: string; nowMs: number }) {
  return (
    <time dateTime={iso} className="tabular-nums">
      {formatSubmittedAt(iso, nowMs)}
    </time>
  )
}

export function LeadsList({ rows, nowMs, listParams }: LeadsListProps) {
  return (
    <div>
      {/* Table from xl: at 14px its seven columns and chips need more than the 1024px content width. */}
      <ul className="divide-y divide-black/8 xl:hidden">
        {rows.map((row) => (
          <li
            key={row.id}
            className="py-2 data-pending:pointer-events-none data-pending:opacity-60"
          >
            <div className="flex items-start justify-between gap-4">
              <Link
                href={leadDetailHref(row.id, listParams)}
                prefetch={false}
                className="intel-body font-medium text-foreground transition-colors hover:text-cobalt-primary"
              >
                {row.name}
              </Link>
              {row.status === 'spam' ? (
                <div className="flex items-center gap-1">
                  <LeadStatusBadge status={row.status} />
                  <LeadDeleteControl
                    leadId={row.id}
                    name={row.name}
                    company={row.company}
                  />
                </div>
              ) : (
                <LeadStatusBadge status={row.status} />
              )}
            </div>
            <p className="mt-1 intel-body text-body">{row.company ?? '—'}</p>
            <p className="mt-2 intel-secondary text-meta">
              {row.service}
              <span aria-hidden className="px-2">
                ·
              </span>
              {formatChannelLabel(row.initial_channel)}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 intel-secondary text-meta">
              <SubmittedCell iso={row.created_at} nowMs={nowMs} />
              <LeadDeliveryMark status={row.notify_status} />
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden xl:block">
        <table className="w-full border-collapse text-left intel-secondary">
          <caption className="sr-only">Contact submissions</caption>
          <thead>
            <tr className="border-b border-black/8">
              <th className="intel-th pr-3">
                Submitted
              </th>
              <th className="intel-th pr-3">
                Name
              </th>
              <th className="intel-th pr-3">
                Company
              </th>
              <th className="intel-th pr-3">
                Service
              </th>
              <th className="intel-th pr-3">
                Status
              </th>
              <th className="intel-th pr-3">
                Channel
              </th>
              <th className="intel-th">
                Delivery
              </th>
              <th className="w-px whitespace-nowrap p-0">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-black/8 data-pending:pointer-events-none data-pending:opacity-60"
              >
                <td className="whitespace-nowrap py-[5px] pr-3 text-meta">
                  <SubmittedCell iso={row.created_at} nowMs={nowMs} />
                </td>
                <td className="max-w-[12rem] py-[5px] pr-3">
                  <Link
                    href={leadDetailHref(row.id, listParams)}
                    prefetch={false}
                    className="font-medium text-foreground transition-colors hover:text-cobalt-primary"
                  >
                    {row.name}
                  </Link>
                </td>
                {/* Truncate on an inner block: browsers ignore max-width on table cells. */}
                <td className="py-[5px] pr-3 text-body">
                  <span className="block max-w-[11rem] truncate">{row.company ?? '—'}</span>
                </td>
                <td className="py-[5px] pr-3 text-body">
                  <span className="block max-w-[11rem] truncate">{row.service}</span>
                </td>
                <td className="py-[5px] pr-3">
                  <LeadStatusBadge status={row.status} />
                </td>
                <td className="whitespace-nowrap py-[5px] pr-3 text-body">
                  {formatChannelLabel(row.initial_channel)}
                </td>
                <td className="py-[5px]">
                  <LeadDeliveryMark status={row.notify_status} />
                </td>
                <td className="w-px whitespace-nowrap py-0 pr-0 pl-2 text-right align-middle">
                  {row.status === 'spam' ? (
                    <LeadDeleteControl
                      leadId={row.id}
                      name={row.name}
                      company={row.company}
                    />
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

type LeadsPaginationProps = {
  params: LeadsListParams
  page: number
  pageCount: number
  total: number
}

export function LeadsPagination({
  params,
  page,
  pageCount,
  total,
}: LeadsPaginationProps) {
  if (total === 0) {
    return null
  }

  const previousHref =
    page > 1 ? leadsListHref({ ...params, page: page - 1 }) : null
  const nextHref =
    page < pageCount ? leadsListHref({ ...params, page: page + 1 }) : null

  return (
    <nav
      aria-label="Leads pagination"
      className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-black/8 pt-3"
    >
      <p className="intel-secondary tabular-nums text-meta">
        {total} {total === 1 ? 'inquiry' : 'inquiries'}
        {pageCount > 1 ? ` · Page ${page} of ${pageCount}` : null}
      </p>
      {pageCount > 1 ? (
        <div className="flex items-center gap-6">
          {previousHref ? (
            <Link
              href={previousHref}
              className="intel-body text-foreground transition-colors hover:text-cobalt-primary"
            >
              Previous
            </Link>
          ) : (
            <span className="intel-secondary text-meta">Previous</span>
          )}
          {nextHref ? (
            <Link
              href={nextHref}
              className="intel-body text-foreground transition-colors hover:text-cobalt-primary"
            >
              Next
            </Link>
          ) : (
            <span className="intel-secondary text-meta">Next</span>
          )}
        </div>
      ) : null}
    </nav>
  )
}

type EmptyStateProps = {
  title: string
  body: string
  action?: { href: string; label: string }
}

export function LeadsEmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <div>
      <p className="intel-body font-medium text-foreground">{title}</p>
      <p className="mt-2 intel-body leading-relaxed text-body">{body}</p>
      {action ? (
        <Link
          href={action.href}
          className="mt-4 inline-block intel-body text-cobalt-primary transition-colors hover:text-[#1E85FF]"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  )
}

export function LeadsQueryError() {
  return (
    <p className="intel-body leading-relaxed text-body" role="alert">
      Unable to load inquiries. Try again shortly.
    </p>
  )
}

export function LeadsHeader() {
  return (
    <h1 className="intel-title text-foreground">
      Leads
    </h1>
  )
}

function formatCount(value: number | null): string {
  if (value === null) {
    return '—'
  }
  return new Intl.NumberFormat('en-US').format(value)
}

export function LeadsStatStrip({ stats }: { stats: LeadDashboardStats }) {
  const deliveryContext =
    stats.deliveryIssues !== null && stats.deliveryIssues > 0
      ? 'Failed or not configured'
      : undefined
  const deliveryTone =
    deliveryContext === undefined ? undefined : 'warning'

  return (
    <StatStrip>
      <MetricCard
        label="Total inquiries"
        value={formatCount(stats.total)}
        icon={<Inbox className="size-3" />}
        accent="cobalt"
      />
      <MetricCard
        label="New"
        value={formatCount(stats.newCount)}
        icon={<CircleDot className="size-3" />}
        accent="cobalt"
      />
      <MetricCard
        label="Active pipeline"
        value={formatCount(stats.activePipeline)}
        icon={<Layers className="size-3" />}
        accent="cobalt"
      />
      <MetricCard
        label="Delivery issues"
        value={formatCount(stats.deliveryIssues)}
        icon={<TriangleAlert className="size-3" />}
        accent="warning"
        context={deliveryContext}
        contextTone={deliveryTone}
      />
    </StatStrip>
  )
}
