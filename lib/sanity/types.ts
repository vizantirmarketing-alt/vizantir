// ============================================
// Site Settings (Singleton)
// ============================================

export interface SiteSettings {
  siteName: string
  siteUrl: string
  defaultMetaTitle: string
  defaultMetaDescription: string
  organizationDescription: string
  logoUrl?: string
  ogImageUrl?: string
  socialLinks?: {
    linkedin?: string
    twitter?: string
    instagram?: string
    facebook?: string
    youtube?: string
  }
  hasPhysicalLocation: boolean
  address?: {
    street: string
    city: string
    state: string
    zip: string
    country: string
  }
  coordinates?: {
    lat: number
    lng: number
  }
  phone?: string
  email?: string
  googleVerification?: string
  // Customize these for your business
  priceRange?: string // '$', '$$', '$$$', '$$$$'
  foundingDate?: string
  areaServed?: string[] // Countries, states, or cities
  knowsAbout?: string[] // Expertise areas for E-E-A-T
}

// ============================================
// Generic Content Types
// ============================================

export interface FAQ {
  question: string
  answer: string
}

interface SEOFields {
  metaTitle?: string
  metaDescription?: string
  ogImageUrl?: string
}

// ============================================
// Page/Post Types (Customize for your site)
// ============================================

interface PageListItem {
  _id: string
  _updatedAt: string
  title: string
  slug: string
}

interface Page extends PageListItem, SEOFields {
  description?: string
  content?: any[] // PortableText
  faqs?: FAQ[]
}

interface PostListItem {
  _id: string
  _updatedAt: string
  title: string
  slug: string
  publishedAt: string
  excerpt?: string
  author?: {
    name: string
    slug: string
  }
}

export interface Post extends PostListItem, SEOFields {
  body?: any[] // PortableText
  author?: Author
}

interface Author {
  _id: string
  name: string
  slug: string
  role?: string
  bio?: any[] // PortableText
  imageUrl?: string
  linkedin?: string
  twitter?: string
  credentials?: string[]
}

// ============================================
// Service/Product Types (Customize for your site)
// ============================================

export interface ServiceListItem {
  _id: string
  _updatedAt: string
  title: string
  slug: string
  description?: string
  included?: string[]
  /** Display order from Sanity; lower appears first on /services */
  order?: number
}

export interface Service extends ServiceListItem, SEOFields {
  heroHeadline?: string
  heroSubheadline?: string
  overview?: any[] // PortableText
  benefits?: string[]
  process?: {
    step: number
    title: string
    description: string
  }[]
  offerings?: {
    name: string
    description: string
  }[]
  deliverables?: string[]
  faqs?: FAQ[]
  relatedServices?: { title: string; slug: string }[]
}

interface CaseStudyImage {
  alt?: string
  asset?: {
    _id: string
    url: string
    metadata?: {
      dimensions?: {
        width: number
        height: number
      }
    }
  }
}

export interface CaseStudyListItem {
  _id: string
  _updatedAt: string
  title: string
  slug: string
  client?: string
  projectType?: 'client' | 'studio'
  industry?: string
  summary?: string
  heroImage?: CaseStudyImage
  stack?: string[]
  featured?: boolean
  siteUrl?: string
  challenge?: any[] // PortableText
  solution?: any[] // PortableText
  results?: any[] // PortableText
}

export interface CaseStudy extends CaseStudyListItem, SEOFields {
  gallery?: CaseStudyImage[]
}

// ============================================
// Location Types (for multi-location businesses)
// ============================================

interface LocationListItem {
  _id: string
  _updatedAt: string
  name: string
  slug: string
  city: string
  state: string
}

export interface Location extends LocationListItem, SEOFields {
  description?: string
  headline?: string
  subheadline?: string
  hasPhysicalPresence: boolean
  address?: {
    street: string
    city: string
    state: string
    zip: string
  }
  coordinates?: {
    lat: number
    lng: number
  }
  serviceAreas?: string[]
  content?: any[] // PortableText
  testimonials?: {
    quote: string
    name: string
    company: string
  }[]
  faqs?: FAQ[]
}

// ============================================
// Sitemap Types
// ============================================

export interface SitemapData {
  pages?: { slug: string; _updatedAt: string }[]
  posts?: { slug: string; _updatedAt: string; publishedAt: string }[]
  services?: { slug: string; _updatedAt: string }[]
  caseStudies?: { slug: string; _updatedAt: string }[]
  locations?: { slug: string; _updatedAt: string }[]
}

export interface SitemapPageItem {
  slug: string
  title: string
  _updatedAt: string
}

export interface SitemapPageData {
  posts: SitemapPageItem[]
  services: SitemapPageItem[]
  caseStudies: SitemapPageItem[]
  locations: SitemapPageItem[]
}





