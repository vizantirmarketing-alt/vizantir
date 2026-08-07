import type { 
  Service, 
  Post, 
  Location, 
  FAQ,
  CaseStudy,
} from '@/lib/sanity/types'

import {
  websiteId,
  webPageId,
  serviceId,
  articleId,
  caseStudyId,
  personId,
  founderId,
  locationId,
  refOrganization,
  refWebsite,
  refWebPage,
  refPerson,
} from './ids'

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

export function faqSchema(faqs: FAQ[] | undefined | null) {
  if (!faqs || faqs.length === 0) return null

  return {
    '@type': 'FAQPage',
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
// Service Schema
// ============================================

export function serviceSchema(service: Service, siteUrl: string) {
  const url = `${siteUrl}/services/${service.slug}`

  return {
    '@type': 'Service',
    '@id': serviceId(siteUrl, service.slug),
    name: service.title,
    description: service.description,
    url,
    provider: refOrganization(siteUrl),
    areaServed: { '@type': 'Country', name: 'United States' },
    ...(service.offerings && service.offerings.length > 0 && {
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: `${service.title} Offerings`,
        itemListElement: service.offerings.map((offering, i) => ({
          '@type': 'Offer',
          '@id': `${url}#offer-${i}`,
          name: offering.name,
          description: offering.description,
        })),
      },
    }),
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

