import type { Metadata } from 'next'
import Link from 'next/link'

import { CategoryToggles } from '@/app/intel/_components/new-businesses/CategoryToggles'
import { ImportLatestButton, ImportRow } from '@/app/intel/_components/new-businesses/ImportControls'
import { NewBusinessFilters } from '@/app/intel/_components/new-businesses/NewBusinessFilters'
import { NewBusinessesTable } from '@/app/intel/_components/new-businesses/NewBusinessesTable'
import { WebsiteCheckButton } from '@/app/intel/_components/new-businesses/WebsiteCheckControls'
import { WebsiteCheckRunChip } from '@/app/intel/_components/ui/StatusChip'
import { resolvedCheckRunIds } from '@/lib/new-businesses/website-runs'
import { fetchCheckRuns, type CheckRunRow } from '@/lib/new-businesses/website-store'
import { splitRunSummary } from '@/lib/prospects/ingest'
import { Panel } from '@/app/intel/_components/ui/Panel'
import { requireIntelUser } from '@/lib/auth/allowlist'
import { createOutreachStore } from '@/lib/outreach/deps'
import { formatLocalTimestamp } from '@/lib/briefing/dates'
import { formatPeriod, periodKey } from '@/lib/new-businesses/discovery'
import {
  fetchCategories,
  fetchImports,
  fetchNewBusinesses,
  fetchNewBusinessFilterOptions,
  fetchNewBusinessTierCounts,
  type NewBusinessRow,
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
  return [
    head,
    `${format(tiers.likely)} likely`,
    `${format(tiers.possible)} possible`,
    `${format(tiers.low)} low`,
    `${format(tiers.checked)} checked`,
    `${format(tiers.noWebsite)} no website`,
  ].join(' · ')
}

/** The last few website-check runs, with the prospect runs' note and error lines. */
function CheckRunList({ runs }: { runs: CheckRunRow[] | null }) {
  if (runs === null) {
    return (
      <p className="intel-body text-body" role="alert">
        Unable to load website checks. Try again shortly.
      </p>
    )
  }
  if (runs.length === 0) {
    return <p className="intel-body text-body">No website checks yet.</p>
  }
  const resolved = resolvedCheckRunIds(runs)
  return (
    <ul className="divide-y divide-black/8 intel-body">
      {runs.map((run) => {
        const summary = splitRunSummary(run.errorSummary)
        // A failure resolved by a later completed check is a fact, not a problem.
        const isResolved = resolved.has(run.id)
        const errors = isResolved ? [] : summary.errors
        const notes = isResolved ? [...summary.notes, 'The cause has since been resolved. Its unchecked businesses went back into the queue.'] : summary.notes
        const when = run.finishedAt ?? run.claimedAt ?? run.requestedAt
        return (
          <li key={run.id} className="min-w-0 py-2 first:pt-0 last:pb-0">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
              <WebsiteCheckRunChip state={run.state} />
              <span className="text-body">
                {run.businessCount > 0
                  ? `${run.checked} of ${run.businessCount} checked${run.rejected > 0 ? ` · ${run.rejected} rejected` : ''}`
                  : run.state === 'requested'
                    ? 'Waiting for the research runner'
                    : 'No businesses'}
              </span>
              <span className="intel-secondary text-meta">
                {run.source === 'schedule' ? 'Scheduled' : 'Requested'} · {formatLocalTimestamp(when)}
              </span>
            </div>
            {notes.map((note) => (
              <p key={`n-${note}`} className="mt-0.5 intel-secondary text-meta [overflow-wrap:anywhere]">
                {note}
              </p>
            ))}
            {errors.map((error) => (
              <p key={`e-${error}`} className="mt-0.5 intel-secondary text-warning-severe [overflow-wrap:anywhere]">
                {error}
              </p>
            ))}
          </li>
        )
      })}
    </ul>
  )
}

/**
 * Draft ids for the accepted rows on this page, keyed by subject (the group
 * key, or the row id before grouping). Null when Outreach cannot be read, for
 * example before migration 0032; the rows then just offer Draft email.
 */
async function activeDraftsFor(rows: NewBusinessRow[]): Promise<Map<string, string> | null> {
  const refs = rows.filter((row) => row.reviewStatus === 'accepted').map((row) => row.groupKey ?? row.id)
  if (refs.length === 0) return new Map()
  try {
    const drafts = await createOutreachStore().activeDraftsFor('new_business', refs)
    return new Map(drafts.map((draft) => [draft.subjectRef, draft.id]))
  } catch {
    return null
  }
}

export default async function NewBusinessesPage({ searchParams }: PageProps) {
  await requireIntelUser()

  const params = parseNewBusinessesListParams(await searchParams)
  const [list, categories, imports, options, tiers, checkRuns] = await Promise.all([
    fetchNewBusinesses(params),
    fetchCategories(),
    fetchImports(),
    fetchNewBusinessFilterOptions(),
    fetchNewBusinessTierCounts(params),
    fetchCheckRuns(5),
  ])
  const activeDrafts = list.ok ? await activeDraftsFor(list.rows) : null
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

      <Panel title="Website checks">
        <WebsiteCheckButton />
        <CheckRunList runs={checkRuns} />
      </Panel>

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
            <NewBusinessesTable rows={list.rows} activeDrafts={activeDrafts} />
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
