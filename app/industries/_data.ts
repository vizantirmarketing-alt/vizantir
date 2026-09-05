export type IndustryVertical = {
  href: string
  title: string
  tagline: string
  description: string
}

export const PRIMARY_VERTICALS: IndustryVertical[] = [
  {
    href: '/hospitality-web-design',
    title: 'Hospitality Web Design',
    tagline: 'That Fills Tables',
    description:
      'Custom websites for restaurants, hotels, and lounges. Built on Next.js for mobile speed, bookings that convert, and a first impression that matches the venue.',
  },
  {
    href: '/law-firm-web-design',
    title: 'Law Firm Web Design',
    tagline: 'That Builds Trust',
    description:
      'Custom websites for law firms and legal practices. Built to establish credibility, generate consultations, and present your firm at the highest level.',
  },
  {
    href: '/commercial-real-estate-web-design',
    title: 'Commercial Real Estate Web Design',
    tagline: 'That Converts',
    description:
      'Custom websites for commercial real estate firms, brokerages, and property groups. Built to showcase listings, establish credibility, and generate qualified leads.',
  },
  {
    href: '/las-vegas-web-design',
    title: 'Las Vegas Web Design',
    tagline: 'Built for Las Vegas Businesses That Need to Win Local',
    description:
      'Custom Next.js web design for Las Vegas, Henderson, Summerlin, and Paradise businesses. Fixed-scope projects from $15,000. Built by a local studio, no templates.',
  },
]

export const SECONDARY_INDUSTRIES: string[] = [
  'Professional Services',
  'Beauty & Wellness',
  'Retail & Consumer Brands',
  'Home Services & Trades',
  'Financial Advisors',
  'Education & Coaching',
  'Studios & Creative Spaces',
  'Boutique Agencies',
]
