/**
 * Category list helpers for the Categories panel. Pure; safe for client
 * components.
 */

export type CategoryState = { category: string; enabled: boolean }

export const BULK_CATEGORY_LIMIT = 500

/** Categories whose name contains the query, ignoring case and extra spaces. */
export function filterCategories<T extends CategoryState>(categories: readonly T[], query: string): T[] {
  const needle = query.trim().replace(/\s+/g, ' ').toLowerCase()
  if (needle.length === 0) return [...categories]
  return categories.filter((c) => c.category.toLowerCase().includes(needle))
}

/**
 * The categories a "Turn on shown" or "Turn off shown" action changes: only
 * those shown by the current filter, and only those not already in the
 * requested state.
 */
export function bulkTargets(categories: readonly CategoryState[], query: string, enabled: boolean): string[] {
  return filterCategories(categories, query)
    .filter((c) => c.enabled !== enabled)
    .map((c) => c.category)
}

/** Running total, e.g. "9 of 121 on". */
export function formatEnabledTotal(categories: readonly CategoryState[]): string {
  const on = categories.filter((c) => c.enabled).length
  return `${on} of ${categories.length} on`
}
