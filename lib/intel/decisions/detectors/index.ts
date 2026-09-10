import { buriedDemandDetector } from '@/lib/intel/decisions/detectors/buried-demand'
import { crawlerAbsenceDetector } from '@/lib/intel/decisions/detectors/crawler-absence'
import { demandWithoutPageDetector } from '@/lib/intel/decisions/detectors/demand-without-page'
import { geoSignalDetector } from '@/lib/intel/decisions/detectors/geo-signal'
import { indexedButBrokenDetector } from '@/lib/intel/decisions/detectors/indexed-but-broken'
import { llmsDriftDetector } from '@/lib/intel/decisions/detectors/llms-drift'
import { metadataGapDetector } from '@/lib/intel/decisions/detectors/metadata-gap'
import { schemaDriftDetector } from '@/lib/intel/decisions/detectors/schema-drift'
import { sitemapContradictionDetector } from '@/lib/intel/decisions/detectors/sitemap-contradiction'
import { thinPageDetector } from '@/lib/intel/decisions/detectors/thin-page'
import { withinReachDetector } from '@/lib/intel/decisions/detectors/within-reach'
import type { Detector } from '@/lib/intel/decisions/types'

export const DETECTORS: readonly Detector[] = [
  // GSC-only. Category `opportunity`, unregistered, unchanged by Phase 2.
  buriedDemandDetector,
  withinReachDetector,
  geoSignalDetector,

  // Phase 2b Search Intelligence. Category `search_intelligence`, discipline
  // `seo`, all needsScan. See lib/intel/decisions/registry.ts.
  sitemapContradictionDetector,
  metadataGapDetector,
  thinPageDetector,
  indexedButBrokenDetector,
  demandWithoutPageDetector,

  // Phase 2c AEO. Category `search_intelligence`, discipline `aeo`.
  schemaDriftDetector,

  // Phase 2d. Category `search_intelligence`, discipline `geo`.
  llmsDriftDetector,
  crawlerAbsenceDetector,
]
