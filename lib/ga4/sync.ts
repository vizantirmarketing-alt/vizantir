import 'server-only';
import { runGa4Report, type Ga4Row } from '@/lib/ga4/client';
import { serverEnv } from '@/lib/env/server';
import { createSupabaseServiceRole } from '@/lib/supabase/service';

const PROPERTY_TIME_ZONE = 'America/Los_Angeles';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UPSERT_CONFLICT = 'date,channel_group';

const REPORT_METRICS = [
  'activeUsers',
  'sessions',
  'engagedSessions',
  'screenPageViews',
  'keyEvents',
] as const;

export type SyncGa4Result = {
  status: 'success' | 'partial' | 'failed';
  recordsProcessed: number;
  message?: string;
};

type ServiceClient = ReturnType<typeof createSupabaseServiceRole>;

type Ga4DailyRow = {
  date: string;
  channel_group: string;
  users: number;
  sessions: number;
  engaged_sessions: number;
  views: number;
  key_events: number;
  updated_at: string;
};

type PropertyWindow = {
  startDate: string;
  endDate: string;
};

export async function syncGa4(): Promise<SyncGa4Result> {
  let runId: number | null = null;
  let recordsProcessed = 0;
  const window = propertyLocalWindow();
  const dataThroughDate = window?.endDate ?? null;

  try {
    const supabase = createSupabaseServiceRole();

    const inserted = await supabase
      .from('sync_runs')
      .insert({ provider: 'ga4', status: 'running' })
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

    if (window === null) {
      const message = 'Failed to compute property-local date window';
      await finishRun(supabase, runId, {
        status: 'failed',
        recordsProcessed: 0,
        dataThroughDate: null,
        message,
      });
      return { status: 'failed', recordsProcessed: 0, message };
    }

    if (!serverEnv.GSC_SERVICE_ACCOUNT_KEY || !serverEnv.GA4_PROPERTY_ID) {
      const message = 'GA4 is not configured';
      await finishRun(supabase, runId, {
        status: 'failed',
        recordsProcessed: 0,
        dataThroughDate,
        message,
      });
      return { status: 'failed', recordsProcessed: 0, message };
    }

    const updatedAt = new Date().toISOString();
    const failedSets: string[] = [];

    const siteCount = await syncSiteTotals(
      supabase,
      window.startDate,
      window.endDate,
      updatedAt
    );
    if (siteCount === null) {
      failedSets.push('date');
    } else {
      recordsProcessed += siteCount;
    }

    const channelCount = await syncChannelGroups(
      supabase,
      window.startDate,
      window.endDate,
      updatedAt
    );
    if (channelCount === null) {
      failedSets.push('date,sessionDefaultChannelGroup');
    } else {
      recordsProcessed += channelCount;
    }

    const status: SyncGa4Result['status'] =
      failedSets.length === 0
        ? 'success'
        : failedSets.length === 2
          ? 'failed'
          : 'partial';
    const message =
      failedSets.length > 0
        ? `Failed dimension sets: ${failedSets.join('; ')}`
        : undefined;

    await finishRun(supabase, runId, {
      status,
      recordsProcessed,
      dataThroughDate,
      message,
    });
    return { status, recordsProcessed, message };
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

async function syncSiteTotals(
  supabase: ServiceClient,
  startDate: string,
  endDate: string,
  updatedAt: string
): Promise<number | null> {
  const result = await runGa4Report({
    startDate,
    endDate,
    dimensions: ['date'],
    metrics: [...REPORT_METRICS],
  });
  if (!result.ok) {
    return null;
  }

  const rows = toDailyRows(result.rows, '', updatedAt);
  const upserted = await upsertDaily(supabase, rows);
  if (!upserted) {
    return null;
  }

  return rows.length;
}

async function syncChannelGroups(
  supabase: ServiceClient,
  startDate: string,
  endDate: string,
  updatedAt: string
): Promise<number | null> {
  const result = await runGa4Report({
    startDate,
    endDate,
    dimensions: ['date', 'sessionDefaultChannelGroup'],
    metrics: [...REPORT_METRICS],
  });
  if (!result.ok) {
    return null;
  }

  const rows = toChannelRows(result.rows, updatedAt);
  const upserted = await upsertDaily(supabase, rows);
  if (!upserted) {
    return null;
  }

  return rows.length;
}

async function upsertDaily(
  supabase: ServiceClient,
  rows: Ga4DailyRow[]
): Promise<boolean> {
  if (rows.length === 0) {
    return true;
  }

  const { error } = await supabase
    .from('ga4_daily')
    .upsert(rows, { onConflict: UPSERT_CONFLICT });
  return !error;
}

async function finishRun(
  supabase: ServiceClient,
  runId: number,
  result: {
    status: SyncGa4Result['status'];
    recordsProcessed: number;
    dataThroughDate: string | null;
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

function toDailyRows(
  rows: Ga4Row[],
  channelGroup: string,
  updatedAt: string
): Ga4DailyRow[] {
  const mapped: Ga4DailyRow[] = [];

  for (const row of rows) {
    const date = row.dimensions[0];
    if (date === undefined || !DATE_RE.test(date)) {
      continue;
    }
    const metrics = readMetrics(row.metrics);
    if (metrics === null) {
      continue;
    }
    mapped.push({
      date,
      channel_group: channelGroup,
      ...metrics,
      updated_at: updatedAt,
    });
  }

  return mapped;
}

function toChannelRows(rows: Ga4Row[], updatedAt: string): Ga4DailyRow[] {
  const mapped: Ga4DailyRow[] = [];

  for (const row of rows) {
    const date = row.dimensions[0];
    const channelGroup = row.dimensions[1];
    if (date === undefined || !DATE_RE.test(date)) {
      continue;
    }
    if (channelGroup === undefined || channelGroup === '') {
      continue;
    }
    const metrics = readMetrics(row.metrics);
    if (metrics === null) {
      continue;
    }
    mapped.push({
      date,
      channel_group: channelGroup,
      ...metrics,
      updated_at: updatedAt,
    });
  }

  return mapped;
}

function readMetrics(metrics: number[]): {
  users: number;
  sessions: number;
  engaged_sessions: number;
  views: number;
  key_events: number;
} | null {
  const users = metrics[0];
  const sessions = metrics[1];
  const engagedSessions = metrics[2];
  const views = metrics[3];
  const keyEvents = metrics[4];
  if (
    users === undefined ||
    sessions === undefined ||
    engagedSessions === undefined ||
    views === undefined ||
    keyEvents === undefined
  ) {
    return null;
  }

  return {
    users: Math.round(users),
    sessions: Math.round(sessions),
    engaged_sessions: Math.round(engagedSessions),
    views: Math.round(views),
    key_events: Math.round(keyEvents),
  };
}

/**
 * Window is 3 property-local days ago through yesterday.
 * GA4 days are America/Los_Angeles calendar days, not UTC. Intl is used so
 * PDT (UTC-7) vs PST (UTC-8) is correct; a fixed offset would mis-label the
 * date around midnight Pacific.
 */
function propertyLocalWindow(): PropertyWindow | null {
  const today = calendarDateInTimeZone(new Date(), PROPERTY_TIME_ZONE);
  if (today === null) {
    return null;
  }
  return {
    startDate: addCalendarDays(today, -3),
    endDate: addCalendarDays(today, -1),
  };
}

type CalendarYmd = {
  year: number;
  month: number;
  day: number;
};

function calendarDateInTimeZone(now: Date, timeZone: string): CalendarYmd | null {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const year = readPartNumber(parts, 'year');
  const month = readPartNumber(parts, 'month');
  const day = readPartNumber(parts, 'day');
  if (year === null || month === null || day === null) {
    return null;
  }

  return { year, month, day };
}

function readPartNumber(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes
): number | null {
  const part = parts.find((item) => item.type === type);
  if (part === undefined) {
    return null;
  }
  const value = Number(part.value);
  return Number.isInteger(value) ? value : null;
}

function addCalendarDays(ymd: CalendarYmd, days: number): string {
  const date = new Date(Date.UTC(ymd.year, ymd.month - 1, ymd.day + days));
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
