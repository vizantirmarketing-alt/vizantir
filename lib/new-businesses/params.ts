/**
 * New Businesses list params and labels. Pure; safe to import from client
 * components.
 */

export const NEW_BUSINESSES_PAGE_SIZE = 50

export const NEW_BUSINESS_REVIEW_STATUSES = ['unreviewed', 'accepted', 'rejected', 'archived'] as const
export type NewBusinessReviewStatus = (typeof NEW_BUSINESS_REVIEW_STATUSES)[number]

export const NEW_BUSINESS_REVIEW_LABELS: Record<NewBusinessReviewStatus, string> = {
  unreviewed: 'Unreviewed',
  accepted: 'Accepted',
  rejected: 'Rejected',
  archived: 'Archived',
}

export const PHONE_LABEL = 'Phone on public license record'

/** Lead tiers, as in lib/new-businesses/rank.ts. Repeated here so this file stays dependency-free. */
export const NEW_BUSINESS_LEAD_FILTERS = ['likely', 'possible', 'low'] as const
export type NewBusinessLeadFilter = (typeof NEW_BUSINESS_LEAD_FILTERS)[number]

export function isNewBusinessLeadFilter(value: unknown): value is NewBusinessLeadFilter {
  return NEW_BUSINESS_LEAD_FILTERS.some((tier) => tier === value)
}
export const NEW_BUSINESS_NOTE_MAX = 2000

export type NewBusinessesListParams = {
  review: NewBusinessReviewStatus | 'all'
  /** Lead tier filter. Default all: the score orders the list, it never hides rows. */
  lead: NewBusinessLeadFilter | 'all'
  category: string | null
  city: string | null
  zip: string | null
  /** YYYY-MM */
  period: string | null
  page: number
}

export type NewBusinessesSearchParams = Partial<Record<keyof NewBusinessesListParams, string | string[]>>

const PERIOD_RE = /^(\d{4})-(0[1-9]|1[0-2])$/

export function isNewBusinessReviewStatus(value: unknown): value is NewBusinessReviewStatus {
  return NEW_BUSINESS_REVIEW_STATUSES.some((status) => status === value)
}

export function parsePeriodParam(value: string | null): { year: number; month: number } | null {
  if (value === null) return null
  const match = PERIOD_RE.exec(value)
  return match ? { year: Number(match[1]), month: Number(match[2]) } : null
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function text(value: string | undefined, max = 200): string | null {
  const trimmed = value?.trim() ?? ''
  return trimmed.length === 0 || trimmed.length > max ? null : trimmed
}

export function parseNewBusinessesListParams(search: NewBusinessesSearchParams): NewBusinessesListParams {
  const review = first(search.review)
  const lead = first(search.lead)
  const period = text(first(search.period), 7)
  const page = Number(first(search.page))
  return {
    review: isNewBusinessReviewStatus(review) ? review : 'unreviewed',
    lead: isNewBusinessLeadFilter(lead) ? lead : 'all',
    category: text(first(search.category)),
    city: text(first(search.city)),
    zip: text(first(search.zip), 10),
    period: period !== null && PERIOD_RE.test(period) ? period : null,
    page: Number.isInteger(page) && page > 1 ? page : 1,
  }
}

export function newBusinessesListHref(params: NewBusinessesListParams): string {
  const query = new URLSearchParams()
  if (params.review !== 'unreviewed') query.set('review', params.review)
  if (params.lead !== 'all') query.set('lead', params.lead)
  if (params.category !== null) query.set('category', params.category)
  if (params.city !== null) query.set('city', params.city)
  if (params.zip !== null) query.set('zip', params.zip)
  if (params.period !== null) query.set('period', params.period)
  if (params.page > 1) query.set('page', String(params.page))
  const qs = query.toString()
  return qs.length > 0 ? `/intel/new-businesses?${qs}` : '/intel/new-businesses'
}

export function newBusinessesFiltersActive(params: NewBusinessesListParams): boolean {
  return (
    params.review !== 'unreviewed' ||
    params.lead !== 'all' ||
    params.category !== null ||
    params.city !== null ||
    params.zip !== null ||
    params.period !== null
  )
}
