'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { TextAction } from '@/app/intel/_components/ui/TextAction'
import { siteReviewText, type SiteReviewState } from '@/lib/outreach/site-reviews/view'

import { reviewBusinessSite } from '@/app/intel/(app)/outreach/actions'

/**
 * Where an accepted business's site review stands, with "Review this site"
 * or "Review again". Queues a run for the research runner; nothing is read
 * by the dashboard itself.
 */
export function SiteReviewAction({ leadId, state }: { leadId: string; state: SiteReviewState }) {
  const router = useRouter()
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, startTransition] = useTransition()
  const text = siteReviewText(state)
  const label = state === 'not_reviewed' ? 'Review this site' : state === 'nothing_found' || state === 'unclear' ? 'Review again' : null

  if (text === null && label === null) return null
  return (
    <div className="space-y-1">
      {text !== null ? <p className="intel-secondary text-meta">{text}</p> : null}
      {label !== null ? (
        <TextAction
          pending={pending}
          pendingLabel="Queuing…"
          onClick={() => {
            setMessage(null)
            startTransition(async () => {
              const result = await reviewBusinessSite(leadId)
              setMessage(result.ok ? { ok: true, text: result.message } : { ok: false, text: result.error })
              if (result.ok) router.refresh()
            })
          }}
        >
          {label}
        </TextAction>
      ) : null}
      {message !== null ? (
        <p className={`intel-secondary ${message.ok ? 'text-meta' : 'text-warning-severe'}`} role={message.ok ? 'status' : 'alert'}>
          {message.text}
        </p>
      ) : null}
    </div>
  )
}
