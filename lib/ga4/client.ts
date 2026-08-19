import 'server-only';
import { getGa4AccessToken } from '@/lib/ga4/auth';
import { serverEnv } from '@/lib/env/server';

const YYYYMMDD_RE = /^\d{8}$/;

export type Ga4Row = {
  dimensions: string[];
  metrics: number[];
};

export type Ga4ReportResult =
  | { ok: true; rows: Ga4Row[] }
  | {
      ok: false;
      reason:
        | 'unauthorized'
        | 'forbidden'
        | 'rate_limited'
        | 'http_error'
        | 'network_error'
        | 'invalid_json';
      status?: number;
    };

export async function runGa4Report(params: {
  startDate: string;
  endDate: string;
  dimensions: string[];
  metrics: string[];
}): Promise<Ga4ReportResult> {
  const propertyId = serverEnv.GA4_PROPERTY_ID;
  if (!propertyId) {
    return { ok: false, reason: 'unauthorized' };
  }

  const tokenResult = await getGa4AccessToken();
  if (!tokenResult.ok) {
    if (tokenResult.reason === 'not_configured') {
      return { ok: false, reason: 'unauthorized' };
    }
    return {
      ok: false,
      reason: tokenResult.reason,
      status: tokenResult.status,
    };
  }

  const endpoint = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenResult.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: params.startDate, endDate: params.endDate }],
        dimensions: params.dimensions.map((name) => ({ name })),
        metrics: params.metrics.map((name) => ({ name })),
      }),
      cache: 'no-store',
    });
  } catch {
    return { ok: false, reason: 'network_error' };
  }

  if (response.status === 401) {
    return { ok: false, reason: 'unauthorized', status: 401 };
  }
  if (response.status === 403) {
    return { ok: false, reason: 'forbidden', status: 403 };
  }
  if (response.status === 429) {
    return { ok: false, reason: 'rate_limited', status: 429 };
  }
  if (!response.ok) {
    return { ok: false, reason: 'http_error', status: response.status };
  }

  let parsed: unknown;
  try {
    parsed = await response.json();
  } catch {
    return { ok: false, reason: 'invalid_json', status: response.status };
  }

  const rows = parseReportRows(
    parsed,
    params.dimensions.length,
    params.metrics.length
  );
  if (rows === null) {
    return { ok: false, reason: 'invalid_json', status: response.status };
  }

  return { ok: true, rows };
}

function parseReportRows(
  value: unknown,
  dimensionCount: number,
  metricCount: number
): Ga4Row[] | null {
  if (!isPlainObject(value)) {
    return null;
  }

  if (!('rows' in value) || value.rows === undefined) {
    return [];
  }

  if (!Array.isArray(value.rows)) {
    return null;
  }

  const rows: Ga4Row[] = [];
  for (const item of value.rows) {
    const row = parseGa4Row(item, dimensionCount, metricCount);
    if (row === null) {
      return null;
    }
    rows.push(row);
  }

  return rows;
}

function parseGa4Row(
  value: unknown,
  dimensionCount: number,
  metricCount: number
): Ga4Row | null {
  if (!isPlainObject(value)) {
    return null;
  }

  if (!Array.isArray(value.dimensionValues) || !Array.isArray(value.metricValues)) {
    return null;
  }

  if (
    value.dimensionValues.length !== dimensionCount ||
    value.metricValues.length !== metricCount
  ) {
    return null;
  }

  const dimensions: string[] = [];
  for (const item of value.dimensionValues) {
    const parsed = parseDimensionValue(item);
    if (parsed === null) {
      return null;
    }
    dimensions.push(parsed);
  }

  const metrics: number[] = [];
  for (const item of value.metricValues) {
    const parsed = parseMetricValue(item);
    if (parsed === null) {
      return null;
    }
    metrics.push(parsed);
  }

  return { dimensions, metrics };
}

function parseDimensionValue(value: unknown): string | null {
  if (!isPlainObject(value) || typeof value.value !== 'string') {
    return null;
  }
  return formatGa4Date(value.value);
}

function parseMetricValue(value: unknown): number | null {
  if (!isPlainObject(value) || typeof value.value !== 'string') {
    return null;
  }
  if (value.value.trim() === '') {
    return null;
  }
  const parsed = Number(value.value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
}

/**
 * GA4 `date` values are property-local calendar days (this property's
 * metadata.timeZone is America/Los_Angeles), returned as YYYYMMDD strings.
 * Reformat to YYYY-MM-DD only. Do not convert to UTC or any other zone.
 */
function formatGa4Date(value: string): string {
  if (!YYYYMMDD_RE.test(value)) {
    return value;
  }
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
