import type { Metadata } from 'next'

import { ActivityFeed } from '@/app/intel/_components/ActivityFeed'
import {
  DecisionEmptyState,
  DecisionFeed,
  DecisionHeader,
  DecisionQueryError,
  OverviewStatStrip,
} from '@/app/intel/_components/DecisionFeed'
import { Panel } from '@/app/intel/_components/ui/Panel'
import { requireIntelUser } from '@/lib/auth/allowlist'
import { fetchActivity } from '@/lib/intel/activity'
import {
  fetchDecisionFeed,
  type DecisionFeedSection,
} from '@/lib/intel/decisions/feed'
import { fetchLeadDailySeriesInLastDays } from '@/lib/intel/leads'
import { fetchSiteRangeTotals } from '@/lib/intel/search'

export const metadata: Metadata = {
  title: 'Overview',
  robots: { index: false, follow: false },
}

function countNewFindings(sections: DecisionFeedSection[]): number {
  let count = 0
  for (const section of sections) {
    for (const item of section.items) {
      if (item.status === 'new') {
        count += 1
      }
    }
  }
  return count
}

function clicksFromTotals(
  result: Awaited<ReturnType<typeof fetchSiteRangeTotals>>,
): number | null {
  if (!result.ok) {
    return null
  }
  if (result.status === 'no_data') {
    return 0
  }
  return result.totals.clicks
}

function impressionsFromTotals(
  result: Awaited<ReturnType<typeof fetchSiteRangeTotals>>,
): number | null {
  if (!result.ok) {
    return null
  }
  if (result.status === 'no_data') {
    return 0
  }
  return result.totals.impressions
}

function dailyMetric(
  result: Awaited<ReturnType<typeof fetchSiteRangeTotals>>,
  metric: 'clicks' | 'impressions',
): number[] {
  if (!result.ok || result.status !== 'ready') {
    return []
  }
  return result.daily.map((point) => point[metric])
}

export default async function IntelOverviewPage() {
  await requireIntelUser()

  const [result, siteTotals, leadSeries, activity] = await Promise.all([
    fetchDecisionFeed(),
    fetchSiteRangeTotals('28d'),
    fetchLeadDailySeriesInLastDays(28),
    fetchActivity(),
  ])

  const activityFeed = (
    <ActivityFeed items={activity.items} nowMs={activity.nowMs} />
  )

  const stats = (
    <OverviewStatStrip
      findingsNeedingAttention={
        result.ok ? countNewFindings(result.sections) : null
      }
      leadsLast28Days={leadSeries === null ? null : leadSeries.total}
      leadsDaily={leadSeries === null ? [] : leadSeries.daily}
      clicks28d={clicksFromTotals(siteTotals)}
      clicksDaily={dailyMetric(siteTotals, 'clicks')}
      impressions28d={impressionsFromTotals(siteTotals)}
      impressionsDaily={dailyMetric(siteTotals, 'impressions')}
    />
  )

  if (!result.ok) {
    return (
      <div className="flex flex-col gap-4">
        <DecisionHeader />
        {stats}
        {activityFeed}
        <Panel>
          <DecisionQueryError />
        </Panel>
      </div>
    )
  }

  if (result.total === 0) {
    return (
      <div className="flex flex-col gap-4">
        <DecisionHeader />
        {stats}
        {activityFeed}
        <Panel>
          <DecisionEmptyState />
        </Panel>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <DecisionHeader />
      {stats}
      {activityFeed}
      <DecisionFeed sections={result.sections} />
    </div>
  )
}
