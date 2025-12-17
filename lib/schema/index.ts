import type { 
  SiteSettings, 
  Service, 
  Post, 
  Author, 
  Location, 
  Category,
  FAQ 
} from '@/lib/sanity/types'

import {
  websiteId,
  organizationId,
  localBusinessId,
  webPageId,
  serviceId,
  articleId,
  personId,
  locationId,
  categoryId,
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
// WebSite Schema
// ============================================

export function websiteSchema(settings: SiteSettings) {
  return {
    '@type': 'WebSite',
    '@id': websiteId(settings.siteUrl),
    url: settings.siteUrl,
    name: settings.siteName,
    description: settings.organizationDescription,
    publisher: refOrganization(settings.siteUrl),
    inLanguage: 'en-US',
  }
}

// ============================================
// Organization Schema
// ============================================

export function organizationSchema(settings: SiteSettings) {
  const sameAs = [
    settings.socialLinks?.linkedin,
    settings.socialLinks?.twitter,
    settings.socialLinks?.instagram,
    settings.socialLinks?.facebook,
    settings.socialLinks?.youtube,
  ].filter((url): url is string => Boolean(url))

  return {
    '@type': 'Organization',
    '@id': organizationId(settings.siteUrl),
    name: settings.siteName,
    url: settings.siteUrl,
    description: settings.organizationDescription,
    
    ...(settings.logoUrl && {
      logo: { '@type': 'ImageObject', url: settings.logoUrl },
    }),
    
    ...(settings.email && { email: settings.email }),
    ...(settings.phone && { telephone: settings.phone }),
    ...(settings.foundingDate && { foundingDate: settings.foundingDate }),
    ...(settings.priceRange && { priceRange: settings.priceRange }),
    
    ...(settings.hasPhysicalLocation && settings.address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: settings.address.street,
        addressLocality: settings.address.city,
        addressRegion: settings.address.state,
        postalCode: settings.address.zip,
        addressCountry: settings.address.country || 'US',
      },
    }),
    
    // Area served (customize for your business)
    ...(settings.areaServed && {
      areaServed: settings.areaServed.map(area => ({
        '@type': 'Place',
        name: area,
      })),
    }),
    
    // E-E-A-T: What your organization knows about
    ...(settings.knowsAbout && {
      knowsAbout: settings.knowsAbout,
    }),
    
    ...(sameAs.length > 0 && { sameAs }),
  }
}

// ============================================
// LocalBusiness Schema (only if physical location)
// ============================================

export function localBusinessSchema(settings: SiteSettings) {
  if (!settings.hasPhysicalLocation || !settings.address?.street) return null

  return {
    '@type': 'LocalBusiness', // Or 'ProfessionalService', 'Restaurant', etc.
    '@id': localBusinessId(settings.siteUrl),
    name: settings.siteName,
    url: settings.siteUrl,
    ...(settings.ogImageUrl && { image: settings.ogImageUrl }),
    ...(settings.phone && { telephone: settings.phone }),
    ...(settings.priceRange && { priceRange: settings.priceRange }),
    parentOrganization: refOrganization(settings.siteUrl),
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings.address.street,
      addressLocality: settings.address.city,
      addressRegion: settings.address.state,
      postalCode: settings.address.zip,
      addressCountry: settings.address.country || 'US',
    },
    ...(hasValidCoordinates(settings.coordinates) && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: settings.coordinates.lat,
        longitude: settings.coordinates.lng,
      },
    }),
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
      author: authorSlug
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
// Person Schema (Authors/Team)
// ============================================

export function personSchema(author: Author, siteUrl: string) {
  const url = `${siteUrl}/about/${author.slug}`

  const sameAs = [author.linkedin, author.twitter].filter(
    (u): u is string => Boolean(u)
  )

  return {
    '@type': 'Person',
    '@id': personId(siteUrl, author.slug),
    name: author.name,
    url,
    ...(author.role && { jobTitle: author.role }),
    ...(author.imageUrl && { image: author.imageUrl }),
    worksFor: refOrganization(siteUrl),
    ...(sameAs.length > 0 && { sameAs }),
    ...(author.credentials && author.credentials.length > 0 && { 
      knowsAbout: author.credentials 
    }),
  }
}

// ============================================
// Location Schema
// ============================================

export function locationSchema(location: Location, siteUrl: string) {
  const url = `${siteUrl}/locations/${location.slug}`
  const id = locationId(siteUrl, location.slug, location.hasPhysicalPresence)

  // Physical location
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
// Category Schema
// ============================================

export function categorySchema(category: Category, siteUrl: string) {
  const url = `${siteUrl}/categories/${category.slug}`

  return {
    '@type': 'Thing', // Or 'Service', 'Product', etc. based on your use
    '@id': categoryId(siteUrl, category.slug),
    name: category.name,
    description: category.description,
    url,
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
// AboutPage Schema
// ============================================

export function aboutPageSchema(siteUrl: string, ogImageUrl?: string) {
  const url = `${siteUrl}/about`
  
  return {
    '@type': 'AboutPage',
    '@id': webPageId(url),
    url,
    name: 'About',
    isPartOf: refWebsite(siteUrl),
    about: refOrganization(siteUrl),
    mainEntity: refOrganization(siteUrl),
    ...(ogImageUrl && {
      primaryImageOfPage: { '@type': 'ImageObject', url: ogImageUrl },
    }),
    inLanguage: 'en-US',
  }
}

// ============================================
// ContactPage Schema
// ============================================

export function contactPageSchema(siteUrl: string) {
  const url = `${siteUrl}/contact`
  
  return {
    '@type': 'ContactPage',
    '@id': webPageId(url),
    url,
    name: 'Contact',
    isPartOf: refWebsite(siteUrl),
    inLanguage: 'en-US',
  }
}

