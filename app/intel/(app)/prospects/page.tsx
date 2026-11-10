import type { Metadata } from 'next'

import { ProspectCampaigns } from '@/app/intel/_components/prospects/ProspectCampaigns'
import { ProspectRunRequestForm } from '@/app/intel/_components/prospects/ProspectRunRequestForm'
import { ProspectRunsList } from '@/app/intel/_components/prospects/ProspectRunsList'
import { ProspectsFilters } from '@/app/intel/_components/prospects/ProspectsFilters'
import {
  ProspectsEmptyState,
  ProspectsPagination,
  ProspectsTable,
} from '@/app/intel/_components/prospects/ProspectsTable'
import { Panel } from '@/app/intel/_components/ui/Panel'
import { requireIntelUser } from '@/lib/auth/allowlist'
import type { Campaign } from '@/lib/briefing/campaigns'
import { createCampaignStore } from '@/lib/briefing/store'
import {
  fetchProspectFilterOptions,
  fetchProspects,
  fetchRecentProspectRuns,
} from '@/lib/prospects/load'
import {
  parseProspectsListParams,
  prospectsFiltersActive,
  type ProspectsSearchParams,
} from '@/lib/prospects/params'

export const metadata: Metadata = {
  title: 'Prospect Research',
  robots: { index: false, follow: false },
}

type ProspectsPageProps = {
  searchParams: Promise<ProspectsSearchParams>
}

export default async function IntelProspectsPage({
  searchParams,
}: ProspectsPageProps) {
  await requireIntelUser()

  const params = parseProspectsListParams(await searchParams)
  const [result, options, runs] = await Promise.all([
    fetchProspects(params),
    fetchProspectFilterOptions(),
    fetchRecentProspectRuns(),
  ])
  const filtersActive = prospectsFiltersActive(params)
  const campaigns = await loadCampaigns()

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-base font-semibold tracking-tight text-foreground">
          Prospect Research
        </h1>
        <p className="mt-1 text-sm text-meta">
          Companies found by outbound research. Inbound inquiries stay under Leads.
        </p>
      </div>

      <Panel title="Request research" accent="cobalt">
        <ProspectRunRequestForm />
      </Panel>

      <Panel title="Scheduled campaigns">
        {campaigns === null ? (
          <p className="text-sm leading-relaxed text-body" role="alert">
            Unable to load scheduled campaigns. Try again shortly.
          </p>
        ) : (
          <ProspectCampaigns campaigns={campaigns} />
        )}
      </Panel>

      <Panel title="Recent runs">
        {runs.ok ? (
          <ProspectRunsList runs={runs.runs} />
        ) : (
          <p className="text-sm leading-relaxed text-body" role="alert">
            Unable to load research runs. Try again shortly.
          </p>
        )}
      </Panel>

      <Panel title="Filters">
        <ProspectsFilters
          params={params}
          industries={options.industries}
          markets={options.markets}
        />
      </Panel>

      <Panel title="Prospects">
        {!result.ok ? (
          <p className="text-sm leading-relaxed text-body" role="alert">
            Unable to load prospects. Try again shortly.
          </p>
        ) : result.total === 0 && filtersActive ? (
          <ProspectsEmptyState
            title="No matching prospects"
            body="Nothing matches the current filters."
            action={{ href: '/intel/prospects', label: 'Clear filters' }}
          />
        ) : result.total === 0 ? (
          <ProspectsEmptyState
            title="No prospects yet"
            body="Researched companies appear here after the research runner submits results for a run."
          />
        ) : (
          <>
            <ProspectsTable rows={result.rows} />
            <ProspectsPagination
              params={params}
              page={result.page}
              pageCount={result.pageCount}
              total={result.total}
            />
          </>
        )}
      </Panel>
    </div>
  )
}

async function loadCampaigns(): Promise<Campaign[] | null> {
  try {
    return await createCampaignStore().listAllCampaigns()
  } catch {
    console.error('Prospect campaigns query failed')
    return null
  }
}
