import 'server-only';

import chromium from '@sparticuz/chromium-min';
import { chromium as playwright } from 'playwright-core';

import { isReportId } from '@/lib/reports/load';
import { signPrintToken } from '@/lib/reports/print-token';
import { createSupabaseServiceRole } from '@/lib/supabase/service';

/** Must match the installed `@sparticuz/chromium-min` version and the pack URL. */
export const CHROMIUM_MIN_VERSION = '143.0.4';

export const CHROMIUM_PACK_URL = `https://github.com/Sparticuz/chromium/releases/download/v${CHROMIUM_MIN_VERSION}/chromium-v${CHROMIUM_MIN_VERSION}-pack.x64.tar`;

const REPORTS_BUCKET = 'reports';
const PERIOD_RE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type RenderReportPdfResult =
  | { ok: true; pdfPath: string; bytes: number }
  | {
      ok: false;
      reason:
        | 'invalid_id'
        | 'not_found'
        | 'failed'
        | 'misconfigured'
        | 'render_failed'
        | 'upload_failed'
        | 'db_error';
    };

type ServiceClient = ReturnType<typeof createSupabaseServiceRole>;

type ReportRow = {
  id: string;
  clientId: string;
  period: string;
  status: string;
};

export async function renderReportPdf(
  reportId: string
): Promise<RenderReportPdfResult> {
  if (!isReportId(reportId)) {
    return { ok: false, reason: 'invalid_id' };
  }

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return { ok: false, reason: 'misconfigured' };
  }

  try {
    const supabase = createSupabaseServiceRole();
    const loaded = await loadRenderableReport(supabase, reportId);
    if (!loaded.ok) {
      return loaded;
    }

    const { report, slug } = loaded;
    const pdfPath = `${slug}/${report.period}.pdf`;

    const pdf = await capturePrintPdf(report.id, secret);
    if (pdf === null) {
      return { ok: false, reason: 'render_failed' };
    }

    const uploaded = await supabase.storage
      .from(REPORTS_BUCKET)
      .upload(pdfPath, pdf, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploaded.error) {
      console.error('PDF upload failed');
      return { ok: false, reason: 'upload_failed' };
    }

    const updated = await supabase
      .from('reports')
      .update({ pdf_path: pdfPath })
      .eq('id', report.id)
      .eq('client_id', report.clientId);

    if (updated.error) {
      console.error('PDF path update failed');
      return { ok: false, reason: 'db_error' };
    }

    return { ok: true, pdfPath, bytes: pdf.byteLength };
  } catch (error) {
    logIntelReportPdfError(error);
    return { ok: false, reason: 'render_failed' };
  }
}

async function loadRenderableReport(
  supabase: ServiceClient,
  reportId: string
): Promise<
  | { ok: true; report: ReportRow; slug: string }
  | {
      ok: false;
      reason: 'not_found' | 'failed' | 'db_error';
    }
> {
  const byId = await supabase
    .from('reports')
    .select('id, client_id, period, status')
    .eq('id', reportId)
    .maybeSingle();

  if (byId.error) {
    console.error('Report lookup failed');
    return { ok: false, reason: 'db_error' };
  }
  if (byId.data === null) {
    return { ok: false, reason: 'not_found' };
  }

  const parsed = parseReportRow(byId.data);
  if (parsed === null) {
    return { ok: false, reason: 'not_found' };
  }
  if (parsed.status === 'failed') {
    return { ok: false, reason: 'failed' };
  }

  const confirmed = await supabase
    .from('reports')
    .select('id, client_id, period, status')
    .eq('id', parsed.id)
    .eq('client_id', parsed.clientId)
    .maybeSingle();

  if (confirmed.error) {
    console.error('Report lookup failed');
    return { ok: false, reason: 'db_error' };
  }
  if (confirmed.data === null) {
    return { ok: false, reason: 'not_found' };
  }

  const report = parseReportRow(confirmed.data);
  if (report === null) {
    return { ok: false, reason: 'not_found' };
  }
  if (report.status === 'failed') {
    return { ok: false, reason: 'failed' };
  }

  const clientResult = await supabase
    .from('clients')
    .select('id, slug')
    .eq('id', report.clientId)
    .maybeSingle();

  if (clientResult.error) {
    console.error('Report client lookup failed');
    return { ok: false, reason: 'db_error' };
  }
  if (clientResult.data === null) {
    return { ok: false, reason: 'not_found' };
  }

  const slug = parseClientSlug(clientResult.data, report.clientId);
  if (slug === null) {
    return { ok: false, reason: 'not_found' };
  }

  return { ok: true, report, slug };
}

async function capturePrintPdf(
  reportId: string,
  secret: string
): Promise<Buffer | null> {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 720 },
    });

    await page.route(
      (url) => isThirdPartyTracker(url),
      (route) => route.abort()
    );

    const token = signPrintToken(reportId, secret);
    const printUrl = `${appOrigin()}/intel/reports/${reportId}/print?token=${encodeURIComponent(token)}`;
    console.error(
      'Intel report pdf: navigate',
      originAndPath(printUrl)
    );
    const response = await page.goto(printUrl, {
      waitUntil: 'networkidle',
      timeout: 45_000,
    });

    const status = response === null ? null : response.status();
    console.error('Intel report pdf: navigation status', status);
    if (status !== 200) {
      return null;
    }

    await page.waitForSelector('.report-document', { timeout: 15_000 });
    await page.emulateMedia({ media: 'print' });

    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '0.65in',
        right: '0.65in',
        bottom: '0.65in',
        left: '0.65in',
      },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

async function launchBrowser() {
  if (process.env.VERCEL) {
    chromium.setGraphicsMode = false;
    let executablePath: string;
    try {
      executablePath = await chromium.executablePath(CHROMIUM_PACK_URL);
      console.error('Intel report pdf: chromium executablePath', executablePath);
    } catch (error) {
      console.error(
        'Intel report pdf: chromium executablePath resolution failed'
      );
      logIntelReportPdfError(error);
      throw error;
    }

    return launchPlaywright({
      args: chromium.args,
      executablePath,
      headless: true,
    });
  }

  console.error('Intel report pdf: chromium executablePath', 'channel:chrome');
  return launchPlaywright({
    channel: 'chrome',
    headless: true,
  });
}

async function launchPlaywright(
  options: Parameters<typeof playwright.launch>[0]
) {
  try {
    const browser = await playwright.launch(options);
    console.error('Intel report pdf: chromium launch succeeded');
    return browser;
  } catch (error) {
    console.error('Intel report pdf: chromium launch failed');
    logIntelReportPdfError(error);
    throw error;
  }
}

function originAndPath(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return '[unparseable]';
  }
}

function logIntelReportPdfError(caught: unknown): void {
  if (caught instanceof Error) {
    console.error(
      'Intel report pdf:',
      caught.name,
      caught.message,
      caught.stack ?? ''
    );
    return;
  }
  console.error('Intel report pdf:', caught);
}

function appOrigin(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (site) {
    return site;
  }
  return `http://127.0.0.1:${process.env.PORT ?? '3000'}`;
}

function isThirdPartyTracker(url: URL): boolean {
  const host = url.hostname;
  return (
    host === 'www.google-analytics.com' ||
    host === 'www.googletagmanager.com' ||
    host === 'www.clarity.ms' ||
    host.endsWith('.clarity.ms') ||
    host === 'vitals.vercel-insights.com'
  );
}

function parseReportRow(value: unknown): ReportRow | null {
  if (!isPlainObject(value)) {
    return null;
  }
  const id = asNonEmptyString(value.id);
  const clientId = asNonEmptyString(value.client_id);
  const period = asPeriod(value.period);
  const status = asNonEmptyString(value.status);
  if (
    id === null ||
    clientId === null ||
    period === null ||
    status === null ||
    !isReportId(id)
  ) {
    return null;
  }
  return { id, clientId, period, status };
}

function parseClientSlug(value: unknown, clientId: string): string | null {
  if (!isPlainObject(value)) {
    return null;
  }
  const id = asNonEmptyString(value.id);
  const slug = asNonEmptyString(value.slug);
  if (id !== clientId || slug === null || !SLUG_RE.test(slug)) {
    return null;
  }
  return slug;
}

function asPeriod(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const datePart = value.slice(0, 10);
  return PERIOD_RE.test(datePart) ? datePart : null;
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
