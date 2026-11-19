/**
 * The contact form's POST handler, with its network and database steps
 * injected (app/api/contact/route.ts wires the real ones). Order:
 *
 * 1. Validate the body.
 * 2. Honeypot filled (a local check): rate limit by IP on its own form key,
 *    so bot traffic never uses a real visitor's allowance. Over the cap,
 *    nothing is stored and no external service is called. Under it, enrich
 *    and store as spam with the honeypot reason.
 * 3. Otherwise: Turnstile, then the normal rate limit, then enrichment.
 * 4. A disposable email address is stored as spam with its reason.
 * 5. Anything else is scored; at or above the threshold it is stored as spam.
 *
 * Spam is stored through the same submit path as everything else, which
 * sends no notification for spam. Enrichment never runs before an abuse
 * check, and its failure never stops an inquiry being stored and notified.
 * Every honeypot and disposable outcome, stored or not, returns the same
 * success response as a real inquiry, so a script learns nothing.
 */

import { z } from 'zod';

import type { ContactEnrichment, EnrichContactInput } from '@/lib/contact/enrich';
import {
  ATTRIBUTION_FIELD_MAX,
  deriveInitialChannel,
  resolveRequestOrigin,
  stripControlChars,
} from '@/lib/forms/attribution';
import {
  CONTACT_BUDGETS,
  CONTACT_LANDING_PAGE_BUDGETS,
  CONTACT_SERVICES,
} from '@/lib/forms/contact-fields';
import type { ContactSubmissionRow } from '@/lib/forms/contact-submission';
import { emailSchema, isDisposableEmail } from '@/lib/forms/email-validation';
import { scoreLead, SPAM_SCORE_THRESHOLD } from '@/lib/leads/spam-score';

const serviceEnum = z.enum(CONTACT_SERVICES);
const websiteBudgetEnum = z.enum(CONTACT_BUDGETS);
const landingPageBudgetEnum = z.enum(CONTACT_LANDING_PAGE_BUDGETS);
const budgetEnum = z.union([websiteBudgetEnum, landingPageBudgetEnum]);

const optionalAttributionText = (max: number) =>
  z
    .string()
    .max(max)
    .transform((s) => {
      const cleaned = stripControlChars(s).trim();
      return cleaned === '' ? null : cleaned;
    })
    .optional()
    .nullable();

const bodySchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    email: emailSchema,
    phone: z
      .string()
      .max(50)
      .transform((s) => {
        const t = s.trim();
        return t === '' ? null : t;
      }),
    company: z
      .string()
      .max(200)
      .transform((s) => {
        const t = s.trim();
        return t === '' ? null : t;
      }),
    service: serviceEnum,
    budget: z
      .union([z.literal(''), budgetEnum])
      .transform((v) => (v === '' ? null : v)),
    message: z.string().trim().min(10).max(5000),
    website: z.string().optional(),
    startedAt: z
      .union([z.number(), z.string()])
      .optional()
      .nullable()
      .transform((value) => {
        if (value == null || value === '') return null;
        const n = typeof value === 'number' ? value : Number(value);
        if (!Number.isFinite(n)) return null;
        return Math.trunc(n);
      }),
    turnstileToken: z.string().min(1),
    landing_page: optionalAttributionText(ATTRIBUTION_FIELD_MAX.landing_page),
    referrer: optionalAttributionText(ATTRIBUTION_FIELD_MAX.referrer),
    utm_source: optionalAttributionText(ATTRIBUTION_FIELD_MAX.utm_source),
    utm_medium: optionalAttributionText(ATTRIBUTION_FIELD_MAX.utm_medium),
    utm_campaign: optionalAttributionText(ATTRIBUTION_FIELD_MAX.utm_campaign),
  })
  .superRefine((data, ctx) => {
    // Optional budget: null always allowed (no cross-check).
    if (data.budget === null) return;

    const isLandingPage = data.service === 'Landing Page';
    const allowedBudgets = isLandingPage
      ? CONTACT_LANDING_PAGE_BUDGETS
      : CONTACT_BUDGETS;

    if (!(allowedBudgets as readonly string[]).includes(data.budget)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Budget selection does not match the chosen service.',
        path: ['budget'],
      });
    }
  });

export const CONTACT_FORM_KEY = 'contact';
export const CONTACT_WINDOW_MINUTES = 60;
export const CONTACT_MAX_ATTEMPTS = 3;

/** Honeypot catches stored per IP per window; more are dropped silently. */
export const CONTACT_HONEYPOT_FORM_KEY = 'contact-honeypot';
export const CONTACT_HONEYPOT_WINDOW_MINUTES = 60;
export const CONTACT_HONEYPOT_MAX_ATTEMPTS = 5;

/** Suspect reasons the handler records itself; enrichment records the rest. */
export const HONEYPOT_REASON = 'honeypot';
export const DISPOSABLE_EMAIL_REASON = 'disposable_email';

export type ContactReply = {
  status: number;
  body: { ok: true } | { ok: false; error: string };
};

const success = (): ContactReply => ({ status: 200, body: { ok: true } });
const failure = (status: number, error: string): ContactReply => ({
  status,
  body: { ok: false, error },
});

export type ContactHandlerDeps = {
  enrich: (input: EnrichContactInput) => Promise<ContactEnrichment>;
  getClientIp: (req: Request) => string;
  hashIp: (ip: string) => string;
  verifyTurnstile: (token: string, ip: string) => Promise<boolean>;
  checkRateLimit: (opts: {
    ip: string;
    formKey: string;
    windowMinutes: number;
    maxAttempts: number;
  }) => Promise<{ allowed: boolean }>;
  /** Stores the submission and, unless its status is spam, notifies. */
  submit: (row: ContactSubmissionRow) => Promise<void>;
};

type ParsedContactBody = z.infer<typeof bodySchema>;

export function honeypotFilled(value: string | undefined): boolean {
  return value != null && value.trim().length > 0;
}

function toSubmissionRow(
  req: Request,
  body: ParsedContactBody,
  ipHash: string,
  enrichment: ContactEnrichment,
  status?: 'spam'
): ContactSubmissionRow {
  return {
    name: body.name,
    email: body.email,
    phone: body.phone,
    company: body.company,
    service: body.service,
    budget: body.budget,
    message: body.message,
    ipHash,
    landingPage: body.landing_page ?? null,
    referrer: body.referrer ?? null,
    utmSource: body.utm_source ?? null,
    utmMedium: body.utm_medium ?? null,
    utmCampaign: body.utm_campaign ?? null,
    initialChannel: deriveInitialChannel({
      utmSource: body.utm_source,
      referrer: body.referrer,
      requestOrigin: resolveRequestOrigin(req),
    }),
    enrichment,
    ...(status ? { status } : {}),
  };
}

/** Enrichment with nothing looked up, used when enrichment fails. */
function emptyEnrichment(pagePath: string | null): ContactEnrichment {
  return {
    ip: null,
    country: null,
    region: null,
    city: null,
    timezone: null,
    browser: null,
    browserVersion: null,
    os: null,
    osVersion: null,
    deviceType: null,
    deviceSummary: null,
    userAgent: null,
    acceptLanguage: null,
    httpReferrer: null,
    pagePath,
    mxValid: null,
    vpn: null,
    proxy: null,
    tor: null,
    isDatacenter: null,
    fraudScore: null,
    isSuspect: false,
    suspectReason: null,
    submitDurationMs: null,
  };
}

async function safeEnrich(
  req: Request,
  body: ParsedContactBody,
  deps: ContactHandlerDeps
): Promise<ContactEnrichment> {
  try {
    return await deps.enrich({
      request: req,
      email: body.email,
      honeypot: body.website,
      startedAt: body.startedAt ?? null,
      pagePath: body.landing_page ?? null,
    });
  } catch {
    return emptyEnrichment(body.landing_page ?? null);
  }
}

/** Adds a suspect reason once, keeping any already recorded. */
export function withSuspectReason(
  enrichment: ContactEnrichment,
  reason: string
): ContactEnrichment {
  const reasons = enrichment.suspectReason?.split(',').filter((r) => r.length > 0) ?? [];
  if (!reasons.includes(reason)) reasons.push(reason);
  return { ...enrichment, isSuspect: true, suspectReason: reasons.join(',') };
}

export async function handleContactPost(
  req: Request,
  deps: ContactHandlerDeps
): Promise<ContactReply> {
  let body: ParsedContactBody;

  try {
    const json = await req.json();
    body = bodySchema.parse(json);
  } catch {
    return failure(400, 'Invalid request.');
  }

  if (honeypotFilled(body.website)) {
    // Bots must not learn that the honeypot fired, or that its cap was hit.
    try {
      const ip = deps.getClientIp(req);
      const cap = await deps.checkRateLimit({
        ip,
        formKey: CONTACT_HONEYPOT_FORM_KEY,
        windowMinutes: CONTACT_HONEYPOT_WINDOW_MINUTES,
        maxAttempts: CONTACT_HONEYPOT_MAX_ATTEMPTS,
      });
      if (!cap.allowed) return success();
      const enrichment = withSuspectReason(await safeEnrich(req, body, deps), HONEYPOT_REASON);
      await deps.submit(toSubmissionRow(req, body, deps.hashIp(ip), enrichment, 'spam'));
    } catch {
      // Nothing to tell the submitter.
    }
    return success();
  }

  const ip = deps.getClientIp(req);
  const turnstileOk = await deps.verifyTurnstile(body.turnstileToken, ip);
  if (!turnstileOk) {
    return failure(400, 'Verification failed. Please try again.');
  }

  const rl = await deps.checkRateLimit({
    ip,
    formKey: CONTACT_FORM_KEY,
    windowMinutes: CONTACT_WINDOW_MINUTES,
    maxAttempts: CONTACT_MAX_ATTEMPTS,
  });
  if (!rl.allowed) {
    return failure(429, 'Too many attempts. Please try again later.');
  }

  const enrichment = await safeEnrich(req, body, deps);

  if (isDisposableEmail(body.email)) {
    try {
      const row = toSubmissionRow(
        req,
        body,
        deps.hashIp(ip),
        withSuspectReason(enrichment, DISPOSABLE_EMAIL_REASON),
        'spam'
      );
      await deps.submit(row);
    } catch {
      // As before, a disposable address always gets the success response.
    }
    return success();
  }

  let ipHash: string;
  try {
    ipHash = deps.hashIp(ip);
  } catch {
    return failure(500, 'Server configuration error.');
  }

  const spam = scoreLead({
    name: body.name,
    email: body.email,
    phone: body.phone,
    company: body.company,
    message: body.message,
  });
  const status = spam.score >= SPAM_SCORE_THRESHOLD ? 'spam' : undefined;

  try {
    await deps.submit(toSubmissionRow(req, body, ipHash, enrichment, status));
  } catch {
    return failure(500, 'Could not save your message. Please try again.');
  }

  return success();
}
