import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  renderReportPdf,
  type PdfRenderDiagnostics,
} from '@/lib/reports/pdf';

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

  // Temporary diagnostic scaffolding — remove once PDF render failures are identified.
  const debug = await requestWantsDebug(request);
  const { reportId } = await context.params;

  try {
    const result = await renderReportPdf(reportId);

    if (!result.ok) {
      return NextResponse.json(
        {
          error: failureMessage(result.reason),
          reason: result.reason,
          ...(debug ? { diagnostics: result.diagnostics } : {}),
        },
        { status: failureStatus(result.reason) }
      );
    }

    return NextResponse.json(
      {
        pdfPath: result.pdfPath,
        bytes: result.bytes,
        ...(debug ? { diagnostics: result.diagnostics } : {}),
      },
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
      {
        error: 'PDF generation failed',
        ...(debug ? { diagnostics: diagnosticsFromCaught(error) } : {}),
      },
      { status: 500 }
    );
  }
}

// Temporary diagnostic scaffolding — remove once PDF render failures are identified.
async function requestWantsDebug(request: Request): Promise<boolean> {
  const url = new URL(request.url);
  if (url.searchParams.get('debug') === 'true') {
    return true;
  }

  try {
    const body: unknown = await request.json();
    if (!isPlainObject(body)) {
      return false;
    }
    return body.debug === true || body.debug === 'true';
  } catch {
    return false;
  }
}

function diagnosticsFromCaught(caught: unknown): PdfRenderDiagnostics {
  if (caught instanceof Error) {
    return {
      chromiumExecutablePath: null,
      launchSucceeded: false,
      navigateUrl: null,
      navigationStatus: null,
      errorName: caught.name,
      errorMessage: caught.message,
      errorStack: caught.stack
        ? caught.stack.split('\n').slice(0, 8).join('\n')
        : null,
    };
  }

  return {
    chromiumExecutablePath: null,
    launchSucceeded: false,
    navigateUrl: null,
    navigationStatus: null,
    errorName: typeof caught,
    errorMessage: String(caught),
    errorStack: null,
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function failureMessage(
  reason:
    | 'invalid_id'
    | 'not_found'
    | 'failed'
    | 'misconfigured'
    | 'render_failed'
    | 'redirected_away'
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
    | 'redirected_away'
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
