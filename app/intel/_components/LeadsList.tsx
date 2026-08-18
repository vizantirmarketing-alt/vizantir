import Link from 'next/link'

import {
  formatChannelLabel,
  formatSubmittedAt,
  leadsListHref,
  type LeadListRow,
  type LeadsListParams,
} from '@/lib/intel/lead-params'

import { LeadDeliveryMark } from '@/app/intel/_components/LeadDeliveryMark'
import { LeadStatusBadge } from '@/app/intel/_components/LeadStatusBadge'

type LeadsListProps = {
  rows: LeadListRow[]
  nowMs: number
}

function SubmittedCell({ iso, nowMs }: { iso: string; nowMs: number }) {
  return (
    <time dateTime={iso} title={iso}>
      {formatSubmittedAt(iso, nowMs)}
    </time>
  )
}

export function LeadsList({ rows, nowMs }: LeadsListProps) {
  return (
    <div className="mt-12">
      <ul className="divide-y divide-black/8 lg:hidden">
        {rows.map((row) => (
          <li key={row.id} className="py-6">
            <div className="flex items-start justify-between gap-4">
              <Link
                href={`/intel/leads/${row.id}`}
                className="text-base font-medium text-foreground transition-colors hover:text-cobalt-primary"
              >
                {row.name}
              </Link>
              <LeadStatusBadge status={row.status} />
            </div>
            <p className="mt-1 text-sm text-body">{row.company ?? '—'}</p>
            <p className="mt-3 text-sm text-meta">
              {row.service}
              <span aria-hidden className="px-2">
                ·
              </span>
              {formatChannelLabel(row.initial_channel)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-meta">
              <SubmittedCell iso={row.created_at} nowMs={nowMs} />
              <LeadDeliveryMark status={row.notify_status} />
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden lg:block">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">Contact submissions</caption>
          <thead>
            <tr className="border-b border-black/8">
              <th className="py-3 pr-4 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-meta">
                Submitted
              </th>
              <th className="py-3 pr-4 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-meta">
                Name
              </th>
              <th className="py-3 pr-4 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-meta">
                Company
              </th>
              <th className="py-3 pr-4 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-meta">
                Service
              </th>
              <th className="py-3 pr-4 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-meta">
                Status
              </th>
              <th className="py-3 pr-4 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-meta">
                Channel
              </th>
              <th className="py-3 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-meta">
                Delivery
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-black/8">
                <td className="whitespace-nowrap py-4 pr-4 text-meta">
                  <SubmittedCell iso={row.created_at} nowMs={nowMs} />
                </td>
                <td className="max-w-[12rem] py-4 pr-4">
                  <Link
                    href={`/intel/leads/${row.id}`}
                    className="font-medium text-foreground transition-colors hover:text-cobalt-primary"
                  >
                    {row.name}
                  </Link>
                </td>
                <td className="max-w-[11rem] truncate py-4 pr-4 text-body">
                  {row.company ?? '—'}
                </td>
                <td className="max-w-[11rem] truncate py-4 pr-4 text-body">
                  {row.service}
                </td>
                <td className="py-4 pr-4">
                  <LeadStatusBadge status={row.status} />
                </td>
                <td className="whitespace-nowrap py-4 pr-4 text-body">
                  {formatChannelLabel(row.initial_channel)}
                </td>
                <td className="py-4">
                  <LeadDeliveryMark status={row.notify_status} />
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
      className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-black/8 pt-8"
    >
      <p className="text-sm text-meta">
        {total} {total === 1 ? 'inquiry' : 'inquiries'}
        {pageCount > 1 ? ` · Page ${page} of ${pageCount}` : null}
      </p>
      {pageCount > 1 ? (
        <div className="flex items-center gap-6">
          {previousHref ? (
            <Link
              href={previousHref}
              className="text-sm text-foreground transition-colors hover:text-cobalt-primary"
            >
              Previous
            </Link>
          ) : (
            <span className="text-sm text-meta">Previous</span>
          )}
          {nextHref ? (
            <Link
              href={nextHref}
              className="text-sm text-foreground transition-colors hover:text-cobalt-primary"
            >
              Next
            </Link>
          ) : (
            <span className="text-sm text-meta">Next</span>
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
    <div className="mt-16 max-w-md">
      <p className="text-base font-medium text-foreground">{title}</p>
      <p className="mt-3 text-base leading-relaxed text-body">{body}</p>
      {action ? (
        <Link
          href={action.href}
          className="mt-6 inline-block text-sm text-cobalt-primary transition-colors hover:text-[#1E85FF]"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  )
}

export function LeadsQueryError() {
  return (
    <p className="mt-16 max-w-md text-base leading-relaxed text-body" role="alert">
      Unable to load inquiries. Try again shortly.
    </p>
  )
}

export function LeadsHeader() {
  return (
    <div>
      <p className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-cobalt-primary">
        Intel
      </p>
      <h1 className="mt-6 text-3xl font-black tracking-tight text-foreground md:text-4xl">
        Leads
      </h1>
    </div>
  )
}
