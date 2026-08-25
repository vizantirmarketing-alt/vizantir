import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';

const TOKEN_TTL_MS = 5 * 60 * 1000;

export function signPrintToken(
  reportId: string,
  secret: string,
  now = Date.now()
): string {
  const exp = now + TOKEN_TTL_MS;
  const body = `${reportId}.${exp}`;
  const sig = createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyPrintToken(
  token: string,
  reportId: string,
  secret: string,
  now = Date.now()
): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  const [payloadReportId, expRaw, signature] = parts;
  if (payloadReportId !== reportId) {
    return false;
  }

  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || now >= exp) {
    return false;
  }

  const expected = createHmac('sha256', secret)
    .update(`${payloadReportId}.${expRaw}`)
    .digest('base64url');
  const provided = Buffer.from(signature);
  const computed = Buffer.from(expected);
  if (provided.length !== computed.length) {
    return false;
  }
  return timingSafeEqual(provided, computed);
}
