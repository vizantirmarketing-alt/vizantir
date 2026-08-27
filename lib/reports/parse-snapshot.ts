import 'server-only';

import type { CruxMetric, CruxReportData, FetchCruxReportResult } from '@/lib/reports/crux';
import type {
  EngagementBreakdownRow,
  EngagementEventCount,
  EngagementReportData,
  FetchEngagementReportResult,
} from '@/lib/reports/engagement';
import type {
  FetchGa4ReportResult,
  Ga4ChannelRow,
  Ga4ConversionRow,
  Ga4PageRow,
  Ga4ReportData,
} from '@/lib/reports/ga4';
import type {
  CareTier,
  ReportBlocker,
  ReportSnapshot,
  ReportWarning,
} from '@/lib/reports/generate';
import type { ReportSourceFailureReason } from '@/lib/reports/google-credentials';
import type {
  FetchGscReportResult,
  GscMovedRow,
  GscReportData,
  GscTotals,
} from '@/lib/reports/gsc';
import type {
  FetchUptimeReportResult,
  UptimeIncident,
  UptimeReportData,
} from '@/lib/reports/uptime';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const BLOCKERS: readonly ReportBlocker[] = [
  'ga4_failed',
  'zero_sessions',
  'gsc_failed',
  'gsc_empty_rows',
];
const WARNINGS: readonly ReportWarning[] = [
  'crux_failed',
  'uptime_failed',
  'engagement_failed',
];
const FAILURE_REASONS: readonly ReportSourceFailureReason[] = [
  'not_configured',
  'unauthorized',
  'forbidden',
  'rate_limited',
  'http_error',
  'network_error',
  'invalid_json',
];

export function parseReportSnapshot(value: unknown): ReportSnapshot | null {
  if (!isPlainObject(value)) {
    return null;
  }
  if (!isSnapshotVersion(value.version)) {
    return null;
  }
  const version = value.version;

  const generatedAt = asNonEmptyString(value.generatedAt);
  const period = parsePeriod(value.period);
  const client = parseSnapshotClient(value.client);
  const ga4 = parseGa4(value.ga4);
  const gsc = parseGsc(value.gsc);
  const crux = parseCrux(value.crux);
  const uptime = parseUptime(value.uptime);
  const blockers = parseLiteralArray(value.blockers, isBlocker);
  const warnings = parseLiteralArray(value.warnings, isWarning);
  const engagement = parseOptionalEngagement(value.engagement, version);

  if (
    generatedAt === null ||
    period === null ||
    client === null ||
    ga4 === null ||
    gsc === null ||
    crux === null ||
    uptime === null ||
    blockers === null ||
    warnings === null ||
    engagement === null
  ) {
    return null;
  }

  return {
    version,
    generatedAt,
    period,
    client,
    ga4,
    gsc,
    crux,
    uptime,
    ...(engagement !== undefined ? { engagement } : {}),
    blockers,
    warnings,
  };
}

function parsePeriod(value: unknown): ReportSnapshot['period'] | null {
  if (!isPlainObject(value)) {
    return null;
  }
  const start = asIsoDate(value.start);
  const end = asIsoDate(value.end);
  const priorStart = asIsoDate(value.priorStart);
  const priorEnd = asIsoDate(value.priorEnd);
  if (
    start === null ||
    end === null ||
    priorStart === null ||
    priorEnd === null
  ) {
    return null;
  }
  return { start, end, priorStart, priorEnd };
}

function parseSnapshotClient(value: unknown): ReportSnapshot['client'] | null {
  if (!isPlainObject(value)) {
    return null;
  }
  const id = asNonEmptyString(value.id);
  const name = asNonEmptyString(value.name);
  const slug = asNonEmptyString(value.slug);
  const siteUrl = asNonEmptyString(value.siteUrl);
  const careTier = value.careTier;
  if (
    id === null ||
    name === null ||
    slug === null ||
    siteUrl === null ||
    !isCareTier(careTier)
  ) {
    return null;
  }
  return { id, name, slug, siteUrl, careTier };
}

function parseGa4(value: unknown): FetchGa4ReportResult | null {
  const failure = parseSourceFailure(value);
  if (failure !== null) {
    return failure;
  }
  if (!isPlainObject(value) || value.ok !== true) {
    return null;
  }
  const data = parseGa4Data(value.data);
  return data === null ? null : { ok: true, data };
}

function parseGa4Data(value: unknown): Ga4ReportData | null {
  if (!isPlainObject(value)) {
    return null;
  }
  const sessions = asFiniteNumber(value.sessions);
  const totalUsers = asFiniteNumber(value.totalUsers);
  const newUsers = asFiniteNumber(value.newUsers);
  const returningUsers = asFiniteNumber(value.returningUsers);
  const newUserSessions = asFiniteNumber(value.newUserSessions);
  const returningUserSessions = asFiniteNumber(value.returningUserSessions);
  const channelGroups = parseArray(value.channelGroups, parseChannelRow);
  const topPages = parseArray(value.topPages, parsePageRow);
  const conversions = parseArray(value.conversions, parseConversionRow);
  if (
    sessions === null ||
    totalUsers === null ||
    newUsers === null ||
    returningUsers === null ||
    newUserSessions === null ||
    returningUserSessions === null ||
    channelGroups === null ||
    topPages === null ||
    conversions === null
  ) {
    return null;
  }
  return {
    sessions,
    totalUsers,
    newUsers,
    returningUsers,
    newUserSessions,
    returningUserSessions,
    channelGroups,
    topPages,
    conversions,
  };
}

function parseChannelRow(value: unknown): Ga4ChannelRow | null {
  if (!isPlainObject(value)) {
    return null;
  }
  const channel = asNonEmptyString(value.channel);
  const sessions = asFiniteNumber(value.sessions);
  if (channel === null || sessions === null) {
    return null;
  }
  return { channel, sessions };
}

function parsePageRow(value: unknown): Ga4PageRow | null {
  if (!isPlainObject(value)) {
    return null;
  }
  const pagePath = asString(value.pagePath);
  const screenPageViews = asFiniteNumber(value.screenPageViews);
  const averageSessionDuration = asFiniteNumber(value.averageSessionDuration);
  if (
    pagePath === null ||
    screenPageViews === null ||
    averageSessionDuration === null
  ) {
    return null;
  }
  return { pagePath, screenPageViews, averageSessionDuration };
}

function parseConversionRow(value: unknown): Ga4ConversionRow | null {
  if (!isPlainObject(value)) {
    return null;
  }
  const eventName = asNonEmptyString(value.eventName);
  const keyEvents = asFiniteNumber(value.keyEvents);
  if (eventName === null || keyEvents === null) {
    return null;
  }
  return { eventName, keyEvents };
}

function parseGsc(value: unknown): FetchGscReportResult | null {
  const failure = parseSourceFailure(value);
  if (failure !== null) {
    return failure;
  }
  if (!isPlainObject(value) || value.ok !== true) {
    return null;
  }
  if (value.skipped === true) {
    return { ok: true, skipped: true };
  }
  if (value.skipped !== false) {
    return null;
  }
  const data = parseGscData(value.data);
  return data === null ? null : { ok: true, skipped: false, data };
}

function parseGscData(value: unknown): GscReportData | null {
  if (!isPlainObject(value)) {
    return null;
  }
  const current = parseGscTotals(value.current);
  const prior =
    value.prior === null ? null : parseGscTotals(value.prior);
  const clicksChange = asNullableNumber(value.clicksChange);
  const impressionsChange = asNullableNumber(value.impressionsChange);
  const ctrChange = asNullableNumber(value.ctrChange);
  const positionChange = asNullableNumber(value.positionChange);
  const topQueries = parseArray(value.topQueries, parseMovedRow);
  const topPages = parseArray(value.topPages, parseMovedRow);
  if (
    current === null ||
    (value.prior !== null && prior === null) ||
    clicksChange === undefined ||
    impressionsChange === undefined ||
    ctrChange === undefined ||
    positionChange === undefined ||
    topQueries === null ||
    topPages === null ||
    typeof value.emptyRows !== 'boolean'
  ) {
    return null;
  }
  return {
    current,
    prior,
    clicksChange,
    impressionsChange,
    ctrChange,
    positionChange,
    topQueries: sortMovedRowsByImpressions(topQueries),
    topPages: sortMovedRowsByImpressions(topPages),
    emptyRows: value.emptyRows,
  };
}

function sortMovedRowsByImpressions(rows: GscMovedRow[]): GscMovedRow[] {
  return [...rows].sort((a, b) => b.impressions - a.impressions);
}

function parseGscTotals(value: unknown): GscTotals | null {
  if (!isPlainObject(value)) {
    return null;
  }
  const clicks = asFiniteNumber(value.clicks);
  const impressions = asFiniteNumber(value.impressions);
  const ctr = asFiniteNumber(value.ctr);
  const position = asFiniteNumber(value.position);
  if (
    clicks === null ||
    impressions === null ||
    ctr === null ||
    position === null
  ) {
    return null;
  }
  return { clicks, impressions, ctr, position };
}

function parseMovedRow(value: unknown): GscMovedRow | null {
  if (!isPlainObject(value)) {
    return null;
  }
  const key = asString(value.key);
  const clicks = asFiniteNumber(value.clicks);
  const impressions = asFiniteNumber(value.impressions);
  const ctr = asFiniteNumber(value.ctr);
  const position = asFiniteNumber(value.position);
  const prior = value.prior === null ? null : parseGscTotals(value.prior);
  const clicksChange = asNullableNumber(value.clicksChange);
  const impressionsChange = asNullableNumber(value.impressionsChange);
  const ctrChange = asNullableNumber(value.ctrChange);
  const positionChange = asNullableNumber(value.positionChange);
  if (
    key === null ||
    clicks === null ||
    impressions === null ||
    ctr === null ||
    position === null ||
    (value.prior !== null && prior === null) ||
    clicksChange === undefined ||
    impressionsChange === undefined ||
    ctrChange === undefined ||
    positionChange === undefined
  ) {
    return null;
  }
  return {
    key,
    clicks,
    impressions,
    ctr,
    position,
    prior,
    clicksChange,
    impressionsChange,
    ctrChange,
    positionChange,
  };
}

function parseCrux(value: unknown): FetchCruxReportResult | null {
  const failure = parseSourceFailure(value);
  if (failure !== null) {
    return failure;
  }
  if (!isPlainObject(value) || value.ok !== true) {
    return null;
  }
  if (value.kind === 'no_data') {
    return { ok: true, kind: 'no_data' };
  }
  if (value.kind !== 'metrics') {
    return null;
  }
  const data = parseCruxData(value.data);
  return data === null ? null : { ok: true, kind: 'metrics', data };
}

function parseCruxData(value: unknown): CruxReportData | null {
  if (!isPlainObject(value) || value.formFactor !== 'PHONE') {
    return null;
  }
  const collectionPeriod =
    value.collectionPeriod === null
      ? null
      : parseCollectionPeriod(value.collectionPeriod);
  if (value.collectionPeriod !== null && collectionPeriod === null) {
    return null;
  }
  const lcp = parseCruxMetric(value.lcp);
  const inp = parseCruxMetric(value.inp);
  const cls = parseCruxMetric(value.cls);
  if (lcp === null || inp === null || cls === null) {
    return null;
  }
  return { formFactor: 'PHONE', collectionPeriod, lcp, inp, cls };
}

function parseCollectionPeriod(
  value: unknown
): CruxReportData['collectionPeriod'] {
  if (!isPlainObject(value)) {
    return null;
  }
  const firstDate = asIsoDate(value.firstDate);
  const lastDate = asIsoDate(value.lastDate);
  if (firstDate === null || lastDate === null) {
    return null;
  }
  return { firstDate, lastDate };
}

function parseCruxMetric(value: unknown): CruxMetric | null {
  if (!isPlainObject(value)) {
    return null;
  }
  const p75 = asFiniteNumber(value.p75);
  const threshold = asFiniteNumber(value.threshold);
  if (p75 === null || threshold === null || typeof value.passed !== 'boolean') {
    return null;
  }
  return { p75, threshold, passed: value.passed };
}

function parseUptime(value: unknown): FetchUptimeReportResult | null {
  const failure = parseSourceFailure(value);
  if (failure !== null) {
    return failure;
  }
  if (!isPlainObject(value) || value.ok !== true) {
    return null;
  }
  const data = parseUptimeData(value.data);
  return data === null ? null : { ok: true, data };
}

function parseOptionalEngagement(
  value: unknown,
  version: 2 | 3
): FetchEngagementReportResult | undefined | null {
  if (version === 2) {
    return undefined;
  }
  if (value === undefined || value === null) {
    return undefined;
  }
  return parseEngagement(value);
}

function parseEngagement(value: unknown): FetchEngagementReportResult | null {
  const failure = parseSourceFailure(value);
  if (failure !== null) {
    return failure;
  }
  if (!isPlainObject(value) || value.ok !== true) {
    return null;
  }
  const data = parseEngagementData(value.data);
  return data === null ? null : { ok: true, data };
}

function parseEngagementData(value: unknown): EngagementReportData | null {
  if (!isPlainObject(value)) {
    return null;
  }
  const title = asNonEmptyString(value.title);
  const events = parseArray(value.events, parseEngagementEventCount);
  if (title === null || events === null) {
    return null;
  }
  const breakdown =
    value.breakdown === null || value.breakdown === undefined
      ? null
      : parseEngagementBreakdown(value.breakdown);
  if (
    value.breakdown !== null &&
    value.breakdown !== undefined &&
    breakdown === null
  ) {
    return null;
  }
  return { title, events, breakdown };
}

function parseEngagementBreakdown(
  value: unknown
): EngagementReportData['breakdown'] {
  if (!isPlainObject(value)) {
    return null;
  }
  const dimension = asNonEmptyString(value.dimension);
  const label = asNonEmptyString(value.label);
  const rows = parseArray(value.rows, parseEngagementBreakdownRow);
  if (dimension === null || label === null || rows === null) {
    return null;
  }
  return { dimension, label, rows };
}

function parseEngagementBreakdownRow(
  value: unknown
): EngagementBreakdownRow | null {
  if (!isPlainObject(value)) {
    return null;
  }
  const dimensionValue = asString(value.dimensionValue);
  const events = parseArray(value.events, parseEngagementEventCount);
  if (dimensionValue === null || events === null) {
    return null;
  }
  return { dimensionValue, events };
}

function parseEngagementEventCount(
  value: unknown
): EngagementEventCount | null {
  if (!isPlainObject(value)) {
    return null;
  }
  const name = asNonEmptyString(value.name);
  const label = asNonEmptyString(value.label);
  const count = asFiniteNumber(value.count);
  if (name === null || label === null || count === null) {
    return null;
  }
  return { name, label, count };
}

function parseUptimeData(value: unknown): UptimeReportData | null {
  if (!isPlainObject(value)) {
    return null;
  }
  const uptimePercentage = asNullableNumber(value.uptimePercentage);
  const monitorCreatedAt = asNonEmptyString(value.monitorCreatedAt);
  const incidents = parseArray(value.incidents, parseIncident);
  if (
    uptimePercentage === undefined ||
    monitorCreatedAt === null ||
    incidents === null ||
    !isCoverage(value.coverage)
  ) {
    return null;
  }
  return {
    uptimePercentage,
    coverage: value.coverage,
    monitorCreatedAt,
    incidents,
  };
}

function parseIncident(value: unknown): UptimeIncident | null {
  if (!isPlainObject(value)) {
    return null;
  }
  const startedAt = asNonEmptyString(value.startedAt);
  const durationSeconds = asFiniteNumber(value.durationSeconds);
  const reason = asNullableString(value.reason);
  if (startedAt === null || durationSeconds === null || reason === undefined) {
    return null;
  }
  return { startedAt, durationSeconds, reason };
}

function parseSourceFailure(
  value: unknown
): { ok: false; reason: ReportSourceFailureReason; status?: number } | null {
  if (!isPlainObject(value) || value.ok !== false) {
    return null;
  }
  if (!isFailureReason(value.reason)) {
    return null;
  }
  if (value.status === undefined) {
    return { ok: false, reason: value.reason };
  }
  const status = asFiniteNumber(value.status);
  if (status === null) {
    return null;
  }
  return { ok: false, reason: value.reason, status };
}

function parseArray<T>(
  value: unknown,
  parseItem: (item: unknown) => T | null
): T[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const result: T[] = [];
  for (const item of value) {
    const parsed = parseItem(item);
    if (parsed === null) {
      return null;
    }
    result.push(parsed);
  }
  return result;
}

function parseLiteralArray<T>(
  value: unknown,
  isItem: (item: unknown) => item is T
): T[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const result: T[] = [];
  for (const item of value) {
    if (!isItem(item)) {
      return null;
    }
    result.push(item);
  }
  return result;
}

function asNullableNumber(value: unknown): number | null | undefined {
  if (value === null) {
    return null;
  }
  const parsed = asFiniteNumber(value);
  return parsed === null ? undefined : parsed;
}

function asNullableString(value: unknown): string | null | undefined {
  if (value === null) {
    return null;
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asIsoDate(value: unknown): string | null {
  const text = asNonEmptyString(value);
  return text !== null && ISO_DATE_RE.test(text) ? text : null;
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function isCareTier(value: unknown): value is CareTier {
  return value === 'essential' || value === 'care';
}

function isSnapshotVersion(
  value: unknown
): value is ReportSnapshot['version'] {
  return value === 2 || value === 3;
}

function isBlocker(value: unknown): value is ReportBlocker {
  return BLOCKERS.some((item) => item === value);
}

function isWarning(value: unknown): value is ReportWarning {
  return WARNINGS.some((item) => item === value);
}

function isFailureReason(value: unknown): value is ReportSourceFailureReason {
  return FAILURE_REASONS.some((item) => item === value);
}

function isCoverage(
  value: unknown
): value is UptimeReportData['coverage'] {
  return value === 'full' || value === 'partial' || value === 'none';
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
