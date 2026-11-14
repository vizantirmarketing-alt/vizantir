/**
 * Host and domain helpers for contact address finding. Pure. Every host list
 * for this feature lives here.
 *
 * Registrable domains are worked out without a public suffix list: the last
 * two labels, or the last three when the last two are a known two-part
 * suffix such as co.uk. That is enough for the businesses this dashboard
 * covers; an unknown two-part suffix only makes the match stricter, never
 * looser, because a suffix is never accepted on its own.
 */

/**
 * Addresses at these domains are placeholders or belong to a website
 * platform, never to the business. A domain matches when it equals one of
 * these or is a subdomain of it ("sentry-next.wixpress.com").
 */
export const PLACEHOLDER_EMAIL_DOMAINS = [
  // Template and documentation placeholders
  'example.com', 'example.org', 'example.net', 'domain.com', 'email.com', 'yourdomain.com', 'yoursite.com',
  'yourwebsite.com', 'yourcompany.com', 'mydomain.com', 'mysite.com', 'website.com', 'company.com', 'test.com',
  'sample.com', 'address.com',
  // Website platforms, error trackers and form services
  'sentry.io', 'wixpress.com', 'wix.com', 'squarespace.com', 'godaddy.com', 'secureserver.net', 'wordpress.com',
  'wordpress.org', 'weebly.com', 'shopify.com', 'myshopify.com', 'hubspot.com', 'hs-sites.com', 'mailchimp.com',
  'list-manage.com', 'webflow.io', 'jimdo.com', 'strikingly.com', 'duda.co', 'cloudflare.com', 'formspree.io',
  'typeform.com', 'jotform.com', 'elfsight.com', 'sentry.wixpress.com',
] as const

/** An address ending in one of these is a file name picked up from page markup. */
export const FILENAME_SUFFIXES = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.css', '.js'] as const

/** Two-part public suffixes, so "shop.example.co.uk" registers as "example.co.uk". */
const TWO_PART_SUFFIXES = new Set([
  'co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'me.uk', 'ltd.uk', 'plc.uk',
  'com.au', 'net.au', 'org.au', 'co.nz', 'org.nz', 'co.za', 'com.mx', 'com.br', 'co.jp', 'co.in', 'co.kr',
  'com.sg', 'com.hk', 'com.cn', 'co.il',
])

export function matchesDomain(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`)
}

/** Lower case, no trailing dot, no leading "www.". */
export function normalizeHost(host: string): string {
  return host.trim().toLowerCase().replace(/\.$/, '').replace(/^www\./, '')
}

/** The registrable domain of a host, or null for an IP address or a single label. */
export function registrableDomain(host: string): string | null {
  const clean = normalizeHost(host)
  if (clean.length === 0 || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(clean) || clean.startsWith('[')) return null
  const labels = clean.split('.').filter((label) => label.length > 0)
  if (labels.length < 2) return null
  const lastTwo = labels.slice(-2).join('.')
  if (TWO_PART_SUFFIXES.has(lastTwo)) return labels.length >= 3 ? labels.slice(-3).join('.') : null
  return lastTwo
}

export function isPlaceholderDomain(domain: string): boolean {
  const host = normalizeHost(domain)
  return PLACEHOLDER_EMAIL_DOMAINS.some((listed) => matchesDomain(host, listed))
}

export function looksLikeFilename(address: string): boolean {
  const lower = address.toLowerCase()
  return FILENAME_SUFFIXES.some((suffix) => lower.endsWith(suffix))
}
