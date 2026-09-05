import { landingPagePricing } from '@/data/pricing'
import { faqSchema } from '@/lib/schema'

const SITE_URL = 'https://www.vizantir.com'
const PROVIDER = {
  '@type': 'Organization' as const,
  name: 'Vizantir',
  url: SITE_URL,
  alternateName: 'Vizantir Design Studio',
}

type FaqItem = {
  question: string
  answer: string
}

type BreadcrumbItem = {
  name: string
  path: string
}

type BuildLandingPagesSchemaArgs = {
  pageUrl: string
  serviceName: string
  serviceDescription: string
  faqs: readonly FaqItem[]
  breadcrumbs: BreadcrumbItem[]
}

export function buildLandingPagesSchema({
  pageUrl,
  serviceName,
  serviceDescription,
  faqs,
  breadcrumbs,
}: BuildLandingPagesSchemaArgs) {
  const faqNode = faqSchema(faqs, pageUrl)

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        '@id': `${pageUrl}#service`,
        name: serviceName,
        description: serviceDescription,
        provider: PROVIDER,
        areaServed: [
          { '@type': 'Country', name: 'United States' },
          { '@type': 'City', name: 'Las Vegas' },
          { '@type': 'State', name: 'Nevada' },
        ],
        offers: landingPagePricing.map((tier) => ({
          '@type': 'PriceSpecification',
          name: tier.name,
          price: tier.priceMin,
          priceCurrency: 'USD',
          description: tier.description,
        })),
      },
      ...(faqNode ? [faqNode] : []),
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: breadcrumbs.map((crumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.name,
          item: `${SITE_URL}${crumb.path === '/' ? '' : crumb.path}`,
        })),
      },
    ],
  }
}

export function LandingPagesJsonLd({ schema }: { schema: ReturnType<typeof buildLandingPagesSchema> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
