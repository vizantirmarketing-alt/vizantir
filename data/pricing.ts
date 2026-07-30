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
  slug: 'essential-care' | 'website-care' | 'growth-partner'
  name: string
  price: string
  priceMin: number
  tagline: string
  description: string
  includes: string[]
  featured?: boolean
}

export type LandingPageTier = {
  slug: 'campaign-landing-page' | 'conversion-system'
  name: string
  price: string
  priceMin: number
  tagline: string
  description: string
  includes: string[]
  featured?: boolean
}

export type BlogTier = {
  slug: 'blog-single' | 'blog-essentials' | 'blog-growth'
  name: string
  price: string
  priceMin: number
  cadence: string
  postsPerMonth: number
  tagline: string
  popular?: boolean
  includes: string[]
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
    slug: 'essential-care',
    name: 'Essential Care',
    price: '$295/month',
    priceMin: 295,
    tagline: 'We keep it healthy.',
    description:
      "Hosting, monitoring, and security updates for a site that's stable and doesn't change often.",
    includes: [
      'Hosting oversight and deployment support',
      'Uptime and broken-link monitoring',
      'Dependency and security updates',
      'Up to 1 hour per month of content changes',
      'Email response within 2 business days',
      '10% preferred rate on all landing pages and campaign work',
    ],
  },
  {
    slug: 'website-care',
    name: 'Website Care',
    price: '$650/month',
    priceMin: 650,
    tagline: 'We keep it running.',
    description:
      'Everything in Essential Care, plus more monthly bandwidth and faster response.',
    featured: true,
    includes: [
      'Everything in Essential Care',
      'Up to 2 hours per month of content or layout changes',
      'Performance and Core Web Vitals monitoring',
      'Priority email response (24–48 hr)',
      '15% preferred rate on all landing pages and campaign work',
    ],
  },
  {
    slug: 'growth-partner',
    name: 'Growth Partner',
    price: '$1,500/month',
    priceMin: 1500,
    tagline: 'We keep it growing.',
    description:
      'Everything in Website Care, plus more monthly bandwidth, quarterly optimization on the pages you already have, and preferred rates on campaign work.',
    includes: [
      'Everything in Website Care',
      'Up to 4 hours per month of improvements or new sections',
      'Quarterly conversion and performance pass on existing pages',
      'Quarterly analytics and performance review',
      'Technical SEO and schema maintenance',
      'Priority scheduling on new work',
      '20% preferred rate on all landing pages and campaign work',
    ],
  },
]

export const landingPagePricing: LandingPageTier[] = [
  {
    slug: 'campaign-landing-page',
    name: 'Campaign Landing Page',
    price: 'from $3,500',
    priceMin: 3500,
    tagline: 'One page. One goal.',
    description:
      'For a specific service, promotion, event, or paid campaign.',
    includes: [
      '1 focused strategy session',
      'Up to 7 primary sections',
      'Custom responsive design',
      'Custom Next.js development',
      'Client-supplied copy with light editing',
      '1 form, booking tool, or email integration',
      'Analytics and conversion event setup',
      'Metadata and technical SEO fundamentals',
      '2 consolidated revision rounds',
      '14 days of post-launch support',
    ],
  },
  {
    slug: 'conversion-system',
    name: 'Conversion System',
    price: 'from $8,000',
    priceMin: 8000,
    tagline: 'Built for paid traffic.',
    description:
      'For businesses spending $5,000 or more per month on paid traffic, or launching an offer that has to work across multiple audiences.',
    includes: [
      'Everything in Campaign Landing Page',
      'Audience and competitor research',
      'Offer and messaging workshop',
      'Copy structure and substantial refinement',
      '8 to 12 sections',
      'Reusable landing page component system',
      '2 audience, location, headline, or offer variants',
      'Testing-ready structure',
      'Custom interactions or motion',
      'CRM, booking, or lead routing integration',
      'Behavior tracking and detailed conversion event tracking',
      'Campaign handoff documentation',
      '45 days of post-launch support',
    ],
  },
]

export const blogPricing: BlogTier[] = [
  {
    slug: 'blog-single',
    name: 'Single Post',
    price: '$350',
    priceMin: 350,
    cadence: 'one-time',
    postsPerMonth: 0,
    tagline: 'Test the waters.',
    includes: [
      'One original, human-written post (1,500+ words)',
      'Topic & keyword research',
      'SEO optimization (meta title, description, headings)',
      'Internal links to your key pages',
      'Custom featured image',
      'Published directly into your blog',
      '1 round of revisions',
    ],
  },
  {
    slug: 'blog-essentials',
    name: 'Essentials',
    price: '$650/month',
    priceMin: 650,
    cadence: 'per month',
    postsPerMonth: 2,
    tagline: 'A steady content presence.',
    popular: true,
    includes: [
      '2 original, human-written posts per month (1,500+ words each)',
      'Topic & keyword strategy',
      'SEO optimization on every post',
      'Internal links to your key pages',
      'Custom featured image per post',
      'Published directly into your blog',
      '1 round of revisions per post',
      'Monthly content summary',
    ],
  },
  {
    slug: 'blog-growth',
    name: 'Growth',
    price: '$1,200/month',
    priceMin: 1200,
    cadence: 'per month',
    postsPerMonth: 4,
    tagline: 'A real content engine.',
    includes: [
      '4 original, human-written posts per month (1,500+ words each)',
      'Topic & keyword strategy',
      'SEO optimization on every post',
      'Internal links to your key pages',
      'Custom featured image per post',
      'Published directly into your blog',
      '1 round of revisions per post',
      'Monthly content & performance summary',
    ],
  },
]

export type ChatbotTier = {
  slug: 'chatbot-starter' | 'chatbot-growth' | 'chatbot-scale'
  name: string
  priceMin: number       // 150 — used to compute display + discount
  conversations: string
  tagline: string
  popular?: boolean
}

export const CHATBOT_SETUP_FEE = {
  amount: 500,
  display: '$500',
  description: 'One-time setup: deployment, training on your content, and brand-voice tuning.',
} as const

export const chatbotPricing: ChatbotTier[] = [
  {
    slug: 'chatbot-starter',
    name: 'Starter',
    priceMin: 150,
    conversations: 'Up to 500 conversations per month',
    tagline: 'For low-volume sites that want a smart front door.',
  },
  {
    slug: 'chatbot-growth',
    name: 'Growth',
    priceMin: 350,
    conversations: 'Up to 2,000 conversations per month',
    tagline: 'A real customer-facing channel that handles repeat questions.',
    popular: true,
  },
  {
    slug: 'chatbot-scale',
    name: 'Scale',
    priceMin: 600,
    conversations: 'Up to 5,000 conversations per month',
    tagline: 'High-traffic sites where the bot earns its keep daily.',
  },
]

const essentialsTier = projectPricing[0]
const growthTier = projectPricing[1]
const enterpriseTier = projectPricing[2]
const essentialCareTier = carePricing[0]
const websiteCareTier = carePricing[1]
const growthCareTier = carePricing[2]

export const pricingFAQs = {
  cost: `Project pricing starts at ${essentialsTier.price} for Essentials, ${growthTier.price} for Growth, and ${enterpriseTier.price} for Enterprise. Timelines are ${essentialsTier.timeline}, ${growthTier.timeline}, and ${enterpriseTier.timeline} respectively.`,
  retainer: `After launch, care retainers start at ${essentialCareTier.price} for ${essentialCareTier.name}, ${websiteCareTier.price} for ${websiteCareTier.name}, and ${growthCareTier.price} for ${growthCareTier.name}.`,
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

export const CONTACT_BUDGET_FROM_LANDING_PAGES = [
  '$3,500 – $8,000',
  '$8,000 – $15,000',
  '$15,000+',
  'Not Sure Yet',
] as const

const campaignLandingPageTier = landingPagePricing.find(
  (tier) => tier.slug === 'campaign-landing-page',
)
if (!campaignLandingPageTier) {
  throw new Error('landingPagePricing is missing campaign-landing-page')
}

/** 50% of Campaign Landing Page list — Vizantir-built sites only. Does not stack with care preferred rates. */
export const EXISTING_SITE_PAGE_RATE = campaignLandingPageTier.priceMin * 0.5
export const EXISTING_SITE_PAGE_RATE_DISPLAY = `$${EXISTING_SITE_PAGE_RATE.toLocaleString('en-US')}`

export function formatCareClientPrice(priceMin: number): string {
  const discounted = Math.round(priceMin * (1 - 0.15))
  return `$${discounted.toLocaleString()}`
}
