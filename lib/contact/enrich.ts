import 'server-only';
import { resolveMx } from 'node:dns/promises';
import { UAParser } from 'ua-parser-js';

const MX_TIMEOUT_MS = 3000;
const PROXYCHECK_TIMEOUT_MS = 3000;
const FAST_SUBMIT_MS = 3000;
const HIGH_FRAUD_SCORE = 85;

export type ContactDeviceType = 'mobile' | 'tablet' | 'desktop';

export type ContactEnrichment = {
  ip: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  timezone: string | null;
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
  osVersion: string | null;
  deviceType: ContactDeviceType | null;
  deviceSummary: string | null;
  userAgent: string | null;
  acceptLanguage: string | null;
  httpReferrer: string | null;
  pagePath: string | null;
  mxValid: boolean | null;
  vpn: boolean | null;
  proxy: boolean | null;
  tor: boolean | null;
  isDatacenter: boolean | null;
  fraudScore: number | null;
  isSuspect: boolean;
  suspectReason: string | null;
  submitDurationMs: number | null;
};

export type EnrichContactInput = {
  request: Request;
  email: string;
  honeypot: string | undefined;
  startedAt: number | null;
  pagePath: string | null;
};

export async function enrichContactSubmission(
  input: EnrichContactInput
): Promise<ContactEnrichment> {
  const { request } = input;
  const userAgent = readHeader(request, 'user-agent');
  const parsed = parseUserAgent(userAgent);
  const ip = readClientIp(request);
  const submitDurationMs = durationFromStartedAt(input.startedAt);
  const honeypotFlagged =
    input.honeypot != null && input.honeypot.trim().length > 0;

  const [mxValid, reputation] = await Promise.all([
    resolveMxValid(input.email),
    honeypotFlagged
      ? Promise.resolve(emptyIpReputation())
      : lookupIpReputation(ip),
  ]);

  const suspectReasons = collectSuspectReasons({
    honeypot: input.honeypot,
    submitDurationMs,
    reputation,
  });

  return {
    ip,
    country: readGeoHeader(request, 'x-vercel-ip-country'),
    region: readGeoHeader(request, 'x-vercel-ip-country-region'),
    city: readGeoHeader(request, 'x-vercel-ip-city'),
    timezone: readGeoHeader(request, 'x-vercel-ip-timezone'),
    browser: parsed.browser,
    browserVersion: parsed.browserVersion,
    os: parsed.os,
    osVersion: parsed.osVersion,
    deviceType: parsed.deviceType,
    deviceSummary: parsed.deviceSummary,
    userAgent,
    acceptLanguage: readHeader(request, 'accept-language'),
    httpReferrer: readHeader(request, 'referer'),
    pagePath: nonempty(input.pagePath),
    mxValid,
    vpn: reputation.vpn,
    proxy: reputation.proxy,
    tor: reputation.tor,
    isDatacenter: reputation.isDatacenter,
    fraudScore: reputation.fraudScore,
    isSuspect: suspectReasons.length > 0,
    suspectReason: suspectReasons.length > 0 ? suspectReasons.join(',') : null,
    submitDurationMs,
  };
}

export function formatContactNetworkLabel(enrichment: {
  vpn: boolean | null;
  proxy: boolean | null;
  tor: boolean | null;
  isDatacenter: boolean | null;
  fraudScore: number | null;
}): string {
  const parts: string[] = [];
  if (
    enrichment.vpn === true ||
    enrichment.proxy === true ||
    enrichment.tor === true
  ) {
    parts.push('VPN');
  }
  if (enrichment.isDatacenter === true) {
    parts.push('Datacenter');
  }
  if (
    enrichment.fraudScore != null &&
    enrichment.fraudScore >= HIGH_FRAUD_SCORE
  ) {
    parts.push(`risk ${enrichment.fraudScore}`);
  }
  return parts.length > 0 ? parts.join(', ') : 'Clean';
}

function readHeader(request: Request, name: string): string | null {
  const value = request.headers.get(name);
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readGeoHeader(request: Request, name: string): string | null {
  const raw = readHeader(request, name);
  if (raw === null) return null;
  try {
    const decoded = decodeURIComponent(raw).trim();
    return decoded.length > 0 ? decoded : null;
  } catch {
    return raw;
  }
}

function readClientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded == null) return null;
  const first = forwarded.split(',')[0]?.trim();
  return first && first.length > 0 ? first : null;
}

function nonempty(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function durationFromStartedAt(startedAt: number | null): number | null {
  if (startedAt == null || !Number.isFinite(startedAt)) {
    return null;
  }
  return Date.now() - startedAt;
}

type IpReputation = {
  vpn: boolean | null;
  proxy: boolean | null;
  tor: boolean | null;
  isDatacenter: boolean | null;
  fraudScore: number | null;
};

function emptyIpReputation(): IpReputation {
  return {
    vpn: null,
    proxy: null,
    tor: null,
    isDatacenter: null,
    fraudScore: null,
  };
}

function collectSuspectReasons(input: {
  honeypot: string | undefined;
  submitDurationMs: number | null;
  reputation: IpReputation;
}): string[] {
  const reasons: string[] = [];
  if (input.honeypot != null && input.honeypot.trim().length > 0) {
    reasons.push('honeypot');
  }
  if (
    input.submitDurationMs != null &&
    input.submitDurationMs >= 0 &&
    input.submitDurationMs < FAST_SUBMIT_MS
  ) {
    reasons.push('fast_submit');
  }
  if (
    input.reputation.vpn === true ||
    input.reputation.proxy === true ||
    input.reputation.tor === true
  ) {
    reasons.push('vpn');
  }
  if (input.reputation.isDatacenter === true) {
    reasons.push('datacenter');
  }
  if (
    input.reputation.fraudScore != null &&
    input.reputation.fraudScore >= HIGH_FRAUD_SCORE
  ) {
    reasons.push('high_fraud_score');
  }
  return reasons;
}

async function lookupIpReputation(ip: string | null): Promise<IpReputation> {
  const empty = emptyIpReputation();
  const apiKey = process.env.PROXYCHECK_API_KEY?.trim();
  if (ip == null || !apiKey) {
    return empty;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, PROXYCHECK_TIMEOUT_MS);

  try {
    const url = `https://proxycheck.io/v2/${encodeURIComponent(ip)}?key=${encodeURIComponent(apiKey)}&vpn=3&risk=1`;
    const res = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) {
      return empty;
    }
    const data: unknown = await res.json();
    return parseProxyCheckReputation(data, ip);
  } catch {
    return empty;
  } finally {
    clearTimeout(timer);
  }
}

function parseProxyCheckReputation(data: unknown, ip: string): IpReputation {
  const empty = emptyIpReputation();
  const root = asRecord(data);
  if (root === null) {
    return empty;
  }

  const entry = asRecord(root[ip]);
  if (entry === null) {
    return empty;
  }

  const proxyYes = entry.proxy === 'yes';
  const type = typeof entry.type === 'string' ? entry.type : null;
  const fraudScore =
    typeof entry.risk === 'number' && Number.isFinite(entry.risk)
      ? Math.min(100, Math.max(0, Math.round(entry.risk)))
      : null;

  return {
    vpn: proxyYes && type === 'VPN',
    proxy: proxyYes,
    tor: type === 'Tor',
    isDatacenter: type === 'Hosting',
    fraudScore,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

type ParsedUserAgent = {
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
  osVersion: string | null;
  deviceType: ContactDeviceType | null;
  deviceSummary: string | null;
};

function parseUserAgent(userAgent: string | null): ParsedUserAgent {
  if (userAgent === null) {
    return {
      browser: null,
      browserVersion: null,
      os: null,
      osVersion: null,
      deviceType: null,
      deviceSummary: null,
    };
  }

  const result = UAParser(userAgent);
  const browser = nonempty(result.browser.name);
  const browserVersion = nonempty(result.browser.major ?? result.browser.version);
  const os = nonempty(result.os.name);
  const osVersion = nonempty(result.os.version);
  const deviceModel = nonempty(result.device.model);
  const deviceType = toDeviceType(result.device.type);

  const summaryParts: string[] = [];
  if (deviceModel) {
    summaryParts.push(deviceModel);
  } else if (deviceType !== 'desktop') {
    summaryParts.push(deviceType);
  }
  if (browser) {
    summaryParts.push(browserVersion ? `${browser} ${browserVersion}` : browser);
  }
  if (os) {
    summaryParts.push(osVersion ? `${os} ${osVersion}` : os);
  }

  return {
    browser,
    browserVersion,
    os,
    osVersion,
    deviceType,
    deviceSummary: summaryParts.length > 0 ? summaryParts.join(', ') : null,
  };
}

function toDeviceType(type: string | undefined): ContactDeviceType {
  if (type === 'mobile' || type === 'tablet') {
    return type;
  }
  return 'desktop';
}

async function resolveMxValid(email: string): Promise<boolean | null> {
  const domain = email.split('@')[1]?.trim().toLowerCase();
  if (!domain) {
    return false;
  }

  try {
    const records = await withTimeout(resolveMx(domain), MX_TIMEOUT_MS);
    return records.length > 0;
  } catch (err) {
    if (err instanceof Error && err.message === 'MX_TIMEOUT') {
      return null;
    }
    return false;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('MX_TIMEOUT'));
    }, ms);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err: unknown) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}
