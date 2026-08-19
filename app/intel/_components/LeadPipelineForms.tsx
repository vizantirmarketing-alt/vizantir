'use client'

import { useState, useTransition, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  centsToDollarInput,
  type LeadStatus,
} from '@/lib/intel/lead-params'
import { cn } from '@/lib/utils'

import {
  updateLeadNotes,
  updateLeadStatus,
  updateLeadValue,
} from '@/app/intel/(app)/leads/[id]/actions'

const fieldClassName =
  'w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-foreground transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cobalt-focus'

type LeadPipelineFormsProps = {
  leadId: string
  status: LeadStatus
  estimatedValueCents: number | null
  estimatedValueDollars: string
  notes: string | null
}

function MutationError({ message }: { message: string | null }) {
  if (message === null) {
    return null
  }

  return (
    <p className="text-sm text-warning-severe" role="alert">
      {message}
    </p>
  )
}

export function LeadPipelineForms({
  leadId,
  status,
  estimatedValueCents,
  estimatedValueDollars,
  notes,
}: LeadPipelineFormsProps) {
  return (
    <div className="space-y-8">
      <StatusForm leadId={leadId} currentStatus={status} />
      <ValueForm
        key={estimatedValueDollars || 'empty'}
        leadId={leadId}
        estimatedValueCents={estimatedValueCents}
        estimatedValueDollars={estimatedValueDollars}
      />
      <NotesForm leadId={leadId} notes={notes} />
    </div>
  )
}

function StatusForm({
  leadId,
  currentStatus,
}: {
  leadId: string
  currentStatus: LeadStatus
}) {
  const [selected, setSelected] = useState<LeadStatus>(currentStatus)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const unchanged = selected === currentStatus

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (unchanged || pending) {
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await updateLeadStatus(leadId, selected)
      if (!result.ok) {
        setError(result.error)
      }
    })
  }

  return (
    <form onSubmit={onSubmit} aria-busy={pending} className="max-w-md">
      <label
        htmlFor="intel-lead-status"
        className="mb-2 block text-sm font-medium text-body"
      >
        Status
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          id="intel-lead-status"
          name="status"
          value={selected}
          disabled={pending}
          onChange={(event) => {
            const next = event.target.value
            for (const status of LEAD_STATUSES) {
              if (status === next) {
                setSelected(status)
                setError(null)
                return
              }
            }
          }}
          className={cn(fieldClassName, 'sm:flex-1')}
        >
          {LEAD_STATUSES.map((status) => (
            <option key={status} value={status}>
              {LEAD_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={pending || unchanged}
          className="border-black/10 sm:shrink-0"
        >
          {pending ? 'Saving…' : 'Update status'}
        </Button>
      </div>
      <p className="mt-2 text-sm text-meta">
        Current: {LEAD_STATUS_LABELS[currentStatus]}. Choose a new status, then
        update.
      </p>
      <div className="mt-2">
        <MutationError message={error} />
      </div>
    </form>
  )
}

function ValueForm({
  leadId,
  estimatedValueCents,
  estimatedValueDollars,
}: {
  leadId: string
  estimatedValueCents: number | null
  estimatedValueDollars: string
}) {
  const [value, setValue] = useState(
    estimatedValueDollars.length > 0
      ? estimatedValueDollars
      : centsToDollarInput(estimatedValueCents),
  )
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) {
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await updateLeadValue(leadId, value)
      if (!result.ok) {
        setError(result.error)
      }
    })
  }

  return (
    <form onSubmit={onSubmit} aria-busy={pending} className="max-w-md">
      <label
        htmlFor="intel-lead-value"
        className="mb-2 block text-sm font-medium text-body"
      >
        Estimated value
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          id="intel-lead-value"
          name="estimatedValueDollars"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          value={value}
          disabled={pending}
          placeholder="Amount in dollars"
          onChange={(event) => {
            setValue(event.target.value)
            setError(null)
          }}
          className={cn(fieldClassName, 'sm:flex-1')}
        />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={pending}
          className="border-black/10 sm:shrink-0"
        >
          {pending ? 'Saving…' : 'Save'}
        </Button>
      </div>
      <p className="mt-2 text-sm text-meta">Leave blank to clear.</p>
      <div className="mt-2">
        <MutationError message={error} />
      </div>
    </form>
  )
}

function NotesForm({ leadId, notes }: { leadId: string; notes: string | null }) {
  const [value, setValue] = useState(notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) {
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await updateLeadNotes(leadId, value)
      if (!result.ok) {
        setError(result.error)
      }
    })
  }

  return (
    <form onSubmit={onSubmit} aria-busy={pending} className="max-w-xl">
      <label
        htmlFor="intel-lead-notes"
        className="mb-2 block text-sm font-medium text-body"
      >
        Notes
      </label>
      <textarea
        id="intel-lead-notes"
        name="notes"
        rows={6}
        maxLength={5000}
        value={value}
        disabled={pending}
        onChange={(event) => {
          setValue(event.target.value)
          setError(null)
        }}
        className={cn(fieldClassName, 'min-h-[9rem] resize-y')}
      />
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={pending}
          className="border-black/10"
        >
          {pending ? 'Saving…' : 'Save'}
        </Button>
        <MutationError message={error} />
      </div>
    </form>
  )
}
