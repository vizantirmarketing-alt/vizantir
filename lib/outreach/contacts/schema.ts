/**
 * Wire format between the research runner and the contact-address ingest
 * route. Pure; no I/O.
 *
 * The batch itself is strict: an unknown top-level field rejects it. Each
 * lead entry is parsed on its own, also strictly, so one malformed entry does
 * not throw away the rest: the server records that lead as unclear.
 *
 * Note what is absent: the runner never sends a status, a classification, a
 * kind or which address to keep. It reports what it read and every address
 * it saw; the server decides everything (lib/outreach/contacts/rules.ts).
 */

import { z } from 'zod'

import { parseHttpUrl } from '@/lib/new-businesses/website-hosts'

export const CONTACT_INGEST_MAX_LEADS = 20
export const CONTACT_MAX_PAGE_READS = 3
export const CONTACT_MAX_ADDRESSES = 20
/** The text copied around an address, verbatim. */
export const CONTACT_CONTEXT_MAX_CHARS = 300
/** A mailto link's target, verbatim. */
export const CONTACT_LINK_HREF_MAX_CHARS = 500
export const CONTACT_INGEST_MAX_RUN_LINES = 50
/** Request body cap, checked before JSON parsing. */
export const CONTACT_INGEST_MAX_BODY_CHARS = 200_000

const httpUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .refine((value) => parseHttpUrl(value) !== null, { message: 'Must be an http or https URL.' })

export const reportedAddressSchema = z.strictObject({
  /** As it appeared on the page, as text or in a mailto link. Validated by the server. */
  email: z.string().trim().min(1).max(320),
  page_url: httpUrlSchema,
  /** For a mailto link: the visible link text and the words around it. */
  context: z.string().trim().min(1).max(CONTACT_CONTEXT_MAX_CHARS),
  /** For an address found as a mailto link: the link target, copied exactly. */
  link_href: z
    .string()
    .trim()
    .max(CONTACT_LINK_HREF_MAX_CHARS)
    .refine((value) => /^mailto:/i.test(value), { message: 'Must be a mailto link.' })
    .optional(),
})

export const contactLeadSchema = z.strictObject({
  /** The opaque lead id from the claim response. */
  id: z.uuid(),
  /** The pages actually read, at most three. */
  pages_read: z.array(httpUrlSchema).max(CONTACT_MAX_PAGE_READS),
  addresses: z.array(reportedAddressSchema).max(CONTACT_MAX_ADDRESSES),
  note: z.string().trim().max(300).optional(),
})

export const contactBatchSchema = z.strictObject({
  runId: z.uuid(),
  /** Each entry is checked separately; see parseContactLead. */
  leads: z.array(z.unknown()).max(CONTACT_INGEST_MAX_LEADS),
  /** Set on the last batch of a run. */
  finish: z.enum(['completed', 'failed']).optional(),
  runErrors: z.array(z.string().trim().min(1).max(500)).max(CONTACT_INGEST_MAX_RUN_LINES).optional(),
  runNotes: z.array(z.string().trim().min(1).max(500)).max(CONTACT_INGEST_MAX_RUN_LINES).optional(),
})

export type ReportedAddress = z.infer<typeof reportedAddressSchema>
export type ContactLeadReport = z.infer<typeof contactLeadSchema>
export type ContactBatch = z.infer<typeof contactBatchSchema>

export type ParsedContactLead =
  | { ok: true; report: ContactLeadReport }
  /** id is set when the entry carried a usable lead id, so the lead can be recorded as unclear. */
  | { ok: false; id: string | null }

export function parseContactLead(entry: unknown): ParsedContactLead {
  const parsed = contactLeadSchema.safeParse(entry)
  if (parsed.success) return { ok: true, report: parsed.data }
  const id = z.object({ id: z.uuid() }).safeParse(entry)
  return { ok: false, id: id.success ? id.data.id.toLowerCase() : null }
}

export type ParseContactBodyResult =
  | { ok: true; batch: ContactBatch }
  | { ok: false; status: 400 | 413; error: string; issues?: string[] }

/** Parses a raw request body. Size is checked before JSON parsing. */
export function parseContactBody(raw: string): ParseContactBodyResult {
  if (raw.length > CONTACT_INGEST_MAX_BODY_CHARS) return { ok: false, status: 413, error: 'Payload too large' }
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return { ok: false, status: 400, error: 'Invalid JSON' }
  }
  const parsed = contactBatchSchema.safeParse(json)
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      error: 'Invalid payload',
      issues: parsed.error.issues.slice(0, 20).map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`),
    }
  }
  return { ok: true, batch: parsed.data }
}

/** Every lead entry checked locally, for the runner helper: the same parse the server makes. */
export function leadIssues(batch: ContactBatch): string[] {
  const issues: string[] = []
  batch.leads.forEach((entry, index) => {
    const parsed = contactLeadSchema.safeParse(entry)
    if (!parsed.success) {
      for (const issue of parsed.error.issues.slice(0, 5)) issues.push(`leads.${index}.${issue.path.join('.') || '(entry)'}: ${issue.message}`)
    }
  })
  return issues
}
