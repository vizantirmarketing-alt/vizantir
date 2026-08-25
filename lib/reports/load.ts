import 'server-only';

import type { CareTier, ReportSnapshot } from '@/lib/reports/generate';
import { parseReportSnapshot } from '@/lib/reports/parse-snapshot';
import { createSupabaseServiceRole } from '@/lib/supabase/service';

const REPORT_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const REPORT_COLUMNS = 'id, client_id, period, tier, status, snapshot';
const CLIENT_COLUMNS = 'id, name, slug, site_url, care_tier';

export type ReportStatus = 'pending' | 'draft' | 'sent' | 'failed';

export type ReportClient = {
  id: string;
  name: string;
  slug: string;
  siteUrl: string;
  careTier: CareTier;
};

export type ReportDocument = {
  reportId: string;
  period: string;
  tier: CareTier;
  status: ReportStatus;
  client: ReportClient;
  snapshot: ReportSnapshot;
};

export type LoadReportResult =
  | { ok: true; document: ReportDocument }
  | { ok: false; reason: 'not_found' | 'malformed' | 'query_failed' };

export function isReportId(value: string): boolean {
  return REPORT_ID_RE.test(value);
}

export async function loadReport(reportId: string): Promise<LoadReportResult> {
  if (!isReportId(reportId)) {
    return { ok: false, reason: 'not_found' };
  }

  try {
    const supabase = createSupabaseServiceRole();
    const reportResult = await supabase
      .from('reports')
      .select(REPORT_COLUMNS)
      .eq('id', reportId)
      .maybeSingle();

    if (reportResult.error) {
      console.error('Report lookup failed');
      return { ok: false, reason: 'query_failed' };
    }
    if (reportResult.data === null) {
      return { ok: false, reason: 'not_found' };
    }

    const report = parseReportRow(reportResult.data);
    if (report === null) {
      return { ok: false, reason: 'malformed' };
    }

    const clientResult = await supabase
      .from('clients')
      .select(CLIENT_COLUMNS)
      .eq('id', report.clientId)
      .maybeSingle();

    if (clientResult.error) {
      console.error('Report client lookup failed');
      return { ok: false, reason: 'query_failed' };
    }
    if (clientResult.data === null) {
      return { ok: false, reason: 'malformed' };
    }

    const client = parseClientRow(clientResult.data);
    if (client === null) {
      return { ok: false, reason: 'malformed' };
    }

    return {
      ok: true,
      document: {
        reportId: report.id,
        period: report.period,
        tier: report.tier,
        status: report.status,
        client,
        snapshot: report.snapshot,
      },
    };
  } catch {
    console.error('Report lookup failed');
    return { ok: false, reason: 'query_failed' };
  }
}

type ParsedReportRow = {
  id: string;
  clientId: string;
  period: string;
  tier: CareTier;
  status: ReportStatus;
  snapshot: ReportSnapshot;
};

function parseReportRow(value: unknown): ParsedReportRow | null {
  if (!isPlainObject(value)) {
    return null;
  }
  const id = asNonEmptyString(value.id);
  const clientId = asNonEmptyString(value.client_id);
  const period = asPeriod(value.period);
  const tier = value.tier;
  const status = value.status;
  const snapshot = parseReportSnapshot(value.snapshot);
  if (
    id === null ||
    clientId === null ||
    period === null ||
    !isCareTier(tier) ||
    !isReportStatus(status) ||
    snapshot === null
  ) {
    return null;
  }
  return { id, clientId, period, tier, status, snapshot };
}

function parseClientRow(value: unknown): ReportClient | null {
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

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isCareTier(value: unknown): value is CareTier {
  return value === 'essential' || value === 'care';
}

function isReportStatus(value: unknown): value is ReportStatus {
  return (
    value === 'pending' ||
    value === 'draft' ||
    value === 'sent' ||
    value === 'failed'
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
