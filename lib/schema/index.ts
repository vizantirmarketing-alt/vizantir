import type { 
  Service, 
  Post, 
  Location, 
  FAQ,
  CaseStudy,
} from '@/lib/sanity/types'
import {
  carePricing,
  landingPagePricing,
  projectPricing,
} from '@/data/pricing'

import {
  webPageId,
  howToId,
  faqId,
  pageServiceId,
  offerId,
  serviceId,
  articleId,
  pageArticleId,
  caseStudyId,
  personId,
  founderId,
  locationId,
  refOrganization,
  refWebsite,
  refWebPage,
  refPerson,
} from './ids'

const OFFER_PRICE_BY_NAME = new Map<string, number>([
  ...projectPricing.map((tier) => [tier.name, tier.priceNumeric] as const),
  ...carePricing.map((tier) => [tier.name, tier.priceMin] as const),
  ...landingPagePricing.map((tier) => [tier.name, tier.priceMin] as const),
])

function offerPriceFields(name: string) {
  const price = OFFER_PRICE_BY_NAME.get(name)
  if (price == null) return undefined

  return {
    price: price.toString(),
    priceCurrency: 'USD' as const,
  }
}

function pricedOffer(tier: {
  name: string
  price: number
  description: string
}) {
  return {
    '@type': 'Offer',
    name: tier.name,
    price: tier.price.toString(),
    priceCurrency: 'USD',
    description: tier.description,
    itemOffered: {
      '@type': 'Service',
      name: tier.name,
      description: tier.description,
    },
  }
}

type ServiceOfferTier = {
  name: string
  price: number
  description: string
}

/** Service slugs that publish a priced catalog. Other service slugs stay unpriced. */
const SERVICE_OFFERS_BY_SLUG = new Map<string, readonly ServiceOfferTier[]>([
  [
    'website-care',
    carePricing.map((tier) => ({
      name: tier.name,
      price: tier.priceMin,
      description: tier.description,
    })),
  ],
  [
    'landing-pages',
    landingPagePricing.map((tier) => ({
      name: tier.name,
      price: tier.priceMin,
      description: tier.description,
    })),
  ],
])

function serviceOffers(slug: string) {
  const tiers = SERVICE_OFFERS_BY_SLUG.get(slug)
  if (!tiers) return undefined

  return tiers.map((tier) => ({
    '@type': 'Offer' as const,
    name: tier.name,
    price: tier.price.toString(),
    priceCurrency: 'USD',
    description: tier.description,
  }))
}

// ============================================
// Helpers
// ============================================

function hasValidCoordinates(
  coords?: { lat?: number; lng?: number }
): coords is { lat: number; lng: number } {
  return coords?.lat != null && coords?.lng != null
}

// ============================================
// Graph Combiner
// ============================================

/**
 * Combines multiple schema nodes into a single @graph
 * This is the recommended way to output JSON-LD
 */
export function graphSchema(nodes: (Record<string, unknown> | null | undefined)[]) {
  const validNodes = nodes.filter((node): node is Record<string, unknown> => 
    node != null && typeof node === 'object'
  )

  // Remove individual @context from nodes
  const cleanedNodes = validNodes.map(node => {
    const { '@context': _, ...rest } = node
    return rest
  })

  return {
    '@context': 'https://schema.org',
    '@graph': cleanedNodes,
  }
}

// ============================================
// WebPage Schema
// ============================================

interface WebPageSchemaParams {
  url: string
  name: string
  description?: string
  siteUrl: string
  mainEntity?: { '@id': string }
  imageUrl?: string
  datePublished?: string
  dateModified?: string
}

export function webPageSchema({
  url,
  name,
  description,
  siteUrl,
  mainEntity,
  imageUrl,
  datePublished,
  dateModified,
}: WebPageSchemaParams) {
  return {
    '@type': 'WebPage',
    '@id': webPageId(url),
    url,
    name,
    ...(description && { description }),
    isPartOf: refWebsite(siteUrl),
    ...(mainEntity && { mainEntity }),
    ...(imageUrl && { primaryImageOfPage: { '@type': 'ImageObject', url: imageUrl } }),
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified }),
    inLanguage: 'en-US',
  }
}

// ============================================
// Breadcrumb Schema
// ============================================

interface BreadcrumbItem {
  name: string
  url: string
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

// ============================================
// FAQ Schema
// ============================================

export function faqSchema(faqs: readonly FAQ[] | undefined | null, pageUrl: string) {
  if (!faqs || faqs.length === 0) return null

  return {
    '@type': 'FAQPage',
    '@id': faqId(pageUrl),
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

// ============================================
// HowTo Schema
// ============================================

interface HowToStepInput {
  name: string
  text: string
}

interface HowToSchemaParams {
  url: string
  name: string
  description?: string
  siteUrl: string
  steps: readonly HowToStepInput[]
}

export function howToSchema({
  url,
  name,
  description,
  siteUrl,
  steps,
}: HowToSchemaParams) {
  return {
    '@type': 'HowTo',
    '@id': howToId(url),
    name,
    ...(description && { description }),
    url,
    inLanguage: 'en-US',
    isPartOf: refWebsite(siteUrl),
    mainEntityOfPage: refWebPage(url),
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  }
}

// ============================================
// ItemList Schema
// ============================================

interface ItemListItem {
  name: string
  description?: string
  url?: string
}

interface ItemListSchemaParams {
  name?: string
  items: readonly ItemListItem[]
}

export function itemListSchema({ name, items }: ItemListSchemaParams) {
  return {
    '@type': 'ItemList',
    ...(name && { name }),
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.description && { description: item.description }),
      ...(item.url && { url: item.url }),
    })),
  }
}

// ============================================
// Service Schema
// ============================================

interface OfferSchemaParams {
  pageUrl: string
  slug: string
  name: string
  price: number
  description: string
}

export function offerSchema({
  pageUrl,
  slug,
  name,
  price,
  description,
}: OfferSchemaParams) {
  return {
    '@type': 'Offer',
    '@id': offerId(pageUrl, slug),
    name,
    price: price.toString(),
    priceCurrency: 'USD',
    description,
    itemOffered: { '@id': pageServiceId(pageUrl) },
  }
}

/** Priced Offers for custom website projects (Essentials / Growth / Enterprise). */
export function projectOfferSchemas(pageUrl: string) {
  return projectPricing.map((tier) =>
    offerSchema({
      pageUrl,
      slug: tier.slug,
      name: tier.name,
      price: tier.priceNumeric,
      description: tier.description,
    }),
  )
}

interface PageServiceSchemaParams {
  url: string
  name: string
  description: string
  siteUrl: string
  serviceType?: string
  offers?: readonly { '@id': string }[]
}

/** Page-level Service for marketing URLs that are not Sanity `/services/[slug]` docs. */
export function pageServiceSchema({
  url,
  name,
  description,
  siteUrl,
  serviceType,
  offers,
}: PageServiceSchemaParams) {
  return {
    '@type': 'Service',
    '@id': pageServiceId(url),
    name,
    description,
    url,
    provider: refOrganization(siteUrl),
    areaServed: { '@type': 'Country', name: 'United States' },
    ...(serviceType && { serviceType }),
    ...(offers && offers.length > 0 && { offers }),
  }
}

export function serviceSchema(service: Service, siteUrl: string) {
  const url = `${siteUrl}/services/${service.slug}`
  const offers = serviceOffers(service.slug)

  return {
    '@type': 'Service',
    '@id': serviceId(siteUrl, service.slug),
    name: service.title,
    description: service.description,
    url,
    provider: refOrganization(siteUrl),
    areaServed: { '@type': 'Country', name: 'United States' },
    ...(offers && { offers }),
    ...(service.offerings && service.offerings.length > 0 && {
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: `${service.title} Offerings`,
        itemListElement: service.offerings.map((offering, i) => ({
          '@type': 'Offer',
          '@id': `${url}#offer-${i}`,
          name: offering.name,
          description: offering.description,
          ...offerPriceFields(offering.name),
        })),
      },
    }),
  }
}

export function servicesOfferCatalogSchema(siteUrl: string) {
  const url = `${siteUrl}/services`

  return {
    '@type': 'Service',
    '@id': `${url}#pricing`,
    name: 'Website Design Services',
    url,
    provider: refOrganization(siteUrl),
    areaServed: { '@type': 'Country', name: 'United States' },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Website Design Pricing',
      itemListElement: [
        ...projectPricing.map((tier) =>
          pricedOffer({
            name: tier.name,
            price: tier.priceNumeric,
            description: tier.description,
          }),
        ),
        ...carePricing.map((tier) =>
          pricedOffer({
            name: tier.name,
            price: tier.priceMin,
            description: tier.description,
          }),
        ),
        ...landingPagePricing.map((tier) =>
          pricedOffer({
            name: tier.name,
            price: tier.priceMin,
            description: tier.description,
          }),
        ),
      ],
    },
  }
}

// ============================================
// BlogPosting Schema
// ============================================

const FOUNDER_AUTHOR_SLUG = 'james-tram'

export function blogPostSchema(post: Post, siteUrl: string) {
  const url = `${siteUrl}/blog/${post.slug}`
  const authorSlug = post.author?.slug

  return {
    '@type': 'BlogPosting',
    '@id': articleId(siteUrl, post.slug),
    headline: post.title,
    description: post.excerpt,
    url,
    inLanguage: 'en-US',
    datePublished: post.publishedAt,
    dateModified: post._updatedAt,
    
    isPartOf: refWebsite(siteUrl),
    mainEntityOfPage: refWebPage(url),

    ...(post.ogImageUrl && {
      image: { '@type': 'ImageObject', url: post.ogImageUrl },
    }),

    // Author with canonical @id reference
    ...(post.author && {
      author: authorSlug === FOUNDER_AUTHOR_SLUG
        ? {
            '@type': 'Person',
            '@id': founderId(siteUrl),
            name: post.author.name,
            url: `${siteUrl}/about`,
          }
        : authorSlug
          ? {
              '@type': 'Person',
              '@id': personId(siteUrl, authorSlug),
              name: post.author.name,
              url: `${siteUrl}/about/${authorSlug}`,
            }
          : {
              '@type': 'Person',
              name: post.author.name,
            },
    }),

    publisher: refOrganization(siteUrl),
  }
}

// ============================================
// Article Schema (standalone pages, not blog posts)
// ============================================

interface ArticleAboutProperty {
  name: string
  value: string
}

interface ArticleSchemaParams {
  url: string
  headline: string
  description?: string
  siteUrl: string
  datePublished?: string
  dateModified?: string
  about?: readonly ArticleAboutProperty[]
}

export function articleSchema({
  url,
  headline,
  description,
  siteUrl,
  datePublished,
  dateModified,
  about,
}: ArticleSchemaParams) {
  return {
    '@type': 'Article',
    '@id': pageArticleId(url),
    headline,
    ...(description && { description }),
    url,
    inLanguage: 'en-US',
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified }),
    isPartOf: refWebsite(siteUrl),
    mainEntityOfPage: refWebPage(url),
    author: {
      '@type': 'Person',
      '@id': founderId(siteUrl),
    },
    publisher: refOrganization(siteUrl),
    ...(about && about.length > 0 && {
      about: about.map((item) => ({
        '@type': 'PropertyValue',
        name: item.name,
        value: item.value,
      })),
    }),
  }
}

// ============================================
// Location Schema
// ============================================

export function locationSchema(location: Location, siteUrl: string) {
  const url = `${siteUrl}/locations/${location.slug}`
  const id = locationId(siteUrl, location.slug, location.hasPhysicalPresence)

  // Physical location — distinct LocalBusiness for this /locations/[slug] URL; site-wide Organization/LocalBusiness is in app/layout.tsx
  if (location.hasPhysicalPresence && location.address?.street) {
    return {
      '@type': 'LocalBusiness',
      '@id': id,
      name: location.name,
      description: location.description,
      url,
      parentOrganization: refOrganization(siteUrl),
      address: {
        '@type': 'PostalAddress',
        streetAddress: location.address.street,
        addressLocality: location.address.city,
        addressRegion: location.address.state,
        postalCode: location.address.zip,
        addressCountry: 'US',
      },
      ...(hasValidCoordinates(location.coordinates) && {
        geo: {
          '@type': 'GeoCoordinates',
          latitude: location.coordinates.lat,
          longitude: location.coordinates.lng,
        },
      }),
      ...(location.serviceAreas && location.serviceAreas.length > 0 && {
        areaServed: location.serviceAreas.map((area) => ({
          '@type': 'City',
          name: area,
        })),
      }),
    }
  }

  // Remote/service area (no physical presence)
  return {
    '@type': 'Service',
    '@id': id,
    name: `Services in ${location.city}`,
    description: location.description,
    url,
    provider: refOrganization(siteUrl),
    areaServed: {
      '@type': 'City',
      name: location.city,
    },
  }
}

// ============================================
// CollectionPage Schema (for index pages)
// ============================================

interface CollectionPageParams {
  url: string
  name: string
  description?: string
  siteUrl: string
  items: { name: string; url: string }[]
}

export function collectionPageSchema({
  url,
  name,
  description,
  siteUrl,
  items,
}: CollectionPageParams) {
  return {
    '@type': 'CollectionPage',
    '@id': webPageId(url),
    url,
    name,
    ...(description && { description }),
    isPartOf: refWebsite(siteUrl),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        url: item.url,
      })),
    },
    inLanguage: 'en-US',
  }
}

// ============================================
// Person Schema
// ============================================

interface PersonSchemaParams {
  siteUrl: string
  name: string
  jobTitle: string
  description: string
  sameAs?: string[]
  imageUrl?: string
}

export function personSchema({
  siteUrl,
  name,
  jobTitle,
  description,
  sameAs,
  imageUrl,
}: PersonSchemaParams) {
  return {
    '@type': 'Person',
    '@id': founderId(siteUrl),
    name,
    jobTitle,
    description,
    url: `${siteUrl}/about`,
    worksFor: refOrganization(siteUrl),
    ...(sameAs && sameAs.length > 0 && { sameAs }),
    ...(imageUrl && { image: { '@type': 'ImageObject', url: imageUrl } }),
  }
}

// ============================================
// Case Study Schema
// ============================================

export function caseStudySchema(caseStudy: CaseStudy, siteUrl: string) {
  const url = `${siteUrl}/case-studies/${caseStudy.slug}`

  return {
    '@type': 'CreativeWork',
    '@id': caseStudyId(siteUrl, caseStudy.slug),
    name: caseStudy.title,
    ...(caseStudy.summary && { description: caseStudy.summary }),
    url,
    inLanguage: 'en-US',
    dateModified: caseStudy._updatedAt,
    isPartOf: refWebsite(siteUrl),
    mainEntityOfPage: refWebPage(url),
    creator: {
      '@type': 'Person',
      '@id': founderId(siteUrl),
      name: 'James Tram',
      url: `${siteUrl}/about`,
    },
    publisher: refOrganization(siteUrl),
    ...(caseStudy.heroImage?.asset?.url && {
      image: { '@type': 'ImageObject', url: caseStudy.heroImage.asset.url },
    }),
    ...(caseStudy.client && {
      about: {
        '@type': 'Organization',
        name: caseStudy.client,
        ...(caseStudy.siteUrl && { url: caseStudy.siteUrl }),
      },
    }),
    ...(caseStudy.stack && caseStudy.stack.length > 0 && {
      keywords: caseStudy.stack.join(', '),
    }),
  }
}

