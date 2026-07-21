import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  CONTACT_BUDGETS,
  CONTACT_LANDING_PAGE_BUDGETS,
  CONTACT_SERVICES,
} from '@/lib/forms/contact-fields';
import { submitContactForm } from '@/lib/forms/contact-submission';
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
    turnstileToken: z.string().min(1),
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

export async function POST(req: Request) {
  let body: z.infer<typeof bodySchema>;

  try {
    const json = await req.json();
    body = bodySchema.parse(json);
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid request.' },
      { status: 400 }
    );
  }

  if (body.website && body.website.trim().length > 0) {
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
    await submitContactForm({
      name: body.name,
      email: body.email,
      phone: body.phone,
      company: body.company,
      service: body.service,
      budget: body.budget,
      message: body.message,
      ipHash,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Could not save your message. Please try again.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
