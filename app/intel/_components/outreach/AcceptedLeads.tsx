'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { TextAction } from '@/app/intel/_components/ui/TextAction'
import { CALL_NOTE_MAX, CALL_OUTCOMES, CALL_OUTCOME_LABELS, type CallOutcome } from '@/lib/outreach/calls'
import { leadHref, writeItYourselfHref } from '@/lib/outreach/links'
import { OUTREACH_SUBJECT_LABELS } from '@/lib/outreach/params'
import { callLine, telHref, type WorklistRow } from '@/lib/outreach/worklist'

import { findContactEmail, logOutreachCall, writeOutreachDraft } from '@/app/intel/(app)/outreach/actions'

const SOURCE_LABELS: Record<WorklistRow['subjectType'], string> = {
  prospect: 'Open in Prospect Research',
  new_business: 'Open in New Businesses',
}

const primaryClassName = 'bg-cobalt-primary intel-secondary text-white hover:bg-[#1E85FF]'
const linkActionClassName =
  '-mx-1 inline-flex items-center rounded px-1 intel-body font-medium text-cobalt-text underline-offset-2 transition-colors hover:bg-cobalt-soft hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-focus'
const fieldClassName =
  'w-full rounded-lg border border-black/10 bg-white px-3 py-2 intel-body text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cobalt-focus'

/** The phone number from the license record, as stored, as a tel: link. Nothing is dialled by the dashboard. */
export function PhoneLink({ phone }: { phone: string }) {
  const href = telHref(phone)
  if (href === null) return <span className="[overflow-wrap:anywhere]">{phone}</span>
  return (
    <a href={href} className="whitespace-nowrap text-cobalt-text underline-offset-2 hover:underline">
      {phone}
    </a>
  )
}

/** Records what happened on a call the owner made. No browser dialog. */
function LogCallForm({ row, onDone, onCancel }: { row: WorklistRow; onDone: () => void; onCancel: () => void }) {
  const [outcome, setOutcome] = useState<CallOutcome | ''>('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const id = `call-${row.subjectType}-${row.leadId}`

  return (
    <form
      className="mt-2 space-y-2 rounded-lg border border-black/10 px-3 py-3"
      aria-label={`Log a call to ${row.name}`}
      onSubmit={(event) => {
        event.preventDefault()
        if (outcome === '') {
          setError('Choose how the call went.')
          return
        }
        setError(null)
        startTransition(async () => {
          const result = await logOutreachCall(row.subjectType, row.subjectRef, { outcome, note })
          if (result.ok) onDone()
          else setError(result.error)
        })
      }}
    >
      <fieldset className="space-y-1">
        <legend className="intel-body font-medium text-body">How did the call go?</legend>
        {CALL_OUTCOMES.map((value) => (
          <label key={value} className="flex items-center gap-2 intel-body text-foreground">
            <input
              type="radio"
              name={`${id}-outcome`}
              value={value}
              checked={outcome === value}
              disabled={pending}
              onChange={() => setOutcome(value)}
              className="size-4 accent-cobalt-primary"
            />
            {CALL_OUTCOME_LABELS[value]}
          </label>
        ))}
      </fieldset>
      <div>
        <label htmlFor={`${id}-note`} className="mb-1 block intel-body font-medium text-body">
          Note (optional)
        </label>
        <textarea
          id={`${id}-note`}
          value={note}
          rows={2}
          maxLength={CALL_NOTE_MAX}
          disabled={pending}
          onChange={(event) => setNote(event.target.value)}
          className={fieldClassName}
        />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button type="submit" size="sm" disabled={pending} className={primaryClassName}>
          {pending ? 'Saving…' : 'Save call'}
        </Button>
        <TextAction disabled={pending} onClick={onCancel}>
          Cancel
        </TextAction>
      </div>
      {error !== null ? (
        <p className="intel-secondary text-warning-severe" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}

/** One accepted lead: who it is, where its contact address stands, and its next step. */
function AcceptedLeadRow({ row }: { row: WorklistRow }) {
  const router = useRouter()
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [logging, setLogging] = useState(false)
  const [pending, startTransition] = useTransition()

  function findContact() {
    setMessage(null)
    startTransition(async () => {
      const result = await findContactEmail(row.subjectType, row.leadId)
      setMessage(result.ok ? { ok: true, text: result.message } : { ok: false, text: result.error })
      if (result.ok) router.refresh()
    })
  }

  function draft() {
    setMessage(null)
    startTransition(async () => {
      const result = await writeOutreachDraft(row.subjectType, row.leadId)
      if (result.ok) router.push(`/intel/outreach/${result.draftId}`)
      else setMessage({ ok: false, text: result.error })
    })
  }

  const writeHref = writeItYourselfHref(row)

  return (
    <li
      className="grid min-w-0 gap-x-4 gap-y-1.5 py-2.5 first:pt-0 last:pb-0 @min-[44rem]:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_auto] @min-[44rem]:items-start"
      aria-busy={pending}
    >
      <div className="min-w-0">
        <p className="intel-body font-medium text-foreground [overflow-wrap:anywhere]">{row.name}</p>
        <p className="intel-secondary text-meta">{OUTREACH_SUBJECT_LABELS[row.subjectType]}</p>
        <p className="intel-secondary">
          <Link href={leadHref(row)} className="whitespace-nowrap text-cobalt-text underline-offset-2 hover:underline">
            {SOURCE_LABELS[row.subjectType]}
          </Link>
        </p>
      </div>
      <div className="min-w-0">
        {row.address !== null ? <p className="intel-body text-foreground [overflow-wrap:anywhere]">{row.address}</p> : null}
        <p className="intel-secondary text-meta [overflow-wrap:anywhere]">
          {row.action === 'log_call' && row.phone !== null ? (
            // The same words as statusText, with the number as a link.
            <>
              No email address is published. Call <PhoneLink phone={row.phone} />.
            </>
          ) : (
            row.statusText
          )}
          {row.addressHint !== null ? ` ${row.addressHint}` : ''}
        </p>
        {row.phone !== null && row.action !== 'log_call' ? (
          <p className="intel-secondary text-meta">
            Phone: <PhoneLink phone={row.phone} />
          </p>
        ) : null}
        {row.calls !== null ? <p className="intel-secondary text-meta">{callLine(row.calls)}</p> : null}
        {row.noFindingText !== null ? <p className="intel-secondary text-meta">{row.noFindingText}</p> : null}
        {message !== null ? (
          <p className={`intel-secondary ${message.ok ? 'text-meta' : 'text-warning-severe'}`} role={message.ok ? 'status' : 'alert'}>
            {message.text}
          </p>
        ) : null}
        {logging ? (
          <LogCallForm
            row={row}
            onCancel={() => setLogging(false)}
            onDone={() => {
              setLogging(false)
              setMessage({ ok: true, text: 'Call saved.' })
              router.refresh()
            }}
          />
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 @min-[44rem]:justify-end">
        {row.action === 'find_contact' ? (
          <Button type="button" size="sm" disabled={pending} onClick={findContact} className={primaryClassName}>
            {pending ? 'Queuing…' : 'Find contact email'}
          </Button>
        ) : null}
        {row.action === 'draft' ? (
          <Button type="button" size="sm" disabled={pending} onClick={draft} className={primaryClassName}>
            {pending ? 'Working…' : 'Draft email'}
          </Button>
        ) : null}
        {row.action === 'log_call' && !logging ? (
          <Button type="button" size="sm" disabled={pending} onClick={() => setLogging(true)} className={primaryClassName}>
            Log a call
          </Button>
        ) : null}
        {row.secondary === 'draft' ? (
          <TextAction disabled={pending} onClick={draft}>
            Draft email
          </TextAction>
        ) : null}
        {row.secondary === 'write' ? (
          <Link href={writeHref} className={linkActionClassName}>
            Write it yourself
          </Link>
        ) : null}
        {row.checkAgain ? (
          <TextAction disabled={pending} onClick={findContact}>
            Check again
          </TextAction>
        ) : null}
      </div>
    </li>
  )
}

export function AcceptedLeads({ rows }: { rows: WorklistRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="intel-body text-body">
        No accepted leads are waiting. Accept leads in{' '}
        <Link href="/intel/prospects" className="text-cobalt-text underline-offset-2 hover:underline">
          Prospect Research
        </Link>{' '}
        or{' '}
        <Link href="/intel/new-businesses" className="text-cobalt-text underline-offset-2 hover:underline">
          New Businesses
        </Link>
        .
      </p>
    )
  }
  return (
    <div className="@container">
      <ul className="divide-y divide-black/8">
        {rows.map((row) => (
          <AcceptedLeadRow key={`${row.subjectType}:${row.subjectRef}`} row={row} />
        ))}
      </ul>
    </div>
  )
}
