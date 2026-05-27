export type PricingTier = {
  slug: 'essentials' | 'growth' | 'enterprise'
  name: string
  price: string
  priceNumeric: number
  timeline: string
  description: string
  includes: string[]
  featured: boolean
}

export type CareTier = {
  slug: 'essentials-care' | 'growth-care' | 'enterprise-care'
  name: string
  price: string
  priceMin: number
  description: string
}

export const projectPricing: PricingTier[] = [
  {
    slug: 'essentials',
    name: 'Essentials',
    price: '$15,000',
    priceNumeric: 15000,
    timeline: '6–8 weeks',
    description:
      'For a focused rebuild: core pages, contact flow, and CMS for a team that needs a credible presence fast.',
    includes: [
      'Up to 8 custom pages',
      'Mobile-first responsive design',
      'Sanity CMS with editor training',
      'Contact forms and basic analytics',
      'Technical SEO setup',
      '1 SEO-optimized landing page (location or service)',
      'Core Web Vitals optimization',
      '30 days post-launch support',
    ],
    featured: false,
  },
  {
    slug: 'growth',
    name: 'Growth',
    price: '$30,000',
    priceNumeric: 30000,
    timeline: '8–12 weeks',
    description:
      'For growing companies with richer content: service lines, case studies, blog, and integrations that support lead flow.',
    includes: [
      'Up to 20 custom pages',
      'Blog or resources section',
      'Advanced animations and interactions',
      'Third-party integrations (CRM, booking, etc.)',
      'Extended discovery and content strategy',
      'Up to 3 SEO-optimized landing pages',
      'Custom case study template + 2 case studies built',
      'AEO/GEO optimization for AI search visibility',
      'Google Business Profile optimization',
      '60 days post-launch support',
    ],
    featured: true,
  },
  {
    slug: 'enterprise',
    name: 'Enterprise',
    price: '$60,000+',
    priceNumeric: 60000,
    timeline: '12–16+ weeks',
    description:
      'For complex builds: multi-location brands, custom data displays, member portals, or applications beyond a marketing site.',
    includes: [
      'Unlimited pages within agreed scope',
      'Custom functionality and API work',
      'Multi-language or multi-location architecture',
      'Dedicated project timeline and staging environments',
      'Post-launch optimization sprint',
      'Unlimited SEO-optimized landing pages',
      'Custom integrations beyond standard CRMs',
      'Performance monitoring dashboard',
      'A/B testing infrastructure',
      '90 days post-launch support',
    ],
    featured: false,
  },
]

export const carePricing: CareTier[] = [
  {
    slug: 'essentials-care',
    name: 'Essentials Care',
    price: '$500/month',
    priceMin: 500,
    description:
      'Core maintenance: updates, backups, monitoring, and prioritized fixes so your site stays reliable.',
  },
  {
    slug: 'growth-care',
    name: 'Growth Care',
    price: '$1,500/month',
    priceMin: 1500,
    description:
      'More bandwidth for content changes, performance tuning, and proactive improvements.',
  },
  {
    slug: 'enterprise-care',
    name: 'Enterprise Care',
    price: '$2,500/month',
    priceMin: 2500,
    description:
      'Hands-on support for larger sites: faster turnaround, deeper technical work, and ongoing optimization.',
  },
]

const essentialsTier = projectPricing[0]
const growthTier = projectPricing[1]
const enterpriseTier = projectPricing[2]
const essentialsCareTier = carePricing[0]

export const pricingFAQs = {
  cost: `Project pricing starts at ${essentialsTier.price} for Essentials, ${growthTier.price} for Growth, and ${enterpriseTier.price} for Enterprise. Timelines are ${essentialsTier.timeline}, ${growthTier.timeline}, and ${enterpriseTier.timeline} respectively.`,
  retainer: `After launch, Website Care retainers start at ${essentialsCareTier.price} for Essentials Care, ${carePricing[1].price} for Growth Care, and ${carePricing[2].price} for Enterprise Care.`,
  timeline: `${essentialsTier.name} projects take ${essentialsTier.timeline} from kickoff. ${growthTier.name} projects run ${growthTier.timeline}. ${enterpriseTier.name} builds can stretch ${enterpriseTier.timeline} depending on scope.`,
  budgetPositioning: `Projects start at ${essentialsTier.price} and scale to ${enterpriseTier.price} depending on scope. If budget is your primary concern, platforms like Squarespace, Webflow, and Wix will serve you well. Vizantir is for businesses where a mediocre website costs more than a great one.`,
} as const

/** Industry landing pages — pass vertical label and scope detail for the second sentence. */
export function industryProjectCostAnswer(
  verticalLabel: string,
  scopeNote: string,
  startingPrice: string = essentialsTier.price,
): string {
  return `Custom ${verticalLabel} websites at Vizantir start at ${startingPrice}. ${scopeNote}`
}

/** @param launchQualifier Suffix after "launch" (include leading space or comma), e.g. " depending on scope." */
export function industryProjectTimelineAnswer(
  projectsPhrase: string,
  launchQualifier: string,
  timeline: string = essentialsTier.timeline,
): string {
  return `Most ${projectsPhrase} take ${timeline} from kickoff to launch${launchQualifier}`
}

export const CONTACT_BUDGET_FROM_PRICING = [
  `${essentialsTier.price} – ${growthTier.price}`,
  `${growthTier.price} – ${enterpriseTier.price}`,
  `${enterpriseTier.price}`,
  'Not Sure Yet',
] as const

export function getProjectTier(slug: PricingTier['slug']): PricingTier {
  const tier = projectPricing.find((t) => t.slug === slug)
  if (!tier) {
    throw new Error(`Unknown project tier slug: ${slug}`)
  }
  return tier
}

export function getCareTier(slug: CareTier['slug']): CareTier {
  const tier = carePricing.find((t) => t.slug === slug)
  if (!tier) {
    throw new Error(`Unknown care tier slug: ${slug}`)
  }
  return tier
}
