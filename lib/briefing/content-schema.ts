/**
 * Reads stored briefing content back. Pure. Content is written only by
 * generateBriefing, but it is parsed rather than trusted so a malformed row
 * renders as unavailable instead of breaking the page. Content from an older
 * content version does not parse; regenerate that day to see it again.
 */

import { z } from 'zod'

import { BRIEFING_CONTENT_VERSION, type BriefingContent, type SourceFreshness } from '@/lib/briefing/context'

const sourceSchema = z.object({
  provider: z.string(),
  label: z.string(),
  state: z.enum(['ok', 'stale', 'failed', 'partial', 'never']),
  lastRunAt: z.string().nullable(),
  message: z.string().nullable(),
})

export const briefingContentSchema = z.object({
  version: z.literal(BRIEFING_CONTENT_VERSION),
  briefingDate: z.string(),
  generatedAt: z.string(),
  windows: z.object({
    prospectsSince: z.string(),
    runsSince: z.string(),
    inquiriesSince: z.string(),
  }),
  newProspects: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      domain: z.string(),
      priority: z.number().nullable(),
      fitScore: z.number().nullable(),
      opportunityScore: z.number().nullable(),
      confidence: z.string(),
      performance: z.string().nullable(),
      highlight: z
        .object({ factorKey: z.string(), claim: z.string(), sourceUrl: z.string() })
        .nullable(),
    }),
  ),
  newProspectsTotal: z.number(),
  topUnreviewed: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      domain: z.string(),
      priority: z.number().nullable(),
      fitScore: z.number().nullable(),
      opportunityScore: z.number().nullable(),
    }),
  ),
  inquiries: z.object({
    newCount: z.number().nullable(),
    deliveryIssues: z.number().nullable(),
    recentTotal: z.number(),
    recent: z.array(
      z.object({
        id: z.string(),
        status: z.string(),
        company: z.string().nullable(),
        ageDays: z.number().nullable(),
      }),
    ),
    olderCount: z.number(),
  }),
  findings: z.object({
    openCount: z.number(),
    items: z.array(
      z.object({
        findingKey: z.string(),
        title: z.string(),
        category: z.string(),
        confidence: z.string(),
        status: z.string(),
      }),
    ),
  }),
  runs: z.array(
    z.object({
      id: z.string(),
      state: z.string(),
      market: z.string().nullable(),
      industry: z.string().nullable(),
      saved: z.number(),
      requested: z.number().nullable(),
      finishedAt: z.string().nullable(),
      errors: z.array(z.string()),
      notes: z.array(z.string()),
    }),
  ),
  sources: z.array(sourceSchema),
  newBusinesses: z.object({ count: z.number(), since: z.string(), noWebsite: z.number().optional() }).optional(),
  unavailable: z.array(z.string()),
  quiet: z.boolean(),
  suggestedActions: z.array(z.object({ recordId: z.string(), text: z.string() })).nullable(),
})

export function readBriefingContent(value: unknown): BriefingContent | null {
  const parsed = briefingContentSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

export function readSourceFreshness(value: unknown): SourceFreshness[] {
  const parsed = z.array(sourceSchema).safeParse(value)
  return parsed.success ? parsed.data : []
}
