import 'server-only'

/**
 * Production reads for the command center. Every function is read-only:
 *   latestBriefing     createBriefingStore().getLatest()   lib/briefing/store.ts
 *   prospectDetail     fetchProspectDetail                 lib/prospects/load.ts
 *   openInquiries      fetchLeads, one status at a time    lib/intel/leads.ts
 *   findings           fetchDecisionFeed                   lib/intel/decisions/feed.ts
 * plus one select-only prospect search by name or domain below
 * (searchProspects), which reads id, name, domain, market and industry only.
 * Nothing here inserts, updates, deletes, calls an RPC or fetches a URL.
 */

import type { AssistantSources, InquiryStatusRead } from '@/lib/assistant/context'
import { OPEN_INQUIRY_STATUSES } from '@/lib/assistant/context'
import type { ProspectCandidate } from '@/lib/assistant/resolve'
import { createBriefingStore } from '@/lib/briefing/store'
import { fetchDecisionFeed } from '@/lib/intel/decisions/feed'
import { fetchLeads } from '@/lib/intel/leads'
import { fetchProspectDetail } from '@/lib/prospects/load'
import { createSupabaseServiceRole } from '@/lib/supabase/service'

function toCandidate(row: unknown): ProspectCandidate | null {
  if (typeof row !== 'object' || row === null) return null
  const id = Reflect.get(row, 'id')
  const name = Reflect.get(row, 'canonical_name')
  const domain = Reflect.get(row, 'domain')
  const market = Reflect.get(row, 'market')
  const industry = Reflect.get(row, 'industry')
  if (typeof id !== 'string' || typeof name !== 'string' || typeof domain !== 'string') return null
  return { id, name, domain, market: typeof market === 'string' ? market : null, industry: typeof industry === 'string' ? industry : null }
}

/**
 * Prospects whose name or domain contains the term, two plain ilike selects
 * (no filter-string building), merged by id. The term arrives without
 * wildcard characters (resolve.ts searchTerm).
 */
async function searchProspects(term: string, limit: number): Promise<ProspectCandidate[] | null> {
  const client = createSupabaseServiceRole()
  const columns = 'id, canonical_name, domain, market, industry'
  const pattern = `%${term}%`
  const [byName, byDomain] = await Promise.all([
    client.from('prospects').select(columns).ilike('canonical_name', pattern).order('canonical_name').limit(limit),
    client.from('prospects').select(columns).ilike('domain', pattern).order('domain').limit(limit),
  ])
  if (byName.error || byDomain.error) return null
  const merged = new Map<string, ProspectCandidate>()
  for (const row of [...(byName.data ?? []), ...(byDomain.data ?? [])]) {
    const candidate = toCandidate(row)
    if (candidate !== null) merged.set(candidate.id, candidate)
  }
  return [...merged.values()].slice(0, limit)
}

export const assistantSources: AssistantSources = {
  async latestBriefing() {
    try {
      const latest = await createBriefingStore().getLatest()
      if (latest === null) return { ok: true, briefing: null }
      return {
        ok: true,
        briefing: { briefingDate: latest.briefingDate, generatedAt: latest.generatedAt, status: latest.status, content: latest.content },
      }
    } catch {
      return { ok: false }
    }
  },
  prospectDetail: (id) => fetchProspectDetail(id),
  async searchProspects(term, limit) {
    try {
      return await searchProspects(term, limit)
    } catch {
      return null
    }
  },
  async openInquiries() {
    const reads = await Promise.all(
      OPEN_INQUIRY_STATUSES.map(async (status): Promise<InquiryStatusRead | null> => {
        const result = await fetchLeads({ status, channel: 'all', q: '', sort: 'newest', page: 1 })
        return result.ok ? { status, total: result.total, rows: result.rows } : null
      }),
    )
    return reads.some((read) => read === null) ? null : (reads as InquiryStatusRead[])
  },
  async findings() {
    const feed = await fetchDecisionFeed()
    return feed.ok ? feed.sections.flatMap((section) => section.items) : null
  },
}
