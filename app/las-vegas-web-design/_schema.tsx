import { pricingFAQs, projectPricing } from '@/data/pricing'

const essentialsProjectTier = projectPricing[0]

export interface FaqItem {
  question: string
  answer: string
}

interface PricingTierSchema {
  name: string
  price: number
  description: string
}

export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: 'How much does web design cost in Las Vegas?',
    answer: `Template sites from local freelancers often run $3,000–$8,000. Custom WordPress builds typically land between $8,000 and $20,000. Vizantir projects start at ${essentialsProjectTier.price} for a fixed-scope Next.js build. Price depends on page count, integrations, and content complexity. We quote after discovery, not before.`,
  },
  {
    question: 'Why hire a Las Vegas web design studio instead of a national agency?',
    answer:
      'Timezone alignment matters when you want same-day feedback. We can meet in person when a walkthrough helps. You also get a team that knows the local market without treating every business like a casino or a law firm. National agencies can be excellent; we compete on direct access and custom builds, not headcount.',
  },
  {
    question: 'Do you only work with Las Vegas businesses?',
    answer:
      'No. We are based in Las Vegas and serve clients across Henderson, Summerlin, Paradise, and the wider valley, but roughly half our work is with companies outside Nevada. Remote collaboration is standard for us.',
  },
  {
    question: 'What stack do you build on?',
    answer:
      'Next.js 16, React, TypeScript, and Tailwind CSS on the front end. Sanity for content management. Hosted on Vercel for speed and reliability. We chose this stack because it performs well, scales cleanly, and does not require monthly plugin maintenance.',
  },
  {
    question: 'How long does a website project take?',
    answer: `${pricingFAQs.timeline} Timelines assume you can provide content and feedback on schedule.`,
  },
  {
    question: 'Can you redesign an existing site without starting from zero?',
    answer:
      'Sometimes a refresh is enough. More often, businesses come to us because the current platform (WordPress, Wix, Squarespace) is the bottleneck. We assess during the strategy call and recommend a full rebuild only when it saves money long term.',
  },
  {
    question: 'What happens after launch?',
    answer: `You own the site and the codebase. ${pricingFAQs.retainer} if you want us handling updates, content changes, and small improvements. Many clients manage day-to-day edits themselves through Sanity and call us for larger work.`,
  },
] as const

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
      name: 'James Tram',
    },
    parentOrganization: {
      '@type': 'Organization',
      name: 'JT Holdings Corp',
    },
  }
}

export function LasVegasPageSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      buildBusinessEntity(),
      {
        '@type': 'WebPage',
        '@id': `${PAGE_URL}#webpage`,
        url: PAGE_URL,
        name: 'Las Vegas Web Design Studio — Custom Next.js Websites',
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
      {
        '@type': 'FAQPage',
        '@id': `${PAGE_URL}#faq`,
        mainEntity: FAQ_ITEMS.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
