import 'server-only';
import {
  SEARCH_ANALYTICS_ROW_LIMIT,
  fetchSearchAnalytics,
  type GscRow,
} from '@/lib/gsc/client';
import { serverEnv } from '@/lib/env/server';
import { createSupabaseServiceRole } from '@/lib/supabase/service';

const BACKFILL_FLOOR = '2025-12-18';
const UPSERT_CHUNK_SIZE = 500;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const SITE_CONFLICT = 'date';
const QUERY_PAGE_CONFLICT = 'date,query,page';

export type SyncGscResult = {
  status: 'success' | 'partial' | 'failed';
  recordsProcessed: number;
  message?: string;
};

type ServiceClient = ReturnType<typeof createSupabaseServiceRole>;

type GscSiteDailyRow = {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  updated_at: string;
};

type GscQueryPageDailyRow = {
  date: string;
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  updated_at: string;
};

type WindowSyncResult =
  | { ok: true; recordsProcessed: number }
  | { ok: false };

export async function syncGsc(options?: {
  backfill?: boolean;
}): Promise<SyncGscResult> {
  let runId: number | null = null;
  let recordsProcessed = 0;
  const dataThroughDate = utcDateOffset(-2);

  try {
    const supabase = createSupabaseServiceRole();

    const inserted = await supabase
      .from('sync_runs')
      .insert({ provider: 'gsc', status: 'running' })
      .select('id')
      .single();

    runId = readNumericId(inserted.data);
    if (inserted.error || runId === null) {
      return {
        status: 'failed',
        recordsProcessed: 0,
        message: 'Failed to record sync run',
      };
    }

    if (!serverEnv.GSC_SERVICE_ACCOUNT_KEY || !serverEnv.GSC_SITE_URL) {
      const message = 'GSC is not configured';
      await finishRun(supabase, runId, {
        status: 'failed',
        recordsProcessed: 0,
        dataThroughDate,
        message,
      });
      return { status: 'failed', recordsProcessed: 0, message };
    }

    if (options?.backfill === true) {
      return await runBackfill(supabase, runId, dataThroughDate);
    }

    const startDate = utcDateOffset(-5);
    const daily = await syncDailyWindow(
      supabase,
      startDate,
      dataThroughDate,
      new Date().toISOString()
    );
    recordsProcessed = daily.recordsProcessed;

    await finishRun(supabase, runId, {
      status: daily.status,
      recordsProcessed,
      dataThroughDate,
      message: daily.message,
    });
    return {
      status: daily.status,
      recordsProcessed,
      message: daily.message,
    };
  } catch {
    if (runId !== null) {
      try {
        const supabase = createSupabaseServiceRole();
        await finishRun(supabase, runId, {
          status: 'failed',
          recordsProcessed,
          dataThroughDate,
          message: 'Sync failed',
        });
      } catch {
        // Swallow so the function never throws.
      }
    }

    return { status: 'failed', recordsProcessed, message: 'Sync failed' };
  }
}

async function runBackfill(
  supabase: ServiceClient,
  runId: number,
  dataThroughDate: string
): Promise<SyncGscResult> {
  const earliest = await readEarliestSiteDate(supabase);
  if (earliest === 'error') {
    const message = 'Failed to read existing GSC coverage';
    await finishRun(supabase, runId, {
      status: 'failed',
      recordsProcessed: 0,
      dataThroughDate,
      message,
    });
    return { status: 'failed', recordsProcessed: 0, message };
  }

  const cursorEnd =
    earliest === null ? dataThroughDate : addUtcDays(earliest, -1);

  let recordsProcessed = 0;
  let earliestSynced = earliest;
  const updatedAt = new Date().toISOString();

  for (const window of iterateBackfillWindows(cursorEnd)) {
    const windowResult = await syncWindow(
      supabase,
      window.start,
      window.end,
      updatedAt
    );

    if (!windowResult.ok) {
      const reached =
        earliestSynced === null
          ? 'none'
          : earliestSynced;
      const message = `Backfill stopped at window ${window.start} to ${window.end}; earliest synced date is ${reached}`;
      await finishRun(supabase, runId, {
        status: 'partial',
        recordsProcessed,
        dataThroughDate,
        message,
      });
      return { status: 'partial', recordsProcessed, message };
    }

    recordsProcessed += windowResult.recordsProcessed;
    earliestSynced = window.start;
  }

  await finishRun(supabase, runId, {
    status: 'success',
    recordsProcessed,
    dataThroughDate,
  });
  return { status: 'success', recordsProcessed };
}

async function syncDailyWindow(
  supabase: ServiceClient,
  startDate: string,
  endDate: string,
  updatedAt: string
): Promise<SyncGscResult> {
  const failedSets: string[] = [];
  let recordsProcessed = 0;

  const siteCount = await syncSiteDimension(
    supabase,
    startDate,
    endDate,
    updatedAt
  );
  if (siteCount === null) {
    failedSets.push('date');
  } else {
    recordsProcessed += siteCount;
  }

  const queryPageResult = await upsertQueryPagePages(
    supabase,
    startDate,
    endDate,
    updatedAt
  );
  if (!queryPageResult.ok) {
    failedSets.push('date,query,page');
  } else {
    recordsProcessed += queryPageResult.recordsProcessed;
  }

  const status: SyncGscResult['status'] =
    failedSets.length === 0
      ? 'success'
      : failedSets.length === 2
        ? 'failed'
        : 'partial';
  const message =
    failedSets.length > 0
      ? `Failed dimension sets: ${failedSets.join('; ')}`
      : undefined;

  return { status, recordsProcessed, message };
}

async function syncWindow(
  supabase: ServiceClient,
  startDate: string,
  endDate: string,
  updatedAt: string
): Promise<WindowSyncResult> {
  const queryPageResult = await upsertQueryPagePages(
    supabase,
    startDate,
    endDate,
    updatedAt
  );
  if (!queryPageResult.ok) {
    return { ok: false };
  }

  const siteCount = await syncSiteDimension(
    supabase,
    startDate,
    endDate,
    updatedAt
  );
  if (siteCount === null) {
    return { ok: false };
  }

  return {
    ok: true,
    recordsProcessed: siteCount + queryPageResult.recordsProcessed,
  };
}

async function syncSiteDimension(
  supabase: ServiceClient,
  startDate: string,
  endDate: string,
  updatedAt: string
): Promise<number | null> {
  const siteResult = await fetchSearchAnalytics({
    startDate,
    endDate,
    dimensions: ['date'],
  });
  if (!siteResult.ok) {
    return null;
  }

  const siteRows = siteRowsForWindow(
    siteResult.rows,
    startDate,
    endDate,
    updatedAt
  );
  const siteUpserted = await upsertChunks(
    supabase,
    'gsc_site_daily',
    siteRows,
    SITE_CONFLICT
  );
  if (!siteUpserted) {
    return null;
  }

  return siteRows.length;
}

async function upsertQueryPagePages(
  supabase: ServiceClient,
  startDate: string,
  endDate: string,
  updatedAt: string
): Promise<WindowSyncResult> {
  let startRow = 0;
  let recordsProcessed = 0;

  for (;;) {
    const page = await fetchSearchAnalytics({
      startDate,
      endDate,
      dimensions: ['date', 'query', 'page'],
      startRow,
    });
    if (!page.ok) {
      return { ok: false };
    }

    const rows = toQueryPageRows(page.rows, updatedAt);
    if (rows.length > 0) {
      const upserted = await upsertChunks(
        supabase,
        'gsc_query_page_daily',
        rows,
        QUERY_PAGE_CONFLICT
      );
      if (!upserted) {
        return { ok: false };
      }
      recordsProcessed += rows.length;
    }

    if (page.rows.length < SEARCH_ANALYTICS_ROW_LIMIT) {
      return { ok: true, recordsProcessed };
    }

    startRow += SEARCH_ANALYTICS_ROW_LIMIT;
  }
}

async function upsertChunks(
  supabase: ServiceClient,
  table: 'gsc_site_daily' | 'gsc_query_page_daily',
  rows: GscSiteDailyRow[] | GscQueryPageDailyRow[],
  onConflict: string
): Promise<boolean> {
  for (let index = 0; index < rows.length; index += UPSERT_CHUNK_SIZE) {
    const chunk = rows.slice(index, index + UPSERT_CHUNK_SIZE);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict });
    if (error) {
      return false;
    }
  }
  return true;
}

async function readEarliestSiteDate(
  supabase: ServiceClient
): Promise<string | null | 'error'> {
  const { data, error } = await supabase
    .from('gsc_site_daily')
    .select('date')
    .order('date', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    return 'error';
  }
  if (data === null) {
    return null;
  }
  const date = readDateField(data);
  return date === null ? 'error' : date;
}

async function finishRun(
  supabase: ServiceClient,
  runId: number,
  result: {
    status: SyncGscResult['status'];
    recordsProcessed: number;
    dataThroughDate: string;
    message?: string;
  }
): Promise<void> {
  await supabase
    .from('sync_runs')
    .update({
      status: result.status,
      completed_at: new Date().toISOString(),
      records_processed: result.recordsProcessed,
      data_through_date: result.dataThroughDate,
      administrator_message: result.message ?? null,
      error_code: result.status === 'success' ? null : result.status,
    })
    .eq('id', runId);
}

function iterateBackfillWindows(
  fromEnd: string
): Array<{ start: string; end: string }> {
  const windows: Array<{ start: string; end: string }> = [];
  let end = fromEnd;

  while (end >= BACKFILL_FLOOR) {
    const monthAgo = addUtcMonths(end, -1);
    let start = addUtcDays(monthAgo, 1);
    if (start < BACKFILL_FLOOR) {
      start = BACKFILL_FLOOR;
    }
    if (start > end) {
      break;
    }
    windows.push({ start, end });
    end = addUtcDays(start, -1);
  }

  return windows;
}

function siteRowsForWindow(
  rows: GscRow[],
  startDate: string,
  endDate: string,
  updatedAt: string
): GscSiteDailyRow[] {
  const byDate = new Map<string, GscSiteDailyRow>();

  let cursor = startDate;
  while (cursor <= endDate) {
    byDate.set(cursor, {
      date: cursor,
      clicks: 0,
      impressions: 0,
      ctr: 0,
      position: 0,
      updated_at: updatedAt,
    });
    cursor = addUtcDays(cursor, 1);
  }

  for (const row of rows) {
    const date = row.keys[0];
    if (date === undefined || !DATE_RE.test(date)) {
      continue;
    }
    byDate.set(date, {
      date,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
      updated_at: updatedAt,
    });
  }

  return [...byDate.values()];
}

function toQueryPageRows(
  rows: GscRow[],
  updatedAt: string
): GscQueryPageDailyRow[] {
  const mapped: GscQueryPageDailyRow[] = [];

  for (const row of rows) {
    const date = row.keys[0];
    if (date === undefined || !DATE_RE.test(date)) {
      continue;
    }
    mapped.push({
      date,
      query: row.keys[1] ?? '',
      page: row.keys[2] ?? '',
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
      updated_at: updatedAt,
    });
  }

  return mapped;
}

function utcDateOffset(days: number): string {
  const now = new Date();
  const date = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days)
  );
  return formatUtcDate(date);
}

function parseUtcDate(iso: string): Date {
  const parts = iso.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addUtcDays(iso: string, days: number): string {
  const date = parseUtcDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return formatUtcDate(date);
}

function addUtcMonths(iso: string, months: number): string {
  const date = parseUtcDate(iso);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const lastDay = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)
  ).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return formatUtcDate(date);
}

function readNumericId(value: unknown): number | null {
  if (typeof value !== 'object' || value === null || !('id' in value)) {
    return null;
  }
  const id = value.id;
  if (typeof id === 'number' && Number.isFinite(id)) {
    return id;
  }
  if (typeof id === 'string' && /^\d+$/.test(id)) {
    return Number(id);
  }
  return null;
}

function readDateField(value: unknown): string | null {
  if (typeof value !== 'object' || value === null || !('date' in value)) {
    return null;
  }
  const date = value.date;
  if (typeof date === 'string' && DATE_RE.test(date)) {
    return date;
  }
  return null;
}
