import 'server-only';

import type { ReportSnapshot } from '@/lib/reports/generate';

const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 1024;

const SYSTEM_PROMPT = `You draft the Recommended next section of a monthly website care report.

Rules:
- Produce two or three recommendations, no more.
- Reference specific pages, queries, and numbers from the snapshot.
- Use the per-row prior-period comparisons on GSC topQueries and topPages (positionChange, impressionsChange, clicksChange) to make each recommendation specific rather than generic.
- State expected impact for each recommendation.
- Skip any recommendation you cannot ground in the data provided.
- Write plainly, as one person explaining to another.
- No marketing language.
- Do not use em-dashes.
- Do not use phrases like "leverage", "robust", "seamless", or "it's worth noting".
- Return only the recommendation text. No preamble, no headers, no markdown code fences.`;

export type GenerateAnalysisDraftResult =
  | { ok: true; text: string }
  | {
      ok: false;
      reason:
        | 'not_configured'
        | 'gsc_skipped'
        | 'gsc_failed'
        | 'gsc_empty_rows'
        | 'unauthorized'
        | 'forbidden'
        | 'rate_limited'
        | 'http_error'
        | 'network_error'
        | 'invalid_json'
        | 'empty_text'
        | 'truncated';
      status?: number;
    };

export async function generateAnalysisDraft(
  snapshot: ReportSnapshot
): Promise<GenerateAnalysisDraftResult> {
  if (!snapshot.gsc.ok) {
    return { ok: false, reason: 'gsc_failed' };
  }
  if (snapshot.gsc.skipped) {
    return { ok: false, reason: 'gsc_skipped' };
  }
  if (snapshot.gsc.data.emptyRows) {
    return { ok: false, reason: 'gsc_empty_rows' };
  }

  const apiKey = readApiKey();
  if (apiKey === null) {
    return { ok: false, reason: 'not_configured' };
  }

  let response: Response;
  try {
    response = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Draft the Recommended next section from this report snapshot:\n\n${JSON.stringify(snapshot)}`,
          },
        ],
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(45000),
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

  if (isMaxTokensStop(parsed)) {
    return { ok: false, reason: 'truncated' };
  }

  const text = parseMessageText(parsed);
  if (text === null) {
    return { ok: false, reason: 'invalid_json', status: response.status };
  }
  if (text.length === 0) {
    return { ok: false, reason: 'empty_text' };
  }

  return { ok: true, text };
}

function readApiKey(): string | null {
  const value = process.env.ANTHROPIC_API_KEY;
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isMaxTokensStop(value: unknown): boolean {
  if (!isPlainObject(value)) {
    return false;
  }
  return typeof value.stop_reason === 'string' && value.stop_reason === 'max_tokens';
}

function parseMessageText(value: unknown): string | null {
  if (!isPlainObject(value) || !Array.isArray(value.content)) {
    return null;
  }

  const parts: string[] = [];
  for (const block of value.content) {
    if (!isPlainObject(block)) {
      return null;
    }
    if (block.type !== 'text') {
      continue;
    }
    if (typeof block.text !== 'string') {
      return null;
    }
    parts.push(block.text);
  }

  if (parts.length === 0) {
    return null;
  }

  return parts.join('\n').trim();
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
