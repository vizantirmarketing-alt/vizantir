'use client'

import { useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { TextAction } from '@/app/intel/_components/ui/TextAction'
import { NewBusinessImportChip } from '@/app/intel/_components/ui/StatusChip'

import {
  importLatestNow,
  reimportNewBusinessPeriod,
  type ImportActionResult,
} from '@/app/intel/(app)/new-businesses/actions'

// Messages wrap anywhere, so a long period name or error can never widen the
// panel or the page.
const wrap = 'w-full min-w-0 [overflow-wrap:anywhere]'

function Message({ result }: { result: ImportActionResult | null }) {
  if (result === null) return null
  return result.ok ? (
    <p className={`${wrap} text-sm text-meta`} role="status">
      {result.message}
    </p>
  ) : (
    <p className={`${wrap} text-sm text-warning-severe`} role="alert">
      {result.error}
    </p>
  )
}

export function ImportLatestButton() {
  const [result, setResult] = useState<ImportActionResult | null>(null)
  const [pending, startTransition] = useTransition()
  return (
    <div className="mb-3 flex min-w-0 flex-col items-start gap-2" aria-busy={pending}>
      <Button
        type="button"
        size="sm"
        disabled={pending}
        className="bg-cobalt-primary text-white hover:bg-[#1E85FF]"
        onClick={() => {
          setResult(null)
          startTransition(async () => setResult(await importLatestNow()))
        }}
      >
        {pending ? 'Importing…' : 'Import latest'}
      </Button>
      <Message result={result} />
    </div>
  )
}

export type ImportRowProps = {
  period: string
  label: string
  state: 'importing' | 'imported' | 'failed'
  summary: string
  timestamp: string
  error: string | null
}

/**
 * One import period: heading with its status chip and Re-import action, then
 * the summary line (the only place its counts appear), then any stored error,
 * then the result of a Re-import from this page.
 */
export function ImportRow({ period, label, state, summary, timestamp, error }: ImportRowProps) {
  const [result, setResult] = useState<ImportActionResult | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <li className="min-w-0 py-2 first:pt-0 last:pb-0">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <span className="font-medium text-foreground">{label}</span>
        <span className="flex items-center gap-3">
          <NewBusinessImportChip state={state} />
          {state !== 'importing' ? (
            <TextAction
              pending={pending}
              pendingLabel="Re-importing…"
              onClick={() => {
                setResult(null)
                startTransition(async () => setResult(await reimportNewBusinessPeriod(period)))
              }}
            >
              Re-import
            </TextAction>
          ) : null}
        </span>
      </div>
      <p className={`mt-0.5 ${wrap} text-meta`}>
        {summary} · {timestamp}
      </p>
      {error !== null ? <p className={`mt-0.5 ${wrap} text-warning-severe`}>{error}</p> : null}
      {result !== null ? (
        <div className="mt-1">
          <Message result={result} />
        </div>
      ) : null}
    </li>
  )
}
