export const ATTRIBUTION_STORAGE_KEY = 'vizantir:attribution';

export const ATTRIBUTION_FIELD_MAX = {
  landing_page: 512,
  referrer: 1024,
  utm_source: 256,
  utm_medium: 256,
  utm_campaign: 256,
} as const;

/**
 * Host-matching rules for initial_channel, evaluated in order after campaign
 * and direct. More specific hosts (gemini.google.com) must appear before
 * broader names (google) so they are not swallowed by organic_search.
 */
export const INITIAL_CHANNEL_HOST_RULES = [
  {
    channel: 'ai_referral',
    hosts: [
      'chatgpt.com',
      'chat.openai.com',
      'perplexity.ai',
      'claude.ai',
      'gemini.google.com',
      'copilot.microsoft.com',
    ],
  },
  {
    channel: 'organic_search',
    hosts: ['google', 'bing', 'duckduckgo', 'yahoo', 'ecosia', 'brave'],
  },
  {
    channel: 'social',
    hosts: [
      'linkedin',
      'facebook',
      'instagram',
      'x.com',
      'twitter',
      'reddit',
      'youtube',
    ],
  },
] as const;

export type InitialChannel =
  | 'campaign'
  | 'direct'
  | 'organic_search'
  | 'ai_referral'
  | 'social'
  | 'referral';

export type ClientAttribution = {
  landing_page: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
};

const EMPTY_ATTRIBUTION: ClientAttribution = {
  landing_page: null,
  referrer: null,
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
};

export function stripControlChars(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F]/g, '');
}

export function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function deriveInitialChannel(input: {
  utmSource: string | null | undefined;
  referrer: string | null | undefined;
  requestOrigin: string;
}): InitialChannel {
  if (emptyToNull(input.utmSource) !== null) {
    return 'campaign';
  }

  const referrer = emptyToNull(input.referrer);
  if (referrer === null) {
    return 'direct';
  }

  let referrerUrl: URL;
  try {
    referrerUrl = new URL(referrer);
  } catch {
    return 'referral';
  }

  if (isSameOrigin(referrerUrl, input.requestOrigin)) {
    return 'direct';
  }

  const hostname = referrerUrl.hostname;
  for (const rule of INITIAL_CHANNEL_HOST_RULES) {
    if (rule.hosts.some((host) => hostnameMatchesRule(hostname, host))) {
      return rule.channel;
    }
  }

  return 'referral';
}

export function resolveRequestOrigin(req: Request): string {
  const headerOrigin = req.headers.get('origin');
  if (headerOrigin) {
    try {
      return new URL(headerOrigin).origin;
    } catch {
      // ignore invalid Origin
    }
  }

  const forwardedHost = req.headers.get('x-forwarded-host');
  const forwardedProto = req.headers.get('x-forwarded-proto');
  if (forwardedHost) {
    const host = forwardedHost.split(',')[0]?.trim() ?? '';
    const proto = forwardedProto?.split(',')[0]?.trim() || 'https';
    if (host.length > 0) {
      try {
        return new URL(`${proto}://${host}`).origin;
      } catch {
        // ignore invalid forwarded host
      }
    }
  }

  try {
    return new URL(req.url).origin;
  } catch {
    return '';
  }
}

export function captureClientAttribution(): ClientAttribution {
  if (typeof window === 'undefined') {
    return EMPTY_ATTRIBUTION;
  }

  const stored = readSessionAttribution();
  if (stored) {
    return stored;
  }

  const captured = captureFromWindow();
  writeSessionAttribution(captured);
  return captured;
}

function hostnameMatchesRule(hostname: string, rule: string): boolean {
  const host = hostname.toLowerCase();
  const needle = rule.toLowerCase();

  if (needle.includes('.')) {
    return host === needle || host.endsWith(`.${needle}`);
  }

  return host.split('.').includes(needle);
}

function isSameOrigin(referrerUrl: URL, requestOrigin: string): boolean {
  if (requestOrigin.length === 0) {
    return false;
  }
  try {
    return referrerUrl.origin === new URL(requestOrigin).origin;
  } catch {
    return false;
  }
}

function clip(value: string | null, max: number): string | null {
  if (value === null) return null;
  return value.length > max ? value.slice(0, max) : value;
}

function buildLandingPage(pathname: string, search: string): string {
  const params = new URLSearchParams(search);
  const utmParams = new URLSearchParams();
  for (const [key, value] of params.entries()) {
    if (key.startsWith('utm_')) {
      utmParams.append(key, value);
    }
  }
  const query = utmParams.toString();
  return query.length > 0 ? `${pathname}?${query}` : pathname;
}

function captureFromWindow(): ClientAttribution {
  const params = new URLSearchParams(window.location.search);
  const landingPage = buildLandingPage(
    window.location.pathname,
    window.location.search
  );

  return {
    landing_page: clip(
      emptyToNull(landingPage),
      ATTRIBUTION_FIELD_MAX.landing_page
    ),
    referrer: clip(
      emptyToNull(document.referrer),
      ATTRIBUTION_FIELD_MAX.referrer
    ),
    utm_source: clip(
      emptyToNull(params.get('utm_source')),
      ATTRIBUTION_FIELD_MAX.utm_source
    ),
    utm_medium: clip(
      emptyToNull(params.get('utm_medium')),
      ATTRIBUTION_FIELD_MAX.utm_medium
    ),
    utm_campaign: clip(
      emptyToNull(params.get('utm_campaign')),
      ATTRIBUTION_FIELD_MAX.utm_campaign
    ),
  };
}

function isClientAttribution(value: unknown): value is ClientAttribution {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return (
    isOptionalTextField(value, 'landing_page') &&
    isOptionalTextField(value, 'referrer') &&
    isOptionalTextField(value, 'utm_source') &&
    isOptionalTextField(value, 'utm_medium') &&
    isOptionalTextField(value, 'utm_campaign')
  );
}

function isOptionalTextField(
  value: object,
  key: keyof ClientAttribution
): boolean {
  if (!(key in value)) {
    return false;
  }
  const field: unknown = Reflect.get(value, key);
  return field === null || typeof field === 'string';
}

function normalizeStoredAttribution(
  value: ClientAttribution
): ClientAttribution {
  return {
    landing_page: emptyToNull(value.landing_page),
    referrer: emptyToNull(value.referrer),
    utm_source: emptyToNull(value.utm_source),
    utm_medium: emptyToNull(value.utm_medium),
    utm_campaign: emptyToNull(value.utm_campaign),
  };
}

function readSessionAttribution(): ClientAttribution | null {
  try {
    const raw = sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isClientAttribution(parsed)) {
      return null;
    }
    return normalizeStoredAttribution(parsed);
  } catch {
    return null;
  }
}

function writeSessionAttribution(value: ClientAttribution): void {
  try {
    sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // sessionStorage may be unavailable (private mode, quota, disabled).
  }
}
