import 'server-only';
import { serverEnv } from '@/lib/env/server';
import type { ReportSourceFailure } from '@/lib/reports/google-credentials';

const CRUX_ENDPOINT =
  'https://chromeuxreport.googleapis.com/v1/records:queryRecord';

const THRESHOLDS = {
  lcp: 2500,
  inp: 200,
  cls: 0.1,
} as const;

export type CruxMetric = {
  p75: number;
  threshold: number;
  passed: boolean;
};

export type CruxReportData = {
  formFactor: 'PHONE';
  collectionPeriod: {
    firstDate: string;
    lastDate: string;
  } | null;
  lcp: CruxMetric;
  inp: CruxMetric;
  cls: CruxMetric;
};

export type FetchCruxReportResult =
  | { ok: true; kind: 'metrics'; data: CruxReportData }
  | { ok: true; kind: 'no_data' }
  | ReportSourceFailure;

export async function fetchCruxReport(params: {
  origin: string | null;
}): Promise<FetchCruxReportResult> {
  const origin = normalizeOrigin(params.origin);
  if (origin === null) {
    return { ok: true, kind: 'no_data' };
  }

  const apiKey = serverEnv.CRUX_API_KEY;
  if (!apiKey) {
    return { ok: false, reason: 'not_configured' };
  }

  const url = new URL(CRUX_ENDPOINT);
  url.searchParams.set('key', apiKey);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin,
        formFactor: 'PHONE',
        metrics: [
          'largest_contentful_paint',
          'interaction_to_next_paint',
          'cumulative_layout_shift',
        ],
      }),
      cache: 'no-store',
    });
  } catch {
    return { ok: false, reason: 'network_error' };
  }

  if (response.status === 404) {
    return { ok: true, kind: 'no_data' };
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

  const data = parseCruxRecord(parsed);
  if (data === null) {
    return { ok: false, reason: 'invalid_json', status: response.status };
  }

  return { ok: true, kind: 'metrics', data };
}

function parseCruxRecord(value: unknown): CruxReportData | null {
  if (!isPlainObject(value) || !isPlainObject(value.record)) {
    return null;
  }

  const metrics = value.record.metrics;
  if (!isPlainObject(metrics)) {
    return null;
  }

  const lcp = parseMetric(metrics.largest_contentful_paint, THRESHOLDS.lcp);
  const inp = parseMetric(metrics.interaction_to_next_paint, THRESHOLDS.inp);
  const cls = parseMetric(metrics.cumulative_layout_shift, THRESHOLDS.cls);
  if (lcp === null || inp === null || cls === null) {
    return null;
  }

  return {
    formFactor: 'PHONE',
    collectionPeriod: parseCollectionPeriod(value.record.collectionPeriod),
    lcp,
    inp,
    cls,
  };
}

function parseMetric(value: unknown, threshold: number): CruxMetric | null {
  if (!isPlainObject(value) || !isPlainObject(value.percentiles)) {
    return null;
  }
  const p75 = toFiniteNumber(value.percentiles.p75);
  if (p75 === null) {
    return null;
  }
  return {
    p75,
    threshold,
    passed: p75 <= threshold,
  };
}

function parseCollectionPeriod(
  value: unknown
): CruxReportData['collectionPeriod'] {
  if (!isPlainObject(value)) {
    return null;
  }
  const firstDate = formatCruxDate(value.firstDate);
  const lastDate = formatCruxDate(value.lastDate);
  if (firstDate === null || lastDate === null) {
    return null;
  }
  return { firstDate, lastDate };
}

function formatCruxDate(value: unknown): string | null {
  if (!isPlainObject(value)) {
    return null;
  }
  const year = toFiniteNumber(value.year);
  const month = toFiniteNumber(value.month);
  const day = toFiniteNumber(value.day);
  if (
    year === null ||
    month === null ||
    day === null ||
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null;
  }
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function normalizeOrigin(value: string | null): string | null {
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
