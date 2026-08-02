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
    category,
    tags,
    readTime,
    "metaDescription": seo.metaDescription,
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
    category,
    tags,
    readTime,
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
    included,
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
    included,
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
// Case Studies
// ============================================

export const allCaseStudiesQuery = groq`
  *[_type == "caseStudy"] | order(featured desc, _updatedAt desc) {
    _id,
    _updatedAt,
    title,
    "slug": slug.current,
    client,
    industry,
    summary,
    heroImage{
      alt,
      asset->{
        _id,
        url
      }
    },
    stack,
    featured,
    siteUrl,
    challenge,
    solution,
    results
  }
`

/** Proof Band verification for /landing-pages family. */
export const landingPagesProofBandQuery = groq`
  *[_type == "caseStudy" && slug.current in [
    "elorae-nails",
    "pink-salt-salon",
    "meridian-row"
  ]]{
    "slug": slug.current,
    title
  }
`

export const caseStudyBySlugQuery = groq`
  *[_type == "caseStudy" && slug.current == $slug][0] {
    _id,
    _updatedAt,
    title,
    "slug": slug.current,
    client,
    industry,
    summary,
    heroImage{
      alt,
      asset->{
        _id,
        url
      }
    },
    gallery[]{
      alt,
      asset->{
        _id,
        url
      }
    },
    challenge,
    solution,
    results,
    stack,
    siteUrl,
    featured,
    "metaTitle": seo.metaTitle,
    "metaDescription": seo.metaDescription,
    "ogImageUrl": seo.ogImage.asset->url
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
// Sitemap
// ============================================

export const sitemapQuery = groq`{
  "posts": *[_type == "post" && (!defined(seo.noIndex) || seo.noIndex == false)] { "slug": slug.current, _updatedAt, publishedAt },
  "services": *[_type == "service" && (!defined(seo.noIndex) || seo.noIndex == false)] | order(coalesce(order, 999) asc, title asc) { "slug": slug.current, _updatedAt },
  "caseStudies": *[_type == "caseStudy" && (!defined(seo.noIndex) || seo.noIndex == false)] { "slug": slug.current, _updatedAt },
  "locations": *[_type == "location" && (!defined(seo.noIndex) || seo.noIndex == false)] { "slug": slug.current, _updatedAt }
}`

export const sitemapPageQuery = groq`{
  "posts": *[_type == "post" && (!defined(seo.noIndex) || seo.noIndex == false)] | order(publishedAt desc) {
    "slug": slug.current,
    title,
    _updatedAt
  },
  "services": *[_type == "service" && (!defined(seo.noIndex) || seo.noIndex == false)] | order(coalesce(order, 999) asc, title asc) {
    "slug": slug.current,
    title,
    _updatedAt
  },
  "caseStudies": *[_type == "caseStudy" && (!defined(seo.noIndex) || seo.noIndex == false)] | order(title asc) {
    "slug": slug.current,
    title,
    _updatedAt
  },
  "locations": *[_type == "location" && (!defined(seo.noIndex) || seo.noIndex == false)] | order(name asc) {
    "slug": slug.current,
    "title": name,
    _updatedAt
  }
}`

export const homepageFaqsQuery = `*[_type == "faq" && (placement == "homepage" || placement == "both")] | order(sortOrder asc) {
  _id,
  question,
  answer
}`

export const faqPageFaqsQuery = `*[_type == "faq" && (placement == "faqPage" || placement == "both")] | order(sortOrder asc) {
  _id,
  question,
  answer
}`

// ============================================
// Chat Knowledge (LLM context — Portable Text flattened via pt::text)
// ============================================

export const chatAllServicesQuery = groq`
  *[_type == "service"] | order(order asc) {
    title,
    "slug": slug.current,
    description,
    heroHeadline,
    heroSubheadline,
    "overview": pt::text(overview),
    benefits,
    process[]{ step, title, description },
    offerings[]{ name, description },
    deliverables,
    faqs[]{ question, answer }
  }
`

export const chatAllCaseStudiesQuery = groq`
  *[_type == "caseStudy"] | order(featured desc) {
    title,
    client,
    industry,
    summary,
    stack,
    siteUrl,
    "challenge": pt::text(challenge),
    "solution": pt::text(solution),
    "results": pt::text(results)
  }
`

export const chatAllFaqsQuery = groq`
  *[_type == "faq"] | order(sortOrder asc) {
    question,
    answer,
    placement
  }
`

export const chatAuthorQuery = groq`
  *[_type == "author"][0] {
    name,
    role,
    "bio": pt::text(bio),
    credentials
  }
`

