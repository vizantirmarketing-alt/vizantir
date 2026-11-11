'use client'

import { useState, useTransition, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import {
  RUN_EXCLUSIONS_MAX,
  RUN_TARGET_COUNT_MAX,
  RUN_TEXT_MAX,
} from '@/lib/prospects/params'

import { requestProspectRun } from '@/app/intel/(app)/prospects/actions'

const fieldClassName =
  'w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 intel-body text-foreground transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cobalt-focus'

function readFormString(form: FormData, key: string): string {
  const value = form.get(key)
  return typeof value === 'string' ? value : ''
}

export function ProspectRunRequestForm() {
  const [error, setError] = useState<string | null>(null)
  const [requested, setRequested] = useState(false)
  const [pending, startTransition] = useTransition()

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) {
      return
    }

    const form = event.currentTarget
    const data = new FormData(form)
    setError(null)
    setRequested(false)

    startTransition(async () => {
      const result = await requestProspectRun({
        market: readFormString(data, 'market'),
        industry: readFormString(data, 'industry'),
        targetCount: readFormString(data, 'targetCount'),
        exclusions: readFormString(data, 'exclusions'),
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      form.reset()
      setRequested(true)
    })
  }

  return (
    <form onSubmit={onSubmit} aria-busy={pending} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_8rem]">
        <div>
          <label
            htmlFor="intel-prospect-run-market"
            className="mb-2 block intel-body font-medium text-body"
          >
            Market
          </label>
          <input
            id="intel-prospect-run-market"
            name="market"
            required
            maxLength={RUN_TEXT_MAX}
            placeholder="Las Vegas, NV"
            className={fieldClassName}
          />
        </div>
        <div>
          <label
            htmlFor="intel-prospect-run-industry"
            className="mb-2 block intel-body font-medium text-body"
          >
            Industry
          </label>
          <input
            id="intel-prospect-run-industry"
            name="industry"
            required
            maxLength={RUN_TEXT_MAX}
            placeholder="Law firms"
            className={fieldClassName}
          />
        </div>
        <div>
          <label
            htmlFor="intel-prospect-run-count"
            className="mb-2 block intel-body font-medium text-body"
          >
            Companies
          </label>
          <input
            id="intel-prospect-run-count"
            name="targetCount"
            type="number"
            required
            min={1}
            max={RUN_TARGET_COUNT_MAX}
            defaultValue={10}
            className={fieldClassName}
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="intel-prospect-run-exclusions"
          className="mb-2 block intel-body font-medium text-body"
        >
          Exclude domains (optional)
        </label>
        <textarea
          id="intel-prospect-run-exclusions"
          name="exclusions"
          rows={2}
          placeholder="One per line or comma separated"
          className={fieldClassName}
        />
        <p className="mt-1 intel-secondary text-meta">
          Up to {RUN_EXCLUSIONS_MAX} domains. The research runner skips these.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          size="sm"
          disabled={pending}
          className="bg-cobalt-primary text-white hover:bg-[#1E85FF]"
        >
          {pending ? 'Requesting…' : 'Request research run'}
        </Button>
        {requested ? (
          <p className="intel-body text-body" role="status">
            Run requested. It waits in the queue until the research runner claims it.
          </p>
        ) : null}
        {error !== null ? (
          <p className="intel-body text-warning-severe" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </form>
  )
}
