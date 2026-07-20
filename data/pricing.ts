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
  tagline: string
  description: string
  includes: string[]
  featured?: boolean
}

export type LandingPageTier = {
  slug: 'campaign-lp' | 'conversion-lp' | 'campaign-system'
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
    slug: 'essentials-care',
    name: 'Website Care',
    price: '$650/month',
    priceMin: 650,
    tagline: 'We keep it running.',
    description:
      'Hosting oversight, monitoring, and light monthly changes so your site stays fast, secure, and current.',
    includes: [
      'Hosting oversight and deployment support',
      'Uptime and broken-link monitoring',
      'Dependency and security updates',
      'Up to 2 hours per month of content or layout changes',
      'Priority email response (24–48 hr)',
      '15% preferred rate on landing pages and new work',
    ],
  },
  {
    slug: 'growth-care',
    name: 'Growth Partner',
    price: '$1,500/month',
    priceMin: 1500,
    tagline: 'We keep it growing.',
    description:
      'Everything in Website Care, plus more monthly bandwidth, a quarterly landing page, and preferred rates on campaign work.',
    featured: true,
    includes: [
      'Everything in Website Care',
      'Up to 4 hours per month of improvements or new sections',
      '1 Campaign Landing Page per quarter included',
      'Quarterly analytics and performance review',
      'Priority scheduling on new work',
      '20% preferred rate on additional landing pages',
    ],
  },
  {
    slug: 'enterprise-care',
    name: 'Campaign Partner',
    price: '$3,000/month',
    priceMin: 3000,
    tagline: 'We keep campaigns converting.',
    description:
      'Everything in Growth Partner, plus a landing page every month, messaging support, and ongoing iteration.',
    includes: [
      'Everything in Growth Partner',
      '1 custom landing page per month included (or 2 smaller campaign variants)',
      'Messaging and conversion coaching',
      'Ongoing analytics and iteration',
      'Monthly strategy review',
      '30% preferred rate on additional landing pages',
    ],
  },
]

export const landingPagePricing: LandingPageTier[] = [
  {
    slug: 'campaign-lp',
    name: 'Campaign Landing Page',
    price: 'from $3,000',
    priceMin: 3000,
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
    slug: 'conversion-lp',
    name: 'Conversion Landing Page',
    price: 'from $4,500',
    priceMin: 4500,
    tagline: 'Built for paid traffic.',
    description:
      'For a business spending on traffic or launching a meaningful new offer.',
    featured: true,
    includes: [
      'Everything in Campaign Landing Page',
      'Audience and competitor research',
      'Offer and messaging workshop',
      'Copy structure and substantial refinement',
      '8 to 12 sections',
      'Custom interactions or motion',
      'CRM, booking, or lead routing integration',
      'Behavior tracking (Microsoft Clarity or equivalent)',
      'Detailed conversion event tracking',
      '30 days of post-launch support',
    ],
  },
  {
    slug: 'campaign-system',
    name: 'Campaign System',
    price: 'from $7,500',
    priceMin: 7500,
    tagline: 'One system. Multiple variants.',
    description:
      'For businesses running multiple audiences, locations, or paid campaigns.',
    includes: [
      '1 primary landing page',
      '2 audience, location, headline, or offer variants',
      'Reusable landing page component system',
      'Testing-ready structure',
      'Advanced analytics events',
      'Up to 2 business integrations',
      'Campaign handoff documentation',
      '45 days of support',
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
const essentialsCareTier = carePricing[0]

export const pricingFAQs = {
  cost: `Project pricing starts at ${essentialsTier.price} for Essentials, ${growthTier.price} for Growth, and ${enterpriseTier.price} for Enterprise. Timelines are ${essentialsTier.timeline}, ${growthTier.timeline}, and ${enterpriseTier.timeline} respectively.`,
  retainer: `After launch, Website Care retainers start at ${essentialsCareTier.price} for ${essentialsCareTier.name}, ${carePricing[1].price} for ${carePricing[1].name}, and ${carePricing[2].price} for ${carePricing[2].name}.`,
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

export function formatCareClientPrice(priceMin: number): string {
  const discounted = Math.round(priceMin * (1 - 0.15))
  return `$${discounted.toLocaleString()}`
}
