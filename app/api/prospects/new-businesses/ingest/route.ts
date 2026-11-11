import { NextResponse } from 'next/server'

import { rescoreStoredRows } from '@/lib/new-businesses/import'
import { createNewBusinessStore } from '@/lib/new-businesses/store'
import { ingestCheckBatch } from '@/lib/new-businesses/website-runs'
import { CHECK_INGEST_MAX_BODY_CHARS, parseCheckBody } from '@/lib/new-businesses/website-schema'
import { createWebsiteCheckStore } from '@/lib/new-businesses/website-store'
import { authorizeRunner, readRunnerAuthEnv } from '@/lib/prospects/runner-auth'

export const dynamic = 'force-dynamic'
// One batch writes at most 40 results, then regroups and rescores every
// stored business, the same work an import does.
export const maxDuration = 120

/**
 * Accepts website-check results for businesses in a claimed run. Results for
 * businesses outside the run are rejected. The server decides each status
 * and score; the runner sends observations only. Authorized by
 * PROSPECT_INGEST_TOKEN only. Writes new_business_check_runs and the
 * website_* and lead_* columns of new_businesses; never review status or
 * notes. A batch that failed with a 500 can be resent whole.
 */
export async function POST(request: Request) {
  const auth = authorizeRunner(request.headers.get('authorization'), readRunnerAuthEnv())
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const declaredLength = Number(request.headers.get('content-length'))
  if (Number.isFinite(declaredLength) && declaredLength > CHECK_INGEST_MAX_BODY_CHARS) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  let raw: string
  try {
    raw = await request.text()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const parsed = parseCheckBody(raw)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error, issues: parsed.issues ?? [] }, { status: parsed.status })
  }

  try {
    const now = new Date()
    const result = await ingestCheckBatch(
      {
        store: createWebsiteCheckStore(),
        rescore: async () => {
          await rescoreStoredRows(createNewBusinessStore(), now.toISOString())
        },
      },
      parsed.batch,
      now,
    )
    if (!result.ok) {
      return NextResponse.json({ error: result.error, runState: result.runState ?? null }, { status: result.status })
    }
    return NextResponse.json(
      { runId: result.runId, runState: result.runState, checked: result.checked, rejected: result.rejected, counts: result.counts },
      { status: 200 },
    )
  } catch (error) {
    const message = error instanceof Error && error.name === 'WebsiteCheckStoreError' ? error.message : 'Ingest failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
