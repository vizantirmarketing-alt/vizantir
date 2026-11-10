import { NextResponse } from 'next/server'

import { buildClaimResponse } from '@/lib/prospects/claim'
import { authorizeRunner, readRunnerAuthEnv } from '@/lib/prospects/runner-auth'
import { createProspectStore } from '@/lib/prospects/store'

export const dynamic = 'force-dynamic'

/**
 * Claims the oldest requested prospect research run for the external runner,
 * and lists the domains already in the prospects table so the runner can skip
 * them. Authorized by PROSPECT_INGEST_TOKEN only. Outcomes go in the response
 * body; console output from route handlers is not reliably visible on Vercel.
 */
export async function POST(request: Request) {
  const auth = authorizeRunner(
    request.headers.get('authorization'),
    readRunnerAuthEnv(),
  )
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await buildClaimResponse(createProspectStore(), new Date())
    return NextResponse.json(body, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Claim failed' }, { status: 500 })
  }
}
