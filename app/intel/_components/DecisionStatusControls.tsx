'use client'

import { useState, useTransition, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import {
  DECISION_STATUSES,
  DECISION_STATUS_LABELS,
  RESULT_NOTE_MAX_LENGTH,
  type DecisionStatus,
} from '@/lib/intel/decision-params'
import { cn } from '@/lib/utils'

import { updateDecisionStatus } from '@/app/intel/(app)/actions'

const fieldClassName =
  'w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-foreground transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cobalt-focus'

type DecisionStatusControlsProps = {
  findingKey: string
  currentStatus: DecisionStatus
}

export function DecisionStatusControls({
  findingKey,
  currentStatus,
}: DecisionStatusControlsProps) {
  const [selected, setSelected] = useState<DecisionStatus>(currentStatus)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const unchanged = selected === currentStatus && selected !== 'completed'

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) {
      return
    }
    if (unchanged) {
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await updateDecisionStatus(
        findingKey,
        selected,
        selected === 'completed' ? note : undefined,
      )
      if (!result.ok) {
        setError(result.error)
      }
    })
  }

  return (
    <form onSubmit={onSubmit} aria-busy={pending} className="max-w-md">
      <label
        htmlFor={`decision-status-${findingKey}`}
        className="mb-2 block text-sm font-medium text-body"
      >
        Status
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          id={`decision-status-${findingKey}`}
          name="status"
          value={selected}
          disabled={pending}
          onChange={(event) => {
            const next = event.target.value
            for (const status of DECISION_STATUSES) {
              if (status === next) {
                setSelected(status)
                setError(null)
                return
              }
            }
          }}
          className={cn(fieldClassName, 'sm:flex-1')}
        >
          {DECISION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {DECISION_STATUS_LABELS[status]}
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

      {selected === 'completed' ? (
        <div className="mt-3">
          <label
            htmlFor={`decision-note-${findingKey}`}
            className="mb-2 block text-sm font-medium text-body"
          >
            Result note
            <span className="font-normal text-meta"> (optional)</span>
          </label>
          <textarea
            id={`decision-note-${findingKey}`}
            name="resultNote"
            rows={3}
            maxLength={RESULT_NOTE_MAX_LENGTH}
            value={note}
            disabled={pending}
            onChange={(event) => setNote(event.target.value)}
            className={fieldClassName}
          />
        </div>
      ) : null}

      {error ? (
        <p className="mt-2 text-sm text-warning-severe" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}
