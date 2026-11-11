import { NextResponse } from 'next/server'

import { buildCheckClaimResponse } from '@/lib/new-businesses/website-runs'
import { createWebsiteCheckStore } from '@/lib/new-businesses/website-store'
import { authorizeRunner, readRunnerAuthEnv } from '@/lib/prospects/runner-auth'

export const dynamic = 'force-dynamic'

/**
 * Claims the oldest requested New Businesses website-check run for the
 * external runner and returns up to 30 businesses chosen by the server.
 * Lives under /api/prospects/ because the runner's credential is attached
 * only for that path prefix. Authorized by PROSPECT_INGEST_TOKEN only.
 * Outcomes go in the response body.
 */
export async function POST(request: Request) {
  const auth = authorizeRunner(request.headers.get('authorization'), readRunnerAuthEnv())
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await buildCheckClaimResponse(createWebsiteCheckStore(), new Date())
    return NextResponse.json(body, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Claim failed' }, { status: 500 })
  }
}
