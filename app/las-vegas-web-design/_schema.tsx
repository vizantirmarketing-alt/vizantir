import { projectPricing } from '@/data/pricing'
import { lasVegasPricingFaqItems } from '@/data/industry-pricing-faqs'
import { faqSchema } from '@/lib/schema'
import { founderId } from '@/lib/schema/ids'

interface PricingTierSchema {
  name: string
  price: number
  description: string
}

export const FAQ_ITEMS = lasVegasPricingFaqItems

const PRICING_TIERS: readonly PricingTierSchema[] = [
  {
    name: projectPricing[0].name,
    price: projectPricing[0].priceNumeric,
    description: projectPricing[0].description,
  },
  {
    name: projectPricing[1].name,
    price: projectPricing[1].priceNumeric,
    description: projectPricing[1].description,
  },
  {
    name: projectPricing[2].name,
    price: projectPricing[2].priceNumeric,
    description: projectPricing[2].description,
  },
] as const

const BUSINESS_ID = 'https://www.vizantir.com/#business'
const SITE_URL = 'https://www.vizantir.com'
const PAGE_URL = 'https://www.vizantir.com/las-vegas-web-design'

const SAME_AS = [
  'https://www.linkedin.com/company/vizantir/',
  'https://www.instagram.com/vizantirdesignstudio',
] as const

function buildBusinessEntity() {
  return {
    '@type': 'ProfessionalService',
    '@id': BUSINESS_ID,
    name: 'Vizantir Design Studio',
    alternateName: 'Vizantir',
    url: SITE_URL,
    image: 'https://www.vizantir.com/og-image.png',
    telephone: '+17022890758',
    priceRange: '$$$',
    description:
      'Custom Next.js web design studio based in Las Vegas, Nevada. Fixed-scope website projects for established businesses in Southern Nevada and nationwide.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Las Vegas',
      addressRegion: 'NV',
      postalCode: '89139',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 36.0395,
      longitude: -115.2511,
    },
    areaServed: [
      { '@type': 'City', name: 'Las Vegas' },
      { '@type': 'City', name: 'Henderson' },
      { '@type': 'City', name: 'Summerlin' },
      { '@type': 'City', name: 'Paradise' },
      { '@type': 'State', name: 'Nevada' },
      { '@type': 'Country', name: 'United States' },
    ],
    sameAs: [...SAME_AS],
    founder: {
      '@type': 'Person',
      '@id': founderId(SITE_URL),
      name: 'James Tram',
    },
    parentOrganization: {
      '@type': 'Organization',
      name: 'JT Holdings Corp',
    },
  }
}

export function LasVegasPageSchema() {
  const faqNode = faqSchema(FAQ_ITEMS, PAGE_URL)
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      buildBusinessEntity(),
      {
        '@type': 'WebPage',
        '@id': `${PAGE_URL}#webpage`,
        url: PAGE_URL,
        name: 'Las Vegas Web Design Studio – Custom Next.js Websites',
        description:
          'Custom Next.js web design for Las Vegas, Henderson, Summerlin, and Paradise businesses. Fixed-scope projects from a local studio.',
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': BUSINESS_ID },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${PAGE_URL}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: SITE_URL,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Las Vegas Web Design',
            item: PAGE_URL,
          },
        ],
      },
      {
        '@type': 'Service',
        '@id': `${PAGE_URL}#service`,
        name: 'Las Vegas Web Design',
        description:
          'Custom Next.js website design and development for businesses in Las Vegas and Southern Nevada.',
        provider: { '@id': BUSINESS_ID },
        areaServed: [
          { '@type': 'City', name: 'Las Vegas' },
          { '@type': 'City', name: 'Henderson' },
          { '@type': 'City', name: 'Summerlin' },
          { '@type': 'City', name: 'Paradise' },
        ],
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Web Design Project Pricing',
          itemListElement: PRICING_TIERS.map((tier) => ({
            '@type': 'Offer',
            name: tier.name,
            price: tier.price.toString(),
            priceCurrency: 'USD',
            description: tier.description,
            itemOffered: {
              '@type': 'Service',
              name: `${tier.name} Web Design Package`,
              description: tier.description,
            },
          })),
        },
      },
      ...(faqNode ? [faqNode] : []),
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
