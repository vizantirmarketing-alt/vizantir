import type { Metadata } from 'next'

import { LeadsFilters } from '@/app/intel/_components/LeadsFilters'
import {
  LeadsEmptyState,
  LeadsHeader,
  LeadsList,
  LeadsPagination,
  LeadsQueryError,
} from '@/app/intel/_components/LeadsList'
import { requireIntelUser } from '@/lib/auth/allowlist'
import {
  parseLeadsListParams,
  type LeadsSearchParams,
} from '@/lib/intel/lead-params'
import { fetchLeads } from '@/lib/intel/leads'

export const metadata: Metadata = {
  title: 'Leads',
  robots: { index: false, follow: false },
}

type LeadsPageProps = {
  searchParams: Promise<LeadsSearchParams>
}

export default async function IntelLeadsPage({ searchParams }: LeadsPageProps) {
  await requireIntelUser()

  const params = parseLeadsListParams(await searchParams)
  const result = await fetchLeads(params)

  if (!result.ok) {
    return (
      <div className="max-w-5xl">
        <LeadsHeader />
        <LeadsQueryError />
      </div>
    )
  }

  if (result.total === 0 && !result.filtersActive) {
    return (
      <div className="max-w-5xl">
        <LeadsHeader />
        <LeadsEmptyState
          title="No inquiries yet"
          body="Contact form submissions will appear here as they arrive."
        />
      </div>
    )
  }

  if (result.total === 0 && result.filtersActive) {
    return (
      <div className="max-w-5xl">
        <LeadsHeader />
        <LeadsFilters params={params} />
        <LeadsEmptyState
          title="No matching inquiries"
          body="Nothing matches the current filters."
          action={{ href: '/intel/leads', label: 'Clear filters' }}
        />
      </div>
    )
  }

  return (
    <div className="max-w-5xl">
      <LeadsHeader />
      <LeadsFilters params={params} />
      <LeadsList rows={result.rows} nowMs={result.nowMs} />
      <LeadsPagination
        params={params}
        page={result.page}
        pageCount={result.pageCount}
        total={result.total}
      />
    </div>
  )
}
