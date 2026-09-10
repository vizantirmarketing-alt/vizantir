import type { CrawlerWindow } from '@/lib/intel/crawlers'
import type {
  DecisionCategory,
  DecisionConfidence,
} from '@/lib/intel/decision-params'
import type { ScanWindow } from '@/lib/scan/types'

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
  /**
   * False until the first scan has run. Follows the `comparisonAvailable`
   * idiom exactly rather than inventing a new one (architecture 16).
   */
  scanAvailable: boolean
  /** The latest scan. Absent whenever scanAvailable is false. */
  scan?: ScanWindow
  /**
   * False when the crawler_hits summary could not be loaded. Follows the
   * `scanAvailable` idiom exactly rather than inventing a new one.
   */
  crawlerAvailable: boolean
  /** The current 30-day crawler window. Absent whenever crawlerAvailable is false. */
  crawler?: CrawlerWindow
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
  /**
   * Skipped entirely when no scan snapshot exists, the same way
   * needsComparison detectors are skipped outside provider_coverage. Unlike
   * needsComparison — which no detector sets, so that branch is dead — this is
   * exercised from day one, including on the first run before any scan.
   */
  needsScan?: boolean
  /**
   * Skipped entirely when the crawler_hits summary could not be loaded, the
   * same way needsScan detectors are skipped when scanAvailable is false.
   */
  needsCrawler?: boolean
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

const EMISSION_DATE_SUFFIX = /:\d{4}-\d{2}-\d{2}$/

/**
 * Stable finding identity: strip the trailing `:YYYY-MM-DD` window from
 * emission_key and prefix `{detector}:` only when the remainder does not
 * already start with it. Matches existing finding_state rows exactly.
 */
export function findingKeyFor(detector: string, emissionKey: string): string {
  const withoutDate = emissionKey.replace(EMISSION_DATE_SUFFIX, '')
  if (withoutDate.startsWith(`${detector}:`)) {
    return withoutDate
  }
  return `${detector}:${withoutDate}`
}
