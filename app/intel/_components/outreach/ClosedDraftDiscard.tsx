'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { discardOutreachDraft } from '@/app/intel/(app)/outreach/actions'
import { TextAction } from '@/app/intel/_components/ui/TextAction'

/**
 * The only action on a closed lead's unsent draft, under Closed. Editing,
 * approving and sending are not offered, and approving and sending are refused
 * on the server for a closed lead.
 */
export function ClosedDraftDiscard({ draftId, status }: { draftId: string; status: 'draft' | 'approved' }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="intel-secondary text-meta">{status === 'approved' ? 'An approved email was not sent.' : 'A draft was not sent.'}</p>
        <TextAction
          tone="destructive"
          pending={pending}
          pendingLabel="Discarding"
          onClick={() => {
            setError(null)
            startTransition(async () => {
              const result = await discardOutreachDraft(draftId)
              if (!result.ok) setError(result.error)
              else router.refresh()
            })
          }}
        >
          Discard draft
        </TextAction>
      </div>
      {error !== null ? (
        <p className="intel-secondary text-warning-severe" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
