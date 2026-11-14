import { NextResponse } from 'next/server'

import { handleContactClaim } from '@/lib/outreach/contacts/routes'
import { createContactStore } from '@/lib/outreach/contacts/store'
import { readRunnerAuthEnv } from '@/lib/prospects/runner-auth'

export const dynamic = 'force-dynamic'

/**
 * Claims the oldest requested contact-address run for the research runner and
 * returns, per lead, an opaque id, the business name and the URLs it may
 * read. Nothing else about a lead is sent. Lives under /api/prospects/
 * because the runner's credential is attached only for that path prefix.
 * Authorized by PROSPECT_INGEST_TOKEN only.
 */
export async function POST(request: Request) {
  const reply = await handleContactClaim(request.headers.get('authorization'), readRunnerAuthEnv(), () => createContactStore(), new Date())
  return NextResponse.json(reply.body, { status: reply.status })
}
