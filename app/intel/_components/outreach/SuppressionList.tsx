'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { TextAction } from '@/app/intel/_components/ui/TextAction'
import { formatShortDate } from '@/lib/prospects/params'
import { SUPPRESSION_REASON_LABELS } from '@/lib/outreach/params'
import type { Suppression } from '@/lib/outreach/types'

import { addOutreachSuppression, removeOutreachSuppression } from '@/app/intel/(app)/outreach/actions'

const fieldClassName =
  'w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 intel-body text-foreground transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cobalt-focus'

function Entry({ entry }: { entry: Suppression }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <li className="min-w-0 py-2 first:pt-0 last:pb-0">
      <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <p className="intel-body text-foreground [overflow-wrap:anywhere]">
            {entry.email}
            {entry.domain !== null ? <span className="text-meta"> · every address at {entry.domain}</span> : null}
          </p>
          <p className="intel-secondary text-meta">
            {SUPPRESSION_REASON_LABELS[entry.reason]} · {formatShortDate(entry.createdAt)}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-x-3">
          {confirming ? (
            <>
              <TextAction
                tone="destructive"
                pending={pending}
                pendingLabel="Removing…"
                onClick={() => {
                  setError(null)
                  startTransition(async () => {
                    const result = await removeOutreachSuppression(entry.id, true)
                    if (result.ok) router.refresh()
                    else setError(result.error)
                  })
                }}
              >
                Confirm remove
              </TextAction>
              <TextAction disabled={pending} onClick={() => setConfirming(false)}>
                Cancel
              </TextAction>
            </>
          ) : (
            <TextAction tone="destructive" onClick={() => setConfirming(true)}>
              Remove
            </TextAction>
          )}
        </div>
      </div>
      {error !== null ? (
        <p className="mt-1 intel-secondary text-warning-severe" role="alert">
          {error}
        </p>
      ) : null}
    </li>
  )
}

export function SuppressionList({ entries }: { entries: Suppression[] }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [wholeDomain, setWholeDomain] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    startTransition(async () => {
      const result = await addOutreachSuppression(email, wholeDomain)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setMessage(result.message ?? 'Added.')
      setEmail('')
      setWholeDomain(false)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} aria-busy={pending} className="space-y-2">
        <label htmlFor="outreach-suppress" className="block intel-body font-medium text-body">
          Add an address
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            id="outreach-suppress"
            type="email"
            autoComplete="off"
            value={email}
            maxLength={254}
            placeholder="name@business.com"
            onChange={(event) => setEmail(event.target.value)}
            className={`${fieldClassName} min-w-0 flex-[1_1_16rem]`}
          />
          <Button type="submit" size="sm" variant="outline" disabled={pending || email.trim().length === 0} className="border-black/10 intel-body">
            {pending ? 'Adding…' : 'Add'}
          </Button>
        </div>
        <label className="flex items-center gap-2 intel-body text-body">
          <input type="checkbox" checked={wholeDomain} onChange={(event) => setWholeDomain(event.target.checked)} className="size-4" />
          Block every address at this domain
        </label>
        {message !== null ? (
          <p className="intel-body text-body" role="status">
            {message}
          </p>
        ) : null}
        {error !== null ? (
          <p className="intel-body text-warning-severe" role="alert">
            {error}
          </p>
        ) : null}
      </form>

      {entries.length === 0 ? (
        <p className="intel-body text-body">Nobody is on the list yet.</p>
      ) : (
        <ul className="divide-y divide-black/8">
          {entries.map((entry) => (
            <Entry key={entry.id} entry={entry} />
          ))}
        </ul>
      )}
    </div>
  )
}
