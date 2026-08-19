import 'server-only';
import { createSign } from 'node:crypto';
import { serverEnv } from '@/lib/env/server';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const TOKEN_AUDIENCE = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
const TOKEN_LIFETIME_SEC = 3600;
const EXPIRY_SKEW_MS = 60_000;

type ServiceAccountKey = {
  clientEmail: string;
  privateKey: string;
};

type CachedAccessToken = {
  accessToken: string;
  expiresAtMs: number;
};

export type Ga4AccessTokenResult =
  | { ok: true; accessToken: string }
  | {
      ok: false;
      reason:
        | 'not_configured'
        | 'unauthorized'
        | 'forbidden'
        | 'rate_limited'
        | 'http_error'
        | 'network_error'
        | 'invalid_json';
      status?: number;
    };

let cachedToken: CachedAccessToken | null = null;

export async function getGa4AccessToken(): Promise<Ga4AccessTokenResult> {
  const now = Date.now();
  if (
    cachedToken !== null &&
    now < cachedToken.expiresAtMs - EXPIRY_SKEW_MS
  ) {
    return { ok: true, accessToken: cachedToken.accessToken };
  }

  const key = parseServiceAccountKey();
  if (key === null) {
    return { ok: false, reason: 'not_configured' };
  }

  let assertion: string;
  try {
    assertion = signServiceAccountJwt(key);
  } catch {
    return { ok: false, reason: 'not_configured' };
  }

  const exchanged = await exchangeJwtForAccessToken(assertion);
  if (!exchanged.ok) {
    return exchanged;
  }

  cachedToken = exchanged.cached;
  return { ok: true, accessToken: exchanged.cached.accessToken };
}

function parseServiceAccountKey(): ServiceAccountKey | null {
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

function signServiceAccountJwt(key: ServiceAccountKey): string {
  const nowSec = Math.floor(Date.now() / 1000);
  const header = toBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = toBase64Url(
    JSON.stringify({
      iss: key.clientEmail,
      scope: SCOPE,
      aud: TOKEN_AUDIENCE,
      iat: nowSec,
      exp: nowSec + TOKEN_LIFETIME_SEC,
    })
  );
  const unsigned = `${header}.${claims}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(key.privateKey, 'base64url');
  return `${unsigned}.${signature}`;
}

type TokenExchangeFailure = {
  ok: false;
  reason:
    | 'unauthorized'
    | 'forbidden'
    | 'rate_limited'
    | 'http_error'
    | 'network_error'
    | 'invalid_json';
  status?: number;
};

async function exchangeJwtForAccessToken(
  assertion: string
): Promise<{ ok: true; cached: CachedAccessToken } | TokenExchangeFailure> {
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  });

  let response: Response;
  try {
    response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
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

  const token = parseAccessTokenResponse(parsed);
  if (token === null) {
    return { ok: false, reason: 'invalid_json', status: response.status };
  }

  return { ok: true, cached: token };
}

function parseAccessTokenResponse(value: unknown): CachedAccessToken | null {
  if (!isPlainObject(value) || typeof value.access_token !== 'string') {
    return null;
  }
  if (value.access_token.length === 0) {
    return null;
  }

  const expiresIn =
    typeof value.expires_in === 'number' && Number.isFinite(value.expires_in)
      ? value.expires_in
      : TOKEN_LIFETIME_SEC;

  return {
    accessToken: value.access_token,
    expiresAtMs: Date.now() + expiresIn * 1000,
  };
}

function toBase64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
