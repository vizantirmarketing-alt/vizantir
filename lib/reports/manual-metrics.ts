/**
 * Operator-entered monthly metrics, stored in reports.manual_metrics. Every field
 * is optional. Reads are lenient: a missing or malformed field is dropped, never
 * a reason to reject the rest or block the report. Writes go through
 * `manualMetricsFromForm`, which is strict and reports what was wrong.
 */

export type ManualMetrics = {
  calls?: number;
  formLeads?: number;
  gbp?: {
    calls?: number;
    directionRequests?: number;
    websiteClicks?: number;
  };
  youtube?: {
    views?: number;
    watchTimeHours?: number;
    videosPublished?: number;
  };
};

/** Form input, one string per field. Blank means not entered. */
export type ManualMetricsFormValues = {
  calls: string;
  formLeads: string;
  gbpCalls: string;
  gbpDirectionRequests: string;
  gbpWebsiteClicks: string;
  youtubeViews: string;
  youtubeWatchTimeHours: string;
  youtubeVideosPublished: string;
};

export const EMPTY_MANUAL_METRICS_FORM: ManualMetricsFormValues = {
  calls: '',
  formLeads: '',
  gbpCalls: '',
  gbpDirectionRequests: '',
  gbpWebsiteClicks: '',
  youtubeViews: '',
  youtubeWatchTimeHours: '',
  youtubeVideosPublished: '',
};

const MAX_VALUE = 1_000_000_000;
const INTEGER_RE = /^\d+$/;
const DECIMAL_RE = /^\d+(\.\d+)?$/;

export function parseManualMetrics(value: unknown): ManualMetrics | null {
  if (!isPlainObject(value)) {
    return null;
  }

  const metrics: ManualMetrics = {};

  const calls = readCount(value.calls);
  if (calls !== undefined) {
    metrics.calls = calls;
  }
  const formLeads = readCount(value.formLeads);
  if (formLeads !== undefined) {
    metrics.formLeads = formLeads;
  }

  if (isPlainObject(value.gbp)) {
    const gbp: NonNullable<ManualMetrics['gbp']> = {};
    const gbpCalls = readCount(value.gbp.calls);
    if (gbpCalls !== undefined) {
      gbp.calls = gbpCalls;
    }
    const directionRequests = readCount(value.gbp.directionRequests);
    if (directionRequests !== undefined) {
      gbp.directionRequests = directionRequests;
    }
    const websiteClicks = readCount(value.gbp.websiteClicks);
    if (websiteClicks !== undefined) {
      gbp.websiteClicks = websiteClicks;
    }
    if (Object.keys(gbp).length > 0) {
      metrics.gbp = gbp;
    }
  }

  if (isPlainObject(value.youtube)) {
    const youtube: NonNullable<ManualMetrics['youtube']> = {};
    const views = readCount(value.youtube.views);
    if (views !== undefined) {
      youtube.views = views;
    }
    const watchTimeHours = readAmount(value.youtube.watchTimeHours);
    if (watchTimeHours !== undefined) {
      youtube.watchTimeHours = watchTimeHours;
    }
    const videosPublished = readCount(value.youtube.videosPublished);
    if (videosPublished !== undefined) {
      youtube.videosPublished = videosPublished;
    }
    if (Object.keys(youtube).length > 0) {
      metrics.youtube = youtube;
    }
  }

  return Object.keys(metrics).length > 0 ? metrics : null;
}

export function manualMetricsToFormValues(
  metrics: ManualMetrics | null
): ManualMetricsFormValues {
  if (metrics === null) {
    return { ...EMPTY_MANUAL_METRICS_FORM };
  }
  return {
    calls: asInput(metrics.calls),
    formLeads: asInput(metrics.formLeads),
    gbpCalls: asInput(metrics.gbp?.calls),
    gbpDirectionRequests: asInput(metrics.gbp?.directionRequests),
    gbpWebsiteClicks: asInput(metrics.gbp?.websiteClicks),
    youtubeViews: asInput(metrics.youtube?.views),
    youtubeWatchTimeHours: asInput(metrics.youtube?.watchTimeHours),
    youtubeVideosPublished: asInput(metrics.youtube?.videosPublished),
  };
}

export type ManualMetricsFormResult =
  | { ok: true; metrics: ManualMetrics | null }
  | { ok: false; error: string };

/**
 * Strict parse of the review form. Blank fields are "not entered". Anything else
 * must be a non-negative whole number (watch time may have decimals).
 */
export function manualMetricsFromForm(
  input: ManualMetricsFormValues
): ManualMetricsFormResult {
  const calls = readFormInteger(input.calls, 'Calls');
  const formLeads = readFormInteger(input.formLeads, 'Form leads');
  const gbpCalls = readFormInteger(input.gbpCalls, 'Business Profile calls');
  const directionRequests = readFormInteger(
    input.gbpDirectionRequests,
    'Direction requests'
  );
  const websiteClicks = readFormInteger(
    input.gbpWebsiteClicks,
    'Website clicks'
  );
  const views = readFormInteger(input.youtubeViews, 'YouTube views');
  const watchTimeHours = readFormDecimal(
    input.youtubeWatchTimeHours,
    'Watch time'
  );
  const videosPublished = readFormInteger(
    input.youtubeVideosPublished,
    'Videos published'
  );

  const fields = [
    calls,
    formLeads,
    gbpCalls,
    directionRequests,
    websiteClicks,
    views,
    watchTimeHours,
    videosPublished,
  ];
  for (const field of fields) {
    if (field.ok === false) {
      return { ok: false, error: field.error };
    }
  }

  const raw = {
    calls: valueOf(calls),
    formLeads: valueOf(formLeads),
    gbp: {
      calls: valueOf(gbpCalls),
      directionRequests: valueOf(directionRequests),
      websiteClicks: valueOf(websiteClicks),
    },
    youtube: {
      views: valueOf(views),
      watchTimeHours: valueOf(watchTimeHours),
      videosPublished: valueOf(videosPublished),
    },
  };

  return { ok: true, metrics: parseManualMetrics(raw) };
}

type FormField = { ok: true; value: number | undefined } | { ok: false; error: string };

function valueOf(field: FormField): number | undefined {
  return field.ok ? field.value : undefined;
}

function readFormInteger(raw: string, label: string): FormField {
  const text = raw.trim();
  if (text.length === 0) {
    return { ok: true, value: undefined };
  }
  if (!INTEGER_RE.test(text)) {
    return { ok: false, error: `${label} must be a whole number, or left blank.` };
  }
  const value = Number(text);
  if (!Number.isSafeInteger(value) || value > MAX_VALUE) {
    return { ok: false, error: `${label} is too large.` };
  }
  return { ok: true, value };
}

function readFormDecimal(raw: string, label: string): FormField {
  const text = raw.trim();
  if (text.length === 0) {
    return { ok: true, value: undefined };
  }
  if (!DECIMAL_RE.test(text)) {
    return { ok: false, error: `${label} must be a number, or left blank.` };
  }
  const value = Number(text);
  if (!Number.isFinite(value) || value > MAX_VALUE) {
    return { ok: false, error: `${label} is too large.` };
  }
  return { ok: true, value };
}

function readCount(value: unknown): number | undefined {
  if (
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value >= 0 &&
    value <= MAX_VALUE
  ) {
    return value;
  }
  return undefined;
}

function readAmount(value: unknown): number | undefined {
  if (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= MAX_VALUE
  ) {
    return value;
  }
  return undefined;
}

function asInput(value: number | undefined): string {
  return value === undefined ? '' : String(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
