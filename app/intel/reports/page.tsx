import type { Metadata } from 'next'

import { IntelShell } from '@/app/intel/_components/IntelShell'
import { Panel } from '@/app/intel/_components/ui/Panel'
import {
  ReportsEmptyState,
  ReportsHeader,
  ReportsQueryError,
  ReportsQueue,
} from '@/app/intel/reports/_components/ReportsQueue'
import { loadReportsQueue } from '@/app/intel/reports/data'
import { requireIntelUser } from '@/lib/auth/allowlist'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Reports',
  robots: { index: false, follow: false },
}

export default async function IntelReportsQueuePage() {
  const user = await requireIntelUser()
  const result = await loadReportsQueue()

  if (!result.ok) {
    return (
      <IntelShell email={user.email}>
        <div className="flex flex-col gap-4">
          <ReportsHeader />
          <Panel>
            <ReportsQueryError />
          </Panel>
        </div>
      </IntelShell>
    )
  }

  if (result.rows.length === 0) {
    return (
      <IntelShell email={user.email}>
        <div className="flex flex-col gap-4">
          <ReportsHeader />
          <Panel>
            <ReportsEmptyState />
          </Panel>
        </div>
      </IntelShell>
    )
  }

  return (
    <IntelShell email={user.email}>
      <div className="flex flex-col gap-4">
        <ReportsHeader />
        <ReportsQueue rows={result.rows} awaitingCount={result.awaitingCount} />
      </div>
    </IntelShell>
  )
}
