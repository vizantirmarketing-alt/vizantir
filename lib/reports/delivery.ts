import 'server-only';

import { isReportToken } from '@/lib/reports/access-token';
import type { CareTier } from '@/lib/reports/generate';
import {
  isReportId,
  type ReportClient,
  type ReportDocument,
  type ReportStatus,
} from '@/lib/reports/load';
import { parseReportSnapshot } from '@/lib/reports/parse-snapshot';
import { createSupabaseServiceRole } from '@/lib/supabase/service';

const REPORTS_BUCKET = 'reports';
const SIGNED_URL_TTL_SECONDS = 300;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PERIOD_FILE_RE = /^\d{4}-\d{2}-\d{2}\.pdf$/;

export type PublicReportResult =
  | { ok: true; document: ReportDocument; pdfDownloadUrl: string | null }
  | { ok: false };

export async function loadPublicReport(
  token: string
): Promise<PublicReportResult> {
  if (!isReportToken(token)) {
    return { ok: false };
  }

  try {
    const supabase = createSupabaseServiceRole();
    const byToken = await supabase
      .from('reports')
      .select('id, client_id, status, token')
      .eq('token', token)
      .maybeSingle();

    if (byToken.error) {
      console.error('Public report lookup failed');
      return { ok: false };
    }
    if (byToken.data === null) {
      return { ok: false };
    }

    const located = parseDeliveryRow(byToken.data);
    if (located === null || located.status !== 'sent' || located.token !== token) {
      return { ok: false };
    }

    const confirmed = await supabase
      .from('reports')
      .select('id, client_id, period, tier, status, snapshot, pdf_path, token')
      .eq('id', located.id)
      .eq('client_id', located.clientId)
      .eq('token', token)
      .eq('status', 'sent')
      .maybeSingle();

    if (confirmed.error) {
      console.error('Public report lookup failed');
      return { ok: false };
    }
    if (confirmed.data === null) {
      return { ok: false };
    }

    const report = parseConfirmedRow(confirmed.data);
    if (
      report === null ||
      report.status !== 'sent' ||
      report.token !== token ||
      report.clientId !== located.clientId
    ) {
      return { ok: false };
    }

    const clientResult = await supabase
      .from('clients')
      .select('id, name, slug, site_url, care_tier')
      .eq('id', report.clientId)
      .maybeSingle();

    if (clientResult.error) {
      console.error('Public report client lookup failed');
      return { ok: false };
    }
    if (clientResult.data === null) {
      return { ok: false };
    }

    const client = parseClientRow(clientResult.data, report.clientId);
    if (client === null) {
      return { ok: false };
    }

    await recordFirstOpen(report.id, report.clientId);

    const document: ReportDocument = {
      reportId: report.id,
      period: report.period,
      tier: report.tier,
      status: report.status,
      client,
      snapshot: report.snapshot,
    };

    return {
      ok: true,
      document,
      pdfDownloadUrl: await signPdfDownloadUrl(report.pdfPath),
    };
  } catch {
    console.error('Public report lookup failed');
    return { ok: false };
  }
}

async function recordFirstOpen(
  reportId: string,
  clientId: string
): Promise<void> {
  try {
    const supabase = createSupabaseServiceRole();
    const updated = await supabase
      .from('reports')
      .update({ opened_at: new Date().toISOString() })
      .eq('id', reportId)
      .eq('client_id', clientId)
      .is('opened_at', null);

    if (updated.error) {
      console.error('Report first-open update failed');
    }
  } catch {
    console.error('Report first-open update failed');
  }
}

async function signPdfDownloadUrl(pdfPath: string | null): Promise<string | null> {
  if (pdfPath === null || !isStoredPdfPath(pdfPath)) {
    return null;
  }

  try {
    const supabase = createSupabaseServiceRole();
    const signed = await supabase.storage
      .from(REPORTS_BUCKET)
      .createSignedUrl(pdfPath, SIGNED_URL_TTL_SECONDS, {
        download: pdfPath.split('/')[1] ?? 'report.pdf',
      });

    if (signed.error || typeof signed.data?.signedUrl !== 'string') {
      console.error('Report PDF signed URL failed');
      return null;
    }

    return signed.data.signedUrl;
  } catch {
    console.error('Report PDF signed URL failed');
    return null;
  }
}

type DeliveryRow = {
  id: string;
  clientId: string;
  status: string;
  pdfPath: string | null;
  token: string;
};

type ConfirmedRow = DeliveryRow & {
  period: string;
  tier: CareTier;
  status: ReportStatus;
  snapshot: NonNullable<ReturnType<typeof parseReportSnapshot>>;
};

function parseDeliveryRow(value: unknown): DeliveryRow | null {
  if (!isPlainObject(value)) {
    return null;
  }

  const id = asNonEmptyString(value.id);
  const clientId = asNonEmptyString(value.client_id);
  const status = asNonEmptyString(value.status);
  const token = asNonEmptyString(value.token);
  const pdfPath =
    value.pdf_path === null || value.pdf_path === undefined
      ? null
      : asNonEmptyString(value.pdf_path);

  if (
    id === null ||
    !isReportId(id) ||
    clientId === null ||
    status === null ||
    token === null
  ) {
    return null;
  }
  if (pdfPath === null && value.pdf_path != null) {
    return null;
  }

  return { id, clientId, status, pdfPath, token };
}

function parseConfirmedRow(value: unknown): ConfirmedRow | null {
  const row = parseDeliveryRow(value);
  if (row === null || !isPlainObject(value) || !isReportStatus(row.status)) {
    return null;
  }

  const period = asPeriod(value.period);
  const tier = value.tier;
  const snapshot = parseReportSnapshot(value.snapshot);
  if (period === null || !isCareTier(tier) || snapshot === null) {
    return null;
  }

  return {
    ...row,
    period,
    tier,
    status: row.status,
    snapshot,
  };
}

function parseClientRow(value: unknown, clientId: string): ReportClient | null {
  if (!isPlainObject(value)) {
    return null;
  }

  const id = asNonEmptyString(value.id);
  const name = asNonEmptyString(value.name);
  const slug = asNonEmptyString(value.slug);
  const siteUrl = asNonEmptyString(value.site_url);
  const careTier = value.care_tier;
  if (
    id === null ||
    id !== clientId ||
    name === null ||
    slug === null ||
    siteUrl === null ||
    !isCareTier(careTier)
  ) {
    return null;
  }

  return { id, name, slug, siteUrl, careTier };
}

function asPeriod(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const datePart = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : null;
}

function isCareTier(value: unknown): value is CareTier {
  return value === 'essential' || value === 'care' || value === 'growth';
}

function isReportStatus(value: unknown): value is ReportStatus {
  return (
    value === 'pending' ||
    value === 'draft' ||
    value === 'sent' ||
    value === 'failed'
  );
}

function isStoredPdfPath(value: string): boolean {
  const parts = value.split('/');
  if (parts.length !== 2) {
    return false;
  }
  const [slug, file] = parts;
  return SLUG_RE.test(slug) && PERIOD_FILE_RE.test(file);
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
