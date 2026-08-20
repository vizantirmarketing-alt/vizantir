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
  /**
   * Care-client preferred rate on landing pages and campaign work.
   * Commercial policy remains; not surfaced on /services care cards.
   */
  preferredRate: string
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
  slug: 'blog-single' | 'blog-ongoing' | 'blog-program'
  name: string
  price: string
  priceMin: number
  cadence: string
  postsPerMonth: number
  tagline: string
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
      'A complete custom website for a focused presence: core pages, a clear contact path, CMS, and the technical foundation the business needs to operate online.',
    includes: [
      'Up to 8 custom pages',
      'Mobile-first responsive design',
      'Sanity CMS with editor training',
      'Contact forms and basic analytics',
      'Technical SEO setup',
      '1 SEO-optimized location or service page',
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
      'The recommended engagement for established companies: service lines, richer content, conversion paths, and the integrations that support how leads actually move.',
    includes: [
      'Up to 20 custom pages',
      'Blog or resources section',
      'Advanced animations and interactions',
      'Third-party integrations (CRM, booking, etc.)',
      'Extended discovery and content strategy',
      'Up to 3 SEO-optimized location or service pages',
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
      'Custom systems, integrations, and larger organizational requirements — multi-location architecture, member tools, and applications beyond a marketing site.',
    includes: [
      'Unlimited pages within agreed scope',
      'Custom functionality and API work',
      'Multi-language or multi-location architecture',
      'Dedicated project timeline and staging environments',
      'Post-launch optimization sprint',
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
    tagline: 'Steady technical upkeep.',
    description:
      'Content changes, performance monitoring, and technical upkeep for a site that is live and needs to stay sharp.',
    preferredRate: '10% preferred rate on all landing pages and campaign work',
    includes: [
      'Hosting oversight and deployment support',
      'Uptime and broken-link monitoring',
      'Performance monitoring',
      'Up to 1 hour per month of content changes',
      'Email response within 2 business days',
      'Quarterly website health review covering performance, Core Web Vitals, broken links, form functionality, indexing health, analytics health, and technical issues needing attention',
    ],
  },
  {
    slug: 'website-care',
    name: 'Website Care',
    price: '$650/month',
    priceMin: 650,
    tagline: 'The usual ongoing relationship.',
    description:
      'Everything in Essential Care, plus more room for content, conversion, and search improvements each month.',
    featured: true,
    preferredRate: '15% preferred rate on all landing pages and campaign work',
    includes: [
      'Everything in Essential Care',
      'Up to 2 hours per month of content, layout, or conversion work',
      'Performance, analytics, and Core Web Vitals review',
      'Search visibility and technical upkeep',
      'Priority email response (24–48 hr)',
      'Monthly performance and opportunity summary — Vizantir reviews what is happening with the site and identifies practical improvements across performance, search visibility, content and conversion opportunities, UX issues, technical improvements, and pages needing attention',
    ],
  },
  {
    slug: 'growth-partner',
    name: 'Growth Partner',
    price: '$1,500/month',
    priceMin: 1500,
    tagline: 'Ongoing improvement at a larger scale.',
    description:
      'Everything in Website Care, plus more monthly capacity for new functionality, conversion work, and strategic support.',
    preferredRate: '20% preferred rate on all landing pages and campaign work',
    includes: [
      'Everything in Website Care',
      'Up to 4 hours per month of improvements, new sections, or new functionality',
      'Conversion and UX optimization',
      'Advanced analytics and performance review',
      'Search visibility, structured data, and technical optimization',
      'Strategic support and priority scheduling',
      'Quarterly website roadmap and strategy session covering what to improve next, which pages underperform, where users drop off, search opportunities, new functionality worth building, and what to test next quarter',
    ],
  },
]

export const landingPagePricing: LandingPageTier[] = [
  {
    slug: 'campaign-landing-page',
    name: 'Campaign Landing Page',
    price: 'from $3,500',
    priceMin: 3500,
    tagline: 'One campaign. One offer. One job.',
    description:
      'A conversion page built around a specific campaign, offer, or traffic source — connected to the same website strategy, not a separate way in.',
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
    tagline: 'Built around the traffic source.',
    description:
      'For businesses spending $5,000 or more per month on paid traffic, or an offer that has to work across more than one audience — scoped conversion work, not a substitute for a full website project.',
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
    // Not publicly presented on /services — retained for internal plan logic.
    slug: 'blog-single',
    name: 'Single Assignment',
    price: '$350',
    priceMin: 350,
    cadence: 'one-time',
    postsPerMonth: 0,
    tagline: 'One piece of search or content work, published into the site.',
    includes: [
      'Search opportunity research for the topic',
      'Service, location, or editorial page as the brief requires',
      'Internal linking and structured data',
      'Published directly into the site',
      'One revision round',
    ],
  },
  {
    slug: 'blog-ongoing',
    name: 'Ongoing',
    price: '$650/month',
    priceMin: 650,
    cadence: 'per month',
    postsPerMonth: 2,
    tagline: 'Ongoing search, structure, and publishing.',
    includes: [
      'Search opportunity research and topic strategy',
      'Service page expansion and location content where it applies',
      'Editorial content published into the site',
      'Internal linking and structured data',
      'Content updates and search visibility, including AI search visibility',
      'Monthly strategy and performance summary',
    ],
  },
  {
    slug: 'blog-program',
    name: 'Program',
    price: '$1,200/month',
    priceMin: 1200,
    cadence: 'per month',
    postsPerMonth: 4,
    tagline: 'A fuller search and content program.',
    includes: [
      'Search opportunity research and topic strategy',
      'Service page expansion and location content where it applies',
      'Editorial content published into the site',
      'Internal linking and structured data',
      'Content updates and search visibility, including AI search visibility',
      'Monthly strategy and performance summary',
    ],
  },
]

/** Recurring Search & Content Growth plans presented on /services. `blog-single` is retained in `blogPricing` for internal plan logic. */
export const publicBlogPricing = blogPricing.filter((tier) => tier.slug !== 'blog-single')

export type ChatbotTier = {
  slug: 'chatbot-starter' | 'chatbot-standard' | 'chatbot-scale'
  name: string
  priceMin: number       // 150 — used to compute display + discount
  conversations: string
  tagline: string
  includes: string[]
}

export const CHATBOT_SETUP_FEE = {
  amount: 500,
  display: '$500',
  description: 'One-time setup: integrate the assistant into the existing site, connect approved business data, and tune conversation flows.',
} as const

export const chatbotSharedIncludes = [
  'Website knowledge assistant trained on approved business data',
  'Customer questions, lead qualification, and guided service discovery',
  'Content-based answers and custom conversation flows',
  'Analytics',
] as const

export const chatbotPricing: ChatbotTier[] = [
  // Starter / Standard / Scale are not publicly presented on /services.
  // Retained for internal plan logic (usage metering and conversation allowances).
  {
    slug: 'chatbot-starter',
    name: 'Starter',
    priceMin: 150,
    conversations: 'Plan includes up to 500 conversations per month',
    tagline: 'Integrated into the existing site and its approved content.',
    includes: [
      'Approved-content integration for the current site',
      'Custom conversation flows tuned to existing pages and services',
      'CRM or workflow integration available where the project requires it',
    ],
  },
  {
    slug: 'chatbot-standard',
    name: 'Standard',
    priceMin: 350,
    conversations: 'Plan includes up to 2,000 conversations per month',
    tagline: 'The same integration, sized for a busier site.',
    includes: [
      'Business-data integration sized for a busier site',
      'Custom conversation flows sized for higher traffic',
      'CRM or workflow integration available where the project requires it',
    ],
  },
  {
    slug: 'chatbot-scale',
    name: 'Scale',
    priceMin: 600,
    conversations: 'Plan includes up to 5,000 conversations per month',
    tagline: 'The same integration, sized for higher traffic and operations.',
    includes: [
      'Business-data integration sized for higher traffic and operations',
      'Custom conversation flows sized for operational use',
      'CRM or workflow integration included',
    ],
  },
]

const chatbotStarterTier = chatbotPricing.find((tier) => tier.slug === 'chatbot-starter')
if (!chatbotStarterTier) {
  throw new Error('chatbotPricing is missing chatbot-starter')
}

/** Public /services starting price for ongoing usage and management. */
export const CHATBOT_USAGE_FROM = chatbotStarterTier.priceMin

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
