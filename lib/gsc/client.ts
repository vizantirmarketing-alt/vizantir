import 'server-only';
import { getGscAccessToken } from '@/lib/gsc/auth';
import { serverEnv } from '@/lib/env/server';

export const SEARCH_ANALYTICS_ROW_LIMIT = 25000;

export type GscDimension = 'date' | 'query' | 'page';

export type GscRow = {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type GscSearchAnalyticsResult =
  | { ok: true; rows: GscRow[] }
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

export async function fetchSearchAnalytics(params: {
  startDate: string;
  endDate: string;
  dimensions: GscDimension[];
  startRow?: number;
}): Promise<GscSearchAnalyticsResult> {
  const siteUrl = serverEnv.GSC_SITE_URL;
  if (!siteUrl) {
    return { ok: false, reason: 'unauthorized' };
  }

  const tokenResult = await getGscAccessToken();
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

  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenResult.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate: params.startDate,
        endDate: params.endDate,
        dimensions: params.dimensions,
        rowLimit: SEARCH_ANALYTICS_ROW_LIMIT,
        startRow: params.startRow ?? 0,
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

  const rows = parseSearchAnalyticsRows(parsed);
  if (rows === null) {
    return { ok: false, reason: 'invalid_json', status: response.status };
  }

  return { ok: true, rows };
}

function parseSearchAnalyticsRows(value: unknown): GscRow[] | null {
  if (!isPlainObject(value)) {
    return null;
  }

  if (!('rows' in value) || value.rows === undefined) {
    return [];
  }

  if (!Array.isArray(value.rows)) {
    return null;
  }

  const rows: GscRow[] = [];
  for (const item of value.rows) {
    const row = parseGscRow(item);
    if (row === null) {
      return null;
    }
    rows.push(row);
  }

  return rows;
}

function parseGscRow(value: unknown): GscRow | null {
  if (!isPlainObject(value) || !Array.isArray(value.keys)) {
    return null;
  }

  const keys: string[] = [];
  for (const key of value.keys) {
    if (typeof key !== 'string') {
      return null;
    }
    keys.push(key);
  }

  const clicks = toFiniteNumber(value.clicks);
  const impressions = toFiniteNumber(value.impressions);
  const ctr = toFiniteNumber(value.ctr);
  const position = toFiniteNumber(value.position);
  if (
    clicks === null ||
    impressions === null ||
    ctr === null ||
    position === null
  ) {
    return null;
  }

  return {
    keys,
    clicks: Math.round(clicks),
    impressions: Math.round(impressions),
    ctr,
    position,
  };
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }
  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
