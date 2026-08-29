import 'server-only';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import {
  getGoogleServiceAccount,
  mapGoogleClientError,
  type ReportSourceFailure,
} from '@/lib/reports/google-credentials';

const PROPERTY_PREFIX = 'properties/';

export type Ga4MetricRow = {
  dimensions: string[];
  metrics: number[];
};

export type Ga4DataClient =
  | { ok: true; client: BetaAnalyticsDataClient }
  | ReportSourceFailure;

export function createGa4DataClient(): Ga4DataClient {
  const account = getGoogleServiceAccount();
  if (account === null) {
    return { ok: false, reason: 'not_configured' };
  }

  return {
    ok: true,
    client: new BetaAnalyticsDataClient({
      credentials: {
        client_email: account.clientEmail,
        private_key: account.privateKey,
      },
      fallback: true,
    }),
  };
}

export function normalizeGa4PropertyId(value: string | null): string | null {
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const id = trimmed.startsWith(PROPERTY_PREFIX)
    ? trimmed.slice(PROPERTY_PREFIX.length)
    : trimmed;
  return /^\d+$/.test(id) ? id : null;
}

export function ga4PropertyPath(propertyId: string): string {
  return `${PROPERTY_PREFIX}${propertyId}`;
}

export async function runGa4Report(
  client: BetaAnalyticsDataClient,
  request: {
    property: string;
    startDate: string;
    endDate: string;
    dimensions: string[];
    metrics: string[];
    orderBys?: Array<{ metric: { metricName: string }; desc: boolean }>;
    limit?: number;
    metricFilter?: {
      filter: {
        fieldName: string;
        numericFilter: {
          operation: 'GREATER_THAN';
          value: { int64Value: string };
        };
      };
    };
    dimensionFilter?:
      | {
          filter: {
            fieldName: string;
            inListFilter: { values: string[] };
          };
        }
      | {
          notExpression: {
            filter: {
              fieldName: string;
              stringFilter: {
                matchType: 'BEGINS_WITH';
                value: string;
              };
            };
          };
        };
  }
): Promise<{ ok: true; rows: Ga4MetricRow[] } | ReportSourceFailure> {
  try {
    const [response] = await client.runReport({
      property: request.property,
      dateRanges: [
        { startDate: request.startDate, endDate: request.endDate },
      ],
      dimensions: request.dimensions.map((name) => ({ name })),
      metrics: request.metrics.map((name) => ({ name })),
      orderBys: request.orderBys,
      limit: request.limit,
      metricFilter: request.metricFilter,
      dimensionFilter: request.dimensionFilter,
    });

    const rows = parseReportRows(
      response.rows,
      request.dimensions.length,
      request.metrics.length
    );
    if (rows === null) {
      return { ok: false, reason: 'invalid_json' };
    }

    return { ok: true, rows };
  } catch (error) {
    return mapGoogleClientError(error);
  }
}

function parseReportRows(
  value: unknown,
  dimensionCount: number,
  metricCount: number
): Ga4MetricRow[] | null {
  if (value === undefined || value === null) {
    return [];
  }
  if (!Array.isArray(value)) {
    return null;
  }

  const rows: Ga4MetricRow[] = [];
  for (const item of value) {
    const row = parseReportRow(item, dimensionCount, metricCount);
    if (row === null) {
      return null;
    }
    rows.push(row);
  }
  return rows;
}

function parseReportRow(
  value: unknown,
  dimensionCount: number,
  metricCount: number
): Ga4MetricRow | null {
  if (!isPlainObject(value)) {
    return null;
  }

  const dimensions = parseStringValues(value.dimensionValues, dimensionCount);
  const metrics = parseNumericValues(value.metricValues, metricCount);
  if (dimensions === null || metrics === null) {
    return null;
  }

  return { dimensions, metrics };
}

function parseStringValues(
  value: unknown,
  expectedLength: number
): string[] | null {
  if (expectedLength === 0) {
    return [];
  }
  if (!Array.isArray(value) || value.length !== expectedLength) {
    return null;
  }

  const result: string[] = [];
  for (const item of value) {
    if (!isPlainObject(item) || typeof item.value !== 'string') {
      return null;
    }
    result.push(item.value);
  }
  return result;
}

function parseNumericValues(
  value: unknown,
  expectedLength: number
): number[] | null {
  if (!Array.isArray(value) || value.length !== expectedLength) {
    return null;
  }

  const result: number[] = [];
  for (const item of value) {
    if (!isPlainObject(item) || typeof item.value !== 'string') {
      return null;
    }
    if (item.value.trim() === '') {
      return null;
    }
    const parsed = Number(item.value);
    if (!Number.isFinite(parsed)) {
      return null;
    }
    result.push(parsed);
  }
  return result;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
