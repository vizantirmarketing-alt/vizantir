import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { renderReportPdf } from '@/lib/reports/pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 90;

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
    const result = await renderReportPdf(reportId);

    if (!result.ok) {
      return NextResponse.json(
        { error: failureMessage(result.reason), reason: result.reason },
        { status: failureStatus(result.reason) }
      );
    }

    return NextResponse.json(
      { pdfPath: result.pdfPath, bytes: result.bytes },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        'Intel report pdf:',
        error.name,
        error.message,
        error.stack ?? ''
      );
    } else {
      console.error('Intel report pdf:', error);
    }
    return NextResponse.json(
      { error: 'PDF generation failed' },
      { status: 500 }
    );
  }
}

function failureMessage(
  reason:
    | 'invalid_id'
    | 'not_found'
    | 'failed'
    | 'misconfigured'
    | 'render_failed'
    | 'upload_failed'
    | 'db_error'
): string {
  if (reason === 'not_found') {
    return 'Report not found';
  }
  if (reason === 'failed') {
    return 'Report cannot be rendered';
  }
  if (reason === 'invalid_id') {
    return 'Invalid request';
  }
  if (reason === 'misconfigured') {
    return 'Server configuration error';
  }
  return 'PDF generation failed';
}

function failureStatus(
  reason:
    | 'invalid_id'
    | 'not_found'
    | 'failed'
    | 'misconfigured'
    | 'render_failed'
    | 'upload_failed'
    | 'db_error'
): number {
  if (reason === 'not_found') {
    return 404;
  }
  if (reason === 'failed') {
    return 409;
  }
  if (reason === 'invalid_id') {
    return 400;
  }
  if (reason === 'misconfigured') {
    return 500;
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
