import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { runBriefingCron } from '@/lib/briefing/cron';
import { createCampaignStore, createGenerateDeps } from '@/lib/briefing/deps';
import { createImportDeps } from '@/lib/new-businesses/deps';
import { importLatestDaily } from '@/lib/new-businesses/import';

export const dynamic = 'force-dynamic';
// Queuing is a few small writes; the New Businesses import downloads and
// parses one PDF (60 second fetch timeout); the briefing makes one model call
// with a 45 second timeout and one retry.
export const maxDuration = 300;

export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}

async function handleCron(request: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  const header = request.headers.get('authorization');
  if (!authorizationMatches(header, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runBriefingCron({
      campaigns: createCampaignStore(),
      briefing: createGenerateDeps(),
      importNewBusinesses: () => importLatestDaily(createImportDeps()),
    });
    // Outcomes go in the response body, not the log. Vercel does not surface
    // console.error from cron routes in the CLI or the dashboard log detail
    // view, so this is the only place an actual error is legible.
    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Briefing cron failed' }, { status: 500 });
  }
}

function authorizationMatches(
  header: string | null,
  secret: string
): boolean {
  const provided = createHash('sha256')
    .update(header ?? '')
    .digest();
  const expected = createHash('sha256')
    .update(`Bearer ${secret}`)
    .digest();
  return timingSafeEqual(provided, expected);
}
