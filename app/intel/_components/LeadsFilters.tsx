'use client'

import { useRouter } from 'next/navigation'
import { type FormEvent } from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
  LEAD_CHANNELS,
  LEAD_CHANNEL_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  leadsFiltersActive,
  leadsListHref,
  parseLeadsListParams,
  type LeadsListParams,
} from '@/lib/intel/lead-params'
import { cn } from '@/lib/utils'

const fieldClassName =
  'w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-foreground transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cobalt-focus'

type LeadsFiltersProps = {
  params: LeadsListParams
}

function readFormString(form: FormData, key: string): string {
  const value = form.get(key)
  return typeof value === 'string' ? value : ''
}

function hrefFromForm(form: HTMLFormElement): string {
  const data = new FormData(form)
  const parsed = parseLeadsListParams({
    status: readFormString(data, 'status'),
    channel: readFormString(data, 'channel'),
    q: readFormString(data, 'q'),
    sort: readFormString(data, 'sort'),
  })
  return leadsListHref({ ...parsed, page: 1 })
}

export function LeadsFilters({ params }: LeadsFiltersProps) {
  const router = useRouter()
  const filtersActive = leadsFiltersActive(params)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    router.push(hrefFromForm(event.currentTarget))
  }

  function onControlChange(form: HTMLFormElement | null) {
    if (!form) return
    router.push(hrefFromForm(form))
  }

  return (
    <form
      key={leadsListHref(params)}
      method="get"
      action="/intel/leads"
      onSubmit={onSubmit}
      className="mt-10"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label
            htmlFor="intel-leads-status"
            className="mb-2 block text-sm font-medium text-body"
          >
            Status
          </label>
          <select
            id="intel-leads-status"
            name="status"
            defaultValue={params.status}
            className={fieldClassName}
            onChange={(event) => onControlChange(event.currentTarget.form)}
          >
            <option value="all">All</option>
            {LEAD_STATUSES.map((status) => (
              <option key={status} value={status}>
                {LEAD_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="intel-leads-channel"
            className="mb-2 block text-sm font-medium text-body"
          >
            Channel
          </label>
          <select
            id="intel-leads-channel"
            name="channel"
            defaultValue={params.channel}
            className={fieldClassName}
            onChange={(event) => onControlChange(event.currentTarget.form)}
          >
            <option value="all">All</option>
            {LEAD_CHANNELS.map((channel) => (
              <option key={channel} value={channel}>
                {LEAD_CHANNEL_LABELS[channel]}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="intel-leads-q"
            className="mb-2 block text-sm font-medium text-body"
          >
            Search
          </label>
          <input
            id="intel-leads-q"
            name="q"
            type="search"
            defaultValue={params.q}
            autoComplete="off"
            spellCheck={false}
            placeholder="Name, email, or company"
            className={fieldClassName}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div>
          <label htmlFor="intel-leads-sort" className="sr-only">
            Sort
          </label>
          <select
            id="intel-leads-sort"
            name="sort"
            defaultValue={params.sort}
            className={cn(fieldClassName, 'w-auto')}
            onChange={(event) => onControlChange(event.currentTarget.form)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>

        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="border-black/10"
        >
          Apply
        </Button>

        {filtersActive ? (
          <Link
            href="/intel/leads"
            className="text-sm text-meta transition-colors hover:text-foreground"
          >
            Clear filters
          </Link>
        ) : null}
      </div>
    </form>
  )
}
