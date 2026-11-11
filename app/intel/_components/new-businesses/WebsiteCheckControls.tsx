'use client'

import { useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'

import { queueWebsiteCheckNow, type ImportActionResult } from '@/app/intel/(app)/new-businesses/actions'

/** "Check next 30 websites": queues one run for the research runner. */
export function WebsiteCheckButton() {
  const [result, setResult] = useState<ImportActionResult | null>(null)
  const [pending, startTransition] = useTransition()
  return (
    <div className="mb-3 flex min-w-0 flex-col items-start gap-2" aria-busy={pending}>
      <Button
        type="button"
        size="sm"
        disabled={pending}
        className="bg-cobalt-primary text-white hover:bg-[#1E85FF]"
        onClick={() => {
          setResult(null)
          startTransition(async () => setResult(await queueWebsiteCheckNow()))
        }}
      >
        {pending ? 'Queuing…' : 'Check next 30 websites'}
      </Button>
      <p className="intel-secondary text-meta">
        Runs with the next scheduled research, or when the scheduled task is started by hand.
      </p>
      {result === null ? null : result.ok ? (
        <p className="intel-secondary text-meta [overflow-wrap:anywhere]" role="status">
          {result.message}
        </p>
      ) : (
        <p className="intel-secondary text-warning-severe [overflow-wrap:anywhere]" role="alert">
          {result.error}
        </p>
      )}
    </div>
  )
}
