'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { TextAction } from '@/app/intel/_components/ui/TextAction'
import { leadHref } from '@/lib/outreach/links'
import { OUTREACH_SUBJECT_LABELS } from '@/lib/outreach/params'
import type { WorklistRow } from '@/lib/outreach/worklist'

import { findContactEmail, writeOutreachDraft } from '@/app/intel/(app)/outreach/actions'

const SOURCE_LABELS: Record<WorklistRow['subjectType'], string> = {
  prospect: 'Open in Prospect Research',
  new_business: 'Open in New Businesses',
}

const primaryClassName = 'bg-cobalt-primary intel-secondary text-white hover:bg-[#1E85FF]'

/** One accepted lead: who it is, where its contact address stands, and its one next step. */
function AcceptedLeadRow({ row }: { row: WorklistRow }) {
  const router = useRouter()
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
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
          {row.statusText}
          {row.addressHint !== null ? ` ${row.addressHint}` : ''}
        </p>
        {message !== null ? (
          <p className={`intel-secondary ${message.ok ? 'text-meta' : 'text-warning-severe'}`} role={message.ok ? 'status' : 'alert'}>
            {message.text}
          </p>
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
