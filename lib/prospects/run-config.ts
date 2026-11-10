/**
 * Campaign config for a research run. Pure.
 *
 * The owner's request form produces it (runRequestSchema); the store reads it
 * back from prospect_runs.config (storedRunConfigSchema), tolerating rows
 * written before a field existed.
 */

import { z } from 'zod'

import { normalizeDomain } from '@/lib/prospects/domain'
import type { RunConfig } from '@/lib/prospects/ingest'
import {
  RUN_EXCLUSIONS_MAX,
  RUN_TARGET_COUNT_MAX,
  RUN_TEXT_MAX,
} from '@/lib/prospects/params'

export const runRequestSchema = z.object({
  market: z
    .string()
    .trim()
    .min(1, 'Enter a market.')
    .max(RUN_TEXT_MAX, `Market cannot exceed ${RUN_TEXT_MAX} characters.`),
  industry: z
    .string()
    .trim()
    .min(1, 'Enter an industry.')
    .max(RUN_TEXT_MAX, `Industry cannot exceed ${RUN_TEXT_MAX} characters.`),
  targetCount: z.coerce
    .number({ message: 'Enter a number of companies.' })
    .int('Enter a whole number.')
    .min(1, 'Request at least 1 company.')
    .max(RUN_TARGET_COUNT_MAX, `Request at most ${RUN_TARGET_COUNT_MAX} companies.`),
  exclusions: z.string().max(10_000).optional(),
})

export type ParseRunExclusionsResult =
  | { ok: true; domains: string[] }
  | { ok: false; error: string }

/** Splits a free-text exclusion list (commas, spaces, newlines) into normalized domains. */
export function parseRunExclusions(raw: string | undefined): ParseRunExclusionsResult {
  if (raw === undefined || raw.trim().length === 0) {
    return { ok: true, domains: [] }
  }

  const entries = raw
    .split(/[\s,]+/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)

  const domains: string[] = []
  for (const entry of entries) {
    const domain = normalizeDomain(entry)
    if (domain === null) {
      return { ok: false, error: `Not a valid domain: ${entry.slice(0, 80)}` }
    }
    if (!domains.includes(domain)) {
      domains.push(domain)
    }
  }

  if (domains.length > RUN_EXCLUSIONS_MAX) {
    return {
      ok: false,
      error: `Exclude at most ${RUN_EXCLUSIONS_MAX} domains per run.`,
    }
  }

  return { ok: true, domains }
}

export const storedRunConfigSchema = z.object({
  market: z.string(),
  industry: z.string(),
  targetCount: z.number().int(),
  exclusions: z.array(z.string()).default([]),
})

export function readRunConfig(value: unknown): RunConfig | null {
  const parsed = storedRunConfigSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}
