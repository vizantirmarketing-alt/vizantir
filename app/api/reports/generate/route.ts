import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateReport } from '@/lib/reports/generate';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const bodySchema = z.object({
  clientId: z.string().uuid(),
  period: z.string().regex(/^\d{4}-\d{2}-01$/),
});

export async function POST(request: Request) {
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

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    const result = await generateReport(
      parsed.data.clientId,
      parsed.data.period
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: failureMessage(result.reason), reason: result.reason },
        { status: failureStatus(result.reason) }
      );
    }

    return NextResponse.json(
      {
        status: result.status,
        reportId: result.reportId,
        sources: result.sources,
        blockers: result.blockers,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Report generation failed' },
      { status: 500 }
    );
  }
}

function failureMessage(
  reason: 'invalid_period' | 'not_found' | 'inactive' | 'already_sent' | 'db_error'
): string {
  if (reason === 'not_found') {
    return 'Client not found';
  }
  if (reason === 'inactive') {
    return 'Client is inactive';
  }
  if (reason === 'already_sent') {
    return 'Report already sent';
  }
  if (reason === 'invalid_period') {
    return 'Invalid request';
  }
  return 'Report generation failed';
}

function failureStatus(
  reason: 'invalid_period' | 'not_found' | 'inactive' | 'already_sent' | 'db_error'
): number {
  if (reason === 'not_found') {
    return 404;
  }
  if (reason === 'inactive' || reason === 'already_sent') {
    return 409;
  }
  if (reason === 'invalid_period') {
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
