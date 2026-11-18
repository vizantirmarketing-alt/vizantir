'use client'

import { useState, useTransition } from 'react'

import { deleteAllSpam } from '@/app/intel/(app)/leads/[id]/actions'
import { Button } from '@/components/ui/button'
import { deleteAllSpamPrompt } from '@/lib/intel/lead-params'

/** "Delete all spam" with an inline confirmation that states the count. */
export function DeleteAllSpamControl({ count }: { count: number }) {
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (count <= 0) {
    return null
  }

  function onConfirm() {
    if (pending) {
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await deleteAllSpam()
      if (!result.ok) {
        setError(result.error)
        return
      }
      setConfirming(false)
    })
  }

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setError(null)
          setConfirming(true)
        }}
        className="border-black/10 text-warning-severe"
      >
        Delete all spam
      </Button>
    )
  }

  return (
    <div role="group" aria-label="Confirm deleting all spam" className="flex flex-col gap-2">
      <p className="intel-body text-foreground">{deleteAllSpamPrompt(count)}</p>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          autoFocus
          disabled={pending}
          onClick={() => setConfirming(false)}
          className="border-black/10"
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={onConfirm}
          className="bg-warning-severe text-white hover:bg-warning-severe/90"
        >
          {pending ? 'Deleting…' : 'Delete all spam'}
        </Button>
      </div>
      {error ? (
        <p className="intel-body text-warning-severe" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
