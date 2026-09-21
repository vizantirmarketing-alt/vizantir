'use client'

import { useId, useLayoutEffect, useRef, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { Trash2 } from 'lucide-react'

import { deleteLead } from '@/app/intel/(app)/leads/[id]/actions'
import { Button } from '@/components/ui/button'

type LeadDeleteControlProps = {
  leadId: string
  name: string
  company: string | null
}

function companyLabel(company: string | null): string {
  if (company === null) {
    return '—'
  }
  const trimmed = company.trim()
  return trimmed.length > 0 ? trimmed : '—'
}

export function LeadDeleteControl({
  leadId,
  name,
  company,
}: LeadDeleteControlProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const companyText = companyLabel(company)

  useLayoutEffect(() => {
    const row = triggerRef.current?.closest('tr, li')
    if (!(row instanceof HTMLElement)) {
      return
    }

    if (pending) {
      row.dataset.pending = ''
      row.setAttribute('aria-busy', 'true')
    } else {
      delete row.dataset.pending
      row.removeAttribute('aria-busy')
    }

    return () => {
      delete row.dataset.pending
      row.removeAttribute('aria-busy')
    }
  }, [pending])

  useLayoutEffect(() => {
    const dialog = dialogRef.current
    if (!open || !dialog || dialog.open) {
      return
    }
    dialog.showModal()
  }, [open])

  function openDialog() {
    if (pending || open) {
      return
    }
    setError(null)
    setOpen(true)
  }

  function closeDialog() {
    if (pending) {
      return
    }
    dialogRef.current?.close()
  }

  function onConfirm() {
    if (pending) {
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await deleteLead(leadId)
      if (!result.ok) {
        setError(result.error)
        return
      }
      dialogRef.current?.close()
    })
  }

  const dialog =
    open && typeof document !== 'undefined'
      ? createPortal(
          <dialog
            ref={dialogRef}
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="w-[min(24rem,calc(100%-2rem))] rounded-lg border border-black/10 bg-white p-5 text-left text-foreground shadow-lg backdrop:bg-black/40"
            onCancel={(event) => {
              if (pending) {
                event.preventDefault()
              }
            }}
            onClose={() => {
              setOpen(false)
              const trigger = triggerRef.current
              if (trigger?.isConnected) {
                trigger.focus()
              }
            }}
          >
            <h2 id={titleId} className="text-sm font-medium text-foreground">
              Delete inquiry
            </h2>
            <p
              id={descriptionId}
              className="mt-2 text-sm leading-relaxed text-body"
            >
              Delete {name} ({companyText})? This deletion is permanent.
            </p>
            {error ? (
              <p className="mt-3 text-sm text-warning-severe" role="alert">
                {error}
              </p>
            ) : null}
            <div className="mt-4 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                autoFocus
                disabled={pending}
                onClick={closeDialog}
                className="border-black/10"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={pending}
                onClick={onConfirm}
                className="bg-warning-severe text-white hover:bg-warning-severe/90"
              >
                {pending ? 'Deleting…' : 'Confirm'}
              </Button>
            </div>
          </dialog>,
          document.body,
        )
      : null

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openDialog}
        disabled={pending}
        aria-haspopup="dialog"
        aria-label={
          companyText === '—'
            ? `Delete ${name}`
            : `Delete ${name}, ${companyText}`
        }
        className="inline-flex size-6 items-center justify-center rounded-md text-warning-severe transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-focus disabled:opacity-50"
      >
        <Trash2 className="size-3.5" aria-hidden />
      </button>
      {dialog}
    </>
  )
}
