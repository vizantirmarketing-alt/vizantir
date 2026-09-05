/**
 * Centralized Entity ID Registry
 * 
 * All schema @id values should be generated through these functions
 * to ensure consistent entity resolution across the site.
 * 
 * This transforms your site into a proper knowledge graph where
 * Google, Bing, and AI engines can unambiguously resolve entities.
 */

// ============================================
// Core Site Entities (Singletons)
// ============================================

export function websiteId(siteUrl: string) {
  return `${siteUrl}/#website`
}

function organizationId(siteUrl: string) {
  return `${siteUrl}/#business`
}

// ============================================
// Page Entities
// ============================================

export function webPageId(pageUrl: string) {
  return `${pageUrl}#webpage`
}

export function howToId(pageUrl: string) {
  return `${pageUrl}#howto`
}

// ============================================
// Content Type Entities
// Customize these paths for your URL structure
// ============================================

export function serviceId(siteUrl: string, slug: string) {
  return `${siteUrl}/services/${slug}#service`
}

export function articleId(siteUrl: string, slug: string) {
  return `${siteUrl}/blog/${slug}#article`
}

export function caseStudyId(siteUrl: string, slug: string) {
  return `${siteUrl}/case-studies/${slug}#casestudy`
}

export function locationId(siteUrl: string, slug: string, hasPhysicalPresence: boolean) {
  return hasPhysicalPresence
    ? `${siteUrl}/locations/${slug}#localbusiness`
    : `${siteUrl}/locations/${slug}#service`
}

// ============================================
// Person Entities
// ============================================

export function personId(siteUrl: string, slug: string) {
  return `${siteUrl}/about/${slug}#person`
}

export function founderId(siteUrl: string) {
  return `${siteUrl}/about#person`
}

// ============================================
// Reference Helpers
// Use these when linking between entities
// ============================================

export function refOrganization(siteUrl: string) {
  return { '@id': organizationId(siteUrl) }
}

export function refWebsite(siteUrl: string) {
  return { '@id': websiteId(siteUrl) }
}

export function refWebPage(pageUrl: string) {
  return { '@id': webPageId(pageUrl) }
}

export function refPerson(siteUrl: string, slug: string) {
  return { '@id': personId(siteUrl, slug) }
}

export function refFounder(siteUrl: string) {
  return { '@id': founderId(siteUrl) }
}





