'use client'

import { useState, useTransition } from 'react'

import { cancelProspectRun } from '@/app/intel/(app)/prospects/actions'

export function ProspectRunCancelButton({ runId }: { runId: string }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null)
          startTransition(async () => {
            const result = await cancelProspectRun(runId)
            if (!result.ok) {
              setError(result.error)
            }
          })
        }}
        className="text-sm text-meta transition-colors hover:text-foreground disabled:opacity-50"
      >
        {pending ? 'Cancelling…' : 'Cancel'}
      </button>
      {error !== null ? (
        <span className="text-sm text-warning-severe" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  )
}
