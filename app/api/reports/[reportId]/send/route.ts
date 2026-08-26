import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

import { sendReport } from '@/lib/reports/send';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type RouteContext = {
  params: Promise<{ reportId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
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

  const { reportId } = await context.params;

  try {
    const result = await sendReport(reportId);

    if (!result.ok) {
      return NextResponse.json(
        { error: failureMessage(result.reason), reason: result.reason },
        { status: failureStatus(result.reason) }
      );
    }

    return NextResponse.json(
      { status: 'sent', sentAt: result.sentAt },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: 'Report send failed' }, { status: 500 });
  }
}

function failureMessage(
  reason:
    | 'invalid_id'
    | 'not_found'
    | 'failed'
    | 'already_sent'
    | 'missing_pdf'
    | 'missing_from'
    | 'misconfigured'
    | 'send_failed'
    | 'db_error'
): string {
  if (reason === 'not_found') {
    return 'Report not found';
  }
  if (reason === 'failed') {
    return 'Report cannot be sent';
  }
  if (reason === 'already_sent') {
    return 'Report already sent';
  }
  if (reason === 'missing_pdf') {
    return 'Report PDF is missing';
  }
  if (reason === 'invalid_id') {
    return 'Invalid request';
  }
  if (reason === 'missing_from') {
    return 'Report sender is not configured';
  }
  if (reason === 'misconfigured') {
    return 'Server configuration error';
  }
  return 'Report send failed';
}

function failureStatus(
  reason:
    | 'invalid_id'
    | 'not_found'
    | 'failed'
    | 'already_sent'
    | 'missing_pdf'
    | 'missing_from'
    | 'misconfigured'
    | 'send_failed'
    | 'db_error'
): number {
  if (reason === 'not_found') {
    return 404;
  }
  if (
    reason === 'failed' ||
    reason === 'already_sent' ||
    reason === 'missing_pdf'
  ) {
    return 409;
  }
  if (reason === 'invalid_id') {
    return 400;
  }
  return 500;
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
