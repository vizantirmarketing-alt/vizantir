import 'server-only';

import { randomBytes } from 'node:crypto';

const TOKEN_BYTES = 32;
const TOKEN_RE = /^[A-Za-z0-9_-]{32,128}$/;

export function generateReportToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

export function isReportToken(value: string): boolean {
  return TOKEN_RE.test(value);
}
