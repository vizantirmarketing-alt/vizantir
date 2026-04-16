import { groq } from 'next-sanity'

// ============================================
// Site Settings (Singleton)
// ============================================

export const siteSettingsQuery = groq`
  *[_type == "siteSettings"][0] {
    siteName,
    siteUrl,
    defaultMetaTitle,
    defaultMetaDescription,
    organizationDescription,
    "logoUrl": logo.asset->url,
    "ogImageUrl": ogImage.asset->url,
    socialLinks,
    hasPhysicalLocation,
    address,
    phone,
    email,
    foundingDate,
    priceRange,
    areaServed,
    knowsAbout
  }
`

// ============================================
// Posts/Blog
// ============================================

export const allPostsQuery = groq`
  *[_type == "post"] | order(publishedAt desc) {
    _id,
    _updatedAt,
    title,
    "slug": slug.current,
    publishedAt,
    excerpt,
    "author": author-> {
      name,
      "slug": slug.current
    }
  }
`

export const postBySlugQuery = groq`
  *[_type == "post" && slug.current == $slug][0] {
    _id,
    _updatedAt,
    title,
    "slug": slug.current,
    publishedAt,
    excerpt,
    body,
    "metaTitle": seo.metaTitle,
    "metaDescription": seo.metaDescription,
    "ogImageUrl": coalesce(seo.ogImage.asset->url, mainImage.asset->url),
    "author": author-> {
      _id,
      name,
      "slug": slug.current,
      role,
      bio,
      "imageUrl": image.asset->url,
      linkedin,
      twitter,
      credentials
    }
  }
`

// ============================================
// Services/Products (customize for your content)
// ============================================

export const allServicesQuery = groq`
  *[_type == "service"] | order(coalesce(order, 999) asc, title asc) {
    _id,
    _updatedAt,
    title,
    "slug": slug.current,
    description,
    order
  }
`

export const serviceBySlugQuery = groq`
  *[_type == "service" && slug.current == $slug][0] {
    _id,
    _updatedAt,
    title,
    "slug": slug.current,
    description,
    heroHeadline,
    heroSubheadline,
    overview,
    benefits,
    process,
    offerings,
    deliverables,
    faqs,
    "metaTitle": seo.metaTitle,
    "metaDescription": seo.metaDescription,
    "ogImageUrl": seo.ogImage.asset->url,
    relatedServices[]-> {
      title,
      "slug": slug.current
    }
  }
`

// ============================================
// Locations (for multi-location businesses)
// ============================================

export const allLocationsQuery = groq`
  *[_type == "location"] | order(name asc) {
    _id,
    _updatedAt,
    name,
    "slug": slug.current,
    city,
    state
  }
`

export const locationBySlugQuery = groq`
  *[_type == "location" && slug.current == $slug][0] {
    _id,
    _updatedAt,
    name,
    "slug": slug.current,
    city,
    state,
    description,
    headline,
    subheadline,
    hasPhysicalPresence,
    address,
    coordinates,
    serviceAreas,
    content,
    testimonials,
    faqs,
    "metaTitle": seo.metaTitle,
    "metaDescription": seo.metaDescription,
    "ogImageUrl": seo.ogImage.asset->url
  }
`

// ============================================
// Categories/Industries
// ============================================

export const allCategoriesQuery = groq`
  *[_type == "category"] | order(name asc) {
    _id,
    _updatedAt,
    name,
    "slug": slug.current
  }
`

export const categoryBySlugQuery = groq`
  *[_type == "category" && slug.current == $slug][0] {
    _id,
    _updatedAt,
    name,
    "slug": slug.current,
    description,
    content,
    faqs,
    "metaTitle": seo.metaTitle,
    "metaDescription": seo.metaDescription,
    "ogImageUrl": seo.ogImage.asset->url
  }
`

// ============================================
// Authors
// ============================================

export const authorBySlugQuery = groq`
  *[_type == "author" && slug.current == $slug][0] {
    _id,
    name,
    "slug": slug.current,
    role,
    bio,
    "imageUrl": image.asset->url,
    linkedin,
    twitter,
    credentials
  }
`

// ============================================
// Sitemap
// ============================================

export const sitemapQuery = groq`{
  "posts": *[_type == "post"] { "slug": slug.current, _updatedAt, publishedAt },
  "services": *[_type == "service"] | order(coalesce(order, 999) asc, title asc) { "slug": slug.current, _updatedAt },
  "locations": *[_type == "location"] { "slug": slug.current, _updatedAt },
  "categories": *[_type == "category"] { "slug": slug.current, _updatedAt }
}`

