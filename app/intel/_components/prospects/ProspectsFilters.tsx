'use client'

import { type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Select } from '@/components/ui/select'
import {
  PROSPECT_REVIEW_LABELS,
  PROSPECT_REVIEW_STATUSES,
  PROSPECT_SORTS,
  PROSPECT_SORT_LABELS,
  parseProspectsListParams,
  prospectsFiltersActive,
  prospectsListHref,
  type ProspectsListParams,
} from '@/lib/prospects/params'

type ProspectsFiltersProps = {
  params: ProspectsListParams
  industries: string[]
  markets: string[]
}

function readFormString(form: FormData, key: string): string {
  const value = form.get(key)
  return typeof value === 'string' ? value : ''
}

function hrefFromForm(form: HTMLFormElement): string {
  const data = new FormData(form)
  const parsed = parseProspectsListParams({
    review: readFormString(data, 'review'),
    industry: readFormString(data, 'industry'),
    market: readFormString(data, 'market'),
    sort: readFormString(data, 'sort'),
  })
  return prospectsListHref({ ...parsed, page: 1 })
}

/** Keeps the current value selectable even if it is not in the scanned options. */
function withCurrent(options: string[], current: string | null): string[] {
  if (current === null || options.includes(current)) {
    return options
  }
  return [current, ...options]
}

export function ProspectsFilters({
  params,
  industries,
  markets,
}: ProspectsFiltersProps) {
  const router = useRouter()
  const filtersActive = prospectsFiltersActive(params)

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
      key={prospectsListHref(params)}
      method="get"
      action="/intel/prospects"
      onSubmit={onSubmit}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label
            htmlFor="intel-prospects-review"
            className="mb-2 block text-sm font-medium text-body"
          >
            Review status
          </label>
          <Select
            id="intel-prospects-review"
            name="review"
            defaultValue={params.review}
            className="w-full"
            onChange={(event) => onControlChange(event.currentTarget.form)}
          >
            <option value="all">All</option>
            {PROSPECT_REVIEW_STATUSES.map((status) => (
              <option key={status} value={status}>
                {PROSPECT_REVIEW_LABELS[status]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label
            htmlFor="intel-prospects-industry"
            className="mb-2 block text-sm font-medium text-body"
          >
            Industry
          </label>
          <Select
            id="intel-prospects-industry"
            name="industry"
            defaultValue={params.industry ?? ''}
            className="w-full"
            onChange={(event) => onControlChange(event.currentTarget.form)}
          >
            <option value="">All</option>
            {withCurrent(industries, params.industry).map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label
            htmlFor="intel-prospects-market"
            className="mb-2 block text-sm font-medium text-body"
          >
            Market
          </label>
          <Select
            id="intel-prospects-market"
            name="market"
            defaultValue={params.market ?? ''}
            className="w-full"
            onChange={(event) => onControlChange(event.currentTarget.form)}
          >
            <option value="">All</option>
            {withCurrent(markets, params.market).map((market) => (
              <option key={market} value={market}>
                {market}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label
            htmlFor="intel-prospects-sort"
            className="mb-2 block text-sm font-medium text-body"
          >
            Sort
          </label>
          <Select
            id="intel-prospects-sort"
            name="sort"
            defaultValue={params.sort}
            className="w-full"
            onChange={(event) => onControlChange(event.currentTarget.form)}
          >
            {PROSPECT_SORTS.map((sort) => (
              <option key={sort} value={sort}>
                {PROSPECT_SORT_LABELS[sort]}
              </option>
            ))}
          </Select>
        </div>
      </div>
      {filtersActive ? (
        <Link
          href="/intel/prospects"
          className="mt-3 inline-block text-sm text-cobalt-primary transition-colors hover:text-[#1E85FF]"
        >
          Clear filters
        </Link>
      ) : null}
    </form>
  )
}
