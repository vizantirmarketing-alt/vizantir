'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { TextAction } from '@/app/intel/_components/ui/TextAction'
import type { ContactNote } from '@/lib/outreach/contacts/view'
import type { OutreachSubjectType } from '@/lib/outreach/params'

import { findContactEmail } from '@/app/intel/(app)/outreach/actions'

/** One line about a lead's contact address: "Found on {host}", or the status in words. */
export function ContactNoteLine({ note }: { note: ContactNote }) {
  return (
    <p className={`intel-secondary ${note.tone === 'warning' ? 'text-warning-severe' : 'text-meta'} [overflow-wrap:anywhere]`}>
      {note.text}
      {note.link !== null ? (
        <>
          {' '}
          <a
            href={note.link.href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-cobalt-text underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-focus"
          >
            {note.link.label}
          </a>
        </>
      ) : null}
    </p>
  )
}

/** The lead pages' contact line with "Find contact email", which queues this one lead. */
export function ContactAddress({ note, subjectType, leadId }: { note: ContactNote | null; subjectType: OutreachSubjectType; leadId: string }) {
  const router = useRouter()
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <div className="space-y-1">
      {note !== null ? <ContactNoteLine note={note} /> : null}
      <TextAction
        pending={pending}
        pendingLabel="Queuing…"
        onClick={() => {
          setResult(null)
          startTransition(async () => {
            const outcome = await findContactEmail(subjectType, leadId)
            setResult(outcome.ok ? { ok: true, text: outcome.message } : { ok: false, text: outcome.error })
            if (outcome.ok) router.refresh()
          })
        }}
      >
        Find contact email
      </TextAction>
      {result !== null ? (
        <p className={`intel-secondary ${result.ok ? 'text-meta' : 'text-warning-severe'}`} role={result.ok ? 'status' : 'alert'}>
          {result.text}
        </p>
      ) : null}
    </div>
  )
}
