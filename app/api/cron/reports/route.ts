import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

import { runMonthlyReports } from '@/lib/reports/run-monthly';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
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
    const result = await runMonthlyReports();
    if (!result.ok) {
      return NextResponse.json(
        {
          error: 'Monthly report run failed',
          period: result.period,
          clients: result.clients,
          outcomes: result.outcomes,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        period: result.period,
        clients: result.clients,
        outcomes: result.outcomes,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Monthly report run failed' },
      { status: 500 }
    );
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
