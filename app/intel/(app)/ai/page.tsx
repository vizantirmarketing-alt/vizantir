import type { Metadata } from 'next'

import { AssistantConsole } from '@/app/intel/_components/assistant/AssistantConsole'
import { listResearchRequests } from '@/lib/assistant/research'
import { createResearchQueue } from '@/lib/assistant/research-store'
import { requireIntelUser } from '@/lib/auth/allowlist'

export const dynamic = 'force-dynamic'
// Each instruction makes up to three model calls through a server action on
// this route (interpretation, an answer and one retry; the briefing's client:
// 45 second timeout, one SDK retry each), plus loaders.
export const maxDuration = 180

export const metadata: Metadata = {
  title: 'Assistant',
  robots: { index: false, follow: false },
}

export default async function IntelAssistantPage() {
  await requireIntelUser()
  const requests = await listResearchRequests(createResearchQueue())

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div>
        <h1 className="intel-title text-foreground">Assistant</h1>
        <p className="mt-1 intel-secondary text-meta">
          Answers from data the dashboard already stores. The one thing it can change is to queue a prospect research run, and only after you
          confirm it. It does nothing else, and the conversation is not saved.
        </p>
      </div>
      <AssistantConsole initialRequests={requests} />
    </div>
  )
}
