'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { savedDraftHref } from '@/lib/outreach/links'
import { OUTREACH_BODY_MAX, OUTREACH_SUBJECT_MAX, type OutreachSubjectType } from '@/lib/outreach/params'

import { createManualDraft } from '@/app/intel/(app)/outreach/actions'

const fieldClassName =
  'w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 intel-body text-foreground transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cobalt-focus'

/** An email written by hand. Saving creates the draft; it then needs review like any other. */
export function ManualDraftForm({
  subjectType,
  leadId,
  initialTo,
  footer,
}: {
  subjectType: OutreachSubjectType
  leadId: string
  initialTo: string
  footer: string
}) {
  const router = useRouter()
  const [toEmail, setToEmail] = useState(initialTo)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <form
      className="space-y-3"
      aria-busy={pending}
      onSubmit={(event) => {
        event.preventDefault()
        setError(null)
        startTransition(async () => {
          const result = await createManualDraft(subjectType, leadId, { toEmail, subject, body })
          if (result.ok) router.push(savedDraftHref(result.draftId))
          else setError(result.error)
        })
      }}
    >
      <p className="intel-secondary text-meta">
        No email was drafted for this lead, because nothing specific is known about its site. Write it yourself. Before it can be approved or
        sent, it has to meet the same writing rules as a drafted email.
      </p>
      <div>
        <label htmlFor="manual-to" className="mb-2 block intel-body font-medium text-body">
          To
        </label>
        <input
          id="manual-to"
          type="email"
          inputMode="email"
          autoComplete="off"
          value={toEmail}
          maxLength={254}
          placeholder="name@business.com"
          onChange={(event) => setToEmail(event.target.value)}
          className={fieldClassName}
        />
      </div>
      <div>
        <label htmlFor="manual-subject" className="mb-2 block intel-body font-medium text-body">
          Subject
        </label>
        <input
          id="manual-subject"
          type="text"
          value={subject}
          maxLength={OUTREACH_SUBJECT_MAX}
          onChange={(event) => setSubject(event.target.value)}
          className={fieldClassName}
        />
      </div>
      <div>
        <label htmlFor="manual-body" className="mb-2 block intel-body font-medium text-body">
          Message
        </label>
        <textarea
          id="manual-body"
          value={body}
          rows={12}
          maxLength={OUTREACH_BODY_MAX}
          onChange={(event) => setBody(event.target.value)}
          className={`${fieldClassName} leading-relaxed`}
        />
      </div>
      <div className="min-w-0 rounded-lg border border-dashed border-black/15 px-3 py-2.5">
        <p className="intel-secondary text-meta">Footer, added to every email and not editable</p>
        <p className="mt-1 whitespace-pre-wrap intel-body text-body [overflow-wrap:anywhere]">{footer}</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-black/8 pt-3">
        <Button type="submit" size="sm" disabled={pending} className="bg-cobalt-primary intel-secondary text-white hover:bg-[#1E85FF]">
          {pending ? 'Saving…' : 'Save draft'}
        </Button>
      </div>
      {error !== null ? (
        <p className="intel-body text-warning-severe" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}
