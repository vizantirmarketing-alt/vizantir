'use client'

import { useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { formatScore } from '@/lib/prospects/params'

import {
  measureProspectPerformance,
  type MeasurePerformanceResult,
} from '@/app/intel/(app)/prospects/actions'

export function ProspectMeasureButton({ prospectId }: { prospectId: string }) {
  const [result, setResult] = useState<MeasurePerformanceResult | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <div aria-busy={pending}>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          className="border-black/10"
          onClick={() => {
            setResult(null)
            startTransition(async () => {
              setResult(await measureProspectPerformance(prospectId))
            })
          }}
        >
          {pending ? 'Measuring…' : 'Measure performance'}
        </Button>
        {pending ? (
          <p className="text-sm text-meta" role="status">
            Running a mobile PageSpeed Insights test. This can take up to two minutes.
          </p>
        ) : null}
      </div>
      {result !== null && result.ok ? (
        <p className="mt-2 text-sm text-body" role="status">
          Mobile performance {result.performanceScore}/100, rated {result.rating}. Fit{' '}
          {formatScore(result.fitScore)}, opportunity {formatScore(result.opportunityScore)},{' '}
          {result.confidence} confidence.
        </p>
      ) : null}
      {result !== null && !result.ok ? (
        <p className="mt-2 text-sm text-warning-severe" role="alert">
          {result.error}
        </p>
      ) : null}
    </div>
  )
}
