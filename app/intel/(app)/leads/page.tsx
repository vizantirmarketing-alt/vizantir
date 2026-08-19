import type { Metadata } from 'next'

import { LeadsFilters } from '@/app/intel/_components/LeadsFilters'
import {
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
import { fetchLeadDashboardStats, fetchLeads } from '@/lib/intel/leads'

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
      className="text-sm text-cobalt-primary transition-colors hover:text-[#1E85FF]"
    >
      Export this filtered view
    </a>
  )
}

export default async function IntelLeadsPage({ searchParams }: LeadsPageProps) {
  await requireIntelUser()

  const params = parseLeadsListParams(await searchParams)
  const [result, stats] = await Promise.all([
    fetchLeads(params),
    fetchLeadDashboardStats(),
  ])

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
            body="Contact form submissions will appear here as they arrive."
          />
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
          <LeadsEmptyState
            title="No matching inquiries"
            body="Nothing matches the current filters."
            action={{ href: '/intel/leads', label: 'Clear filters' }}
          />
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
        <LeadsList rows={result.rows} nowMs={result.nowMs} listParams={params} />
        <LeadsPagination
          params={params}
          page={result.page}
          pageCount={result.pageCount}
          total={result.total}
        />
      </Panel>
    </div>
  )
}
