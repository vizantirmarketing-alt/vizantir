import type { Metadata } from 'next'

import {
  DecisionEmptyState,
  DecisionFeed,
  DecisionHeader,
  DecisionQueryError,
} from '@/app/intel/_components/DecisionFeed'
import { requireIntelUser } from '@/lib/auth/allowlist'
import { fetchDecisionFeed } from '@/lib/intel/decisions/feed'

export const metadata: Metadata = {
  title: 'Overview',
  robots: { index: false, follow: false },
}

export default async function IntelOverviewPage() {
  await requireIntelUser()
  const result = await fetchDecisionFeed()

  if (!result.ok) {
    return (
      <div className="max-w-5xl">
        <DecisionHeader />
        <DecisionQueryError />
      </div>
    )
  }

  if (result.total === 0) {
    return (
      <div className="max-w-5xl">
        <DecisionHeader />
        <DecisionEmptyState />
      </div>
    )
  }

  return (
    <div className="max-w-5xl">
      <DecisionHeader />
      <DecisionFeed sections={result.sections} />
    </div>
  )
}
