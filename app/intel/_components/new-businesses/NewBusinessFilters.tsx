'use client'

import { type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Select } from '@/components/ui/select'
import {
  NEW_BUSINESS_LEAD_FILTERS,
  NEW_BUSINESS_WEBSITE_FILTERS,
  NEW_BUSINESS_WEBSITE_FILTER_LABELS,
  NEW_BUSINESS_REVIEW_LABELS,
  NEW_BUSINESS_REVIEW_STATUSES,
  newBusinessesFiltersActive,
  newBusinessesListHref,
  parseNewBusinessesListParams,
  type NewBusinessesListParams,
} from '@/lib/new-businesses/params'

type Option = { value: string; label: string }

const LEAD_FILTER_LABELS = { likely: 'Likely', possible: 'Possible', low: 'Low' } as const

function readFormString(form: FormData, key: string): string {
  const value = form.get(key)
  return typeof value === 'string' ? value : ''
}

function hrefFromForm(form: HTMLFormElement): string {
  const data = new FormData(form)
  const parsed = parseNewBusinessesListParams({
    review: readFormString(data, 'review'),
    lead: readFormString(data, 'lead'),
    website: readFormString(data, 'website'),
    category: readFormString(data, 'category'),
    city: readFormString(data, 'city'),
    zip: readFormString(data, 'zip'),
    period: readFormString(data, 'period'),
  })
  return newBusinessesListHref({ ...parsed, page: 1 })
}

function withCurrent(options: Option[], current: string | null): Option[] {
  if (current === null || options.some((o) => o.value === current)) return options
  return [{ value: current, label: current }, ...options]
}

function FilterSelect({
  id,
  name,
  label,
  value,
  options,
  allLabel = 'All',
  onChange,
}: {
  id: string
  name: string
  label: string
  value: string
  options: Option[]
  allLabel?: string
  onChange: (form: HTMLFormElement | null) => void
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block intel-body font-medium text-body">
        {label}
      </label>
      <Select
        id={id}
        name={name}
        defaultValue={value}
        className="w-full"
        onChange={(event) => onChange(event.currentTarget.form)}
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  )
}

export function NewBusinessFilters({
  params,
  categories,
  cities,
  zips,
  periods,
}: {
  params: NewBusinessesListParams
  categories: string[]
  cities: string[]
  zips: string[]
  periods: Option[]
}) {
  const router = useRouter()
  const onChange = (form: HTMLFormElement | null) => {
    if (form) router.push(hrefFromForm(form))
  }
  const plain = (values: string[]) => values.map((v) => ({ value: v, label: v }))

  return (
    <form
      key={newBusinessesListHref(params)}
      method="get"
      action="/intel/new-businesses"
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        router.push(hrefFromForm(event.currentTarget))
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
        <div>
          <label htmlFor="nb-review" className="mb-2 block intel-body font-medium text-body">
            Review status
          </label>
          <Select
            id="nb-review"
            name="review"
            defaultValue={params.review}
            className="w-full"
            onChange={(event) => onChange(event.currentTarget.form)}
          >
            <option value="all">All</option>
            {NEW_BUSINESS_REVIEW_STATUSES.map((status) => (
              <option key={status} value={status}>
                {NEW_BUSINESS_REVIEW_LABELS[status]}
              </option>
            ))}
          </Select>
        </div>
        <FilterSelect
          id="nb-lead"
          name="lead"
          label="Lead"
          value={params.lead === 'all' ? '' : params.lead}
          options={NEW_BUSINESS_LEAD_FILTERS.map((tier) => ({ value: tier, label: LEAD_FILTER_LABELS[tier] }))}
          onChange={onChange}
        />
        <FilterSelect
          id="nb-website"
          name="website"
          label="Website"
          value={params.website === 'all' ? '' : params.website}
          options={NEW_BUSINESS_WEBSITE_FILTERS.map((status) => ({ value: status, label: NEW_BUSINESS_WEBSITE_FILTER_LABELS[status] }))}
          onChange={onChange}
        />
        <FilterSelect id="nb-category" name="category" label="Category" value={params.category ?? ''} options={withCurrent(plain(categories), params.category)} onChange={onChange} />
        <FilterSelect id="nb-city" name="city" label="City" value={params.city ?? ''} options={withCurrent(plain(cities), params.city)} onChange={onChange} />
        <FilterSelect id="nb-zip" name="zip" label="Zip" value={params.zip ?? ''} options={withCurrent(plain(zips), params.zip)} onChange={onChange} />
        <FilterSelect id="nb-period" name="period" label="Period" value={params.period ?? ''} options={withCurrent(periods, params.period)} onChange={onChange} />
      </div>
      {newBusinessesFiltersActive(params) ? (
        <Link
          href="/intel/new-businesses"
          className="mt-3 inline-block intel-body text-cobalt-primary transition-colors hover:text-[#1E85FF]"
        >
          Clear filters
        </Link>
      ) : null}
    </form>
  )
}
