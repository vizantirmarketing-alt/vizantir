'use client'

import { useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { briefingFailedMessage, summaryUnavailableMessage } from '@/lib/briefing/messages'

import { generateBriefingNow } from '@/app/intel/(app)/briefing/actions'

function resultMessage(status: string, error: string | null): string {
  if (status === 'failed') return briefingFailedMessage(error)
  if (status === 'no_narrative') return `Briefing generated. ${summaryUnavailableMessage(error)}`
  return 'Briefing generated.'
}

export function GenerateBriefingButton({ hasToday }: { hasToday: boolean }) {
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex flex-wrap items-center gap-3" aria-busy={pending}>
      <Button
        type="button"
        size="sm"
        disabled={pending}
        className="bg-cobalt-primary text-white hover:bg-[#1E85FF]"
        onClick={() => {
          setMessage(null)
          startTransition(async () => {
            const result = await generateBriefingNow()
            if (!result.ok) {
              setMessage({ tone: 'error', text: result.error })
              return
            }
            setMessage({
              tone: result.status === 'failed' ? 'error' : 'ok',
              text: resultMessage(result.status, result.error),
            })
          })
        }}
      >
        {pending ? 'Generating…' : hasToday ? "Regenerate today's briefing" : 'Generate now'}
      </Button>
      {message !== null ? (
        <p
          className={message.tone === 'error' ? 'text-sm text-warning-severe' : 'text-sm text-meta'}
          role={message.tone === 'error' ? 'alert' : 'status'}
        >
          {message.text}
        </p>
      ) : null}
    </div>
  )
}
