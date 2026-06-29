export type Industry = {
  slug: string
  name: string
  keyword: string
  tagline: string
  description: string
}

export const INDUSTRIES: Industry[] = [
  {
    slug: 'hospitality-web-design',
    name: 'Hospitality',
    keyword: 'Hospitality Web Design',
    tagline: 'Restaurants, hotels, and venues where presentation drives bookings.',
    description:
      'Vizantir designs and builds custom websites for hospitality brands — restaurants, hotels, lounges, event venues — where the first impression on mobile decides whether the visitor books or scrolls past.',
  },
  {
    slug: 'law-firm-web-design',
    name: 'Law Firms',
    keyword: 'Law Firm Web Design',
    tagline: 'A practice site that earns trust before the consultation call.',
    description:
      'Vizantir builds custom websites for law firms — boutique practices and established firms — where the site needs to convey authority, specialization, and trust before a prospective client picks up the phone.',
  },
  {
    slug: 'commercial-real-estate-web-design',
    name: 'Commercial Real Estate',
    keyword: 'Commercial Real Estate Web Design',
    tagline: 'Property presentation that drives tenants and investors.',
    description:
      'Vizantir designs custom websites for commercial real estate operators — property developers, brokerages, and portfolio firms — where the site has to communicate scale, quality, and pipeline to tenants and investors.',
  },
]
