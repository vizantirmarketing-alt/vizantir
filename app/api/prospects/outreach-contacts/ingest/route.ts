import { NextResponse } from 'next/server'

import { handleContactIngest } from '@/lib/outreach/contacts/routes'
import { createContactStore } from '@/lib/outreach/contacts/store'
import { readRunnerAuthEnv } from '@/lib/prospects/runner-auth'

export const dynamic = 'force-dynamic'

/**
 * Accepts contact-address reports for leads in a claimed run. Reports for
 * leads outside the run are ignored. The runner sends what it read and the
 * addresses it saw; the server judges every address and keeps at most one
 * per lead. Authorized by PROSPECT_INGEST_TOKEN only. Writes
 * outreach_contact_runs and outreach_contacts only. A batch that failed with
 * a 500 can be resent whole.
 */
export async function POST(request: Request) {
  const reply = await handleContactIngest(
    {
      authorization: request.headers.get('authorization'),
      contentLength: request.headers.get('content-length'),
      text: () => request.text(),
    },
    readRunnerAuthEnv(),
    () => createContactStore(),
    new Date(),
  )
  return NextResponse.json(reply.body, { status: reply.status })
}
