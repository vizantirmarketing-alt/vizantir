import { NextResponse } from 'next/server'

import { ingestBatch } from '@/lib/prospects/ingest'
import {
  INGEST_MAX_BODY_CHARS,
  parseIngestBody,
} from '@/lib/prospects/ingest-schema'
import { authorizeRunner, readRunnerAuthEnv } from '@/lib/prospects/runner-auth'
import { createProspectStore } from '@/lib/prospects/store'

export const dynamic = 'force-dynamic'

/**
 * Accepts one batch of researched prospects for a claimed run. Authorized by
 * PROSPECT_INGEST_TOKEN only. Writes only prospect_runs, prospects and
 * prospect_evidence. Idempotent on run id plus normalized domain, so a batch
 * that failed with a 500 can be resent whole.
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
  if (Number.isFinite(declaredLength) && declaredLength > INGEST_MAX_BODY_CHARS) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  let raw: string
  try {
    raw = await request.text()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const parsed = parseIngestBody(raw)
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error, issues: parsed.issues ?? [] },
      { status: parsed.status },
    )
  }

  try {
    const result = await ingestBatch(createProspectStore(), parsed.batch, new Date())
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, runState: result.runState ?? null },
        { status: result.status },
      )
    }

    return NextResponse.json(
      {
        runId: result.runId,
        runState: result.runState,
        saved: result.saved,
        rejected: result.rejected,
        counts: result.counts,
      },
      { status: 200 },
    )
  } catch (error) {
    const message =
      error instanceof Error && error.name === 'ProspectStoreError'
        ? error.message
        : 'Ingest failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
