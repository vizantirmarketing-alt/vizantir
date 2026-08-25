import 'server-only';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import {
  getGoogleServiceAccount,
  mapGoogleClientError,
  type ReportSourceFailure,
} from '@/lib/reports/google-credentials';

const PROPERTY_PREFIX = 'properties/';
const TOP_PAGES_LIMIT = 5;

export type Ga4ChannelRow = {
  channel: string;
  sessions: number;
};

export type Ga4PageRow = {
  pagePath: string;
  screenPageViews: number;
  averageSessionDuration: number;
};

export type Ga4ConversionRow = {
  eventName: string;
  keyEvents: number;
};

export type Ga4ReportData = {
  sessions: number;
  totalUsers: number;
  newUsers: number;
  returningUsers: number;
  newUserSessions: number;
  returningUserSessions: number;
  channelGroups: Ga4ChannelRow[];
  topPages: Ga4PageRow[];
  conversions: Ga4ConversionRow[];
};

export type FetchGa4ReportResult =
  | { ok: true; data: Ga4ReportData }
  | ReportSourceFailure;

type MetricRow = {
  dimensions: string[];
  metrics: number[];
};

export async function fetchGa4Report(params: {
  propertyId: string | null;
  startDate: string;
  endDate: string;
}): Promise<FetchGa4ReportResult> {
  try {
    const propertyId = normalizePropertyId(params.propertyId);
    if (propertyId === null) {
      return { ok: false, reason: 'not_configured' };
    }

    const account = getGoogleServiceAccount();
    if (account === null) {
      return { ok: false, reason: 'not_configured' };
    }

    const client = new BetaAnalyticsDataClient({
      credentials: {
        client_email: account.clientEmail,
        private_key: account.privateKey,
      },
      fallback: true,
    });

    const property = `${PROPERTY_PREFIX}${propertyId}`;

    const [totals, newVsReturning, channels, pages, conversions] =
      await Promise.all([
        runReport(client, {
          property,
          startDate: params.startDate,
          endDate: params.endDate,
          dimensions: [],
          metrics: ['sessions', 'totalUsers'],
        }),
        runReport(client, {
          property,
          startDate: params.startDate,
          endDate: params.endDate,
          dimensions: ['newVsReturning'],
          metrics: ['sessions', 'totalUsers'],
        }),
        runReport(client, {
          property,
          startDate: params.startDate,
          endDate: params.endDate,
          dimensions: ['sessionDefaultChannelGroup'],
          metrics: ['sessions'],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        }),
        runReport(client, {
          property,
          startDate: params.startDate,
          endDate: params.endDate,
          dimensions: ['pagePath'],
          metrics: ['screenPageViews', 'averageSessionDuration'],
          orderBys: [
            { metric: { metricName: 'screenPageViews' }, desc: true },
          ],
          limit: TOP_PAGES_LIMIT,
        }),
        runReport(client, {
          property,
          startDate: params.startDate,
          endDate: params.endDate,
          dimensions: ['eventName'],
          metrics: ['keyEvents'],
          metricFilter: {
            filter: {
              fieldName: 'keyEvents',
              numericFilter: {
                operation: 'GREATER_THAN',
                value: { int64Value: '0' },
              },
            },
          },
          orderBys: [{ metric: { metricName: 'keyEvents' }, desc: true }],
        }),
      ]);

    if (!totals.ok) {
      return totals;
    }
    if (!newVsReturning.ok) {
      return newVsReturning;
    }
    if (!channels.ok) {
      return channels;
    }
    if (!pages.ok) {
      return pages;
    }
    if (!conversions.ok) {
      return conversions;
    }

    const totalsRow = totals.rows[0];
    const sessions = totalsRow?.metrics[0] ?? 0;
    const totalUsers = totalsRow?.metrics[1] ?? 0;

    let newUsers = 0;
    let returningUsers = 0;
    let newUserSessions = 0;
    let returningUserSessions = 0;
    for (const row of newVsReturning.rows) {
      const label = (row.dimensions[0] ?? '').toLowerCase();
      const rowSessions = row.metrics[0] ?? 0;
      const rowUsers = row.metrics[1] ?? 0;
      if (label === 'new') {
        newUserSessions = rowSessions;
        newUsers = rowUsers;
      } else if (label === 'returning') {
        returningUserSessions = rowSessions;
        returningUsers = rowUsers;
      }
    }

    const channelGroups: Ga4ChannelRow[] = [];
    for (const row of channels.rows) {
      const channel = row.dimensions[0];
      const channelSessions = row.metrics[0];
      if (channel === undefined || channelSessions === undefined) {
        continue;
      }
      channelGroups.push({ channel, sessions: channelSessions });
    }

    const topPages: Ga4PageRow[] = [];
    for (const row of pages.rows) {
      const pagePath = row.dimensions[0];
      const screenPageViews = row.metrics[0];
      const averageSessionDuration = row.metrics[1];
      if (
        pagePath === undefined ||
        screenPageViews === undefined ||
        averageSessionDuration === undefined
      ) {
        continue;
      }
      topPages.push({
        pagePath,
        screenPageViews,
        averageSessionDuration,
      });
    }

    const conversionRows: Ga4ConversionRow[] = [];
    for (const row of conversions.rows) {
      const eventName = row.dimensions[0];
      const keyEvents = row.metrics[0];
      if (eventName === undefined || keyEvents === undefined) {
        continue;
      }
      conversionRows.push({ eventName, keyEvents });
    }

    return {
      ok: true,
      data: {
        sessions,
        totalUsers,
        newUsers,
        returningUsers,
        newUserSessions,
        returningUserSessions,
        channelGroups,
        topPages,
        conversions: conversionRows,
      },
    };
  } catch (error) {
    return mapGoogleClientError(error);
  }
}

async function runReport(
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
  }
): Promise<{ ok: true; rows: MetricRow[] } | ReportSourceFailure> {
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
): MetricRow[] | null {
  if (value === undefined || value === null) {
    return [];
  }
  if (!Array.isArray(value)) {
    return null;
  }

  const rows: MetricRow[] = [];
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
): MetricRow | null {
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

function normalizePropertyId(value: string | null): string | null {
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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
