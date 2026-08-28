import 'server-only';
import { createSupabaseServiceRole } from '@/lib/supabase/service';
import { fetchCruxReport, type FetchCruxReportResult } from '@/lib/reports/crux';
import {
  fetchEngagementReport,
  parseEngagementMetricsConfig,
  type FetchEngagementReportResult,
} from '@/lib/reports/engagement';
import { fetchGa4Report, type FetchGa4ReportResult } from '@/lib/reports/ga4';
import { fetchGscReport, type FetchGscReportResult } from '@/lib/reports/gsc';
import {
  fetchUptimeReport,
  type FetchUptimeReportResult,
} from '@/lib/reports/uptime';

export const REPORT_SNAPSHOT_VERSION = 3 as const;

const PERIOD_RE = /^\d{4}-\d{2}-01$/;
const CLIENT_COLUMNS = [
  'id',
  'name',
  'slug',
  'site_url',
  'care_tier',
  'ga4_property_id',
  'gsc_site_url',
  'crux_origin',
  'uptimerobot_monitor_id',
  'engagement_metrics',
  'reporting_context',
  'active',
].join(', ');

export type CareTier = 'essential' | 'care';

export type ReportBlocker =
  | 'ga4_failed'
  | 'zero_sessions'
  | 'gsc_failed'
  | 'gsc_empty_rows';

export type ReportWarning = 'crux_failed' | 'uptime_failed' | 'engagement_failed';

export type SourceSummary = {
  ga4: 'ok' | 'failed';
  gsc: 'ok' | 'failed' | 'skipped';
  crux: 'ok' | 'failed' | 'no_data';
  uptime: 'ok' | 'failed';
  engagement: 'ok' | 'failed' | 'skipped';
};

export type ReportSnapshot = {
  version: 2 | typeof REPORT_SNAPSHOT_VERSION;
  generatedAt: string;
  period: {
    start: string;
    end: string;
    priorStart: string;
    priorEnd: string;
  };
  client: {
    id: string;
    name: string;
    slug: string;
    siteUrl: string;
    careTier: CareTier;
  };
  ga4: FetchGa4ReportResult;
  gsc: FetchGscReportResult;
  crux: FetchCruxReportResult;
  uptime: FetchUptimeReportResult;
  engagement?: FetchEngagementReportResult;
  blockers: ReportBlocker[];
  warnings: ReportWarning[];
};

export type GenerateReportResult =
  | {
      ok: true;
      reportId: string;
      status: 'pending' | 'failed';
      sources: SourceSummary;
      blockers: ReportBlocker[];
      warnings: ReportWarning[];
    }
  | {
      ok: false;
      reason:
        | 'invalid_period'
        | 'not_found'
        | 'inactive'
        | 'already_sent'
        | 'db_error';
    };

type ReportClient = {
  id: string;
  name: string;
  slug: string;
  siteUrl: string;
  careTier: CareTier;
  ga4PropertyId: string | null;
  gscSiteUrl: string | null;
  cruxOrigin: string | null;
  uptimerobotMonitorId: string | null;
  engagementMetrics: unknown;
};

type MonthWindow = {
  startDate: string;
  endDate: string;
  priorStartDate: string;
  priorEndDate: string;
};

type ServiceClient = ReturnType<typeof createSupabaseServiceRole>;

export async function generateReport(
  clientId: string,
  period: string
): Promise<GenerateReportResult> {
  const window = monthWindow(period);
  if (window === null) {
    return { ok: false, reason: 'invalid_period' };
  }

  try {
    const supabase = createSupabaseServiceRole();
    const client = await loadClient(supabase, clientId);
    if (!client.ok) {
      return client;
    }

    const existing = await supabase
      .from('reports')
      .select('id, status')
      .eq('client_id', clientId)
      .eq('period', window.startDate)
      .maybeSingle();

    if (existing.error) {
      console.error('Report lookup failed');
      return { ok: false, reason: 'db_error' };
    }
    if (existing.data !== null && isSentStatus(existing.data)) {
      return { ok: false, reason: 'already_sent' };
    }

    const engagementConfig = parseEngagementMetricsConfig(
      client.client.engagementMetrics
    );

    const [ga4, gsc, crux, uptime, engagement] = await Promise.all([
      isolate(
        () =>
          fetchGa4Report({
            propertyId: client.client.ga4PropertyId,
            startDate: window.startDate,
            endDate: window.endDate,
          }),
        { ok: false, reason: 'http_error' } as const
      ),
      isolate(
        () =>
          fetchGscReport({
            careTier: client.client.careTier,
            siteUrl: client.client.gscSiteUrl,
            startDate: window.startDate,
            endDate: window.endDate,
            priorStartDate: window.priorStartDate,
            priorEndDate: window.priorEndDate,
          }),
        { ok: false, reason: 'http_error' } as const
      ),
      isolate(
        () => fetchCruxReport({ origin: client.client.cruxOrigin }),
        { ok: false, reason: 'http_error' } as const
      ),
      isolate(
        () =>
          fetchUptimeReport({
            monitorId: client.client.uptimerobotMonitorId,
            startDate: window.startDate,
            endDate: window.endDate,
          }),
        { ok: false, reason: 'http_error' } as const
      ),
      engagementConfig === null
        ? Promise.resolve(null)
        : isolate(
            () =>
              fetchEngagementReport({
                config: engagementConfig,
                propertyId: client.client.ga4PropertyId,
                startDate: window.startDate,
                endDate: window.endDate,
              }),
            { ok: false, reason: 'http_error' } as const
          ),
    ]);

    const blockers = collectBlockers({ ga4, gsc });
    const warnings = collectWarnings({ crux, uptime, engagement });
    const status: 'pending' | 'failed' =
      blockers.length === 0 ? 'pending' : 'failed';
    const sources = toSourceSummary({ ga4, gsc, crux, uptime, engagement });

    const snapshot: ReportSnapshot = {
      version: REPORT_SNAPSHOT_VERSION,
      generatedAt: new Date().toISOString(),
      period: {
        start: window.startDate,
        end: window.endDate,
        priorStart: window.priorStartDate,
        priorEnd: window.priorEndDate,
      },
      client: {
        id: client.client.id,
        name: client.client.name,
        slug: client.client.slug,
        siteUrl: client.client.siteUrl,
        careTier: client.client.careTier,
      },
      ga4,
      gsc,
      crux,
      uptime,
      ...(engagement !== null ? { engagement } : {}),
      blockers,
      warnings,
    };

    const upserted = await supabase
      .from('reports')
      .upsert(
        {
          client_id: clientId,
          period: window.startDate,
          tier: client.client.careTier,
          status,
          snapshot,
        },
        { onConflict: 'client_id,period' }
      )
      .select('id')
      .single();

    if (upserted.error || upserted.data === null) {
      console.error('Report upsert failed');
      return { ok: false, reason: 'db_error' };
    }

    const reportId = readUuid(upserted.data);
    if (reportId === null) {
      console.error('Report upsert returned no id');
      return { ok: false, reason: 'db_error' };
    }

    return {
      ok: true,
      reportId,
      status,
      sources,
      blockers,
      warnings,
    };
  } catch {
    console.error('Report generation failed');
    return { ok: false, reason: 'db_error' };
  }
}

async function loadClient(
  supabase: ServiceClient,
  clientId: string
): Promise<
  | { ok: true; client: ReportClient }
  | { ok: false; reason: 'not_found' | 'inactive' | 'db_error' }
> {
  const result = await supabase
    .from('clients')
    .select(CLIENT_COLUMNS)
    .eq('id', clientId)
    .maybeSingle();

  if (result.error) {
    console.error('Client lookup failed');
    return { ok: false, reason: 'db_error' };
  }
  if (result.data === null) {
    return { ok: false, reason: 'not_found' };
  }

  const parsed = parseClient(result.data);
  if (parsed === null) {
    console.error('Client row was invalid');
    return { ok: false, reason: 'db_error' };
  }
  if (!parsed.active) {
    return { ok: false, reason: 'inactive' };
  }

  return { ok: true, client: parsed.client };
}

function parseClient(
  value: unknown
): { client: ReportClient; active: boolean } | null {
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
  if (typeof value.active !== 'boolean') {
    return null;
  }

  return {
    active: value.active,
    client: {
      id,
      name,
      slug,
      siteUrl,
      careTier,
      ga4PropertyId: asOptionalString(value.ga4_property_id),
      gscSiteUrl: asOptionalString(value.gsc_site_url),
      cruxOrigin: asOptionalString(value.crux_origin),
      uptimerobotMonitorId: asOptionalString(value.uptimerobot_monitor_id),
      engagementMetrics: value.engagement_metrics ?? null,
    },
  };
}

function collectBlockers(params: {
  ga4: FetchGa4ReportResult;
  gsc: FetchGscReportResult;
}): ReportBlocker[] {
  const blockers: ReportBlocker[] = [];

  if (!params.ga4.ok) {
    blockers.push('ga4_failed');
  } else if (params.ga4.data.sessions === 0) {
    blockers.push('zero_sessions');
  }

  if (!params.gsc.ok) {
    blockers.push('gsc_failed');
  } else if (!params.gsc.skipped && params.gsc.data.emptyRows) {
    blockers.push('gsc_empty_rows');
  }

  return blockers;
}

function collectWarnings(params: {
  crux: FetchCruxReportResult;
  uptime: FetchUptimeReportResult;
  engagement: FetchEngagementReportResult | null;
}): ReportWarning[] {
  const warnings: ReportWarning[] = [];

  if (!params.crux.ok) {
    warnings.push('crux_failed');
  }

  if (!params.uptime.ok) {
    warnings.push('uptime_failed');
  }

  if (params.engagement !== null && !params.engagement.ok) {
    warnings.push('engagement_failed');
  }

  return warnings;
}

function toSourceSummary(params: {
  ga4: FetchGa4ReportResult;
  gsc: FetchGscReportResult;
  crux: FetchCruxReportResult;
  uptime: FetchUptimeReportResult;
  engagement: FetchEngagementReportResult | null;
}): SourceSummary {
  return {
    ga4: params.ga4.ok ? 'ok' : 'failed',
    gsc: !params.gsc.ok
      ? 'failed'
      : params.gsc.skipped
        ? 'skipped'
        : 'ok',
    crux: !params.crux.ok
      ? 'failed'
      : params.crux.kind === 'no_data'
        ? 'no_data'
        : 'ok',
    uptime: params.uptime.ok ? 'ok' : 'failed',
    engagement:
      params.engagement === null
        ? 'skipped'
        : params.engagement.ok
          ? 'ok'
          : 'failed',
  };
}

function monthWindow(period: string): MonthWindow | null {
  if (!PERIOD_RE.test(period)) {
    return null;
  }

  const year = Number(period.slice(0, 4));
  const month = Number(period.slice(5, 7));
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }

  const prior = new Date(Date.UTC(year, month - 2, 1));
  const priorYear = prior.getUTCFullYear();
  const priorMonth = prior.getUTCMonth() + 1;

  return {
    startDate: period,
    endDate: lastDayOfMonth(year, month),
    priorStartDate: `${priorYear}-${pad2(priorMonth)}-01`,
    priorEndDate: lastDayOfMonth(priorYear, priorMonth),
  };
}

function lastDayOfMonth(year: number, month: number): string {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${pad2(month)}-${pad2(lastDay)}`;
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

async function isolate<T>(
  run: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await run();
  } catch {
    return fallback;
  }
}

function isSentStatus(value: unknown): boolean {
  if (!isPlainObject(value)) {
    return false;
  }
  return value.status === 'sent';
}

function isCareTier(value: unknown): value is CareTier {
  return value === 'essential' || value === 'care';
}

function readUuid(value: unknown): string | null {
  if (!isPlainObject(value) || typeof value.id !== 'string') {
    return null;
  }
  return value.id.length > 0 ? value.id : null;
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asOptionalString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
