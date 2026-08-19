import type {
  DecisionCategory,
  DecisionConfidence,
} from '@/lib/intel/decision-params'

export type MatchType = 'contains_any' | 'exact_any'

export type QueryGroup = {
  id: number
  slug: string
  label: string
  matchTerms: string[]
  matchType: MatchType
  active: boolean
}

export type SiteDailyRow = {
  date: string
  clicks: number
  impressions: number
  position: number
}

export type QueryWindowStats = {
  query: string
  clicks: number
  impressions: number
  ctr: number | null
  position: number | null
  topPage: string | null
}

export type PageWindowStats = {
  page: string
  clicks: number
  impressions: number
}

export type GroupedQueryStats = {
  group: QueryGroup
  clicks: number
  impressions: number
  ctr: number | null
  position: number | null
  memberQueries: QueryWindowStats[]
  topPages: PageWindowStats[]
}

export type DetectorInput = {
  periodStart: string
  periodEnd: string
  priorStart: string
  priorEnd: string
  groups: QueryGroup[]
  groupedRows: Map<string, GroupedQueryStats>
  siteDaily: SiteDailyRow[]
  queries: QueryWindowStats[]
  comparisonAvailable: boolean
}

export type Finding = {
  emissionKey: string
  category: DecisionCategory
  title: string
  description: string
  evidence: Record<string, unknown>
  relatedUrl?: string
  recommendedAction?: string
  confidence: DecisionConfidence
  score: number
}

export type Detector = {
  name: string
  needsComparison?: boolean
  detect(input: DetectorInput): Finding[]
}

export function slugifyKey(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug.length > 0 ? slug : 'item'
}

export function emissionKeyFor(id: string, periodEnd: string): string {
  return `${id}:${periodEnd}`
}
