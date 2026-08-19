import type { Metadata } from 'next'

import {
  SearchDateSpans,
  SearchEmptyState,
  SearchHeader,
  SearchMoversUnavailable,
  SearchPositionCaveat,
  SearchQueryError,
  SearchRangeNav,
  SearchSummaryCards,
} from '@/app/intel/_components/SearchSurface'
import {
  SearchMovers,
  SearchNearPageOne,
  SearchTopQueries,
} from '@/app/intel/_components/SearchTables'
import { SearchTrendChart } from '@/app/intel/_components/SearchTrendChart'
import { Panel } from '@/app/intel/_components/ui/Panel'
import { requireIntelUser } from '@/lib/auth/allowlist'
import { fetchSearchIntelligence } from '@/lib/intel/search'
import {
  formatSpanLabel,
  parseSearchPageParams,
  type SearchSearchParams,
} from '@/lib/intel/search-params'

export const metadata: Metadata = {
  title: 'Search',
  robots: { index: false, follow: false },
}

type SearchPageProps = {
  searchParams: Promise<SearchSearchParams>
}

export default async function IntelSearchPage({ searchParams }: SearchPageProps) {
  await requireIntelUser()

  const params = parseSearchPageParams(await searchParams)
  const result = await fetchSearchIntelligence(params.range)

  if (!result.ok) {
    return (
      <div className="flex flex-col gap-4">
        <SearchHeader />
        <Panel>
          <SearchQueryError />
        </Panel>
      </div>
    )
  }

  if (result.status === 'no_data') {
    return (
      <div className="flex flex-col gap-4">
        <SearchHeader />
        <Panel>
          <SearchEmptyState
            title="No search data yet"
            body="Search Console has not been synced into this workspace."
          />
        </Panel>
      </div>
    )
  }

  if (result.status === 'empty_range') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <SearchHeader />
          <SearchRangeNav range={result.range} />
        </div>
        <SearchDateSpans span={result.span} comparison={result.comparison} />
        <Panel>
          <SearchEmptyState
            title="No rows in this range"
            body="Nothing was recorded for the selected dates."
          />
        </Panel>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <SearchHeader />
        <SearchRangeNav range={result.range} />
      </div>
      <SearchDateSpans span={result.span} comparison={result.comparison} />
      <SearchSummaryCards
        totals={result.totals}
        comparison={result.comparison}
        daily={result.daily}
      />
      <SearchTrendChart
        daily={result.daily}
        clicks={result.totals.clicks}
        impressions={result.totals.impressions}
        range={result.range}
        spanLabel={formatSpanLabel(result.span)}
        comparison={result.comparison}
      />
      <SearchTopQueries rows={result.topQueries} />
      {result.comparison.available ? (
        <SearchMovers gaining={result.gaining} losing={result.losing} />
      ) : (
        <Panel title="Movers">
          <SearchMoversUnavailable
            coverageStartedOn={result.comparison.coverageStartedOn}
          />
        </Panel>
      )}
      <SearchNearPageOne rows={result.nearPageOne} />
      <SearchPositionCaveat />
    </div>
  )
}
