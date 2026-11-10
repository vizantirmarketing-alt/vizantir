/**
 * Domain normalization for prospects. Pure; no network.
 *
 * A prospect is keyed by its normalized domain: lowercase hostname with any
 * leading `www.` and trailing dot removed. Scheme, port, path, query and
 * fragment are discarded. IP addresses, single-label hosts and non-http(s)
 * schemes are rejected, since none of them identify a company website.
 */

const MAX_DOMAIN_LENGTH = 253
const LABEL_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/
const TLD_RE = /^(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/
const IPV4_RE = /^\d{1,3}(?:\.\d{1,3}){3}$/
/** `scheme://`, or `scheme:` not followed by a port number (mailto:, javascript:). */
const SCHEME_RE = /^[a-z][a-z0-9+.-]*:(?:\/\/|(?!\d))/i

export function normalizeDomain(input: string): string | null {
  const trimmed = input.trim()
  if (trimmed.length === 0 || trimmed.length > 2048) {
    return null
  }

  const candidate = SCHEME_RE.test(trimmed) ? trimmed : `https://${trimmed}`

  let url: URL
  try {
    url = new URL(candidate)
  } catch {
    return null
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return null
  }
  if (url.username !== '' || url.password !== '') {
    return null
  }

  let host = url.hostname.toLowerCase()
  if (host.startsWith('[')) {
    return null
  }
  if (host.endsWith('.')) {
    host = host.slice(0, -1)
  }
  if (host.startsWith('www.')) {
    host = host.slice(4)
  }

  if (host.length === 0 || host.length > MAX_DOMAIN_LENGTH) {
    return null
  }
  if (IPV4_RE.test(host)) {
    return null
  }

  const labels = host.split('.')
  if (labels.length < 2) {
    return null
  }
  if (!labels.every((label) => LABEL_RE.test(label))) {
    return null
  }
  const tld = labels[labels.length - 1]
  if (tld === undefined || !TLD_RE.test(tld)) {
    return null
  }

  return host
}
