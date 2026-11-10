import 'server-only'

/**
 * Production wiring for measureProspect: the existing PageSpeed Insights
 * fetcher (read-only, mobile) and the Supabase store. Shared by the runner
 * measure route and the owner's Measure performance action so both measure
 * exactly the same way.
 */

import { serverEnv } from '@/lib/env/server'
import type { MeasureByIdDeps } from '@/lib/prospects/measure'
import { createProspectStore } from '@/lib/prospects/store'
import { fetchPsiReport } from '@/lib/reports/psi'

export function createMeasureDeps(): MeasureByIdDeps {
  const store = createProspectStore()
  return {
    store,
    findDomainById: (prospectId) => store.findDomainById(prospectId),
    pageSpeedConfigured: Boolean(serverEnv.CRUX_API_KEY),
    now: () => new Date(),
    async fetchMeasurement(url) {
      const report = await fetchPsiReport({ url })
      if (!report.ok) {
        return { ok: false, reason: report.reason, status: report.status }
      }
      return {
        ok: true,
        data: {
          performanceScore: report.data.performanceScore,
          lcpMs: report.data.lcp.value,
          tbtMs: report.data.tbt.value,
          cls: report.data.cls.value,
          fetchedAt: report.data.fetchedAt,
        },
      }
    },
  }
}
