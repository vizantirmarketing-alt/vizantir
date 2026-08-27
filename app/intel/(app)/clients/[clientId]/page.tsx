import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import {
  ClientDashboard,
  ClientPageHeader,
  ClientQueryError,
} from '@/app/intel/_components/ClientDashboard'
import { Panel } from '@/app/intel/_components/ui/Panel'
import { requireIntelUser } from '@/lib/auth/allowlist'
import { loadClientDashboard } from '@/lib/clients/dashboard'
import { loadActiveClients, loadClient } from '@/lib/clients/load'

export const maxDuration = 60

export const metadata: Metadata = {
  title: 'Client',
  robots: { index: false, follow: false },
}

type ClientPageProps = {
  params: Promise<{ clientId: string }>
}

export default async function IntelClientPage({ params }: ClientPageProps) {
  await requireIntelUser()

  const { clientId } = await params
  const result = await loadClient(clientId)

  if (!result.ok && result.reason === 'not_found') {
    notFound()
  }

  if (!result.ok) {
    return (
      <div className="flex flex-col gap-4">
        <ClientPageHeader />
        <Panel>
          <ClientQueryError />
        </Panel>
      </div>
    )
  }

  const [clientsResult, dashboard] = await Promise.all([
    loadActiveClients(),
    loadClientDashboard(result.client),
  ])

  const clients = clientsResult.ok ? clientsResult.clients : [result.client]

  return (
    <ClientDashboard
      client={result.client}
      clients={clients}
      dashboard={dashboard}
    />
  )
}
