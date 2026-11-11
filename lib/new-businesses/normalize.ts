/**
 * Small pure normalisers used to group new business rows for lead ranking.
 * Conservative on purpose: they only remove differences in punctuation,
 * spacing, case and common abbreviations, never meaning.
 */

/** Ten-digit US phone number, or null when the value is not one. */
export function normalizePhone(value: string | null | undefined): string | null {
  const digits = (value ?? '').replace(/\D/g, '')
  const ten = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits
  return ten.length === 10 ? ten : null
}

export const LOCAL_AREA_CODES = ['702', '725'] as const

export function isLocalPhone(phone: string | null): boolean {
  return phone !== null && LOCAL_AREA_CODES.some((code) => phone.startsWith(code))
}

const ENTITY_SUFFIXES = new Set([
  'LLC', 'L L C', 'INC', 'INCORPORATED', 'CORP', 'CORPORATION', 'CO', 'COMPANY', 'LTD', 'LIMITED',
  'PLLC', 'LLP', 'LP', 'PC', 'PA', 'DBA',
])

function basic(value: string): string {
  return value
    .toUpperCase()
    .replace(/&/g, ' AND ')
    .replace(/[^A-Z0-9# ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Business name without punctuation, case or trailing entity suffixes, so
 * "Desert Bloom, LLC" and "DESERT BLOOM LLC" group together.
 */
export function normalizeName(value: string | null | undefined): string {
  let name = basic(value ?? '').replace(/#/g, ' ').replace(/\s+/g, ' ').trim()
  for (;;) {
    const words = name.split(' ')
    if (words.length < 2) break
    const last = words[words.length - 1]!
    const lastTwo = words.slice(-3).join(' ')
    if (lastTwo === 'L L C') {
      name = words.slice(0, -3).join(' ')
      continue
    }
    if (ENTITY_SUFFIXES.has(last)) {
      name = words.slice(0, -1).join(' ')
      continue
    }
    break
  }
  return name
}

const STREET_WORDS: Record<string, string> = {
  STREET: 'ST', AVENUE: 'AVE', AV: 'AVE', BOULEVARD: 'BLVD', ROAD: 'RD', DRIVE: 'DR', LANE: 'LN',
  PARKWAY: 'PKWY', HIGHWAY: 'HWY', CIRCLE: 'CIR', COURT: 'CT', PLACE: 'PL', TERRACE: 'TER',
  NORTH: 'N', SOUTH: 'S', EAST: 'E', WEST: 'W',
}

/** Street address with common abbreviations unified ("Street" and "St"). */
export function normalizeAddress(value: string | null | undefined): string | null {
  const text = basic(value ?? '').replace(/#/g, ' ').replace(/\s+/g, ' ').trim()
  if (text.length === 0) return null
  return text
    .split(' ')
    .map((word) => STREET_WORDS[word] ?? word)
    .join(' ')
}

/** Suite or unit without its label: "Ste 1", "Suite #1" and "1" are the same. */
export function normalizeSuite(value: string | null | undefined): string | null {
  const text = basic(value ?? '')
    .replace(/#/g, ' ')
    .replace(/\b(SUITE|STE|UNIT|APT|APARTMENT|SPACE|SPC|BLDG|BUILDING|NO|NUMBER)\b/g, ' ')
    .replace(/\s+/g, '')
  return text.length > 0 ? text : null
}

/** A street location: address plus suite, so different suites are different places. */
export function locationKey(address: string | null | undefined, suite: string | null | undefined): string | null {
  const street = normalizeAddress(address)
  if (street === null) return null
  return `${street}|${normalizeSuite(suite) ?? ''}`
}
