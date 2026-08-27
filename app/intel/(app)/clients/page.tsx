import type { Metadata } from 'next'

import {
  ClientsEmptyState,
  ClientsHeader,
  ClientsList,
  ClientsQueryError,
} from '@/app/intel/_components/ClientDashboard'
import { Panel } from '@/app/intel/_components/ui/Panel'
import { requireIntelUser } from '@/lib/auth/allowlist'
import { clientSources, loadActiveClients } from '@/lib/clients/load'

export const metadata: Metadata = {
  title: 'Clients',
  robots: { index: false, follow: false },
}

export default async function IntelClientsPage() {
  await requireIntelUser()

  const result = await loadActiveClients()

  if (!result.ok) {
    return (
      <div className="flex flex-col gap-4">
        <ClientsHeader />
        <Panel>
          <ClientsQueryError />
        </Panel>
      </div>
    )
  }

  if (result.clients.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <ClientsHeader />
        <Panel>
          <ClientsEmptyState />
        </Panel>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <ClientsHeader />
      <ClientsList
        clients={result.clients.map((client) => ({
          id: client.id,
          name: client.name,
          siteUrl: client.siteUrl,
          careTier: client.careTier,
          sources: clientSources(client),
        }))}
      />
    </div>
  )
}
