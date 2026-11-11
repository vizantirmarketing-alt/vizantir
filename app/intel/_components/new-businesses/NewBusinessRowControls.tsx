'use client'

import { useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import {
  NEW_BUSINESS_NOTE_MAX,
  NEW_BUSINESS_REVIEW_LABELS,
  type NewBusinessReviewStatus,
} from '@/lib/new-businesses/params'

import { updateNewBusinessNote, updateNewBusinessReview } from '@/app/intel/(app)/new-businesses/actions'

const ACTIONS: { status: NewBusinessReviewStatus; label: string }[] = [
  { status: 'accepted', label: 'Accept' },
  { status: 'rejected', label: 'Reject' },
  { status: 'archived', label: 'Archive' },
]

export function NewBusinessRowControls({
  id,
  reviewStatus,
  ownerNote,
}: {
  id: string
  reviewStatus: NewBusinessReviewStatus
  ownerNote: string | null
}) {
  const [noteOpen, setNoteOpen] = useState(false)
  const [note, setNote] = useState(ownerNote ?? '')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function run(action: () => Promise<{ ok: true } | { ok: false; error: string }>, after?: () => void) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (!result.ok) setError(result.error)
      else after?.()
    })
  }

  const buttonClass = 'h-8 border-black/10 px-2 intel-secondary'

  return (
    <div className="space-y-1.5" aria-busy={pending}>
      {/* Accept, Reject, Archive and Note on one line; they apply to every license of the business. */}
      <div className="flex flex-nowrap items-center gap-1.5">
        {ACTIONS.map((action) => (
          <Button
            key={action.status}
            type="button"
            variant="outline"
            size="sm"
            disabled={pending || reviewStatus === action.status}
            onClick={() => run(() => updateNewBusinessReview(id, action.status))}
            className={buttonClass}
          >
            {action.label}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-expanded={noteOpen}
          onClick={() => setNoteOpen((open) => !open)}
          className={buttonClass}
        >
          {noteOpen ? 'Close' : ownerNote ? 'Edit note' : 'Note'}
        </Button>
      </div>
      {reviewStatus !== 'unreviewed' ? (
        <p className="intel-secondary text-meta">{NEW_BUSINESS_REVIEW_LABELS[reviewStatus]}</p>
      ) : null}
      {ownerNote && !noteOpen ? <p className="line-clamp-1 intel-secondary text-body">{ownerNote}</p> : null}
      {noteOpen ? (
        <div className="space-y-1.5">
          <textarea
            value={note}
            maxLength={NEW_BUSINESS_NOTE_MAX}
            rows={2}
            onChange={(event) => setNote(event.target.value)}
            aria-label="Note"
            className="w-full rounded-lg border border-black/10 bg-white px-2 py-1.5 intel-body text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cobalt-focus"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => run(() => updateNewBusinessNote(id, note), () => setNoteOpen(false))}
            className={buttonClass}
          >
            {pending ? 'Saving…' : 'Save note'}
          </Button>
        </div>
      ) : null}
      {error !== null ? (
        <p className="intel-secondary text-warning-severe" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
