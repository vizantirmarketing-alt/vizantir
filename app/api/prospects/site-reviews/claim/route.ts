import { NextResponse } from 'next/server'

import { handleSiteReviewClaim } from '@/lib/outreach/site-reviews/routes'
import { createSiteReviewStore } from '@/lib/outreach/site-reviews/store'
import { readRunnerAuthEnv } from '@/lib/prospects/runner-auth'

export const dynamic = 'force-dynamic'

/**
 * Claims the oldest requested site-review run for the research runner and
 * returns, per lead, an opaque id, the business name, its own-site URL and
 * the allowed observation categories. Nothing else about a lead is sent.
 * Lives under /api/prospects/ because the runner's credential is attached
 * only for that path prefix. Authorized by PROSPECT_INGEST_TOKEN only.
 */
export async function POST(request: Request) {
  const reply = await handleSiteReviewClaim(request.headers.get('authorization'), readRunnerAuthEnv(), () => createSiteReviewStore(), new Date())
  return NextResponse.json(reply.body, { status: reply.status })
}
