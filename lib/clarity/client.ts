import 'server-only';
import { serverEnv } from '@/lib/env/server';

const CLARITY_INSIGHTS_URL =
  'https://www.clarity.ms/export-data/api/v1/project-live-insights';

export class ClarityTokenMissingError extends Error {
  readonly code = 'clarity_token_missing' as const;

  constructor() {
    super('Clarity API token is not configured');
    this.name = 'ClarityTokenMissingError';
  }
}

export type ClarityMetricGroup = {
  metricName: string;
  information: Array<Record<string, string | number>>;
};

export type ClarityInsightsResult =
  | { ok: true; data: ClarityMetricGroup[] }
  | {
      ok: false;
      reason:
        | 'unauthorized'
        | 'rate_limited'
        | 'http_error'
        | 'network_error'
        | 'invalid_json';
      status?: number;
    };

export async function fetchClarityInsights(params: {
  numOfDays: 1 | 2 | 3;
  dimensions: string[];
}): Promise<ClarityInsightsResult> {
  if (params.dimensions.length > 3) {
    throw new Error('Clarity insights support at most 3 dimensions');
  }

  const token = serverEnv.CLARITY_API_TOKEN;
  if (!token) {
    throw new ClarityTokenMissingError();
  }

  const url = new URL(CLARITY_INSIGHTS_URL);
  url.searchParams.set('numOfDays', String(params.numOfDays));
  params.dimensions.forEach((dimension, index) => {
    url.searchParams.set(`dimension${index + 1}`, dimension);
  });

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
  } catch {
    return { ok: false, reason: 'network_error' };
  }

  if (response.status === 401) {
    return { ok: false, reason: 'unauthorized', status: 401 };
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

  const data = parseClarityMetricGroups(parsed);
  if (data === null) {
    return { ok: false, reason: 'invalid_json', status: response.status };
  }

  return { ok: true, data };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseInformationRow(
  value: unknown
): Record<string, string | number> | null {
  if (!isPlainObject(value)) {
    return null;
  }

  const row: Record<string, string | number> = {};
  for (const [key, field] of Object.entries(value)) {
    if (typeof field === 'string' || typeof field === 'number') {
      row[key] = field;
    }
  }
  return row;
}

function parseClarityMetricGroups(value: unknown): ClarityMetricGroup[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const groups: ClarityMetricGroup[] = [];
  for (const item of value) {
    if (!isPlainObject(item) || typeof item.metricName !== 'string') {
      return null;
    }
    if (!Array.isArray(item.information)) {
      return null;
    }

    const information: Array<Record<string, string | number>> = [];
    for (const row of item.information) {
      const parsedRow = parseInformationRow(row);
      if (parsedRow === null) {
        return null;
      }
      information.push(parsedRow);
    }

    groups.push({ metricName: item.metricName, information });
  }

  return groups;
}
