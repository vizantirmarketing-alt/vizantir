import {
  blogClustersBySlug,
  getBlogCluster,
  getBlogClusterFromCategory,
} from './blog-clusters'

export const BLOG_COMMERCIAL_LINKS = {
  'wordpress-platform': '/nextjs-vs-wordpress',
  'wordpress-security': '/nextjs-vs-wordpress',
  'website-cost': '/services',
  performance: '/services/web-development',
  hospitality: '/hospitality-web-design',
  'law-firm': '/law-firm-web-design',
  cre: '/commercial-real-estate-web-design',
  'vendor-selection': '/are-we-a-fit',
  engineering: '/services/web-development',
  studio: '/services',
  seo: '/services',
  'web-development': '/services/web-development',
  default: '/services',
} as const

export type BlogCommercialDestination =
  (typeof BLOG_COMMERCIAL_LINKS)[keyof typeof BLOG_COMMERCIAL_LINKS]

/**
 * Anchor text describes the destination. Most strings match the page H1
 * when that H1 names the subject. /are-we-a-fit uses the visible subhead
 * on AreWeAFitPageClient because its H1 is a voice line.
 */
export const BLOG_COMMERCIAL_ANCHORS: Record<BlogCommercialDestination, string> = {
  '/nextjs-vs-wordpress': 'Should I Use Next.js or WordPress?',
  '/services': 'Strategy-led websites for established businesses',
  '/services/web-development': 'Web Development Built to Last',
  '/hospitality-web-design': 'Hospitality Web Design That Fills Tables',
  '/law-firm-web-design': 'Law Firm Web Design That Builds Trust',
  '/commercial-real-estate-web-design': 'Commercial Real Estate Web Design That Converts',
  '/are-we-a-fit': 'Honest criteria to decide before you book a Strategy Call',
}

export type ArticleCtaTarget = {
  href: BlogCommercialDestination
  label: string
}

export function resolveArticleCta(
  slug: string,
  category?: string,
): ArticleCtaTarget {
  if (process.env.NODE_ENV === 'development' && !(slug in blogClustersBySlug)) {
    console.warn(`[blog-clusters] Blog slug "${slug}" is absent from data/blog-clusters.ts`)
  }

  const cluster = getBlogCluster(slug) ?? getBlogClusterFromCategory(category)
  const href = cluster ? BLOG_COMMERCIAL_LINKS[cluster] : BLOG_COMMERCIAL_LINKS.default
  return { href, label: BLOG_COMMERCIAL_ANCHORS[href] }
}
