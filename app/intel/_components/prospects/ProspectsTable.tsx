import Link from 'next/link'

import {
  ProspectConfidenceChip,
  ProspectReviewChip,
} from '@/app/intel/_components/ui/StatusChip'
import type { ProspectListRow } from '@/lib/prospects/load'
import {
  formatScore,
  formatShortDate,
  prospectsListHref,
  type ProspectsListParams,
} from '@/lib/prospects/params'

function ScoreValue({ value }: { value: number | null }) {
  return (
    <span className="tabular-nums text-foreground">{formatScore(value)}</span>
  )
}

export function ProspectsTable({ rows }: { rows: ProspectListRow[] }) {
  return (
    <>
      <ul className="divide-y divide-black/8 lg:hidden">
        {rows.map((row) => (
          <li key={row.id} className="py-3">
            <Link
              href={`/intel/prospects/${row.id}`}
              className="intel-body font-medium text-foreground transition-colors hover:text-cobalt-primary"
            >
              {row.name}
            </Link>
            <p className="mt-0.5 intel-secondary text-meta">{row.domain}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 intel-body text-body">
              <span>
                Fit <ScoreValue value={row.fitScore} />
              </span>
              <span aria-hidden>·</span>
              <span>
                Opportunity <ScoreValue value={row.opportunityScore} />
              </span>
              <ProspectConfidenceChip confidence={row.confidence} />
              <ProspectReviewChip status={row.reviewStatus} />
            </div>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-left intel-secondary">
          <thead>
            <tr className="border-b border-black/8 text-meta">
              <th className="intel-th pr-4">Company</th>
              <th className="intel-th pr-4">Industry</th>
              <th className="intel-th pr-4">Market</th>
              <th className="intel-th pr-4 text-right">Fit</th>
              <th className="intel-th pr-4 text-right">Opportunity</th>
              <th className="intel-th pr-4">Confidence</th>
              <th className="intel-th pr-4">Review</th>
              <th className="intel-th">Last researched</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/8">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="py-2.5 pr-4">
                  <Link
                    href={`/intel/prospects/${row.id}`}
                    className="font-medium text-foreground transition-colors hover:text-cobalt-primary"
                  >
                    {row.name}
                  </Link>
                  <p className="text-meta">{row.domain}</p>
                </td>
                <td className="py-2.5 pr-4 text-body">{row.industry ?? '—'}</td>
                <td className="py-2.5 pr-4 text-body">{row.market ?? '—'}</td>
                <td className="py-2.5 pr-4 text-right">
                  <ScoreValue value={row.fitScore} />
                </td>
                <td className="py-2.5 pr-4 text-right">
                  <ScoreValue value={row.opportunityScore} />
                </td>
                <td className="py-2.5 pr-4">
                  <ProspectConfidenceChip confidence={row.confidence} />
                </td>
                <td className="py-2.5 pr-4">
                  <ProspectReviewChip status={row.reviewStatus} />
                </td>
                <td className="py-2.5 tabular-nums text-body">
                  {formatShortDate(row.lastResearchedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export function ProspectsPagination({
  params,
  page,
  pageCount,
  total,
}: {
  params: ProspectsListParams
  page: number
  pageCount: number
  total: number
}) {
  if (pageCount <= 1) {
    return null
  }

  return (
    <nav
      aria-label="Prospect pages"
      className="mt-4 flex items-center justify-between gap-4 border-t border-black/8 pt-3 intel-body"
    >
      <span className="text-meta">
        Page {page} of {pageCount} · {total.toLocaleString('en-US')} prospects
      </span>
      <div className="flex gap-4">
        {page > 1 ? (
          <Link
            href={prospectsListHref({ ...params, page: page - 1 })}
            className="text-cobalt-primary transition-colors hover:text-[#1E85FF]"
          >
            Previous
          </Link>
        ) : null}
        {page < pageCount ? (
          <Link
            href={prospectsListHref({ ...params, page: page + 1 })}
            className="text-cobalt-primary transition-colors hover:text-[#1E85FF]"
          >
            Next
          </Link>
        ) : null}
      </div>
    </nav>
  )
}

export function ProspectsEmptyState({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: { href: string; label: string }
}) {
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
