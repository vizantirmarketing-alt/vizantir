const LANDING_PAGES_SLUG = 'landing-pages'
const LANDING_PAGES_HREF = '/landing-pages'

/** Public href for a service slug. Landing Pages canonicals to /landing-pages. */
export function serviceHref(slug: string): string {
  return slug === LANDING_PAGES_SLUG ? LANDING_PAGES_HREF : `/services/${slug}`
}

export function serviceAbsoluteUrl(siteUrl: string, slug: string): string {
  return `${siteUrl.replace(/\/$/, '')}${serviceHref(slug)}`
}
