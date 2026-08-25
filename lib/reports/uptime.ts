import 'server-only';
import { serverEnv } from '@/lib/env/server';
import type { ReportSourceFailure } from '@/lib/reports/google-credentials';

const UPTIMEROBOT_ENDPOINT = 'https://api.uptimerobot.com/v2/getMonitors';
const LOG_TYPE_DOWN = 1;

export type UptimeIncident = {
  startedAt: string;
  durationSeconds: number;
  reason: string | null;
};

export type UptimeReportData = {
  uptimePercentage: number | null;
  coverage: 'full' | 'partial';
  monitorCreatedAt: string;
  incidents: UptimeIncident[];
};

export type FetchUptimeReportResult =
  | { ok: true; data: UptimeReportData }
  | ReportSourceFailure;

export async function fetchUptimeReport(params: {
  monitorId: string | null;
  startDate: string;
  endDate: string;
}): Promise<FetchUptimeReportResult> {
  const monitorId = normalizeMonitorId(params.monitorId);
  if (monitorId === null) {
    return { ok: false, reason: 'not_configured' };
  }

  const apiKey = serverEnv.UPTIMEROBOT_API_KEY;
  if (!apiKey) {
    return { ok: false, reason: 'not_configured' };
  }

  const startUnix = toUnixStart(params.startDate);
  const endUnix = toUnixEnd(params.endDate);
  if (startUnix === null || endUnix === null) {
    return { ok: false, reason: 'invalid_json' };
  }

  let response: Response;
  try {
    response = await fetch(UPTIMEROBOT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        monitors: monitorId,
        custom_uptime_ranges: `${startUnix}_${endUnix}`,
        logs: 1,
        logs_start_date: startUnix,
        logs_end_date: endUnix,
      }),
      cache: 'no-store',
    });
  } catch {
    return { ok: false, reason: 'network_error' };
  }

  if (response.status === 401) {
    return { ok: false, reason: 'unauthorized', status: 401 };
  }
  if (response.status === 403) {
    return { ok: false, reason: 'forbidden', status: 403 };
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

  if (!isPlainObject(parsed)) {
    return { ok: false, reason: 'invalid_json', status: response.status };
  }
  if (parsed.stat !== 'ok') {
    return { ok: false, reason: 'http_error', status: response.status };
  }

  const data = parseMonitorResponse(parsed, startUnix, endUnix);
  if (data === null) {
    return { ok: false, reason: 'invalid_json', status: response.status };
  }

  return { ok: true, data };
}

function parseMonitorResponse(
  value: unknown,
  startUnix: number,
  endUnix: number
): UptimeReportData | null {
  if (!isPlainObject(value)) {
    return null;
  }
  if (!Array.isArray(value.monitors) || value.monitors.length === 0) {
    return null;
  }

  const monitor = value.monitors[0];
  if (!isPlainObject(monitor)) {
    return null;
  }

  const createdUnix = toFiniteNumber(monitor.create_datetime);
  if (createdUnix === null) {
    return null;
  }

  const monitorCreatedAt = new Date(createdUnix * 1000).toISOString();
  const coverage: 'full' | 'partial' =
    createdUnix > startUnix ? 'partial' : 'full';

  const createdAfterPeriod = createdUnix > endUnix;
  const uptimePercentage = createdAfterPeriod
    ? null
    : parseUptimePercentage(monitor.custom_uptime_ranges);

  const incidents = parseIncidents(monitor.logs);

  return {
    uptimePercentage,
    coverage,
    monitorCreatedAt,
    incidents,
  };
}

function parseIncidents(value: unknown): UptimeIncident[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const incidents: UptimeIncident[] = [];
  for (const item of value) {
    if (!isPlainObject(item)) {
      continue;
    }
    const type = toFiniteNumber(item.type);
    if (type !== LOG_TYPE_DOWN) {
      continue;
    }
    const datetime = toFiniteNumber(item.datetime);
    const duration = toFiniteNumber(item.duration);
    if (datetime === null || duration === null) {
      continue;
    }
    incidents.push({
      startedAt: new Date(datetime * 1000).toISOString(),
      durationSeconds: duration,
      reason: readIncidentReason(item.reason),
    });
  }
  return incidents;
}

function readIncidentReason(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (isPlainObject(value) && typeof value.detail === 'string') {
    const trimmed = value.detail.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

function parseUptimePercentage(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeMonitorId(value: string | null): string | null {
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toUnixStart(date: string): number | null {
  const ms = Date.parse(`${date}T00:00:00Z`);
  return Number.isNaN(ms) ? null : Math.floor(ms / 1000);
}

function toUnixEnd(date: string): number | null {
  const ms = Date.parse(`${date}T23:59:59Z`);
  return Number.isNaN(ms) ? null : Math.floor(ms / 1000);
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
