import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  enrichContactSubmission,
  type ContactEnrichment,
} from '@/lib/contact/enrich';
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
import {
  submitContactForm,
  type ContactSubmissionRow,
} from '@/lib/forms/contact-submission';
import {
  emailSchema,
  isDisposableEmail,
} from '@/lib/forms/email-validation';
import { checkRateLimit, getClientIp, hashIp } from '@/lib/forms/rate-limit';
import { verifyTurnstile } from '@/lib/forms/turnstile';

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

const FORM_KEY = 'contact';
const WINDOW_MINUTES = 60;
const MAX_ATTEMPTS = 3;

const silentSuccess = () => NextResponse.json({ ok: true });

type ParsedContactBody = z.infer<typeof bodySchema>;

function toSubmissionRow(
  req: Request,
  body: ParsedContactBody,
  ipHash: string,
  enrichment: ContactEnrichment
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
  };
}

export async function POST(req: Request) {
  let body: ParsedContactBody;

  try {
    const json = await req.json();
    body = bodySchema.parse(json);
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid request.' },
      { status: 400 }
    );
  }

  const enrichment = await enrichContactSubmission({
    request: req,
    email: body.email,
    honeypot: body.website,
    startedAt: body.startedAt ?? null,
    pagePath: body.landing_page ?? null,
  });

  if (body.website && body.website.trim().length > 0) {
    try {
      const ipHash = hashIp(getClientIp(req));
      await submitContactForm(toSubmissionRow(req, body, ipHash, enrichment));
    } catch {
      // Bots must not learn that the honeypot fired.
    }
    return silentSuccess();
  }

  const ip = getClientIp(req);
  const turnstileOk = await verifyTurnstile(body.turnstileToken, ip);
  if (!turnstileOk) {
    return NextResponse.json(
      { ok: false, error: 'Verification failed. Please try again.' },
      { status: 400 }
    );
  }

  const rl = await checkRateLimit({
    ip,
    formKey: FORM_KEY,
    windowMinutes: WINDOW_MINUTES,
    maxAttempts: MAX_ATTEMPTS,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: 'Too many attempts. Please try again later.' },
      { status: 429 }
    );
  }

  if (isDisposableEmail(body.email)) {
    return silentSuccess();
  }

  let ipHash: string;
  try {
    ipHash = hashIp(ip);
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Server configuration error.' },
      { status: 500 }
    );
  }

  try {
    await submitContactForm(toSubmissionRow(req, body, ipHash, enrichment));
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Could not save your message. Please try again.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
