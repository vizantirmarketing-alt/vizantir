import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyTurnstile } from '@/lib/forms/turnstile';
import { checkRateLimit, getClientIp } from '@/lib/forms/rate-limit';
import {
  emailSchema,
  isDisposableEmail,
} from '@/lib/forms/email-validation';
import { startNewsletterOptIn } from '@/lib/forms/newsletter-confirm';

const bodySchema = z.object({
  email: emailSchema,
  website: z.string().optional(), // honeypot
  turnstileToken: z.string().min(1),
});

const FORM_KEY = 'newsletter';
const WINDOW_MINUTES = 60;
const MAX_ATTEMPTS = 3;

// Same-shape success response. Used for honeypot + disposable + duplicate.
// Bots can't distinguish "you got through" from "we silently dropped you".
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

  // Layer 1 — Honeypot. Silent success.
  if (body.website && body.website.trim().length > 0) {
    return silentSuccess();
  }

  // Layer 2 — Turnstile.
  const ip = getClientIp(req);
  const turnstileOk = await verifyTurnstile(body.turnstileToken, ip);
  if (!turnstileOk) {
    return NextResponse.json(
      { ok: false, error: 'Verification failed. Please try again.' },
      { status: 400 }
    );
  }

  // Layer 3 — Rate limit.
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

  // Layer 4 — Disposable email. Silent success (don't tell bots).
  if (isDisposableEmail(body.email)) {
    return silentSuccess();
  }

  // Layer 5 — Double opt-in.
  const result = await startNewsletterOptIn(body.email);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: 'Could not send confirmation. Please try again.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
