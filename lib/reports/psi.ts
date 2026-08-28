import 'server-only';
import { serverEnv } from '@/lib/env/server';
import type { ReportSourceFailure } from '@/lib/reports/google-credentials';

const PSI_ENDPOINT =
  'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

const THRESHOLDS = {
  lcp: 2500,
  tbt: 200,
  cls: 0.1,
} as const;

export type PsiMetric = {
  value: number;
  threshold: number;
  passed: boolean;
};

export type PsiReportData = {
  strategy: 'mobile';
  fetchedAt: string;
  performanceScore: number;
  lcp: PsiMetric;
  tbt: PsiMetric;
  cls: PsiMetric;
};

export type FetchPsiReportResult =
  | { ok: true; data: PsiReportData }
  | ReportSourceFailure;

export async function fetchPsiReport(params: {
  url: string | null;
}): Promise<FetchPsiReportResult> {
  const pageUrl = normalizeUrl(params.url);
  if (pageUrl === null) {
    return { ok: false, reason: 'not_configured' };
  }

  const apiKey = serverEnv.CRUX_API_KEY;
  if (!apiKey) {
    return { ok: false, reason: 'not_configured' };
  }

  const url = new URL(PSI_ENDPOINT);
  url.searchParams.set('url', pageUrl);
  url.searchParams.set('strategy', 'mobile');
  url.searchParams.set('category', 'performance');
  url.searchParams.set('key', apiKey);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: AbortSignal.timeout(45000),
    });
  } catch {
    console.error('PSI request failed');
    return { ok: false, reason: 'network_error' };
  }

  if (response.status === 401) {
    console.error('PSI request failed');
    return { ok: false, reason: 'unauthorized', status: 401 };
  }
  if (response.status === 403) {
    console.error('PSI request failed');
    return { ok: false, reason: 'forbidden', status: 403 };
  }
  if (response.status === 429) {
    console.error('PSI request failed');
    return { ok: false, reason: 'rate_limited', status: 429 };
  }
  if (!response.ok) {
    console.error('PSI request failed');
    return { ok: false, reason: 'http_error', status: response.status };
  }

  let parsed: unknown;
  try {
    parsed = await response.json();
  } catch {
    console.error('PSI response was invalid');
    return { ok: false, reason: 'invalid_json', status: response.status };
  }

  const data = parsePsiResult(parsed);
  if (data === null) {
    console.error('PSI response was invalid');
    return { ok: false, reason: 'invalid_json', status: response.status };
  }

  return { ok: true, data };
}

function parsePsiResult(value: unknown): PsiReportData | null {
  if (!isPlainObject(value) || !isPlainObject(value.lighthouseResult)) {
    return null;
  }

  const lighthouseResult = value.lighthouseResult;
  if (!isPlainObject(lighthouseResult.audits)) {
    return null;
  }

  const audits = lighthouseResult.audits;
  const lcp = parseAudit(audits['largest-contentful-paint'], THRESHOLDS.lcp);
  const tbt = parseAudit(audits['total-blocking-time'], THRESHOLDS.tbt);
  const cls = parseAudit(audits['cumulative-layout-shift'], THRESHOLDS.cls);
  if (lcp === null || tbt === null || cls === null) {
    return null;
  }

  const performanceScore = parsePerformanceScore(
    lighthouseResult.categories
  );
  if (performanceScore === null) {
    return null;
  }

  return {
    strategy: 'mobile',
    fetchedAt: new Date().toISOString(),
    performanceScore,
    lcp,
    tbt,
    cls,
  };
}

function parsePerformanceScore(value: unknown): number | null {
  if (!isPlainObject(value) || !isPlainObject(value.performance)) {
    return null;
  }
  const score = toFiniteNumber(value.performance.score);
  if (score === null || score < 0 || score > 1) {
    return null;
  }
  return Math.round(score * 100);
}

function parseAudit(value: unknown, threshold: number): PsiMetric | null {
  if (!isPlainObject(value)) {
    return null;
  }
  const numericValue = toFiniteNumber(value.numericValue);
  if (numericValue === null) {
    return null;
  }
  return {
    value: numericValue,
    threshold,
    passed: numericValue <= threshold,
  };
}

function normalizeUrl(value: string | null): string | null {
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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
