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

const AUDIENCE_ROW_LIMIT = 10;

export type Ga4DimensionRow = {
  label: string;
  sessions: number;
};

export type Ga4AudienceData = {
  countries: Ga4DimensionRow[];
  devices: Ga4DimensionRow[];
  browsers: Ga4DimensionRow[];
};

export type FetchGa4AudienceResult =
  | { ok: true; data: Ga4AudienceData }
  | ReportSourceFailure;

export async function fetchGa4Audience(params: {
  propertyId: string | null;
  startDate: string;
  endDate: string;
}): Promise<FetchGa4AudienceResult> {
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

    const [countries, devices, browsers] = await Promise.all([
      runGa4Report(client, {
        property,
        startDate: params.startDate,
        endDate: params.endDate,
        dimensions: ['country'],
        metrics: ['sessions'],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: AUDIENCE_ROW_LIMIT,
      }),
      runGa4Report(client, {
        property,
        startDate: params.startDate,
        endDate: params.endDate,
        dimensions: ['deviceCategory'],
        metrics: ['sessions'],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: AUDIENCE_ROW_LIMIT,
      }),
      runGa4Report(client, {
        property,
        startDate: params.startDate,
        endDate: params.endDate,
        dimensions: ['browser'],
        metrics: ['sessions'],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: AUDIENCE_ROW_LIMIT,
      }),
    ]);

    if (!countries.ok) {
      return countries;
    }
    if (!devices.ok) {
      return devices;
    }
    if (!browsers.ok) {
      return browsers;
    }

    return {
      ok: true,
      data: {
        countries: toDimensionRows(countries.rows),
        devices: toDimensionRows(devices.rows),
        browsers: toDimensionRows(browsers.rows),
      },
    };
  } catch (error) {
    return mapGoogleClientError(error);
  }
}

function toDimensionRows(
  rows: Array<{ dimensions: string[]; metrics: number[] }>
): Ga4DimensionRow[] {
  const result: Ga4DimensionRow[] = [];
  for (const row of rows) {
    const label = row.dimensions[0];
    const sessions = row.metrics[0];
    if (label === undefined || sessions === undefined) {
      continue;
    }
    result.push({ label, sessions });
  }
  result.sort((a, b) => b.sessions - a.sessions);
  return result;
}
