import 'server-only'

/**
 * Two facts per accepted lead for the Outreach page: whether it has a
 * specific finding (hasSpecificFinding, the one definition) and the phone
 * number on its license record. Selects only; reads no owner note, address
 * or review history.
 *
 *   prospect      its stored observations, its factor ratings and domain, so
 *                 the finding is judged exactly as drafting judges it. A
 *                 prospect has no license record, so no phone.
 *   new business  the website check status, and the phone on the primary
 *                 license row, or on another row of the business when the
 *                 primary has none
 */

import { z } from 'zod'

import { NEW_BUSINESS_SOURCE } from '@/lib/new-businesses/discovery'
import { WEBSITE_STATUSES } from '@/lib/new-businesses/website-rules'
import { hasSpecificFinding } from '@/lib/outreach/context'
import type { OutreachSubjectType } from '@/lib/outreach/params'
import { readFactorRatings } from '@/lib/prospects/rubric'
import { createSupabaseServiceRole } from '@/lib/supabase/service'

export type LeadFacts = { phone: string | null; hasFinding: boolean }

const ID_BATCH = 200

const key = (subjectType: OutreachSubjectType, subjectRef: string) => `${subjectType}:${subjectRef}`

/** Facts keyed by "subjectType:subjectRef"; null when they cannot be read. */
export async function loadLeadFacts(): Promise<Map<string, LeadFacts> | null> {
  try {
    const supabase = createSupabaseServiceRole()
    const [prospects, businesses] = await Promise.all([
      supabase.from('prospects').select('id, domain, factor_ratings').eq('review_status', 'accepted'),
      supabase
        .from('new_businesses')
        .select('id, group_key, group_primary, website_status, phone')
        .eq('source', NEW_BUSINESS_SOURCE)
        .eq('review_status', 'accepted'),
    ])
    if (prospects.error || businesses.error) return null
    const prospectRows = z.array(z.object({ id: z.string(), domain: z.string(), factor_ratings: z.unknown() })).safeParse(prospects.data ?? [])
    const businessRows = z
      .array(
        z.object({
          id: z.string(),
          group_key: z.string().nullable(),
          group_primary: z.boolean().nullable(),
          website_status: z.enum(WEBSITE_STATUSES).nullable(),
          phone: z.string().nullable(),
        }),
      )
      .safeParse(businesses.data ?? [])
    if (!prospectRows.success || !businessRows.success) return null

    const facts = new Map<string, LeadFacts>()

    const ids = prospectRows.data.map((row) => row.id)
    const observations = new Map<string, { factorKey: string; kind: string; claim: string }[]>()
    for (let i = 0; i < ids.length; i += ID_BATCH) {
      const { data, error } = await supabase
        .from('prospect_evidence')
        .select('prospect_id, factor_key, kind, claim')
        .eq('kind', 'observation')
        .in('prospect_id', ids.slice(i, i + ID_BATCH))
      if (error) return null
      const rows = z.array(z.object({ prospect_id: z.string(), factor_key: z.string(), kind: z.string(), claim: z.string() })).safeParse(data ?? [])
      if (!rows.success) return null
      for (const row of rows.data) {
        observations.set(row.prospect_id, [...(observations.get(row.prospect_id) ?? []), { factorKey: row.factor_key, kind: row.kind, claim: row.claim }])
      }
    }
    for (const row of prospectRows.data) {
      const hasFinding = hasSpecificFinding({
        type: 'prospect',
        domain: row.domain,
        factorRatings: readFactorRatings(row.factor_ratings),
        evidence: observations.get(row.id) ?? [],
      })
      facts.set(key('prospect', row.id), { phone: null, hasFinding })
    }

    // Primary rows first, so the primary row's phone and status win.
    const ordered = [...businessRows.data].sort((a, b) => Number(b.group_primary ?? false) - Number(a.group_primary ?? false))
    for (const row of ordered) {
      const ref = key('new_business', row.group_key ?? row.id)
      const phone = row.phone?.trim() || null
      const existing = facts.get(ref)
      if (existing === undefined) {
        facts.set(ref, { phone, hasFinding: hasSpecificFinding({ type: 'new_business', websiteStatus: row.website_status }) })
      } else if (existing.phone === null && phone !== null) {
        existing.phone = phone
      }
    }
    return facts
  } catch {
    return null
  }
}

/** The phone on a business's license record, for the draft page; null for a prospect, none on record, or a failed read. */
export async function loadLeadPhone(subjectType: OutreachSubjectType, subjectRef: string, leadId: string): Promise<string | null> {
  if (subjectType !== 'new_business') return null
  try {
    const supabase = createSupabaseServiceRole()
    const primary = await supabase.from('new_businesses').select('phone, group_key').eq('id', leadId).eq('source', NEW_BUSINESS_SOURCE).maybeSingle()
    if (primary.error) return null
    const row = z.object({ phone: z.string().nullable(), group_key: z.string().nullable().optional() }).safeParse(primary.data)
    if (!row.success) return null
    if (row.data.phone?.trim()) return row.data.phone.trim()
    if (subjectRef === leadId) return null
    const others = await supabase.from('new_businesses').select('phone').eq('source', NEW_BUSINESS_SOURCE).eq('group_key', subjectRef).not('phone', 'is', null).limit(1)
    if (others.error) return null
    const other = z.array(z.object({ phone: z.string().nullable() })).safeParse(others.data ?? [])
    return other.success ? (other.data[0]?.phone?.trim() || null) : null
  } catch {
    return null
  }
}
