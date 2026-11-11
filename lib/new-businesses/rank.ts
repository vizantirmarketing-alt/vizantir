/**
 * Deterministic lead ranking for stored new businesses. Pure: no I/O, no
 * clock, no randomness. The same rows always produce the same scores.
 *
 * Businesses, not license rows, are ranked: rows are grouped by
 * lib/new-businesses/group.ts, each business is scored once from all of its
 * licenses, and every row of the business carries that score. Version 3 adds
 * the website check result (lib/new-businesses/website-rules.ts) when there
 * is one.
 *
 * The score only orders the list. It never hides, deletes, skips or rejects
 * a business.
 *
 * Shared phone and shared address signals depend on the whole stored set, so
 * callers rank every stored row together.
 */

import { categoryShortName, categoryTier, type CategoryTier } from '@/lib/new-businesses/category-tiers'
import { groupBusinesses, type BusinessGroup, type GroupInput } from '@/lib/new-businesses/group'
import { isLocalPhone, locationKey, normalizeAddress, normalizeName, normalizePhone } from '@/lib/new-businesses/normalize'
import { WEBSITE_STATUSES, type WebsiteStatus } from '@/lib/new-businesses/website-rules'

export const RANK_VERSION = 'new-business-rank-v3'

export const RANK_WEIGHTS = {
  type: { high: 60, medium: 40, low: 15 } satisfies Record<CategoryTier, number>,
  hasPhone: 5,
  localPhone: 10,
  tollFreePhone: 0,
  outOfAreaPhone: -10,
  severalLicenses: 5,
  sharedPhone: -40,
  sharedLocation: -20,
  addressOrHoldingName: -35,
  storeNumber: -25,
  /** Applied only when a website check result exists. */
  website: {
    no_website: 20,
    social_only: 15,
    placeholder: 15,
    free_builder: 10,
    has_website: -30,
    unclear: 0,
  } satisfies Record<WebsiteStatus, number>,
  /** Distinct categories one business holds to count as several licenses. */
  severalLicensesMin: 2,
  /** Distinct business names on one phone number to count as a filing service pattern. */
  sharedPhoneMinNames: 3,
  /** Distinct business names at one address and suite to count as a shared location. */
  sharedLocationMinNames: 5,
  likelyMin: 70,
  possibleMin: 40,
} as const

export const TOLL_FREE_AREA_CODES = ['800', '833', '844', '855', '866', '877', '888'] as const

export const LEAD_TIERS = ['likely', 'possible', 'low'] as const
export type LeadTier = (typeof LEAD_TIERS)[number]

export const LEAD_TIER_LABELS: Record<LeadTier, string> = {
  likely: 'Likely',
  possible: 'Possible',
  low: 'Low',
}

export type RankSignalKey =
  | 'website'
  | 'type'
  | 'has_phone'
  | 'local_phone'
  | 'toll_free_phone'
  | 'out_of_area_phone'
  | 'no_phone'
  | 'several_licenses'
  | 'shared_phone'
  | 'shared_location'
  | 'address_or_holding_name'
  | 'store_number'

export type RankSignal = { key: RankSignalKey; label: string; points: number }

export type RankResult = { score: number; tier: LeadTier; signals: RankSignal[] }

export type RankInput = {
  name: string
  address: string | null
  suite: string | null
  phone: string | null
  category: string
}

/** One business: its representative name, location and phone, and every category it holds. */
export type BusinessRankInput = {
  name: string
  address: string | null
  suite: string | null
  phone: string | null
  categories: readonly string[]
  /** The website check result, or null when the business has not been checked. */
  website?: WebsiteStatus | null
}

const WEBSITE_SIGNAL_LABELS: Record<WebsiteStatus, string> = {
  no_website: 'No website found',
  social_only: 'Social or directory page only',
  placeholder: 'Website is a placeholder',
  free_builder: 'Free builder page, no own domain',
  has_website: 'Has a website',
  unclear: 'Website check unclear',
}

/** Counts for one business, taken from every stored row. */
export type RankCounts = {
  /** Distinct business names using this phone number (1 when alone, 0 without a phone). */
  phoneNames: number
  /** Distinct business names at this address and suite (1 when alone, 0 without an address). */
  locationNames: number
}

export function tierForScore(score: number): LeadTier {
  if (score >= RANK_WEIGHTS.likelyMin) return 'likely'
  if (score >= RANK_WEIGHTS.possibleMin) return 'possible'
  return 'low'
}

// --- Name patterns. Conservative: a false match on a real shop is worse than a miss.

const ENTITY_TAIL = String.raw`(?:\s+(?:LLC|L L C|INC|CORP|CO|LTD|LP|LLP|TRUST))*`
const STREET_SUFFIX = String.raw`(?:ST|AVE|BLVD|RD|DR|LN|WAY|PKWY|HWY|CIR|CT|PL|TER|LOOP|TRL|PLZ|SQ)`

/**
 * The whole name is a street address, optionally followed by a unit and an
 * entity suffix: "3330 FREMONT STREET LLC", "1200 S MAIN ST UNIT 4 LLC".
 * "101 Main St Cafe" is not matched: it has words after the address.
 */
const ADDRESS_NAME = new RegExp(
  String.raw`^\d{1,6}(?:\s+[NSEW])?(?:\s+[A-Z0-9]+){1,4}\s+${STREET_SUFFIX}(?:\s+(?:UNIT|STE|SUITE|APT|BLDG)\s+[A-Z0-9]+)?${ENTITY_TAIL}$`,
)

/**
 * A house number, a compass direction and a street name, ending in an entity
 * suffix: "4675 E FLAMINGO LLC", "3707 EAST FLAMINGO LLC". The direction and
 * the suffix are both required, so "530 Electric LLC" and "503 Flooring LLC"
 * do not match.
 */
const DIRECTION_ADDRESS_NAME = new RegExp(
  String.raw`^\d{3,6}\s+[NSEW](?:\s+[A-Z]+){1,2}(?:\s+(?:LLC|L L C|INC|CORP|LTD|LP|LLP|TRUST))+$`,
)

/**
 * The name ends in a holding-style word, before any entity suffix:
 * "Smith Family Trust", "Desert Holdings LLC", "Gold Coast Investments LLC".
 * Only the final word counts, so "Capital Barbers" and "Trust Plumbing" do not match.
 */
const HOLDING_NAME = new RegExp(
  String.raw`\s(?:HOLDINGS?|PROPERTIES|INVESTMENTS|TRUST|CAPITAL)${ENTITY_TAIL.replace('|TRUST', '')}$`,
)

/**
 * "#1234", "# 0456", "STORE 0456", "STORE #12", "STORE #42923A". A short "#2"
 * or "#57" is not counted: small local businesses number their second site too.
 */
const STORE_NUMBER = /(?:#\s?\d{3,}[A-Z]?\b|\bSTORE\s*#?\s*\d{2,}[A-Z]?\b)/

function nameForPatterns(name: string): string {
  return name
    .toUpperCase()
    .replace(/&/g, ' AND ')
    .replace(/[^A-Z0-9# ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function isAddressName(name: string): boolean {
  const text = nameForPatterns(name).replace(/#/g, ' ').replace(/\s+/g, ' ')
  const expanded = normalizeAddress(text) ?? ''
  return ADDRESS_NAME.test(expanded) || DIRECTION_ADDRESS_NAME.test(expanded)
}

export function isHoldingName(name: string): boolean {
  const text = nameForPatterns(name).replace(/#/g, ' ').replace(/\s+/g, ' ')
  return HOLDING_NAME.test(text)
}

export function hasStoreNumber(name: string): boolean {
  return STORE_NUMBER.test(nameForPatterns(name))
}

// --- Counts across the stored set.

export type RankGroups = {
  phoneNames: Map<string, Set<string>>
  locationNames: Map<string, Set<string>>
}

function add(map: Map<string, Set<string>>, key: string | null, value: string) {
  if (key === null || value.length === 0) return
  const set = map.get(key) ?? new Set<string>()
  set.add(value)
  map.set(key, set)
}

export function buildRankGroups(rows: readonly Pick<RankInput, 'name' | 'address' | 'suite' | 'phone'>[]): RankGroups {
  const groups: RankGroups = { phoneNames: new Map(), locationNames: new Map() }
  for (const row of rows) {
    const name = normalizeName(row.name)
    add(groups.phoneNames, normalizePhone(row.phone), name)
    add(groups.locationNames, locationKey(row.address, row.suite), name)
  }
  return groups
}

export function countsFor(groups: RankGroups, business: Pick<BusinessRankInput, 'address' | 'suite' | 'phone'>): RankCounts {
  const phone = normalizePhone(business.phone)
  const location = locationKey(business.address, business.suite)
  return {
    phoneNames: phone === null ? 0 : groups.phoneNames.get(phone)?.size ?? 1,
    locationNames: location === null ? 0 : groups.locationNames.get(location)?.size ?? 1,
  }
}

function others(count: number): string {
  const n = count - 1
  return `${n} other new ${n === 1 ? 'license' : 'licenses'}`
}

const TIER_ORDER: Record<CategoryTier, number> = { high: 0, medium: 1, low: 2 }

/** The business's best category: highest tier, then alphabetical for stability. */
export function leadingCategory(categories: readonly string[]): string {
  return [...categories].sort((a, b) => TIER_ORDER[categoryTier(a)] - TIER_ORDER[categoryTier(b)] || a.localeCompare(b))[0] ?? ''
}

// --- Scoring.

export function rankBusiness(business: BusinessRankInput, counts: RankCounts): RankResult {
  const w = RANK_WEIGHTS
  const signals: RankSignal[] = []
  const category = leadingCategory(business.categories)
  const tier = categoryTier(category)
  const short = categoryShortName(category)
  signals.push({
    key: 'type',
    label: tier === 'low' ? `${short} license, which rarely has its own website` : `${short} license`,
    points: w.type[tier],
  })

  const phone = normalizePhone(business.phone)
  if (phone === null) {
    signals.push({ key: 'no_phone', label: 'No phone number on the license', points: 0 })
  } else {
    signals.push({ key: 'has_phone', label: 'Phone number on the license', points: w.hasPhone })
    const areaCode = phone.slice(0, 3)
    if (isLocalPhone(phone)) {
      signals.push({ key: 'local_phone', label: 'Local 702 or 725 phone number', points: w.localPhone })
    } else if ((TOLL_FREE_AREA_CODES as readonly string[]).includes(areaCode)) {
      signals.push({ key: 'toll_free_phone', label: `Toll-free ${areaCode} phone number`, points: w.tollFreePhone })
    } else {
      signals.push({
        key: 'out_of_area_phone',
        label: `Phone number from outside Las Vegas (area code ${areaCode}), often a franchise or corporate office`,
        points: w.outOfAreaPhone,
      })
    }
  }

  const licenses = new Set(business.categories.map((c) => c.trim())).size
  if (licenses >= w.severalLicensesMin) {
    signals.push({ key: 'several_licenses', label: `Holds ${licenses} licenses`, points: w.severalLicenses })
  }

  if (phone !== null && counts.phoneNames >= w.sharedPhoneMinNames) {
    signals.push({ key: 'shared_phone', label: `Shares a phone number with ${others(counts.phoneNames)}`, points: w.sharedPhone })
  }

  if (counts.locationNames >= w.sharedLocationMinNames) {
    signals.push({ key: 'shared_location', label: `Shares an address with ${others(counts.locationNames)}`, points: w.sharedLocation })
  }

  if (isAddressName(business.name)) {
    signals.push({ key: 'address_or_holding_name', label: 'Name is a street address', points: w.addressOrHoldingName })
  } else if (isHoldingName(business.name)) {
    signals.push({ key: 'address_or_holding_name', label: 'Name looks like a holding or property company', points: w.addressOrHoldingName })
  }

  if (hasStoreNumber(business.name)) {
    signals.push({ key: 'store_number', label: 'Name has a store number, so likely a chain location', points: w.storeNumber })
  }

  if (business.website !== undefined && business.website !== null) {
    signals.push({ key: 'website', label: WEBSITE_SIGNAL_LABELS[business.website], points: w.website[business.website] })
  }

  const raw = signals.reduce((sum, signal) => sum + signal.points, 0)
  const score = Math.max(0, Math.min(100, raw))
  return { score, tier: tierForScore(score), signals }
}

export type RankableStoredRow = RankInput & GroupInput & {
  /** Written to every row of a business by a website check; null when unchecked. */
  websiteStatus: WebsiteStatus | null
}

function isWebsiteStatus(value: unknown): value is WebsiteStatus {
  return WEBSITE_STATUSES.some((status) => status === value)
}

export type RankedBusiness = { group: BusinessGroup; result: RankResult }

/**
 * Groups every stored row into businesses and ranks each business once.
 * The representative name, location and phone come from the primary row;
 * when it has no phone, the first row with one is used.
 */
export function rankStoredRows(rows: readonly RankableStoredRow[]): RankedBusiness[] {
  const counts = buildRankGroups(rows)
  const byId = new Map(rows.map((row) => [row.id, row]))
  return groupBusinesses(rows).map((group) => {
    const primary = byId.get(group.primaryId)!
    const members = group.rowIds.map((id) => byId.get(id)!)
    const phone = normalizePhone(primary.phone) !== null ? primary.phone : members.find((row) => normalizePhone(row.phone) !== null)?.phone ?? null
    const business: BusinessRankInput = {
      name: primary.name,
      address: primary.address,
      suite: primary.suite,
      phone,
      categories: group.categories,
      website: members.map((row) => row.websiteStatus).find(isWebsiteStatus) ?? null,
    }
    return { group, result: rankBusiness(business, countsFor(counts, business)) }
  })
}

/** Signals worth showing: they set this business apart from a typical local one. */
const DISTINGUISHING: ReadonlySet<RankSignalKey> = new Set([
  'out_of_area_phone',
  'toll_free_phone',
  'no_phone',
  'shared_phone',
  'shared_location',
  'address_or_holding_name',
  'store_number',
])

/**
 * The reason line under a business name: the website finding first when
 * there is one, then the type, then only what distinguishes the business,
 * largest effect first. A typical unchecked local shop reads just
 * "Restaurant license"; a checked one "No website found · Restaurant license".
 */
export function reasonLine(signals: readonly RankSignal[], limit = 2): string {
  const website = signals.find((signal) => signal.key === 'website')
  const type = signals.find((signal) => signal.key === 'type')
  const extra = signals
    .map((signal, index) => ({ signal, index }))
    .filter(({ signal }) => DISTINGUISHING.has(signal.key))
    .sort((a, b) => Math.abs(b.signal.points) - Math.abs(a.signal.points) || a.index - b.index)
    .slice(0, limit)
    .map(({ signal }) => signal.label)
  // The website finding and the type keep their capitals ("No website found ·
  // Restaurant license"); the distinguishing parts read as a continuation.
  const lead = [website?.label, type?.label].filter((part): part is string => part !== undefined)
  const rest = extra.map((part, i) => (lead.length === 0 && i === 0 ? part : lowerFirst(part)))
  return [...lead, ...rest].join(' · ')
}

function lowerFirst(text: string): string {
  // Keep acronyms and numbers as they are ("LLC", "702").
  if (text.length < 2 || /[A-Z0-9]/.test(text[1]!)) return text
  return text[0]!.toLowerCase() + text.slice(1)
}
