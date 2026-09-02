import 'server-only';
import { resolveMx } from 'node:dns/promises';
import { UAParser } from 'ua-parser-js';

const MX_TIMEOUT_MS = 3000;
const FAST_SUBMIT_MS = 3000;

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
  const submitDurationMs = durationFromStartedAt(input.startedAt);
  const suspectReasons = collectSuspectReasons({
    honeypot: input.honeypot,
    submitDurationMs,
  });

  return {
    ip: readClientIp(request),
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
    mxValid: await resolveMxValid(input.email),
    isSuspect: suspectReasons.length > 0,
    suspectReason: suspectReasons.length > 0 ? suspectReasons.join(',') : null,
    submitDurationMs,
  };
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

function collectSuspectReasons(input: {
  honeypot: string | undefined;
  submitDurationMs: number | null;
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
  return reasons;
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
