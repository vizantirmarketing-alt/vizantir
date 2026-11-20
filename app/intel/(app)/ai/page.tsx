import type { Metadata } from 'next'

import { AssistantConsole } from '@/app/intel/_components/assistant/AssistantConsole'
import { requireIntelUser } from '@/lib/auth/allowlist'

export const dynamic = 'force-dynamic'
// Each instruction makes up to two model calls through a server action on this
// route (the briefing's client: 45 second timeout, one SDK retry each), plus
// read-only loaders.
export const maxDuration = 180

export const metadata: Metadata = {
  title: 'Assistant',
  robots: { index: false, follow: false },
}

export default async function IntelAssistantPage() {
  await requireIntelUser()

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div>
        <h1 className="intel-title text-foreground">Assistant</h1>
        <p className="mt-1 intel-secondary text-meta">
          Answers from data the dashboard already stores. It changes nothing, and nothing here is saved.
        </p>
      </div>
      <AssistantConsole />
    </div>
  )
}
