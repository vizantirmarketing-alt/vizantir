import type { Metadata } from 'next'
import Link from 'next/link'

import { CategoryToggles } from '@/app/intel/_components/new-businesses/CategoryToggles'
import { ImportLatestButton, ImportRow } from '@/app/intel/_components/new-businesses/ImportControls'
import { NewBusinessFilters } from '@/app/intel/_components/new-businesses/NewBusinessFilters'
import { NewBusinessRowControls } from '@/app/intel/_components/new-businesses/NewBusinessRowControls'
import { Panel } from '@/app/intel/_components/ui/Panel'
import { requireIntelUser } from '@/lib/auth/allowlist'
import { formatLocalTimestamp } from '@/lib/briefing/dates'
import { formatPeriod, periodKey } from '@/lib/new-businesses/discovery'
import {
  fetchCategories,
  fetchImports,
  fetchNewBusinesses,
  fetchNewBusinessFilterOptions,
} from '@/lib/new-businesses/load'
import { importSummaryLine } from '@/lib/new-businesses/messages'
import {
  PHONE_LABEL,
  newBusinessesListHref,
  parseNewBusinessesListParams,
  type NewBusinessesSearchParams,
} from '@/lib/new-businesses/params'

export const dynamic = 'force-dynamic'
// Import latest and Re-import run through server actions on this route: one
// listing fetch, one PDF download (60 second timeout, 20 MB cap) and a parse.
// This matches the briefing cron route, which runs the same import.
export const maxDuration = 300

export const metadata: Metadata = {
  title: 'New Businesses',
  robots: { index: false, follow: false },
}

type PageProps = { searchParams: Promise<NewBusinessesSearchParams> }

function address(row: { address: string | null; suite: string | null; city: string | null; state: string | null; zip: string | null }): string {
  const street = [row.address, row.suite].filter(Boolean).join(', ')
  const place = [row.city, [row.state, row.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ')
  return [street, place].filter(Boolean).join(' · ') || '—'
}

export default async function NewBusinessesPage({ searchParams }: PageProps) {
  await requireIntelUser()

  const params = parseNewBusinessesListParams(await searchParams)
  const [list, categories, imports, options] = await Promise.all([
    fetchNewBusinesses(params),
    fetchCategories(),
    fetchImports(),
    fetchNewBusinessFilterOptions(),
  ])
  const periods = (imports ?? [])
    .filter((i) => i.state === 'imported')
    .map((i) => ({ value: periodKey(i.period), label: formatPeriod(i.period) }))

  return (
    // min-w-0 throughout: nothing on this page may widen it past the viewport.
    // The table scrolls inside its own panel instead.
    <div className="flex min-w-0 flex-col gap-4">
      <div className="min-w-0">
        <h1 className="text-base font-semibold tracking-tight text-foreground">New Businesses</h1>
        <p className="mt-1 text-sm text-meta">
          New business licenses from Clark County&apos;s monthly public lists. Only businesses in categories you
          enable are kept.
        </p>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <Panel title="Categories">
          {categories === null ? (
            <p className="text-sm text-body" role="alert">
              Unable to load categories. Try again shortly.
            </p>
          ) : (
            <CategoryToggles categories={categories} />
          )}
        </Panel>

        <Panel title="Imports">
          <ImportLatestButton />
          {imports === null ? (
            <p className="text-sm text-body" role="alert">
              Unable to load imports. Try again shortly.
            </p>
          ) : imports.length === 0 ? (
            <p className="text-sm leading-relaxed text-body">
              Nothing imported yet. The newest list is imported automatically each morning, or use Import latest.
            </p>
          ) : (
            <ul className="divide-y divide-black/8 text-sm">
              {imports.map((i) => (
                <ImportRow
                  key={periodKey(i.period)}
                  period={periodKey(i.period)}
                  label={formatPeriod(i.period)}
                  state={i.state}
                  summary={importSummaryLine(i)}
                  timestamp={formatLocalTimestamp(i.finishedAt ?? i.startedAt)}
                  error={i.error}
                />
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Filters">
        <NewBusinessFilters
          params={params}
          categories={options.categories}
          cities={options.cities}
          zips={options.zips}
          periods={periods}
        />
      </Panel>

      <Panel title="Businesses">
        {!list.ok ? (
          <p className="text-sm text-body" role="alert">
            Unable to load businesses. Try again shortly.
          </p>
        ) : list.rows.length === 0 ? (
          <p className="text-sm leading-relaxed text-body">
            No businesses match. Enable categories, then import or re-import a period.
          </p>
        ) : (
          <>
            <p className="mb-2 text-sm text-meta">{list.total.toLocaleString('en-US')} businesses</p>
            <div className="max-w-full overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-black/8 text-meta">
                    <th className="py-2 pr-4 font-normal">Name</th>
                    <th className="py-2 pr-4 font-normal">Category</th>
                    <th className="py-2 pr-4 font-normal">Address</th>
                    <th className="py-2 pr-4 font-normal">{PHONE_LABEL}</th>
                    <th className="py-2 pr-4 font-normal">Period</th>
                    <th className="py-2 font-normal">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/8">
                  {list.rows.map((row) => (
                    <tr key={row.id} className="align-top">
                      <td className="py-2.5 pr-4 font-medium text-foreground">{row.name}</td>
                      <td className="py-2.5 pr-4 text-body">{row.category}</td>
                      <td className="py-2.5 pr-4 text-body">{address(row)}</td>
                      <td className="whitespace-nowrap py-2.5 pr-4 tabular-nums text-body">{row.phone ?? '—'}</td>
                      <td className="whitespace-nowrap py-2.5 pr-4 text-body">{formatPeriod(row.period)}</td>
                      <td className="min-w-48 py-2.5">
                        <NewBusinessRowControls id={row.id} reviewStatus={row.reviewStatus} ownerNote={row.ownerNote} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {list.pageCount > 1 ? (
              <nav aria-label="Business pages" className="mt-4 flex items-center justify-between gap-4 border-t border-black/8 pt-3 text-sm">
                <span className="text-meta">
                  Page {params.page} of {list.pageCount}
                </span>
                <div className="flex gap-4">
                  {params.page > 1 ? (
                    <Link href={newBusinessesListHref({ ...params, page: params.page - 1 })} className="text-cobalt-primary transition-colors hover:text-[#1E85FF]">
                      Previous
                    </Link>
                  ) : null}
                  {params.page < list.pageCount ? (
                    <Link href={newBusinessesListHref({ ...params, page: params.page + 1 })} className="text-cobalt-primary transition-colors hover:text-[#1E85FF]">
                      Next
                    </Link>
                  ) : null}
                </div>
              </nav>
            ) : null}
          </>
        )}
      </Panel>
    </div>
  )
}
