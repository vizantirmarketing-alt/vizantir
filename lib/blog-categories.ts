export const blogCategories = [
  'Platform',
  'Cost',
  'Performance',
  'Security',
  'SEO',
  'Hosting',
  'Business',
  'Technology',
  'Comparison',
  'Philosophy',
  'Strategy',
] as const

export type BlogCategory = typeof blogCategories[number]
