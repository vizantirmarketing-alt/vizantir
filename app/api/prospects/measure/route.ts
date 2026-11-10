import { NextResponse } from 'next/server'

import { MEASURE_MAX_BODY_CHARS, measureProspect, parseMeasureBody } from '@/lib/prospects/measure'
import { createMeasureDeps } from '@/lib/prospects/measure-deps'
import { authorizeRunner, readRunnerAuthEnv } from '@/lib/prospects/runner-auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
// The PageSpeed fetcher allows 90s per request plus one quick retry.
export const maxDuration = 120

/**
 * Measures the home page of a prospect that already exists, identified by its
 * normalized domain, with the existing PageSpeed Insights fetcher (mobile,
 * read-only). Authorized by PROSPECT_INGEST_TOKEN only. Accepts a domain and
 * nothing else: no URL, rating or score is taken from the caller. Writes only
 * prospects and prospect_evidence; nothing is written to Intel tables.
 */
export async function POST(request: Request) {
  const auth = authorizeRunner(
    request.headers.get('authorization'),
    readRunnerAuthEnv(),
  )
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const declaredLength = Number(request.headers.get('content-length'))
  if (Number.isFinite(declaredLength) && declaredLength > MEASURE_MAX_BODY_CHARS) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  let raw: string
  try {
    raw = await request.text()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const parsed = parseMeasureBody(raw)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  }

  try {
    const result = await measureProspect(parsed.domain, createMeasureDeps())

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, reason: result.reason ?? null },
        { status: result.status },
      )
    }
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    const message =
      error instanceof Error && error.name === 'ProspectStoreError'
        ? error.message
        : 'Measurement failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
