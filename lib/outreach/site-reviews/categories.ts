/**
 * Site review statuses and observation categories. Pure, with no imports, so
 * drafting (lib/outreach/context.ts) and the rules can both read them.
 */

export const SITE_REVIEW_STATUSES = ['reviewed', 'nothing_notable', 'unreadable', 'unclear'] as const
export type SiteReviewStatus = (typeof SITE_REVIEW_STATUSES)[number]

/** What an observation may be about. The site only: never the business, its owners or its customers. */
export const SITE_REVIEW_CATEGORIES = ['structure', 'clarity', 'contact_path', 'mobile_or_speed', 'outdated_or_broken'] as const
export type SiteReviewCategory = (typeof SITE_REVIEW_CATEGORIES)[number]

export const SITE_REVIEW_CATEGORY_LABELS: Record<SiteReviewCategory, string> = {
  structure: 'Site structure and navigation',
  clarity: 'Clarity of what the business offers',
  contact_path: 'Path to contact or book',
  mobile_or_speed: 'Mobile or speed problem seen',
  outdated_or_broken: 'Outdated or broken element',
}

/** An accepted observation, as stored. */
export type StoredObservation = { category: SiteReviewCategory; text: string; pageUrl: string; excerpt: string }
