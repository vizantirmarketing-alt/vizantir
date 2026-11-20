/**
 * Step 2: prospect references are resolved in code against the database, by
 * name or domain, never trusted from the model. Pure; the search is injected
 * (sources.ts in production). No match says so; several matches are offered
 * as choices and nothing runs until the owner picks one.
 */

import { PROSPECT_REF_MAX } from '@/lib/assistant/catalog'

/** A prospect as a candidate: enough to tell them apart. */
export type ProspectCandidate = { id: string; name: string; domain: string; market: string | null; industry: string | null }

/** Name or domain search, select-only, at most `limit` rows. */
export type ProspectSearch = (term: string, limit: number) => Promise<ProspectCandidate[] | null>

/** Candidates shown when a reference is ambiguous. */
export const MAX_CANDIDATES = 5

export type Resolution =
  | { kind: 'one'; prospect: ProspectCandidate }
  | { kind: 'none' }
  | { kind: 'many'; candidates: ProspectCandidate[] }
  | { kind: 'failed' }

/** The search term for a reference: a URL becomes its host, without www. Wildcard characters are removed. */
export function searchTerm(ref: string): string {
  let term = ref.trim().slice(0, PROSPECT_REF_MAX).toLowerCase()
  term = term.replace(/^[a-z]+:\/\//, '').replace(/^www\./, '')
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/.*)?$/.test(term)) term = term.replace(/\/.*$/, '')
  return term.replace(/[%_\\*]/g, ' ').replace(/\s+/g, ' ').trim()
}

/** One reference. An exact name or domain match wins over partial ones; otherwise one row is a match and several are choices. */
export async function resolveProspect(search: ProspectSearch, ref: string): Promise<Resolution> {
  const term = searchTerm(ref)
  if (term.length === 0) return { kind: 'none' }
  const rows = await search(term, MAX_CANDIDATES + 1)
  if (rows === null) return { kind: 'failed' }
  if (rows.length === 0) return { kind: 'none' }
  const exact = rows.filter((row) => row.domain.toLowerCase() === term || row.name.trim().toLowerCase() === term)
  if (exact.length === 1) return { kind: 'one', prospect: exact[0]! }
  if (rows.length === 1) return { kind: 'one', prospect: rows[0]! }
  return { kind: 'many', candidates: (exact.length > 1 ? exact : rows).slice(0, MAX_CANDIDATES) }
}
