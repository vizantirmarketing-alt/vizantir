import { blogCategories } from '@/lib/blog-categories'

export const BLOG_CLUSTERS = [
  'wordpress-platform',
  'website-cost',
  'wordpress-security',
  'performance',
  'hospitality',
  'law-firm',
  'cre',
  'vendor-selection',
  'engineering',
  'studio',
  'seo',
  'web-development',
] as const

export type BlogCluster = (typeof BLOG_CLUSTERS)[number]

type BlogCategory = (typeof blogCategories)[number]

/**
 * Sanity `category` → cluster for slugs that are not in `blogClustersBySlug`.
 * Keys are the live Studio values from `lib/blog-categories.ts` / the post
 * schema list. Mapping follows how published posts in each category already
 * resolve in `blogClustersBySlug` (majority, or the single occupant).
 *
 * Strategy is a mixed bucket in Studio (verticals, cost, vendor, studio).
 * New Strategy posts get the studio cluster rather than hospitality, which
 * is the plurality only because of the current vertical set.
 *
 * SEO does not use performance: that cluster's commercial URL is
 * /services/web-development, which is not an SEO subject. New SEO posts
 * use the seo cluster (/services). Technology does not use
 * wordpress-platform: that cluster's URL is /nextjs-vs-wordpress, and the
 * category includes Next.js vs React material. New Technology posts use
 * the web-development cluster.
 */
export const blogClustersByCategory: Record<BlogCategory, BlogCluster> = {
  Platform: 'wordpress-platform',
  Cost: 'website-cost',
  Performance: 'performance',
  Security: 'wordpress-security',
  SEO: 'seo',
  Hosting: 'wordpress-platform',
  Business: 'website-cost',
  Technology: 'web-development',
  Comparison: 'wordpress-platform',
  Philosophy: 'studio',
  Strategy: 'studio',
}

/**
 * Explicit slug → cluster map for all 49 published posts in SEO-RECON §5.
 * Used to pick the in-article commercial CTA. Related posts resolve by
 * Sanity `category` via GROQ, not from this map.
 */
export const blogClustersBySlug: Record<string, BlogCluster> = {
  'billion-dollar-companies-use-nextjs': 'wordpress-platform',
  'do-i-need-a-custom-website': 'wordpress-platform',
  'do-you-need-yoast-seo': 'wordpress-platform',
  'is-wordpress-still-relevant-2026': 'wordpress-platform',
  'nextjs-vs-react-business-website': 'wordpress-platform',
  'squarespace-vs-custom-website': 'wordpress-platform',
  'the-page-builder-stack-your-wordpress-agency-didnt-explain': 'wordpress-platform',
  'vercel-vs-wp-engine': 'wordpress-platform',
  'webflow-vs-nextjs': 'wordpress-platform',
  'website-builders-vs-custom-development': 'wordpress-platform',
  'when-wix-makes-sense-and-when-youve-outgrown-it': 'wordpress-platform',
  'why-most-agencies-still-use-wordpress': 'wordpress-platform',

  'hidden-wordpress-costs-agencies-dont-tell-you': 'website-cost',
  'how-much-does-a-website-cost-las-vegas': 'website-cost',
  'how-much-does-website-cost-2026': 'website-cost',
  'how-much-does-website-maintenance-cost-2026': 'website-cost',
  'launch-website-weekend-what-it-costs': 'website-cost',
  'the-elementor-renewal-charge-that-wasnt-supposed-to-happen': 'website-cost',
  'true-cost-of-wordpress-website': 'website-cost',
  'what-is-a-website-care-plan': 'website-cost',
  'what-youre-paying-for-30k-website': 'website-cost',
  'why-15000-website-cheaper-than-5000': 'website-cost',
  'wordpress-vs-nextjs-3-year-cost-comparison': 'website-cost',

  'is-wordpress-secure': 'wordpress-security',
  'real-cost-wordpress-security-breach': 'wordpress-security',
  'why-wordpress-gets-hacked': 'wordpress-security',

  'faster-website-makes-you-more-money': 'performance',
  'how-to-speed-up-wordpress': 'performance',
  'nextjs-seo-guide': 'performance',
  'website-speed-matters-business': 'performance',
  'why-wordpress-site-slow': 'performance',

  'hospitality-website-design-las-vegas': 'hospitality',
  'how-to-get-more-bookings-restaurant-website': 'hospitality',
  'las-vegas-hospitality-website-speed': 'hospitality',
  'luxury-salon-spa-website-design': 'hospitality',
  'what-should-a-hotel-website-include': 'hospitality',

  'law-firm-website-design-las-vegas': 'law-firm',

  'commercial-real-estate-website-design': 'cre',

  'how-to-choose-web-design-agency-las-vegas': 'vendor-selection',
  'questions-to-ask-before-hiring-web-designer': 'vendor-selection',
  'what-a-vizantir-engagement-discloses-that-a-wordpress-agency-engagement-usually-doesnt':
    'vendor-selection',

  'two-searches-one-key': 'engineering',
  'what-website-monitoring-actually-catches': 'engineering',
  'why-your-website-needs-to-work-in-every-direction': 'engineering',
  'your-analytics-can-fail-silently': 'engineering',

  'how-las-vegas-businesses-rank-higher-google': 'studio',
  'why-we-dont-build-wordpress-sites': 'studio',
  'why-your-competitors-website-looks-better': 'studio',
  'why-your-website-looks-fine-but-isnt-working': 'studio',
}

export function getBlogCluster(slug: string): BlogCluster | undefined {
  return blogClustersBySlug[slug]
}

export function getBlogClusterFromCategory(category?: string): BlogCluster | undefined {
  if (!category) return undefined
  if (category in blogClustersByCategory) {
    return blogClustersByCategory[category as BlogCategory]
  }
  return undefined
}
