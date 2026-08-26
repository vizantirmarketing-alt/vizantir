import 'server-only';

import { Resend } from 'resend';

import { serverEnv } from '@/lib/env/server';
import { generateReportToken } from '@/lib/reports/access-token';
import { formatMonth } from '@/lib/reports/format';
import { isReportId } from '@/lib/reports/load';
import { createSupabaseServiceRole } from '@/lib/supabase/service';

export type SendReportResult =
  | { ok: true; sentAt: string }
  | {
      ok: false;
      reason:
        | 'invalid_id'
        | 'not_found'
        | 'failed'
        | 'already_sent'
        | 'missing_pdf'
        | 'missing_from'
        | 'misconfigured'
        | 'send_failed'
        | 'db_error';
    };

type ServiceClient = ReturnType<typeof createSupabaseServiceRole>;

type SendableReport = {
  id: string;
  clientId: string;
  period: string;
  status: string;
  pdfPath: string;
  token: string | null;
};

type ReportClient = {
  id: string;
  name: string;
  contactEmail: string;
};

export async function sendReport(reportId: string): Promise<SendReportResult> {
  if (!isReportId(reportId)) {
    return { ok: false, reason: 'invalid_id' };
  }

  try {
    const supabase = createSupabaseServiceRole();
    const loaded = await loadSendableReport(supabase, reportId);
    if (!loaded.ok) {
      return loaded;
    }

    const { report, client } = loaded;
    const origin = appOrigin();
    const apiKey = process.env.RESEND_API_KEY;
    const from = serverEnv.REPORTS_FROM_EMAIL;
    if (!from) {
      console.error('Report send missing REPORTS_FROM_EMAIL');
      await recordSendError(
        supabase,
        report.id,
        report.clientId,
        'REPORTS_FROM_EMAIL is not configured'
      );
      return { ok: false, reason: 'missing_from' };
    }
    if (origin === null || !apiKey) {
      console.error('Report send misconfigured');
      await recordSendError(
        supabase,
        report.id,
        report.clientId,
        'Email is not configured'
      );
      return { ok: false, reason: 'misconfigured' };
    }

    const token = await ensureReportToken(supabase, report);
    if (token === null) {
      return { ok: false, reason: 'db_error' };
    }

    const sentAt = new Date().toISOString();
    const url = `${origin}/r/${token}`;
    const sent = await deliverReportEmail({
      apiKey,
      from,
      to: client.contactEmail,
      period: report.period,
      url,
    });

    if (!sent.ok) {
      await recordSendError(supabase, report.id, report.clientId, sent.message);
      return { ok: false, reason: 'send_failed' };
    }

    const updated = await supabase
      .from('reports')
      .update({
        status: 'sent',
        sent_at: sentAt,
        send_error: null,
      })
      .eq('id', report.id)
      .eq('client_id', report.clientId);

    if (updated.error) {
      console.error('Report sent-status update failed');
      return { ok: false, reason: 'db_error' };
    }

    return { ok: true, sentAt };
  } catch {
    console.error('Report send failed');
    return { ok: false, reason: 'db_error' };
  }
}

async function loadSendableReport(
  supabase: ServiceClient,
  reportId: string
): Promise<
  | { ok: true; report: SendableReport; client: ReportClient }
  | {
      ok: false;
      reason: 'not_found' | 'failed' | 'already_sent' | 'missing_pdf' | 'db_error';
    }
> {
  const byId = await supabase
    .from('reports')
    .select('id, client_id, period, status, pdf_path, token')
    .eq('id', reportId)
    .maybeSingle();

  if (byId.error) {
    console.error('Report lookup failed');
    return { ok: false, reason: 'db_error' };
  }
  if (byId.data === null) {
    return { ok: false, reason: 'not_found' };
  }

  const located = parseReportRow(byId.data);
  if (located === null) {
    return { ok: false, reason: 'not_found' };
  }

  const confirmed = await supabase
    .from('reports')
    .select('id, client_id, period, status, pdf_path, token')
    .eq('id', located.id)
    .eq('client_id', located.clientId)
    .maybeSingle();

  if (confirmed.error) {
    console.error('Report lookup failed');
    return { ok: false, reason: 'db_error' };
  }
  if (confirmed.data === null) {
    return { ok: false, reason: 'not_found' };
  }

  const parsed = parseReportRow(confirmed.data);
  if (parsed === null) {
    return { ok: false, reason: 'not_found' };
  }

  const refusal = sendRefusal(parsed);
  if (refusal !== null) {
    return { ok: false, reason: refusal };
  }
  if (parsed.pdfPath === null) {
    return { ok: false, reason: 'missing_pdf' };
  }

  const clientResult = await supabase
    .from('clients')
    .select('id, name, contact_email')
    .eq('id', parsed.clientId)
    .maybeSingle();

  if (clientResult.error) {
    console.error('Report client lookup failed');
    return { ok: false, reason: 'db_error' };
  }
  if (clientResult.data === null) {
    return { ok: false, reason: 'not_found' };
  }

  const client = parseClientRow(clientResult.data, parsed.clientId);
  if (client === null) {
    return { ok: false, reason: 'not_found' };
  }

  return {
    ok: true,
    report: {
      id: parsed.id,
      clientId: parsed.clientId,
      period: parsed.period,
      status: parsed.status,
      pdfPath: parsed.pdfPath,
      token: parsed.token,
    },
    client,
  };
}

async function ensureReportToken(
  supabase: ServiceClient,
  report: SendableReport
): Promise<string | null> {
  if (report.token !== null) {
    return report.token;
  }

  const token = generateReportToken();
  const updated = await supabase
    .from('reports')
    .update({ token })
    .eq('id', report.id)
    .eq('client_id', report.clientId)
    .is('token', null);

  if (updated.error) {
    console.error('Report token update failed');
    return null;
  }

  const stored = await supabase
    .from('reports')
    .select('token')
    .eq('id', report.id)
    .eq('client_id', report.clientId)
    .maybeSingle();

  if (stored.error) {
    console.error('Report token lookup failed');
    return null;
  }

  const saved = asNonEmptyString(
    isPlainObject(stored.data) ? stored.data.token : null
  );
  return saved;
}

async function deliverReportEmail(input: {
  apiKey: string;
  from: string;
  to: string;
  period: string;
  url: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const month = formatMonth(input.period);
  const text = [
    `Your ${month} website report is ready.`,
    '',
    input.url,
    '',
    'This link is unique to your report. If something looks off, reply to this email and we can fix it without sending a new copy.',
  ].join('\n');

  try {
    const resend = new Resend(input.apiKey);
    const result = await resend.emails.send({
      from: input.from,
      to: input.to,
      subject: `Your ${month} website report`,
      text,
      html: reportEmailHtml(month, input.url),
    });

    if (result.error) {
      console.error('Report email send failed');
      return {
        ok: false,
        message: `${result.error.name}: ${result.error.message}`.slice(0, 300),
      };
    }

    return { ok: true };
  } catch (error) {
    console.error('Report email send failed');
    return { ok: false, message: sendErrorText(error) };
  }
}

async function recordSendError(
  supabase: ServiceClient,
  reportId: string,
  clientId: string,
  message: string
): Promise<void> {
  const updated = await supabase
    .from('reports')
    .update({ send_error: message })
    .eq('id', reportId)
    .eq('client_id', clientId);

  if (updated.error) {
    console.error('Report send-error update failed');
  }
}

function sendRefusal(
  report: ParsedReportRow
): 'failed' | 'already_sent' | 'missing_pdf' | null {
  if (report.status === 'failed') {
    return 'failed';
  }
  if (report.status === 'sent') {
    return 'already_sent';
  }
  if (report.pdfPath === null) {
    return 'missing_pdf';
  }
  return null;
}

function reportEmailHtml(month: string, url: string): string {
  const safeUrl = escapeHtml(url);
  const safeMonth = escapeHtml(month);
  return [
    `<p>Your ${safeMonth} website report is ready.</p>`,
    `<p><a href="${safeUrl}">${safeUrl}</a></p>`,
    '<p>This link is unique to your report. If something looks off, reply to this email and we can fix it without sending a new copy.</p>',
  ].join('');
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function appOrigin(): string | null {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  return site || null;
}

function sendErrorText(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message.slice(0, 300);
  }
  return 'Send failed';
}

type ParsedReportRow = {
  id: string;
  clientId: string;
  period: string;
  status: string;
  pdfPath: string | null;
  token: string | null;
};

function parseReportRow(value: unknown): ParsedReportRow | null {
  if (!isPlainObject(value)) {
    return null;
  }

  const id = asNonEmptyString(value.id);
  const clientId = asNonEmptyString(value.client_id);
  const period = asPeriod(value.period);
  const status = asNonEmptyString(value.status);
  if (id === null || clientId === null || period === null || status === null) {
    return null;
  }
  if (!isReportId(id)) {
    return null;
  }

  const token =
    value.token === null || value.token === undefined
      ? null
      : asNonEmptyString(value.token);
  if (token === null && value.token != null) {
    return null;
  }

  const pdfPath =
    value.pdf_path === null || value.pdf_path === undefined
      ? null
      : asNonEmptyString(value.pdf_path);
  if (pdfPath === null && value.pdf_path != null) {
    return null;
  }

  return { id, clientId, period, status, pdfPath, token };
}

function parseClientRow(value: unknown, clientId: string): ReportClient | null {
  if (!isPlainObject(value)) {
    return null;
  }

  const id = asNonEmptyString(value.id);
  const name = asNonEmptyString(value.name);
  const contactEmail = asNonEmptyString(value.contact_email);
  if (id === null || id !== clientId || name === null || contactEmail === null) {
    return null;
  }
  if (!contactEmail.includes('@')) {
    return null;
  }

  return { id, name, contactEmail };
}

function asPeriod(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const datePart = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : null;
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
