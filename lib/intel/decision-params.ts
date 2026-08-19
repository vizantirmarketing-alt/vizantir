export const DECISION_CATEGORIES = [
  'needs_attention',
  'opportunity',
  'working',
  'system',
] as const

export type DecisionCategory = (typeof DECISION_CATEGORIES)[number]

export const DECISION_CATEGORY_LABELS: Record<DecisionCategory, string> = {
  needs_attention: 'Needs attention',
  opportunity: 'Opportunities',
  working: 'Working',
  system: 'System',
}

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

export function isDecisionId(value: string): boolean {
  if (!/^[1-9]\d*$/.test(value)) {
    return false
  }
  const parsed = Number(value)
  return Number.isSafeInteger(parsed)
}

/** Novelty decay tau in days: effective_score = score * exp(-days_since_created / tau). */
export const DECISION_NOVELTY_TAU_DAYS = 14

export const RESULT_NOTE_MAX_LENGTH = 2000
