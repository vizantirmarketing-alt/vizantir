import type { Metadata } from 'next'

import { DeleteAllSpamControl } from '@/app/intel/_components/DeleteAllSpamControl'
import { LeadsFilters } from '@/app/intel/_components/LeadsFilters'
import {
  HiddenSpamNote,
  LeadsEmptyState,
  LeadsHeader,
  LeadsList,
  LeadsPagination,
  LeadsQueryError,
  LeadsStatStrip,
} from '@/app/intel/_components/LeadsList'
import { Panel } from '@/app/intel/_components/ui/Panel'
import { requireIntelUser } from '@/lib/auth/allowlist'
import {
  leadsExportHref,
  parseLeadsListParams,
  type LeadsListParams,
  type LeadsSearchParams,
} from '@/lib/intel/lead-params'
import { fetchLeadDashboardStats, fetchLeads, fetchSpamCount } from '@/lib/intel/leads'

export const metadata: Metadata = {
  title: 'Leads',
  robots: { index: false, follow: false },
}

type LeadsPageProps = {
  searchParams: Promise<LeadsSearchParams>
}

function ExportAction({ params }: { params: LeadsListParams }) {
  return (
    <a
      href={leadsExportHref(params)}
      className="intel-body text-cobalt-text transition-colors hover:text-[#1E85FF]"
    >
      Export this filtered view
    </a>
  )
}

export default async function IntelLeadsPage({ searchParams }: LeadsPageProps) {
  await requireIntelUser()

  const params = parseLeadsListParams(await searchParams)
  const spamView = params.status === 'spam'
  const [result, stats, spamCount] = await Promise.all([
    fetchLeads(params),
    fetchLeadDashboardStats(),
    // Default view: spam matching the view's filters, shown as the hidden count.
    // Spam view: every spam row, the count "Delete all spam" states.
    params.status === 'all'
      ? fetchSpamCount(params)
      : spamView
        ? fetchSpamCount({ channel: 'all', q: '' })
        : Promise.resolve(null),
  ])
  const hiddenSpam = params.status === 'all' ? spamCount : null
  const deleteAll =
    spamView && spamCount !== null && spamCount > 0 ? (
      <DeleteAllSpamControl count={spamCount} />
    ) : null

  if (!result.ok) {
    return (
      <div className="flex flex-col gap-4">
        <LeadsHeader />
        <LeadsStatStrip stats={stats} />
        <Panel>
          <LeadsQueryError />
        </Panel>
      </div>
    )
  }

  if (result.total === 0 && !result.filtersActive) {
    return (
      <div className="flex flex-col gap-4">
        <LeadsHeader />
        <LeadsStatStrip stats={stats} />
        <Panel>
          <LeadsEmptyState
            title="No inquiries yet"
            body={
              hiddenSpam !== null && hiddenSpam > 0
                ? 'Only spam has arrived so far. Contact form submissions will appear here as they arrive.'
                : 'Contact form submissions will appear here as they arrive.'
            }
          />
          <HiddenSpamNote count={hiddenSpam} params={params} />
        </Panel>
      </div>
    )
  }

  if (result.total === 0 && result.filtersActive) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <LeadsHeader />
          <ExportAction params={params} />
        </div>
        <LeadsStatStrip stats={stats} />
        <Panel title="Filters">
          <LeadsFilters params={params} />
        </Panel>
        <Panel title="Inquiries">
          {deleteAll ? <div className="mb-3">{deleteAll}</div> : null}
          <LeadsEmptyState
            title="No matching inquiries"
            body="Nothing matches the current filters."
            action={{ href: '/intel/leads', label: 'Clear filters' }}
          />
          <HiddenSpamNote count={hiddenSpam} params={params} />
        </Panel>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <LeadsHeader />
        <ExportAction params={params} />
      </div>
      <LeadsStatStrip stats={stats} />
      <Panel title="Filters">
        <LeadsFilters params={params} />
      </Panel>
      <Panel title="Inquiries">
        {deleteAll ? <div className="mb-3">{deleteAll}</div> : null}
        <LeadsList rows={result.rows} nowMs={result.nowMs} listParams={params} />
        <LeadsPagination
          params={params}
          page={result.page}
          pageCount={result.pageCount}
          total={result.total}
        />
        <HiddenSpamNote count={hiddenSpam} params={params} />
      </Panel>
    </div>
  )
}
