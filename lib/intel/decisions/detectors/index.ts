import { buriedDemandDetector } from '@/lib/intel/decisions/detectors/buried-demand'
import { geoSignalDetector } from '@/lib/intel/decisions/detectors/geo-signal'
import { withinReachDetector } from '@/lib/intel/decisions/detectors/within-reach'
import type { Detector } from '@/lib/intel/decisions/types'

export { percentChangeFromPrior } from '@/lib/intel/decisions/change'

export const DETECTORS: readonly Detector[] = [
  buriedDemandDetector,
  withinReachDetector,
  geoSignalDetector,
]
