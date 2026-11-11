'use client'

import { useMemo, useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { bulkTargets, filterCategories, formatEnabledTotal } from '@/lib/new-businesses/categories'
import type { CategoryRow } from '@/lib/new-businesses/load'

import {
  setNewBusinessCategoriesEnabled,
  setNewBusinessCategoryEnabled,
} from '@/app/intel/(app)/new-businesses/actions'

const fieldClassName =
  'w-full rounded-lg border border-black/10 bg-white px-3 py-2 intel-body text-foreground transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cobalt-focus'

function slug(category: string): string {
  return `category-${category.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`
}

export function CategoryToggles({ categories }: { categories: CategoryRow[] }) {
  const [rows, setRows] = useState(categories)
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const shown = useMemo(() => filterCategories(rows, query), [rows, query])

  function apply(names: string[], enabled: boolean, save: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    if (names.length === 0) return
    const changed = new Set(names)
    const before = rows
    setError(null)
    setRows((current) => current.map((row) => (changed.has(row.category) ? { ...row, enabled } : row)))
    startTransition(async () => {
      const result = await save()
      if (!result.ok) {
        setRows(before)
        setError(result.error)
      }
    })
  }

  if (rows.length === 0) {
    return (
      <p className="intel-body leading-relaxed text-body">
        No categories yet. They appear after the first import, all switched off.
      </p>
    )
  }

  const onTargets = bulkTargets(rows, query, true)
  const offTargets = bulkTargets(rows, query, false)

  return (
    <div className="min-w-0 space-y-3" aria-busy={pending}>
      <p className="intel-secondary text-meta [overflow-wrap:anywhere]">
        <span className="font-medium text-foreground">{formatEnabledTotal(rows)}</span>. Only businesses in
        categories that are on are kept; the rest are counted and skipped. After turning a category on, re-import a
        period to pick up its businesses.
      </p>

      <div>
        <label htmlFor="category-search" className="sr-only">
          Search categories
        </label>
        <input
          id="category-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search categories"
          className={fieldClassName}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending || onTargets.length === 0}
          onClick={() => apply(onTargets, true, () => setNewBusinessCategoriesEnabled(onTargets, true))}
          className="border-black/10"
        >
          Turn on shown
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending || offTargets.length === 0}
          onClick={() => apply(offTargets, false, () => setNewBusinessCategoriesEnabled(offTargets, false))}
          className="border-black/10"
        >
          Turn off shown
        </Button>
        <span className="intel-secondary text-meta">
          {shown.length === rows.length ? `${rows.length} shown` : `${shown.length} of ${rows.length} shown`}
        </span>
      </div>

      {error !== null ? (
        <p className="intel-body text-warning-severe [overflow-wrap:anywhere]" role="alert">
          {error}
        </p>
      ) : null}

      {shown.length === 0 ? (
        <p className="intel-body text-body">No categories match.</p>
      ) : (
        <ul className="max-h-96 divide-y divide-black/8 overflow-y-auto pr-1">
          {shown.map((row) => (
            <li key={row.category} className="flex min-w-0 items-center justify-between gap-3 py-1.5">
              <label htmlFor={slug(row.category)} className="min-w-0 flex-1 break-words intel-body text-body">
                {row.category}
              </label>
              <span className="shrink-0 tabular-nums intel-secondary text-meta">{row.lastSeenCount}</span>
              <input
                id={slug(row.category)}
                type="checkbox"
                role="switch"
                aria-checked={row.enabled}
                checked={row.enabled}
                disabled={pending}
                onChange={(event) => {
                  const next = event.target.checked
                  apply([row.category], next, () => setNewBusinessCategoryEnabled(row.category, next))
                }}
                className="size-4 shrink-0 accent-cobalt-primary"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
