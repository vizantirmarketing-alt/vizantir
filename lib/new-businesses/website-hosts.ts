/**
 * Host classification for website-check candidates. Pure. The server
 * classifies every URL itself; the runner's own description of a page
 * (kind_claimed) is stored as evidence only and never decides anything.
 *
 * All host lists live here. A host matches a listed domain when it equals it
 * or is a subdomain of it ("m.facebook.com", "shop.wixsite.com").
 */

export type HostKind = 'social_or_directory' | 'free_builder' | 'own_domain'

/** Social networks, link pages, review sites, directories and map listings. */
export const SOCIAL_OR_DIRECTORY_DOMAINS = [
  // Social and link pages
  'facebook.com', 'fb.com', 'instagram.com', 'tiktok.com', 'x.com', 'twitter.com', 'threads.net',
  'linkedin.com', 'pinterest.com', 'youtube.com', 'snapchat.com', 'nextdoor.com', 'linktr.ee',
  'linkin.bio', 'beacons.ai', 'taplink.cc', 'msha.ke', 'bio.link',
  // Reviews and directories
  'yelp.com', 'yellowpages.com', 'bbb.org', 'mapquest.com', 'manta.com', 'angi.com', 'angieslist.com',
  'homeadvisor.com', 'thumbtack.com', 'houzz.com', 'porch.com', 'tripadvisor.com', 'opentable.com',
  'chamberofcommerce.com', 'bizapedia.com', 'opencorporates.com', 'buzzfile.com', 'dnb.com',
  'zoominfo.com', 'superpages.com', 'citysearch.com', 'foursquare.com', 'birdeye.com',
  'nicelocal.com', 'loc8nearme.com', 'cylex.us.com', 'hotfrog.com', 'merchantcircle.com',
  'alignable.com', 'groupon.com', 'doordash.com', 'ubereats.com', 'grubhub.com', 'seamless.com',
  'postmates.com', 'toasttab.com', 'menupix.com', 'allmenus.com', 'zocdoc.com', 'healthgrades.com',
  'vitals.com', 'webmd.com', 'avvo.com', 'justia.com', 'findlaw.com', 'lawyers.com', 'martindale.com',
  'superlawyers.com', 'zillow.com', 'realtor.com', 'redfin.com', 'trulia.com', 'booksy.com',
  'vagaro.com', 'styleseat.com', 'fresha.com', 'schedulicity.com', 'mindbodyonline.com',
  'nevada.gov', 'nv.gov', 'clarkcountynv.gov', 'maps.apple.com',
] as const

/**
 * Google Maps and Business Profile listings: maps on any Google host, the
 * g.page and goo.gl/maps short links. Matched by host plus path.
 */
function isGoogleListing(url: URL): boolean {
  const host = url.hostname.toLowerCase()
  if (host === 'g.page' || host.endsWith('.g.page') || host === 'maps.app.goo.gl') return true
  if (host === 'goo.gl' && url.pathname.startsWith('/maps')) return true
  if (host === 'maps.google.com' || /^maps\.google\.[a-z.]+$/.test(host)) return true
  if (/^(www\.)?google\.[a-z.]+$/.test(host) && (url.pathname.startsWith('/maps') || url.pathname.startsWith('/search'))) return true
  if (host === 'business.google.com') return true
  return false
}

/** Free website builder addresses: the business has a page, not its own domain. */
export const FREE_BUILDER_DOMAINS = [
  'wixsite.com', 'wix.com', 'square.site', 'squareup.com', 'godaddysites.com', 'weebly.com',
  'wordpress.com', 'webflow.io', 'carrd.co', 'myshopify.com', 'business.site', 'sites.google.com',
  'blogspot.com', 'jimdosite.com', 'jimdo.com', 'strikingly.com', 'mystrikingly.com',
  'site123.me', 'webnode.com', 'yolasite.com', 'ueniweb.com', 'ueni.com', 'durablesites.com',
  'durable.co', 'hibu.com', 'websitebuilder.com', 'mailchimpsites.com', 'mystore.com',
  'company.site', 'netlify.app', 'vercel.app', 'github.io', 'glideapp.io', 'notion.site',
  'framer.website', 'framer.ai', 'tilda.ws', 'ecwid.com', 'bigcartel.com', 'storenvy.com',
  'square.online', 'canva.site', 'my.canva.site', 'squarespace.com', 'wpcomstaging.com',
] as const

function matchesDomain(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`)
}

/** Parses an http or https URL; null for anything else. */
export function parseHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    if (url.username !== '' || url.password !== '') return null
    if (url.hostname.length === 0) return null
    return url
  } catch {
    return null
  }
}

export function classifyHost(value: string): HostKind | null {
  const url = parseHttpUrl(value)
  if (url === null) return null
  const host = url.hostname.toLowerCase().replace(/\.$/, '')
  if (isGoogleListing(url)) return 'social_or_directory'
  // "sites.google.com" must be checked before any broader Google rule.
  if (FREE_BUILDER_DOMAINS.some((domain) => matchesDomain(host, domain))) return 'free_builder'
  if (SOCIAL_OR_DIRECTORY_DOMAINS.some((domain) => matchesDomain(host, domain))) return 'social_or_directory'
  return 'own_domain'
}
