import 'server-only';
import { serverEnv } from '@/lib/env/server';

export type GoogleServiceAccount = {
  clientEmail: string;
  privateKey: string;
};

export type ReportSourceFailureReason =
  | 'not_configured'
  | 'unauthorized'
  | 'forbidden'
  | 'rate_limited'
  | 'http_error'
  | 'network_error'
  | 'invalid_json';

export type ReportSourceFailure = {
  ok: false;
  reason: ReportSourceFailureReason;
  status?: number;
};

export function getGoogleServiceAccount(): GoogleServiceAccount | null {
  const encoded = serverEnv.GSC_SERVICE_ACCOUNT_KEY;
  if (!encoded) {
    return null;
  }

  let parsed: unknown;
  try {
    const json = Buffer.from(encoded, 'base64').toString('utf8').trim();
    parsed = JSON.parse(json);
  } catch {
    return null;
  }

  if (!isPlainObject(parsed)) {
    return null;
  }

  const clientEmail = parsed.client_email;
  const privateKey = parsed.private_key;
  if (typeof clientEmail !== 'string' || clientEmail.length === 0) {
    return null;
  }
  if (typeof privateKey !== 'string' || privateKey.length === 0) {
    return null;
  }

  return { clientEmail, privateKey };
}

export function mapGoogleClientError(error: unknown): ReportSourceFailure {
  if (isNetworkError(error)) {
    return { ok: false, reason: 'network_error' };
  }

  const status = readErrorStatus(error);
  if (status === 401 || status === 16) {
    return { ok: false, reason: 'unauthorized', status: 401 };
  }
  if (status === 403 || status === 7) {
    return { ok: false, reason: 'forbidden', status: 403 };
  }
  if (status === 429 || status === 8) {
    return { ok: false, reason: 'rate_limited', status: 429 };
  }
  if (status !== undefined && status >= 400 && status < 600) {
    return { ok: false, reason: 'http_error', status };
  }
  if (status !== undefined) {
    return { ok: false, reason: 'http_error' };
  }

  return { ok: false, reason: 'http_error' };
}

function readErrorStatus(error: unknown): number | undefined {
  if (!isPlainObject(error)) {
    return undefined;
  }

  if (typeof error.code === 'number' && Number.isFinite(error.code)) {
    return error.code;
  }

  if (typeof error.status === 'number' && Number.isFinite(error.status)) {
    return error.status;
  }

  if (typeof error.status === 'string') {
    const parsed = Number(error.status);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  if (isPlainObject(error.response)) {
    if (
      typeof error.response.status === 'number' &&
      Number.isFinite(error.response.status)
    ) {
      return error.response.status;
    }
  }

  return undefined;
}

function isNetworkError(error: unknown): boolean {
  if (!isPlainObject(error)) {
    return false;
  }
  const code = error.code;
  return (
    code === 'ENOTFOUND' ||
    code === 'ECONNRESET' ||
    code === 'ETIMEDOUT' ||
    code === 'ECONNREFUSED' ||
    code === 'EAI_AGAIN'
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
