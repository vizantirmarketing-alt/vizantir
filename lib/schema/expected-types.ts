/**
 * Route → expected JSON-LD @types.
 *
 * Phase 2c milestone 2. Data only — not consulted by any detector yet.
 * A route absent from this list is simply not checked.
 *
 * Types match what `extractSchemaTypes` in lib/scan/parse.ts records: the
 * block's own `@type` and each `@graph` node's `@type`. Nested types
 * (ListItem, Question, Offer inside hasOfferCatalog, PriceSpecification,
 * Person-as-author, etc.) are properties of a parent and are not listed.
 *
 * Shared baseline, inherited by every route via app/layout.tsx:
 *   BusinessJsonLd  `@type: ['Organization', 'LocalBusiness', 'ProfessionalService']`
 *   WebSiteJsonLd   `@type: 'WebSite'`
 * BreadcrumbList and WebPage are NOT in the layout. Pages that lack them
 * (commercial /landing-pages*) do so because their page graph never calls
 * webPageSchema, not because the layout skipped them.
 *
 * `pattern` is a pathname with no trailing slash — the same form scan/fetch
 * uses after stripping trailing slashes. An exact string matches one path.
 * A trailing `/*` matches exactly one extra segment (`/blog/foo`, not
 * `/blog` and not `/blog/foo/bar`). There is no other matching syntax in
 * this repo (sitemap.ts is an exact-path list; there is no middleware
 * matcher), so this is the smallest convention that covers [slug] routes.
 */

export const SHARED_LAYOUT_SCHEMA_TYPES = [
  'LocalBusiness',
  'Organization',
  'ProfessionalService',
  'WebSite',
] as const

export type SchemaRouteExpectation = {
  pattern: string
  expectedTypes: readonly string[]
}

/** Sanity `/services/[slug]` pages. FAQPage is emitted when `service.faqs` is non-empty; every currently published slug does. */
const SERVICE_DETAIL_TYPES = [
  'BreadcrumbList',
  'FAQPage',
  'LocalBusiness',
  'Organization',
  'ProfessionalService',
  'Service',
  'WebPage',
  'WebSite',
] as const

/**
 * Commercial landing-page family (buildLandingPagesSchema).
 * No WebPage — the graph is Service + FAQPage + BreadcrumbList only.
 * Offers are PriceSpecification nested on Service, so Offer is not expected.
 */
const LANDING_PAGE_TYPES = [
  'BreadcrumbList',
  'FAQPage',
  'LocalBusiness',
  'Organization',
  'ProfessionalService',
  'Service',
  'WebSite',
] as const

/** Industry verticals: pageServiceSchema + top-level projectOfferSchemas. */
const VERTICAL_PAGE_TYPES = [
  'BreadcrumbList',
  'FAQPage',
  'LocalBusiness',
  'Offer',
  'Organization',
  'ProfessionalService',
  'Service',
  'WebPage',
  'WebSite',
] as const

/**
 * Geo marketing pages (las-vegas-web-design, website-redesign-las-vegas).
 * Offers live under Service.hasOfferCatalog, so Offer is not a collected type.
 */
const GEO_PAGE_TYPES = [
  'BreadcrumbList',
  'FAQPage',
  'LocalBusiness',
  'Organization',
  'ProfessionalService',
  'Service',
  'WebPage',
  'WebSite',
] as const

export const EXPECTED_SCHEMA_TYPES: readonly SchemaRouteExpectation[] = [
  // --- Services (priority 1) ---------------------------------------------
  { pattern: '/services/website-strategy', expectedTypes: SERVICE_DETAIL_TYPES },
  { pattern: '/services/web-design', expectedTypes: SERVICE_DETAIL_TYPES },
  { pattern: '/services/web-development', expectedTypes: SERVICE_DETAIL_TYPES },
  { pattern: '/services/landing-pages', expectedTypes: SERVICE_DETAIL_TYPES },
  { pattern: '/services/website-refreshes', expectedTypes: SERVICE_DETAIL_TYPES },
  { pattern: '/services/cms-integrations', expectedTypes: SERVICE_DETAIL_TYPES },
  { pattern: '/services/website-care', expectedTypes: SERVICE_DETAIL_TYPES },

  // --- Landing pages (priority 2) ----------------------------------------
  { pattern: '/landing-pages', expectedTypes: LANDING_PAGE_TYPES },
  { pattern: '/landing-pages/for-google-ads', expectedTypes: LANDING_PAGE_TYPES },
  { pattern: '/landing-pages/for-product-launches', expectedTypes: LANDING_PAGE_TYPES },

  // --- Blog posts (priority 3) -------------------------------------------
  // blogPostSchema always emits BlogPosting. Nested Person / ImageObject
  // are not collected. Type set does not vary by Sanity content.
  {
    pattern: '/blog/*',
    expectedTypes: [
      'BlogPosting',
      'BreadcrumbList',
      'LocalBusiness',
      'Organization',
      'ProfessionalService',
      'WebPage',
      'WebSite',
    ],
  },

  // --- Case studies (priority 4) -----------------------------------------
  // caseStudySchema @type is CreativeWork, not CaseStudy. Nested about
  // Organization / creator Person / image are not collected.
  {
    pattern: '/case-studies/*',
    expectedTypes: [
      'BreadcrumbList',
      'CreativeWork',
      'LocalBusiness',
      'Organization',
      'ProfessionalService',
      'WebPage',
      'WebSite',
    ],
  },

  // --- Statically determined routes with production samples --------------
  {
    pattern: '/how-we-work',
    expectedTypes: [
      'BreadcrumbList',
      'FAQPage',
      'HowTo',
      'ItemList',
      'LocalBusiness',
      'Organization',
      'ProfessionalService',
      'WebPage',
      'WebSite',
    ],
  },
  { pattern: '/law-firm-web-design', expectedTypes: VERTICAL_PAGE_TYPES },
  { pattern: '/hospitality-web-design', expectedTypes: VERTICAL_PAGE_TYPES },
  { pattern: '/commercial-real-estate-web-design', expectedTypes: VERTICAL_PAGE_TYPES },
  { pattern: '/las-vegas-web-design', expectedTypes: GEO_PAGE_TYPES },
  { pattern: '/website-redesign-las-vegas', expectedTypes: GEO_PAGE_TYPES },
  {
    pattern: '/nextjs-vs-wordpress',
    expectedTypes: [
      'BreadcrumbList',
      'FAQPage',
      'ItemList',
      'LocalBusiness',
      'Organization',
      'ProfessionalService',
      'WebPage',
      'WebSite',
    ],
  },
]
