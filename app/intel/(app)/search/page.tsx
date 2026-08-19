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
      <div className="max-w-5xl">
        <SearchHeader />
        <SearchQueryError />
      </div>
    )
  }

  if (result.status === 'no_data') {
    return (
      <div className="max-w-5xl">
        <SearchHeader />
        <SearchEmptyState
          title="No search data yet"
          body="Search Console has not been synced into this workspace."
        />
      </div>
    )
  }

  if (result.status === 'empty_range') {
    return (
      <div className="max-w-5xl">
        <SearchHeader />
        <SearchRangeNav range={result.range} />
        <SearchDateSpans span={result.span} comparison={result.comparison} />
        <SearchEmptyState
          title="No rows in this range"
          body="Nothing was recorded for the selected dates."
        />
      </div>
    )
  }

  return (
    <div className="max-w-5xl">
      <SearchHeader />
      <SearchRangeNav range={result.range} />
      <SearchDateSpans span={result.span} comparison={result.comparison} />
      <SearchSummaryCards
        totals={result.totals}
        comparison={result.comparison}
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
        <SearchMoversUnavailable
          coverageStartedOn={result.comparison.coverageStartedOn}
        />
      )}
      <SearchNearPageOne rows={result.nearPageOne} />
      <SearchPositionCaveat />
    </div>
  )
}
