import { NextResponse } from 'next/server'

import { handleSiteReviewIngest } from '@/lib/outreach/site-reviews/routes'
import { createSiteReviewStore } from '@/lib/outreach/site-reviews/store'
import { readRunnerAuthEnv } from '@/lib/prospects/runner-auth'

export const dynamic = 'force-dynamic'

/**
 * Accepts site-review reports for leads in a claimed run. Reports for leads
 * outside the run are ignored. The runner sends the pages it read and what
 * it saw; the server judges every observation and decides every status.
 * Authorized by PROSPECT_INGEST_TOKEN only. Writes outreach_site_review_runs
 * and outreach_site_reviews only. A batch that failed with a 500 can be
 * resent whole.
 */
export async function POST(request: Request) {
  const reply = await handleSiteReviewIngest(
    {
      authorization: request.headers.get('authorization'),
      contentLength: request.headers.get('content-length'),
      text: () => request.text(),
    },
    readRunnerAuthEnv(),
    () => createSiteReviewStore(),
    new Date(),
  )
  return NextResponse.json(reply.body, { status: reply.status })
}
