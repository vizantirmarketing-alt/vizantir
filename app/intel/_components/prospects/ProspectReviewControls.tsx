'use client'

import { useState, useTransition, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import {
  OWNER_NOTE_MAX,
  PROSPECT_REVIEW_LABELS,
  type ProspectReviewStatus,
} from '@/lib/prospects/params'

import {
  updateProspectNote,
  updateProspectReview,
} from '@/app/intel/(app)/prospects/actions'

const fieldClassName =
  'w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 intel-body text-foreground transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cobalt-focus'

const REVIEW_ACTIONS: { status: ProspectReviewStatus; label: string }[] = [
  { status: 'accepted', label: 'Accept' },
  { status: 'rejected', label: 'Reject' },
  { status: 'archived', label: 'Archive' },
]

function MutationError({ message }: { message: string | null }) {
  if (message === null) {
    return null
  }
  return (
    <p className="intel-body text-warning-severe" role="alert">
      {message}
    </p>
  )
}

export function ProspectReviewControls({
  prospectId,
  reviewStatus,
  ownerNote,
}: {
  prospectId: string
  reviewStatus: ProspectReviewStatus
  ownerNote: string | null
}) {
  return (
    <div className="space-y-8">
      <ReviewButtons prospectId={prospectId} reviewStatus={reviewStatus} />
      <NoteForm prospectId={prospectId} ownerNote={ownerNote} />
    </div>
  )
}

function ReviewButtons({
  prospectId,
  reviewStatus,
}: {
  prospectId: string
  reviewStatus: ProspectReviewStatus
}) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function setStatus(next: ProspectReviewStatus) {
    if (pending || next === reviewStatus) {
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await updateProspectReview(prospectId, next)
      if (!result.ok) {
        setError(result.error)
      }
    })
  }

  return (
    <div aria-busy={pending}>
      <p className="mb-2 intel-body font-medium text-body">Review</p>
      <div className="flex flex-wrap gap-2">
        {REVIEW_ACTIONS.map((action) => (
          <Button
            key={action.status}
            type="button"
            variant="outline"
            size="sm"
            disabled={pending || action.status === reviewStatus}
            onClick={() => setStatus(action.status)}
            className="border-black/10"
          >
            {action.label}
          </Button>
        ))}
        {reviewStatus !== 'unreviewed' ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => setStatus('unreviewed')}
            className="text-meta"
          >
            Reset to unreviewed
          </Button>
        ) : null}
      </div>
      <p className="mt-2 intel-secondary text-meta">
        Current: {PROSPECT_REVIEW_LABELS[reviewStatus]}.
      </p>
      <div className="mt-2">
        <MutationError message={error} />
      </div>
    </div>
  )
}

function NoteForm({
  prospectId,
  ownerNote,
}: {
  prospectId: string
  ownerNote: string | null
}) {
  const [value, setValue] = useState(ownerNote ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()
  const unchanged = value.trim() === (ownerNote ?? '').trim()

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || unchanged) {
      return
    }
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await updateProspectNote(prospectId, value)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setSaved(true)
    })
  }

  return (
    <form onSubmit={onSubmit} aria-busy={pending}>
      <label
        htmlFor="intel-prospect-note"
        className="mb-2 block intel-body font-medium text-body"
      >
        Note
      </label>
      <textarea
        id="intel-prospect-note"
        name="note"
        rows={4}
        maxLength={OWNER_NOTE_MAX}
        value={value}
        disabled={pending}
        onChange={(event) => {
          setValue(event.target.value)
          setSaved(false)
        }}
        className={fieldClassName}
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={pending || unchanged}
          className="border-black/10"
        >
          {pending ? 'Saving…' : 'Save note'}
        </Button>
        {saved ? (
          <p className="intel-secondary text-meta" role="status">
            Saved.
          </p>
        ) : null}
      </div>
      <div className="mt-2">
        <MutationError message={error} />
      </div>
    </form>
  )
}
