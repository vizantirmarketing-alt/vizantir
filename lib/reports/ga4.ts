import 'server-only';
import {
  createGa4DataClient,
  ga4PropertyPath,
  normalizeGa4PropertyId,
  runGa4Report,
} from '@/lib/reports/ga4-client';
import {
  mapGoogleClientError,
  type ReportSourceFailure,
} from '@/lib/reports/google-credentials';

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

export async function fetchGa4Report(params: {
  propertyId: string | null;
  startDate: string;
  endDate: string;
}): Promise<FetchGa4ReportResult> {
  try {
    const propertyId = normalizeGa4PropertyId(params.propertyId);
    if (propertyId === null) {
      return { ok: false, reason: 'not_configured' };
    }

    const created = createGa4DataClient();
    if (!created.ok) {
      return created;
    }

    const client = created.client;
    const property = ga4PropertyPath(propertyId);

    const [totals, newVsReturning, channels, pages, conversions] =
      await Promise.all([
        runGa4Report(client, {
          property,
          startDate: params.startDate,
          endDate: params.endDate,
          dimensions: [],
          metrics: ['sessions', 'totalUsers'],
        }),
        runGa4Report(client, {
          property,
          startDate: params.startDate,
          endDate: params.endDate,
          dimensions: ['newVsReturning'],
          metrics: ['sessions', 'totalUsers'],
        }),
        runGa4Report(client, {
          property,
          startDate: params.startDate,
          endDate: params.endDate,
          dimensions: ['sessionDefaultChannelGroup'],
          metrics: ['sessions'],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        }),
        runGa4Report(client, {
          property,
          startDate: params.startDate,
          endDate: params.endDate,
          dimensions: ['pagePath'],
          metrics: ['screenPageViews', 'averageSessionDuration'],
          dimensionFilter: {
            notExpression: {
              filter: {
                fieldName: 'pagePath',
                stringFilter: {
                  matchType: 'BEGINS_WITH',
                  value: '/intel',
                },
              },
            },
          },
          orderBys: [
            { metric: { metricName: 'screenPageViews' }, desc: true },
          ],
          limit: TOP_PAGES_LIMIT,
        }),
        runGa4Report(client, {
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
