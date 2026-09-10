import type { DetectorFamily, Discipline } from '@/lib/intel/decision-params'

/**
 * Detector identity registry — the source of truth for §17.4's sub-identity.
 *
 * S11: one top-level category, `search_intelligence`, with structured identity
 * beneath it on two orthogonal axes. `discipline` answers "which section does
 * this render in"; `detector_family` answers "what kind of work does this
 * imply". They are independent — a `technical` finding can be SEO (a 404 on a
 * sitemap URL) or GEO (an AI crawler getting a non-200).
 *
 * DELIBERATELY NOT A DATABASE CHECK CONSTRAINT. decision_items.discipline and
 * .detector_family are plain unconstrained text. A constrained column would
 * mean a migration hand-applied through the SQL editor before every new
 * detector family, and if the order slipped the insert would fail closed and
 * the detector would silently never run. That is invariant 12, and it is the
 * exact failure that left psi and gbp writing rows nothing could read. The
 * columns are a queryable denormalised copy; this map wins on any
 * disagreement, and a backfill is a single UPDATE because `detector` is on
 * every row.
 *
 * Applied at persist time in run.ts by detector name, so a detector never
 * carries its own taxonomy and the two cannot drift apart.
 *
 * Only detectors that exist are registered. Phase 2c added `schema-drift`
 * (aeo/schema); Phase 2d added `llms-drift` and `crawler-absence`
 * (geo/ai-crawler-visibility). See §18.2 and §18.3.
 *
 * The three pre-existing GSC detectors — buried-demand, within-reach and
 * geo-signal — are intentionally absent. §17.4: they keep category
 * `opportunity` in Phase 2, and reclassifying them would mean an UPDATE across
 * live rows plus a visible reshuffle of the Overview. They resolve to null
 * discipline and null family, which is correct rather than missing.
 *
 * NAMING COLLISION, flagged in §17.4 and repeated here because it is genuinely
 * confusing: the existing `geo-signal` detector means GEOGRAPHIC (Reno,
 * Phoenix). The `geo` discipline means GENERATIVE ENGINE OPTIMIZATION. They
 * are unrelated concepts one hyphen apart. `geo-signal` is not registered, so
 * nothing breaks today.
 */

export type DetectorIdentity = {
  discipline: Discipline
  family: DetectorFamily
}

export const DETECTOR_REGISTRY = {
  'sitemap-contradiction': { discipline: 'seo', family: 'technical' },
  'metadata-gap': { discipline: 'seo', family: 'metadata' },
  'thin-page': { discipline: 'seo', family: 'content' },
  'indexed-but-broken': { discipline: 'seo', family: 'technical' },
  'demand-without-page': { discipline: 'seo', family: 'technical' },
  'schema-drift': { discipline: 'aeo', family: 'schema' },
  'llms-drift': { discipline: 'geo', family: 'ai-crawler-visibility' },
  'crawler-absence': { discipline: 'geo', family: 'ai-crawler-visibility' },
} as const satisfies Record<string, DetectorIdentity>

export type RegisteredDetector = keyof typeof DETECTOR_REGISTRY

/**
 * Identity for a detector, or null when it is not a Search Intelligence
 * detector. Null is a valid answer, not a lookup failure.
 */
export function detectorIdentity(detector: string): DetectorIdentity | null {
  if (Object.prototype.hasOwnProperty.call(DETECTOR_REGISTRY, detector)) {
    return DETECTOR_REGISTRY[detector as RegisteredDetector]
  }
  return null
}
