import type { Metadata } from 'next'
import Link from 'next/link'

import { CategoryToggles } from '@/app/intel/_components/new-businesses/CategoryToggles'
import { ImportLatestButton, ImportRow } from '@/app/intel/_components/new-businesses/ImportControls'
import { NewBusinessFilters } from '@/app/intel/_components/new-businesses/NewBusinessFilters'
import { NewBusinessesTable } from '@/app/intel/_components/new-businesses/NewBusinessesTable'
import { Panel } from '@/app/intel/_components/ui/Panel'
import { requireIntelUser } from '@/lib/auth/allowlist'
import { formatLocalTimestamp } from '@/lib/briefing/dates'
import { formatPeriod, periodKey } from '@/lib/new-businesses/discovery'
import {
  fetchCategories,
  fetchImports,
  fetchNewBusinesses,
  fetchNewBusinessFilterOptions,
  fetchNewBusinessTierCounts,
  type NewBusinessTierCounts,
} from '@/lib/new-businesses/load'
import { importSummaryLine } from '@/lib/new-businesses/messages'
import {
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

/**
 * "236 businesses from 677 license records · 120 likely · 80 possible · 36 low".
 * Counts follow every filter except Lead, so the breakdown shows all three tiers.
 */
function tierCountLine(listTotal: number, tiers: NewBusinessTierCounts | null): string {
  const format = (n: number) => n.toLocaleString('en-US')
  const plural = (n: number, one: string, many: string) => `${format(n)} ${n === 1 ? one : many}`
  if (tiers === null) return plural(listTotal, 'business', 'businesses')
  const head =
    tiers.mode === 'grouped'
      ? `${plural(tiers.businesses, 'business', 'businesses')} from ${plural(tiers.licenseRecords, 'license record', 'license records')}`
      : plural(tiers.licenseRecords, 'license record', 'license records')
  return [head, `${format(tiers.likely)} likely`, `${format(tiers.possible)} possible`, `${format(tiers.low)} low`].join(' · ')
}

export default async function NewBusinessesPage({ searchParams }: PageProps) {
  await requireIntelUser()

  const params = parseNewBusinessesListParams(await searchParams)
  const [list, categories, imports, options, tiers] = await Promise.all([
    fetchNewBusinesses(params),
    fetchCategories(),
    fetchImports(),
    fetchNewBusinessFilterOptions(),
    fetchNewBusinessTierCounts(params),
  ])
  const periods = (imports ?? [])
    .filter((i) => i.state === 'imported')
    .map((i) => ({ value: periodKey(i.period), label: formatPeriod(i.period) }))

  return (
    // min-w-0 throughout: nothing on this page may widen it past the viewport.
    // The table scrolls inside its own panel instead.
    <div className="flex min-w-0 flex-col gap-4">
      <div className="min-w-0">
        <h1 className="intel-title text-foreground">New Businesses</h1>
        <p className="mt-1 intel-secondary text-meta">
          New business licenses from Clark County&apos;s monthly public lists. Only businesses in categories you
          enable are kept.
        </p>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <Panel title="Categories">
          {categories === null ? (
            <p className="intel-body text-body" role="alert">
              Unable to load categories. Try again shortly.
            </p>
          ) : (
            <CategoryToggles categories={categories} />
          )}
        </Panel>

        <Panel title="Imports">
          <ImportLatestButton />
          {imports === null ? (
            <p className="intel-body text-body" role="alert">
              Unable to load imports. Try again shortly.
            </p>
          ) : imports.length === 0 ? (
            <p className="intel-body leading-relaxed text-body">
              Nothing imported yet. The newest list is imported automatically each morning, or use Import latest.
            </p>
          ) : (
            <ul className="divide-y divide-black/8 intel-body">
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
          <p className="intel-body text-body" role="alert">
            Unable to load businesses. Try again shortly.
          </p>
        ) : list.rows.length === 0 ? (
          <p className="intel-body leading-relaxed text-body">
            No businesses match. Enable categories, then import or re-import a period.
          </p>
        ) : (
          <>
            <p className="mb-2 intel-secondary text-meta">{tierCountLine(list.total, tiers)}</p>
            {list.mode === 'licenses' ? (
              <p className="mb-2 intel-secondary text-meta">
                Businesses are grouped after the next import or re-import. Until then each license is listed on its own.
              </p>
            ) : null}
            {tiers !== null && tiers.unscored > 0 ? (
              <p className="mb-2 intel-secondary text-meta">Scores appear after the next import or re-import.</p>
            ) : null}
            <NewBusinessesTable rows={list.rows} />
            {list.pageCount > 1 ? (
              <nav aria-label="Business pages" className="mt-4 flex items-center justify-between gap-4 border-t border-black/8 pt-3 intel-body">
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
