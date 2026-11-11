'use client'

import { useState, useTransition } from 'react'

import { TextAction } from '@/app/intel/_components/ui/TextAction'

import { cancelProspectRun } from '@/app/intel/(app)/prospects/actions'

export function ProspectRunCancelButton({ runId }: { runId: string }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <span className="inline-flex items-center gap-2">
      <TextAction
        tone="destructive"
        pending={pending}
        pendingLabel="Cancelling…"
        onClick={() => {
          setError(null)
          startTransition(async () => {
            const result = await cancelProspectRun(runId)
            if (!result.ok) {
              setError(result.error)
            }
          })
        }}
      >
        Cancel
      </TextAction>
      {error !== null ? (
        <span className="text-sm text-warning-severe" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  )
}
