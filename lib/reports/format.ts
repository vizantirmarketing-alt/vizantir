import { MEANINGFUL_COMPARISON_BASE } from '@/lib/intel/format-change';

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})/;

export function formatInteger(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(
    Math.round(value)
  );
}

export function formatMonth(isoDate: string): string {
  const date = parseUtcDate(isoDate);
  if (date === null) {
    return isoDate;
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatLongDate(iso: string): string {
  const date = parseUtcDate(iso);
  if (date === null) {
    return iso;
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatCtr(ratio: number): string {
  const percent = ratio * 100;
  if (percent === 0) {
    return '0%';
  }
  if (Math.abs(percent) < 1) {
    return `${percent.toFixed(2)}%`;
  }
  return `${percent.toFixed(1)}%`;
}

export function formatPosition(value: number): string {
  return value.toFixed(1);
}

export function formatUptime(value: number): string {
  if (value >= 100) {
    return '100%';
  }
  return `${value.toFixed(2)}%`;
}

export function formatDuration(seconds: number): string {
  const rounded = Math.max(0, Math.round(seconds));
  if (rounded < 60) {
    return `${rounded}s`;
  }
  const minutes = Math.floor(rounded / 60);
  const remainingSeconds = rounded % 60;
  if (minutes < 60) {
    return remainingSeconds === 0
      ? `${minutes} min`
      : `${minutes} min ${remainingSeconds}s`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes === 0
    ? `${hours} hr`
    : `${hours} hr ${remainingMinutes} min`;
}

export function formatLcp(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`;
}

export function formatInp(ms: number): string {
  return `${Math.round(ms)}ms`;
}

export function formatCls(value: number): string {
  return value.toFixed(2);
}

export function formatSignedInteger(value: number): string {
  const abs = formatInteger(Math.abs(value));
  if (value > 0) {
    return `+${abs}`;
  }
  if (value < 0) {
    return `−${abs}`;
  }
  return '—';
}

export function formatSignedCtr(value: number): string {
  const percent = value * 100;
  const abs =
    Math.abs(percent) < 1 ? Math.abs(percent).toFixed(2) : Math.abs(percent).toFixed(1);
  if (percent > 0) {
    return `+${abs} pts`;
  }
  if (percent < 0) {
    return `−${abs} pts`;
  }
  return '—';
}

export function meaningfulComparisonDelta(
  change: number | null,
  priorBase: number | null
): number | null {
  if (change === null || priorBase === null) {
    return null;
  }
  if (priorBase < MEANINGFUL_COMPARISON_BASE) {
    return null;
  }
  return change;
}

export function plural(count: number, singular: string, pluralForm: string): string {
  return count === 1 ? singular : pluralForm;
}

export function displaySiteUrl(url: string): string {
  return url.replace(/\/$/, '');
}

export function humanizeEventName(name: string): string {
  return name.replace(/_/g, ' ');
}

function parseUtcDate(iso: string): Date | null {
  const match = DATE_RE.exec(iso);
  if (match === null) {
    const ms = Date.parse(iso);
    return Number.isNaN(ms) ? null : new Date(ms);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(Date.UTC(year, month - 1, day));
}
