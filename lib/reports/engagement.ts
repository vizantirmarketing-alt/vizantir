import 'server-only';
import { z } from 'zod';
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

const UNSET_DIMENSION_VALUE = '(not set)';

const engagementEventSchema = z.strictObject({
  name: z.string().trim().min(1),
  label: z.string().trim().min(1),
});

const engagementBreakdownSchema = z.strictObject({
  dimension: z.string().trim().min(1),
  label: z.string().trim().min(1),
});

export const engagementMetricsConfigSchema = z.strictObject({
  title: z.string().trim().min(1),
  events: z.array(engagementEventSchema).min(1).max(6),
  breakdown: engagementBreakdownSchema.optional(),
});

export type EngagementMetricsConfig = z.infer<
  typeof engagementMetricsConfigSchema
>;

export type EngagementEventCount = {
  name: string;
  label: string;
  count: number;
};

export type EngagementBreakdownRow = {
  dimensionValue: string;
  events: EngagementEventCount[];
};

export type EngagementReportData = {
  title: string;
  events: EngagementEventCount[];
  breakdown: {
    dimension: string;
    label: string;
    rows: EngagementBreakdownRow[];
  } | null;
};

export type FetchEngagementReportResult =
  | { ok: true; data: EngagementReportData }
  | ReportSourceFailure;

export function parseEngagementMetricsConfig(
  value: unknown
): EngagementMetricsConfig | null {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = engagementMetricsConfigSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export async function fetchEngagementReport(params: {
  config: EngagementMetricsConfig;
  propertyId: string | null;
  startDate: string;
  endDate: string;
}): Promise<FetchEngagementReportResult> {
  try {
    const propertyId = normalizeGa4PropertyId(params.propertyId);
    if (propertyId === null) {
      return { ok: false, reason: 'not_configured' };
    }

    const created = createGa4DataClient();
    if (!created.ok) {
      return created;
    }

    const dimensions = ['eventName'];
    const breakdownDimension =
      params.config.breakdown === undefined
        ? null
        : toGa4DimensionName(params.config.breakdown.dimension);
    if (breakdownDimension !== null) {
      dimensions.push(breakdownDimension);
    }

    const result = await runGa4Report(created.client, {
      property: ga4PropertyPath(propertyId),
      startDate: params.startDate,
      endDate: params.endDate,
      dimensions,
      metrics: ['eventCount'],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          inListFilter: {
            values: params.config.events.map((event) => event.name),
          },
        },
      },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    });

    if (!result.ok) {
      return result;
    }

    return {
      ok: true,
      data: toEngagementReportData(params.config, result.rows),
    };
  } catch (error) {
    return mapGoogleClientError(error);
  }
}

function toEngagementReportData(
  config: EngagementMetricsConfig,
  rows: Array<{ dimensions: string[]; metrics: number[] }>
): EngagementReportData {
  const totals = new Map<string, number>();
  for (const event of config.events) {
    totals.set(event.name, 0);
  }

  const breakdownCounts = new Map<string, Map<string, number>>();
  const hasBreakdown = config.breakdown !== undefined;

  for (const row of rows) {
    const eventName = row.dimensions[0];
    const count = row.metrics[0];
    if (eventName === undefined || count === undefined) {
      continue;
    }
    if (!totals.has(eventName)) {
      continue;
    }

    totals.set(eventName, (totals.get(eventName) ?? 0) + count);

    if (!hasBreakdown) {
      continue;
    }

    const rawDimension = row.dimensions[1];
    if (rawDimension === undefined || isUnsetDimension(rawDimension)) {
      continue;
    }

    let eventCounts = breakdownCounts.get(rawDimension);
    if (eventCounts === undefined) {
      eventCounts = new Map<string, number>();
      breakdownCounts.set(rawDimension, eventCounts);
    }
    eventCounts.set(eventName, (eventCounts.get(eventName) ?? 0) + count);
  }

  const events: EngagementEventCount[] = config.events.map((event) => ({
    name: event.name,
    label: event.label,
    count: totals.get(event.name) ?? 0,
  }));

  if (config.breakdown === undefined) {
    return { title: config.title, events, breakdown: null };
  }

  const breakdownRows: EngagementBreakdownRow[] = [];
  for (const [dimensionValue, eventCounts] of breakdownCounts) {
    breakdownRows.push({
      dimensionValue,
      events: config.events.map((event) => ({
        name: event.name,
        label: event.label,
        count: eventCounts.get(event.name) ?? 0,
      })),
    });
  }

  breakdownRows.sort((a, b) => sumEventCounts(b) - sumEventCounts(a));

  return {
    title: config.title,
    events,
    breakdown: {
      dimension: config.breakdown.dimension,
      label: config.breakdown.label,
      rows: breakdownRows,
    },
  };
}

function toGa4DimensionName(dimension: string): string {
  return dimension.includes(':') ? dimension : `customEvent:${dimension}`;
}

function isUnsetDimension(value: string): boolean {
  return value.trim() === '' || value === UNSET_DIMENSION_VALUE;
}

function sumEventCounts(row: EngagementBreakdownRow): number {
  let total = 0;
  for (const event of row.events) {
    total += event.count;
  }
  return total;
}
