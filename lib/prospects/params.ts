/**
 * Prospect Research enums, labels and list URL params. Pure; safe to import
 * from client components.
 */

export const PROSPECTS_PAGE_SIZE = 25

export const PROSPECT_REVIEW_STATUSES = [
  'unreviewed',
  'accepted',
  'rejected',
  'archived',
] as const
export type ProspectReviewStatus = (typeof PROSPECT_REVIEW_STATUSES)[number]

export const PROSPECT_REVIEW_LABELS: Record<ProspectReviewStatus, string> = {
  unreviewed: 'Unreviewed',
  accepted: 'Accepted',
  rejected: 'Rejected',
  archived: 'Archived',
}

export const PROSPECT_RUN_STATES = [
  'requested',
  'claimed',
  'completed',
  'partial',
  'failed',
  'cancelled',
] as const
export type ProspectRunState = (typeof PROSPECT_RUN_STATES)[number]

export const PROSPECT_RUN_STATE_LABELS: Record<ProspectRunState, string> = {
  requested: 'Requested',
  claimed: 'In progress',
  completed: 'Completed',
  partial: 'Partial',
  failed: 'Failed',
  cancelled: 'Cancelled',
}

/** States the owner may cancel from. */
export const CANCELLABLE_RUN_STATES: readonly ProspectRunState[] = [
  'requested',
  'claimed',
]

export const EVIDENCE_KINDS = ['observation', 'measurement', 'inference'] as const
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number]

export const EVIDENCE_KIND_LABELS: Record<EvidenceKind, string> = {
  observation: 'Observation',
  measurement: 'Measurement',
  inference: 'Inference',
}

export const PROSPECT_SORTS = ['priority', 'fit', 'opportunity', 'researched'] as const
export type ProspectSort = (typeof PROSPECT_SORTS)[number]

export const DEFAULT_PROSPECT_SORT: ProspectSort = 'priority'

export const PROSPECT_SORT_LABELS: Record<ProspectSort, string> = {
  priority: 'Priority, highest first',
  fit: 'Fit, highest first',
  opportunity: 'Opportunity, highest first',
  researched: 'Last researched, newest first',
}

/** Limits for the owner's research request form. */
export const RUN_TARGET_COUNT_MAX = 50
export const RUN_EXCLUSIONS_MAX = 100
export const RUN_TEXT_MAX = 120
export const OWNER_NOTE_MAX = 5000

export type ProspectsListParams = {
  review: ProspectReviewStatus | 'all'
  industry: string | null
  market: string | null
  sort: ProspectSort
  page: number
}

export type ProspectsSearchParams = {
  review?: string | string[]
  industry?: string | string[]
  market?: string | string[]
  sort?: string | string[]
  page?: string | string[]
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID_RE.test(value)
}

export function isProspectReviewStatus(value: unknown): value is ProspectReviewStatus {
  return PROSPECT_REVIEW_STATUSES.some((status) => status === value)
}

export function isProspectRunState(value: unknown): value is ProspectRunState {
  return PROSPECT_RUN_STATES.some((state) => state === value)
}

export function isEvidenceKind(value: unknown): value is EvidenceKind {
  return EVIDENCE_KINDS.some((kind) => kind === value)
}

function isProspectSort(value: unknown): value is ProspectSort {
  return PROSPECT_SORTS.some((sort) => sort === value)
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function cleanText(value: string | undefined): string | null {
  if (value === undefined) {
    return null
  }
  const trimmed = value.trim()
  if (trimmed.length === 0 || trimmed.length > RUN_TEXT_MAX) {
    return null
  }
  return trimmed
}

export function parseProspectsListParams(
  search: ProspectsSearchParams,
): ProspectsListParams {
  const review = first(search.review)
  const sort = first(search.sort)
  const pageRaw = Number(first(search.page))

  return {
    review: isProspectReviewStatus(review) ? review : 'all',
    industry: cleanText(first(search.industry)),
    market: cleanText(first(search.market)),
    sort: isProspectSort(sort) ? sort : DEFAULT_PROSPECT_SORT,
    page: Number.isInteger(pageRaw) && pageRaw > 1 ? pageRaw : 1,
  }
}

export function prospectsFiltersActive(params: ProspectsListParams): boolean {
  return (
    params.review !== 'all' || params.industry !== null || params.market !== null
  )
}

export function prospectsListHref(params: ProspectsListParams): string {
  const query = new URLSearchParams()
  if (params.review !== 'all') {
    query.set('review', params.review)
  }
  if (params.industry !== null) {
    query.set('industry', params.industry)
  }
  if (params.market !== null) {
    query.set('market', params.market)
  }
  if (params.sort !== DEFAULT_PROSPECT_SORT) {
    query.set('sort', params.sort)
  }
  if (params.page > 1) {
    query.set('page', String(params.page))
  }
  const qs = query.toString()
  return qs.length > 0 ? `/intel/prospects?${qs}` : '/intel/prospects'
}

export function formatScore(value: number | null): string {
  return value === null ? '—' : String(value)
}

/**
 * Prospect pages show dates in the studio's own time zone. Formatting in UTC
 * pushed evening Las Vegas activity onto the next calendar day.
 */
export const PROSPECT_DISPLAY_TIME_ZONE = 'America/Los_Angeles'

function parseIso(iso: string | null): Date | null {
  if (iso === null) {
    return null
  }
  const then = Date.parse(iso)
  return Number.isNaN(then) ? null : new Date(then)
}

/** Short Los Angeles date, e.g. "Nov 9, 2026". */
export function formatShortDate(iso: string | null): string {
  const date = parseIso(iso)
  if (date === null) {
    return '—'
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: PROSPECT_DISPLAY_TIME_ZONE,
  }).format(date)
}

/** Full Los Angeles timestamp, e.g. "November 9, 2026 at 7:30 PM PST". */
export function formatProspectTimestamp(iso: string | null): string {
  const date = parseIso(iso)
  if (date === null) {
    return '—'
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: PROSPECT_DISPLAY_TIME_ZONE,
    timeZoneName: 'short',
  }).format(date)
}

/** Priority weights: 60 percent fit plus 40 percent opportunity. */
export const PRIORITY_FIT_WEIGHT = 0.6
export const PRIORITY_OPPORTUNITY_WEIGHT = 0.4

/** Null when either score is missing; such prospects sort last. */
export function priorityScore(
  fitScore: number | null,
  opportunityScore: number | null,
): number | null {
  if (fitScore === null || opportunityScore === null) {
    return null
  }
  return fitScore * PRIORITY_FIT_WEIGHT + opportunityScore * PRIORITY_OPPORTUNITY_WEIGHT
}

/** Highest priority first, missing priority last, then by name. */
export function comparePriority(
  a: { fitScore: number | null; opportunityScore: number | null; name: string },
  b: { fitScore: number | null; opportunityScore: number | null; name: string },
): number {
  const pa = priorityScore(a.fitScore, a.opportunityScore)
  const pb = priorityScore(b.fitScore, b.opportunityScore)
  if (pa === null && pb !== null) return 1
  if (pa !== null && pb === null) return -1
  if (pa !== null && pb !== null && pa !== pb) return pb - pa
  return a.name.localeCompare(b.name)
}

/** Saved against requested, e.g. "7 of 10"; just the count when unknown. */
export function formatSavedOfRequested(saved: number, requested: number | null): string {
  return requested === null ? String(saved) : `${saved} of ${requested}`
}
