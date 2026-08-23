'use client'

import { useRouter } from 'next/navigation'
import { type FormEvent } from 'react'

import {
  overviewHref,
  type OverviewPageParams,
} from '@/lib/intel/decision-params'
import { cn } from '@/lib/utils'

type DecisionTriagedToggleProps = {
  showTriaged: boolean
  hiddenCount: number
}

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

export function DecisionTriagedToggle({
  showTriaged,
  hiddenCount,
}: DecisionTriagedToggleProps) {
  const router = useRouter()
  const params: OverviewPageParams = { showTriaged }
  const label = `Show triaged (${formatCount(hiddenCount)})`

  function pushParams(next: OverviewPageParams) {
    router.push(overviewHref(next), { scroll: false })
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    pushParams({ showTriaged: data.get('triaged') === '1' })
  }

  return (
    <form
      key={overviewHref(params)}
      method="get"
      action="/intel"
      onSubmit={onSubmit}
      className="shrink-0"
    >
      <label className="inline-flex cursor-pointer items-center gap-2.5 whitespace-nowrap">
        <input
          type="checkbox"
          name="triaged"
          value="1"
          role="switch"
          defaultChecked={showTriaged}
          aria-label={label}
          onChange={(event) => {
            pushParams({ showTriaged: event.currentTarget.checked })
          }}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={cn(
            'relative h-5 w-9 shrink-0 rounded-full bg-black/15 transition-colors',
            "after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-white after:transition-transform after:content-['']",
            'peer-checked:bg-cobalt-primary peer-checked:after:translate-x-4',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-cobalt-focus',
          )}
        />
        <span className="text-sm text-body">{label}</span>
      </label>
    </form>
  )
}
