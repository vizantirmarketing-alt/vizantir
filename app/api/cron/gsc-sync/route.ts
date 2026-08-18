import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { syncGsc } from '@/lib/gsc/sync';

export const dynamic = 'force-dynamic';

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
    const backfill =
      new URL(request.url).searchParams.get('backfill') === '1';
    const result = await syncGsc({ backfill });
    return NextResponse.json(
      {
        status: result.status,
        recordsProcessed: result.recordsProcessed,
        message: result.message ?? null,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
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
