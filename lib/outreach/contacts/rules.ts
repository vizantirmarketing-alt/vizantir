/**
 * Contact address rules. Pure and versioned. The server decides every status
 * and keeps at most one address per lead; the runner only reports what it
 * read and the addresses it saw.
 *
 * For each reported address, in order:
 *   1. syntax: strict, 254 characters at most, not a file name, not a
 *      placeholder or platform domain (lib/outreach/contacts/hosts.ts)
 *   2. the page it was on belongs to the lead, judged from the lead's stored
 *      website or listing, never from anything the runner sent
 *   3. the copied text around it contains the address, or the address was
 *      reported from a mailto link whose target names it (mailtoRecipients)
 *   4. the local part is not one that is never for contact (noreply, abuse...)
 *   5. the domain is the lead's own, or a shared mail provider
 *   6. the local part is a role (info, contact...) or one of the business's
 *      own name tokens; anything else is a named person, counted and never kept
 *
 * One address is chosen by a fixed preference: own domain before shared
 * provider, then contact, info, hello, office, then the rest in ROLE_LOCALS
 * order, then name tokens; ties go to the first seen.
 *
 * Only addresses whose local part is a role, a never-for-contact word or a
 * business name token are stored in the evidence. Every other address may be
 * a person's, so the evidence keeps only what it was judged to be.
 */

import { z } from 'zod'

import { classifyHost, FREE_BUILDER_DOMAINS, parseHttpUrl } from '@/lib/new-businesses/website-hosts'
import type { WebsiteStatus } from '@/lib/new-businesses/website-rules'
import { isPlaceholderDomain, looksLikeFilename, normalizeHost, registrableDomain } from '@/lib/outreach/contacts/hosts'
import type { ContactLeadReport } from '@/lib/outreach/contacts/schema'
import { OUTREACH_EMAIL_MAX, SHARED_MAIL_DOMAINS, emailDomain, isValidEmail } from '@/lib/outreach/params'
import { normalizeDomain } from '@/lib/prospects/domain'

export const CONTACT_RULES_VERSION = 'contact-rules-v2'

export const CONTACT_STATUSES = ['found', 'none_found', 'named_only', 'no_page', 'unclear'] as const
export type ContactStatus = (typeof CONTACT_STATUSES)[number]

export const CONTACT_KINDS = ['own_domain', 'shared_provider'] as const
export type ContactKind = (typeof CONTACT_KINDS)[number]

/** Local parts that are never for contacting the business. Compared without dots, hyphens or underscores. */
export const NOT_CONTACT_LOCALS = [
  'noreply', 'donotreply', 'postmaster', 'abuse', 'privacy', 'legal', 'dmca', 'security', 'billing', 'careers', 'jobs',
  'press', 'webmaster', 'unsubscribe',
] as const

/** Role local parts, in preference order after the first four. Compared without dots, hyphens or underscores. */
export const ROLE_LOCALS = [
  'contact', 'info', 'hello', 'office', 'admin', 'sales', 'team', 'support', 'service', 'inquiries', 'enquiries',
  'booking', 'bookings', 'appointments', 'frontdesk', 'reception', 'mail', 'email',
  // Added in contact-rules-v2. Contact purposes only, never personal names.
  'information', 'inquiry', 'enquiry', 'general', 'customerservice', 'customercare', 'care', 'help', 'connect', 'questions',
  'ask', 'hi', 'hey', 'welcome', 'reservations', 'orders', 'estimates', 'quotes', 'scheduling', 'schedule', 'leasing',
  'frontoffice', 'mainoffice', 'shop', 'store', 'studio', 'clinic',
] as const

/** Words in a business name that are never a name token. */
const NAME_STOP_WORDS = new Set(['llc', 'inc', 'corp', 'corporation', 'ltd', 'llp', 'pllc', 'dba', 'the', 'and', 'company'])

/**
 * Where the lead's pages are, from what the server stored:
 *   own_domain  the business's own website; its registrable domain is its email domain
 *   builder     its page on a free website builder; the exact host (and, on a
 *               path-based builder, the same site path)
 *   listing     the listing or social page the website check stored; that
 *               page and pages under its path
 */
export type LeadSite =
  | { kind: 'own_domain'; url: string; domain: string }
  | { kind: 'builder'; url: string }
  | { kind: 'listing'; url: string }

export function siteForProspect(domain: string): LeadSite | null {
  const normalized = normalizeDomain(domain)
  if (normalized === null) return null
  const registrable = registrableDomain(normalized)
  return registrable === null ? null : { kind: 'own_domain', url: `https://${normalized}/`, domain: registrable }
}

/** 'pending' while the website check has not run: the lead waits rather than getting no_page. */
export function siteForBusiness(websiteStatus: WebsiteStatus | null, websiteUrl: string | null): LeadSite | null | 'pending' {
  if (websiteStatus === null) return 'pending'
  if (websiteUrl === null) return null
  const url = parseHttpUrl(websiteUrl.trim())
  if (url === null) return null
  const kind = classifyHost(url.toString())
  if (kind === 'social_or_directory') return { kind: 'listing', url: url.toString() }
  if (kind === 'free_builder') return { kind: 'builder', url: url.toString() }
  const domain = registrableDomain(url.hostname)
  return domain === null ? null : { kind: 'own_domain', url: url.toString(), domain }
}

/** The URLs the runner may start from: the stored page alone. */
export function startUrls(site: LeadSite): string[] {
  return [site.url]
}

function trimmedPath(path: string): string {
  return path.replace(/\/+$/, '')
}

/** Whether a page belongs to the lead, judged only from the stored site. */
export function pageAllowed(pageUrl: string, site: LeadSite): boolean {
  const page = parseHttpUrl(pageUrl.trim())
  const stored = parseHttpUrl(site.url)
  if (page === null || stored === null) return false
  const pageHost = normalizeHost(page.hostname)
  if (site.kind === 'own_domain') return registrableDomain(pageHost) === site.domain

  if (pageHost !== normalizeHost(stored.hostname)) return false
  const storedPath = trimmedPath(stored.pathname)
  const pagePath = trimmedPath(page.pathname)
  if (site.kind === 'builder') {
    // A path-based builder (sites.google.com/view/name) hosts many sites on one
    // host: the page must be under the same first two path segments.
    if (!FREE_BUILDER_DOMAINS.some((domain) => domain === pageHost)) return true
    const prefix = storedPath.split('/').slice(0, 3).join('/')
    return prefix.length > 0 && (pagePath === prefix || pagePath.startsWith(`${prefix}/`))
  }
  // A listing: the stored page itself, or a page under it (its about tab).
  if (storedPath.length === 0) return pagePath.length === 0
  return pagePath === storedPath || pagePath.startsWith(`${storedPath}/`)
}

/** The business name's own tokens: lower case, accents removed, three letters or more, no company suffixes. */
export function nameTokens(name: string): string[] {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3 && !NAME_STOP_WORDS.has(token))
}

/** Lower case; "mailto:" and any query removed. */
export function normalizeReportedEmail(value: string): string {
  return value
    .trim()
    .replace(/^mailto:/i, '')
    .replace(/\?.*$/, '')
    .trim()
    .toLowerCase()
}

/**
 * The recipients a mailto link names: the part before any "?" query,
 * percent-decoded, split on commas, each trimmed and lower case. Empty when
 * the link is not mailto or cannot be decoded.
 */
export function mailtoRecipients(href: string): string[] {
  const match = /^mailto:([^?]*)/i.exec(href.trim())
  if (match === null) return []
  let decoded: string
  try {
    decoded = decodeURIComponent(match[1]!)
  } catch {
    return []
  }
  return decoded
    .split(',')
    .map((recipient) => recipient.trim().toLowerCase())
    .filter((recipient) => recipient.length > 0)
}

/** The copied text contains the address, or the mailto link it came from names it. */
function evidenceNamesAddress(email: string, context: string, linkHref: string | undefined): boolean {
  if (context.toLowerCase().includes(email)) return true
  return linkHref !== undefined && mailtoRecipients(linkHref).includes(email)
}

/** The local part without a +tag, then without dots, hyphens or underscores, for the word lists. */
function compactLocal(email: string): string {
  const at = email.lastIndexOf('@')
  const local = at > 0 ? email.slice(0, at) : email
  return local.replace(/\+.*$/, '').replace(/[._-]/g, '')
}

export type AddressJudgement =
  | { outcome: 'accepted'; email: string; pageUrl: string; kind: ContactKind; rank: number }
  | { outcome: 'named' }
  | {
      outcome: 'rejected'
      reason: 'syntax' | 'filename' | 'placeholder' | 'page_not_lead' | 'context_missing' | 'not_for_contact' | 'other_domain'
    }

/** The role rank: contact, info, hello, office, the rest of ROLE_LOCALS, then name tokens. -1 when it is not a role. */
export function roleRank(email: string, tokens: readonly string[]): number {
  const local = compactLocal(email)
  const index = (ROLE_LOCALS as readonly string[]).indexOf(local)
  if (index >= 0) return index
  return tokens.includes(local) ? ROLE_LOCALS.length : -1
}

export function judgeAddress(
  reported: { email: string; pageUrl: string; context: string; linkHref?: string },
  site: LeadSite,
  tokens: readonly string[],
): AddressJudgement {
  const email = normalizeReportedEmail(reported.email)
  if (email.length > OUTREACH_EMAIL_MAX) return { outcome: 'rejected', reason: 'syntax' }
  if (looksLikeFilename(email)) return { outcome: 'rejected', reason: 'filename' }
  if (!isValidEmail(email)) return { outcome: 'rejected', reason: 'syntax' }
  const domain = emailDomain(email)!
  if (isPlaceholderDomain(domain)) return { outcome: 'rejected', reason: 'placeholder' }
  if (!pageAllowed(reported.pageUrl, site)) return { outcome: 'rejected', reason: 'page_not_lead' }
  if (!evidenceNamesAddress(email, reported.context, reported.linkHref)) return { outcome: 'rejected', reason: 'context_missing' }
  if ((NOT_CONTACT_LOCALS as readonly string[]).includes(compactLocal(email))) return { outcome: 'rejected', reason: 'not_for_contact' }

  let kind: ContactKind
  if (site.kind === 'own_domain' && registrableDomain(domain) === site.domain) kind = 'own_domain'
  // A shared provider counts only on the lead's own page, which pageAllowed has just confirmed.
  else if (SHARED_MAIL_DOMAINS.has(domain)) kind = 'shared_provider'
  else return { outcome: 'rejected', reason: 'other_domain' }

  const rank = roleRank(email, tokens)
  if (rank < 0) return { outcome: 'named' }
  return { outcome: 'accepted', email, pageUrl: reported.pageUrl.trim(), kind, rank }
}

// --- Evidence, as stored.

const storedAddressSchema = z.union([
  // linkHref is absent on results stored before contact-rules-v2.
  z.object({ email: z.string(), pageUrl: z.string(), context: z.string(), linkHref: z.string().optional() }),
  z.object({ redacted: z.literal(true), outcome: z.enum(['named', 'rejected']) }),
])
export type StoredAddress = z.infer<typeof storedAddressSchema>

const siteSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('own_domain'), url: z.string(), domain: z.string() }),
  z.object({ kind: z.literal('builder'), url: z.string() }),
  z.object({ kind: z.literal('listing'), url: z.string() }),
])

const evidenceSchema = z.object({
  name: z.string(),
  site: siteSchema,
  pagesRead: z.array(z.string()),
  addresses: z.array(storedAddressSchema),
  note: z.string().nullable(),
})
export type ContactEvidence = z.infer<typeof evidenceSchema>

export type ContactDecision = {
  status: ContactStatus
  email: string | null
  sourceUrl: string | null
  kind: ContactKind | null
  rejectedCount: number
  namedCount: number
  /** null for no_page; { malformed: true } for an unclear entry that could not be read. */
  evidence: ContactEvidence | { malformed: true } | null
  rulesVersion: string
}

/** Whether an address may be kept whole in the evidence: a role, a never-for-contact word or a name token. */
function storable(email: string, tokens: readonly string[]): boolean {
  const local = compactLocal(normalizeReportedEmail(email))
  return (ROLE_LOCALS as readonly string[]).includes(local) || (NOT_CONTACT_LOCALS as readonly string[]).includes(local) || tokens.includes(local)
}

function decideFromEvidence(evidence: ContactEvidence): ContactDecision {
  const site = evidence.site as LeadSite
  const tokens = nameTokens(evidence.name)
  const seen = new Set<string>()
  const accepted: Extract<AddressJudgement, { outcome: 'accepted' }>[] = []
  let rejectedCount = 0
  let namedCount = 0

  for (const address of evidence.addresses) {
    if ('redacted' in address) {
      if (address.outcome === 'named') namedCount += 1
      else rejectedCount += 1
      continue
    }
    const key = normalizeReportedEmail(address.email)
    if (seen.has(key)) continue
    seen.add(key)
    const judged = judgeAddress(address, site, tokens)
    if (judged.outcome === 'accepted') accepted.push(judged)
    else if (judged.outcome === 'named') namedCount += 1
    else rejectedCount += 1
  }

  const result = (status: ContactStatus, chosen?: (typeof accepted)[number]): ContactDecision => ({
    status,
    email: chosen?.email ?? null,
    sourceUrl: chosen?.pageUrl ?? null,
    kind: chosen?.kind ?? null,
    rejectedCount,
    namedCount,
    evidence,
    rulesVersion: CONTACT_RULES_VERSION,
  })

  if (accepted.length > 0) {
    // Stable sort: ties keep first-seen order.
    const best = [...accepted].sort((a, b) => (a.kind === b.kind ? a.rank - b.rank : a.kind === 'own_domain' ? -1 : 1))[0]!
    return result('found', best)
  }
  if (namedCount > 0) return result('named_only')
  const readSomething = evidence.pagesRead.some((page) => pageAllowed(page, site)) || evidence.addresses.length > 0
  return result(readSomething ? 'none_found' : 'unclear')
}

/** Decides one lead from the runner's report and the lead as the server stored it. */
export function decideContact(lead: { name: string; site: LeadSite }, report: ContactLeadReport): ContactDecision {
  const tokens = nameTokens(lead.name)
  const evidence: ContactEvidence = {
    name: lead.name,
    site: lead.site,
    pagesRead: report.pages_read.map((page) => page.trim()),
    addresses: report.addresses.map((address) => {
      const linkHref = address.link_href?.trim()
      if (storable(address.email, tokens)) {
        return {
          email: address.email.trim(),
          pageUrl: address.page_url.trim(),
          context: address.context.trim(),
          ...(linkHref !== undefined ? { linkHref } : {}),
        }
      }
      // Judged now and kept only as its outcome: it may be a person's address, and so may its link.
      const judged = judgeAddress({ email: address.email, pageUrl: address.page_url, context: address.context, linkHref }, lead.site, tokens)
      return { redacted: true as const, outcome: judged.outcome === 'named' ? ('named' as const) : ('rejected' as const) }
    }),
    note: report.note?.trim() || null,
  }
  return decideFromEvidence(evidence)
}

/** No stored website or listing: decided by the server without the runner. */
export function noPageDecision(): ContactDecision {
  return { status: 'no_page', email: null, sourceUrl: null, kind: null, rejectedCount: 0, namedCount: 0, evidence: null, rulesVersion: CONTACT_RULES_VERSION }
}

/** A lead entry the server could not read. Nothing from it is kept. */
export function unclearDecision(): ContactDecision {
  return {
    status: 'unclear',
    email: null,
    sourceUrl: null,
    kind: null,
    rejectedCount: 0,
    namedCount: 0,
    evidence: { malformed: true },
    rulesVersion: CONTACT_RULES_VERSION,
  }
}

/**
 * Re-decides a stored result under the current rules, from its stored
 * evidence. null when the evidence is missing or malformed (no_page,
 * unclear entries, or a row from an unknown shape): the stored result is
 * then left as it is and nothing is guessed.
 */
export function rederiveContact(evidence: unknown): ContactDecision | null {
  const parsed = evidenceSchema.safeParse(evidence)
  return parsed.success ? decideFromEvidence(parsed.data) : null
}
