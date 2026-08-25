import 'server-only';
import { google } from 'googleapis';
import {
  getGoogleServiceAccount,
  mapGoogleClientError,
  type ReportSourceFailure,
} from '@/lib/reports/google-credentials';

const TOP_LIMIT = 10;
const FETCH_ROW_LIMIT = 25;
const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

export type GscTotals = {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type GscMovedRow = {
  key: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  prior: GscTotals | null;
  clicksChange: number | null;
  impressionsChange: number | null;
  ctrChange: number | null;
  positionChange: number | null;
};

export type GscReportData = {
  current: GscTotals;
  prior: GscTotals | null;
  clicksChange: number | null;
  impressionsChange: number | null;
  ctrChange: number | null;
  positionChange: number | null;
  topQueries: GscMovedRow[];
  topPages: GscMovedRow[];
  emptyRows: boolean;
};

export type FetchGscReportResult =
  | { ok: true; skipped: true }
  | { ok: true; skipped: false; data: GscReportData }
  | ReportSourceFailure;

type GscApiRow = {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

type SearchanalyticsClient = ReturnType<
  typeof google.searchconsole
>['searchanalytics'];

export async function fetchGscReport(params: {
  careTier: string;
  siteUrl: string | null;
  startDate: string;
  endDate: string;
  priorStartDate: string;
  priorEndDate: string;
}): Promise<FetchGscReportResult> {
  try {
    if (params.careTier === 'essential') {
      return { ok: true, skipped: true };
    }

    const siteUrl = normalizeSiteUrl(params.siteUrl);
    if (siteUrl === null) {
      return { ok: false, reason: 'not_configured' };
    }

    const account = getGoogleServiceAccount();
    if (account === null) {
      return { ok: false, reason: 'not_configured' };
    }

    const auth = new google.auth.JWT({
      email: account.clientEmail,
      key: account.privateKey,
      scopes: [GSC_SCOPE],
    });
    const searchconsole = google.searchconsole({ version: 'v1', auth });
    const searchanalytics = searchconsole.searchanalytics;

    const [
      currentTotals,
      priorTotals,
      currentQueries,
      priorQueries,
      currentPages,
      priorPages,
    ] = await Promise.all([
      querySearchAnalytics(searchanalytics, siteUrl, {
        startDate: params.startDate,
        endDate: params.endDate,
        dimensions: [],
      }),
      querySearchAnalytics(searchanalytics, siteUrl, {
        startDate: params.priorStartDate,
        endDate: params.priorEndDate,
        dimensions: [],
      }),
      querySearchAnalytics(searchanalytics, siteUrl, {
        startDate: params.startDate,
        endDate: params.endDate,
        dimensions: ['query'],
        rowLimit: FETCH_ROW_LIMIT,
      }),
      querySearchAnalytics(searchanalytics, siteUrl, {
        startDate: params.priorStartDate,
        endDate: params.priorEndDate,
        dimensions: ['query'],
        rowLimit: FETCH_ROW_LIMIT,
      }),
      querySearchAnalytics(searchanalytics, siteUrl, {
        startDate: params.startDate,
        endDate: params.endDate,
        dimensions: ['page'],
        rowLimit: FETCH_ROW_LIMIT,
      }),
      querySearchAnalytics(searchanalytics, siteUrl, {
        startDate: params.priorStartDate,
        endDate: params.priorEndDate,
        dimensions: ['page'],
        rowLimit: FETCH_ROW_LIMIT,
      }),
    ]);

    if (!currentTotals.ok) {
      return currentTotals;
    }
    if (!priorTotals.ok) {
      return priorTotals;
    }
    if (!currentQueries.ok) {
      return currentQueries;
    }
    if (!priorQueries.ok) {
      return priorQueries;
    }
    if (!currentPages.ok) {
      return currentPages;
    }
    if (!priorPages.ok) {
      return priorPages;
    }

    const emptyRows = currentTotals.rows.length === 0;
    const current = emptyRows
      ? { clicks: 0, impressions: 0, ctr: 0, position: 0 }
      : toTotals(currentTotals.rows[0]);
    const prior =
      priorTotals.rows.length === 0
        ? null
        : toTotals(priorTotals.rows[0]);

    return {
      ok: true,
      skipped: false,
      data: {
        current,
        prior,
        clicksChange: prior === null ? null : current.clicks - prior.clicks,
        impressionsChange:
          prior === null ? null : current.impressions - prior.impressions,
        ctrChange: prior === null ? null : current.ctr - prior.ctr,
        positionChange:
          prior === null ? null : current.position - prior.position,
        topQueries: withMovement(currentQueries.rows, priorQueries.rows),
        topPages: withMovement(currentPages.rows, priorPages.rows),
        emptyRows,
      },
    };
  } catch (error) {
    return mapGoogleClientError(error);
  }
}

async function querySearchAnalytics(
  searchanalytics: SearchanalyticsClient,
  siteUrl: string,
  request: {
    startDate: string;
    endDate: string;
    dimensions: Array<'query' | 'page'>;
    rowLimit?: number;
  }
): Promise<{ ok: true; rows: GscApiRow[] } | ReportSourceFailure> {
  try {
    const response = await searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: request.startDate,
        endDate: request.endDate,
        dimensions: request.dimensions,
        rowLimit: request.rowLimit,
      },
    });

    const rows = parseSearchAnalyticsRows(response.data.rows);
    if (rows === null) {
      return { ok: false, reason: 'invalid_json' };
    }
    return { ok: true, rows };
  } catch (error) {
    return mapGoogleClientError(error);
  }
}

function withMovement(
  currentRows: GscApiRow[],
  priorRows: GscApiRow[]
): GscMovedRow[] {
  const priorByKey = new Map<string, GscTotals>();
  for (const row of priorRows) {
    const key = row.keys[0];
    if (key === undefined) {
      continue;
    }
    priorByKey.set(key, {
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    });
  }

  const moved: GscMovedRow[] = [];
  for (const row of currentRows) {
    if (moved.length >= TOP_LIMIT) {
      break;
    }
    const key = row.keys[0];
    if (key === undefined) {
      continue;
    }
    const prior = priorByKey.get(key) ?? null;
    moved.push({
      key,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
      prior,
      clicksChange: prior === null ? null : row.clicks - prior.clicks,
      impressionsChange:
        prior === null ? null : row.impressions - prior.impressions,
      ctrChange: prior === null ? null : row.ctr - prior.ctr,
      positionChange: prior === null ? null : row.position - prior.position,
    });
  }
  return moved;
}

function toTotals(row: GscApiRow | undefined): GscTotals {
  if (row === undefined) {
    return { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  }
  return {
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
  };
}

function parseSearchAnalyticsRows(value: unknown): GscApiRow[] | null {
  if (value === undefined || value === null) {
    return [];
  }
  if (!Array.isArray(value)) {
    return null;
  }

  const rows: GscApiRow[] = [];
  for (const item of value) {
    const row = parseGscRow(item);
    if (row === null) {
      return null;
    }
    rows.push(row);
  }
  return rows;
}

function parseGscRow(value: unknown): GscApiRow | null {
  if (!isPlainObject(value)) {
    return null;
  }

  const keys: string[] = [];
  if (value.keys !== undefined) {
    if (!Array.isArray(value.keys)) {
      return null;
    }
    for (const key of value.keys) {
      if (typeof key !== 'string') {
        return null;
      }
      keys.push(key);
    }
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

function normalizeSiteUrl(value: string | null): string | null {
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
