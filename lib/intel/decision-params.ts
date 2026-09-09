export const DECISION_CATEGORIES = [
  'needs_attention',
  'opportunity',
  'working',
  'system',
  'search_intelligence',
] as const

export type DecisionCategory = (typeof DECISION_CATEGORIES)[number]

export const DECISION_CATEGORY_LABELS: Record<DecisionCategory, string> = {
  needs_attention: 'Needs attention',
  opportunity: 'Opportunities',
  working: 'Working',
  system: 'System',
  search_intelligence: 'Search Intelligence',
}

/**
 * Sub-identity within `search_intelligence` (S11, architecture 17.4).
 *
 * Two orthogonal axes. `Discipline` decides which section a finding renders
 * in; `DetectorFamily` describes what kind of work it implies. A `technical`
 * finding can be SEO or GEO, so neither axis implies the other.
 *
 * These are TypeScript-only. The matching decision_items columns are
 * unconstrained text on purpose — see lib/intel/decisions/registry.ts.
 */
export const DISCIPLINES = ['seo', 'aeo', 'geo'] as const

export type Discipline = (typeof DISCIPLINES)[number]

export const DISCIPLINE_LABELS: Record<Discipline, string> = {
  seo: 'SEO',
  aeo: 'AEO',
  geo: 'GEO',
}

/**
 * Open to extension. `internal-linking`, `cannibalization` and `performance`
 * are reserved with no detector yet: their data sources already exist
 * (scan_page_snapshots.internal_links, gsc_query_page_daily, psi_results
 * respectively) and 17.4 names them as the next likely additions.
 */
export const DETECTOR_FAMILIES = [
  'technical',
  'metadata',
  'schema',
  'internal-linking',
  'cannibalization',
  'content',
  'performance',
  'ai-crawler-visibility',
] as const

export type DetectorFamily = (typeof DETECTOR_FAMILIES)[number]

export const DECISION_CONFIDENCES = [
  'high',
  'medium',
  'exploratory',
] as const

export type DecisionConfidence = (typeof DECISION_CONFIDENCES)[number]

export const DECISION_CONFIDENCE_LABELS: Record<DecisionConfidence, string> = {
  high: 'High confidence',
  medium: 'Medium confidence',
  exploratory: 'Exploratory',
}

export const DECISION_STATUSES = [
  'new',
  'seen',
  'planned',
  'in_progress',
  'completed',
  'dismissed',
] as const

export type DecisionStatus = (typeof DECISION_STATUSES)[number]

export const DECISION_STATUS_LABELS: Record<DecisionStatus, string> = {
  new: 'New',
  seen: 'Seen',
  planned: 'Planned',
  in_progress: 'In progress',
  completed: 'Completed',
  dismissed: 'Dismissed',
}

const HIDDEN_STATUSES = new Set<DecisionStatus>(['completed', 'dismissed'])

export function isDecisionCategory(
  value: string,
): value is DecisionCategory {
  return DECISION_CATEGORIES.some((category) => category === value)
}

export function isDecisionConfidence(
  value: string,
): value is DecisionConfidence {
  return DECISION_CONFIDENCES.some((confidence) => confidence === value)
}

export function isDecisionStatus(value: string): value is DecisionStatus {
  return DECISION_STATUSES.some((status) => status === value)
}

export function isHiddenDecisionStatus(status: DecisionStatus): boolean {
  return HIDDEN_STATUSES.has(status)
}

const FINDING_KEY_RE = /^[a-z0-9][a-z0-9-]*:[a-z0-9][a-z0-9-]*$/
const FINDING_KEY_DATE_SUFFIX = /:\d{4}-\d{2}-\d{2}$/

export function isFindingKey(value: string): boolean {
  if (value.length < 3 || value.length > 256) {
    return false
  }
  if (FINDING_KEY_DATE_SUFFIX.test(value)) {
    return false
  }
  return FINDING_KEY_RE.test(value)
}

/** Novelty decay tau in days: effective_score = score * exp(-days_since_created / tau). */
export const DECISION_NOVELTY_TAU_DAYS = 14

export const RESULT_NOTE_MAX_LENGTH = 2000

export type OverviewSearchParams = {
  triaged?: string | string[]
}

export type OverviewPageParams = {
  showTriaged: boolean
}

function firstSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    const first = value[0]
    return typeof first === 'string' ? first : undefined
  }
  return value
}

export function parseOverviewPageParams(
  searchParams: OverviewSearchParams,
): OverviewPageParams {
  return { showTriaged: firstSearchParam(searchParams.triaged) === '1' }
}

export function overviewHref(params: OverviewPageParams): string {
  return params.showTriaged ? '/intel?triaged=1' : '/intel'
}
