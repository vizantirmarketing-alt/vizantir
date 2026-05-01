# Vizantir Form Protection Standard

**Owner:** Vizantir Design Studio (DBA, JT Holdings Corp)
**Applies to:** All Vizantir client projects, vizantir.com, Analytir marketing surfaces, personal sites
**Stack assumed:** Next.js 16+, TypeScript, Tailwind, Supabase, Resend
**Last reviewed:** 2026-04

---

## What this is

A reference document for shipping public forms on Vizantir-built Next.js sites without getting buried in spam, subscription bombing, or bot-driven abuse. Six layers, applied selectively based on form type. Copy the snippets, adjust env vars, ship.

This is not a package. It's a checklist + working code. If a pattern here gets copy-pasted into 5+ projects unchanged, that's the signal to extract `@vizantir/forms` — not before.

## Why it exists

Next.js ships safe primitives, not safe applications. A bare `route.ts` with `await supabase.from('contacts').insert(...)` is wide open to:

- Headless bots filling forms 24/7 to harvest backlinks or pollute lists
- Subscription bombing (signing a victim's email up to thousands of newsletters)
- Credential stuffing on auth forms
- Resource exhaustion (rate-unlimited inserts → Supabase row count → bill spike)

Form protection is engineering work. It's billable. A standardized protection package on a Vizantir project is roughly 2–3 hours of integration time per form, scoped into the build.

## Supabase project setup gotcha

When you create a Supabase project, the **Automatically expose new tables and functions** option determines whether new tables automatically receive table privileges for the Data API roles (`anon`, `authenticated`, and `service_role`). Vizantir's standard recommendation is to leave this disabled so exposure stays under explicit migration control—which means any table your server touches with the service role must get explicit `GRANT` statements in SQL migrations, not only RLS policies.

If production logs show `permission denied for table …` even though RLS policies reference `service_role`, check for missing `GRANT`s. Postgres enforces table privileges before Row Level Security; without grants, the statement fails at that layer and RLS is never evaluated.

---

## The six layers

| # | Layer              | Cost | Default for | Catches                              |
|---|--------------------|------|-------------|--------------------------------------|
| 1 | Honeypot field     | Free | Every form  | Naive bots that fill every input     |
| 2 | Cloudflare Turnstile | Free | Every form  | Headless browsers, scripted clients  |
| 3 | Rate limiting      | Free | Every form  | Same-IP flooding, retry storms       |
| 4 | Email syntax + MX  | Free | Email forms | Garbage emails, typos                |
| 5 | Double opt-in      | Free* | Newsletter  | Subscription bombing, list poisoning |
| 6 | Reputation API     | $$   | High-value lists | Disposable + low-quality emails  |

*Resend free tier covers most projects through launch.

### Default ship config by form type

- **Contact form:** Layers 1, 2, 3
- **Newsletter signup:** Layers 1, 2, 3, 4, 5
- **Booking / lead capture:** Layers 1, 2, 3, 4 (5 if confirmation matters)
- **Auth (Analytir-class):** This document does not cover auth. Auth forms need account lockout, optional 2FA, audit logs, session security — out of scope here. See separate auth security doc.

---

## Layer 1 — Honeypot field

A field invisible to humans, visible to bots that scrape the DOM and fill every input.

### Rules

- **Don't** use `type="hidden"` or `display: none`. Sophisticated bots skip both.
- **Do** position the field off-screen via CSS and mark `aria-hidden`, `tabIndex={-1}`, `autoComplete="off"`.
- Pick a plausible bait name: `website`, `url`, `company_url`. Avoid `honeypot`, `bot_field`, `gotcha`.
- **Silent success on trigger.** Return 200 with the same response shape as a real submission. Never tell a bot it was caught — that trains the next one.

### Component

```tsx
// components/forms/Honeypot.tsx
type Props = {
  name?: string;
  value: string;
  onChange: (v: string) => void;
};

export function Honeypot({ name = 'website', value, onChange }: Props) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: '-9999px',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      }}
    >
      <label htmlFor={name}>Leave this field empty</label>
      <input
        id={name}
        name={name}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
```

### Server check

```ts
// inside route handler, before any DB write
if (body.website && body.website.trim().length > 0) {
  // Silent success. Same shape as real response.
  return Response.json({ ok: true });
}
```

---

## Layer 2 — Cloudflare Turnstile

Privacy-respecting CAPTCHA replacement. Free. Most users see a checkbox or nothing. Issues a token client-side; verify server-side before trusting any submission.

### Setup

1. `dash.cloudflare.com` → Turnstile → Add site. Pick **Managed** widget mode.
2. Copy the **site key** (public) and **secret key** (server-only).
3. Add to env:

```bash
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAA...
TURNSTILE_SECRET_KEY=0x4AAA...
```

4. Install: `npm i @marsidev/react-turnstile`

### Client widget

```tsx
// components/forms/TurnstileWidget.tsx
'use client';

import { Turnstile } from '@marsidev/react-turnstile';

type Props = {
  onVerify: (token: string) => void;
  onExpire?: () => void;
};

export function TurnstileWidget({ onVerify, onExpire }: Props) {
  return (
    <Turnstile
      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
      onSuccess={onVerify}
      onExpire={onExpire}
      options={{
        theme: 'light', // adjust per project palette
        size: 'flexible',
      }}
    />
  );
}
```

### Server verification

```ts
// lib/forms/turnstile.ts
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstile(
  token: string,
  remoteIp?: string
): Promise<boolean> {
  if (!token) return false;

  const body = new URLSearchParams({
    secret: process.env.TURNSTILE_SECRET_KEY!,
    response: token,
  });
  if (remoteIp) body.append('remoteip', remoteIp);

  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch {
    // Fail closed. Bot tries to flood the verifier into 5xx → we deny.
    return false;
  }
}
```

### Edge case

Turnstile tokens are single-use and expire after ~5 minutes. If a user sits on a form for too long, re-issue. The `onExpire` callback handles this.

---

## Layer 3 — Rate limiting (Supabase + hashed IP)

Per-IP, per-window. Hash IPs with a per-project salt before storing. Never store raw IPs — that's PII.

### Schema

```sql
-- Run in Supabase SQL editor. One table per form type, or one shared table.
create table if not exists rate_limits (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  form_key text not null,           -- 'contact' | 'newsletter' | etc
  created_at timestamptz not null default now()
);

create index if not exists rate_limits_lookup_idx
  on rate_limits (ip_hash, form_key, created_at desc);

alter table rate_limits enable row level security;

-- Service role only. No anon access.
create policy "service_role_all" on rate_limits
  for all using (auth.role() = 'service_role');

-- Required when "Automatically expose new tables" was disabled at project setup.
-- Without this, service_role lacks table-level privileges and queries fail with
-- "permission denied for table X" — RLS policy is irrelevant if Postgres
-- rejects at the privilege layer first.
grant select, insert, update, delete on public.rate_limits to service_role;
```

### Env

```bash
RATE_LIMIT_SALT=<32+ random chars, project-specific>
```

Generate with `openssl rand -hex 32`. Different salt per project.

### Library

```ts
// lib/forms/rate-limit.ts
import { createHash } from 'node:crypto';
import { createSupabaseServiceRole } from '@/lib/supabase/service';

export function hashIp(ip: string): string {
  const salt = process.env.RATE_LIMIT_SALT;
  if (!salt) throw new Error('RATE_LIMIT_SALT not set');
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real;
  return '0.0.0.0';
}

type CheckOpts = {
  ip: string;
  formKey: string;
  windowMinutes: number;
  maxAttempts: number;
};

export async function checkRateLimit(opts: CheckOpts): Promise<{
  allowed: boolean;
  attempts: number;
}> {
  const supabase = createSupabaseServiceRole();
  const ipHash = hashIp(opts.ip);
  const since = new Date(Date.now() - opts.windowMinutes * 60_000).toISOString();

  const { count, error } = await supabase
    .from('rate_limits')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .eq('form_key', opts.formKey)
    .gte('created_at', since);

  if (error) {
    // Fail closed.
    return { allowed: false, attempts: -1 };
  }

  const attempts = count ?? 0;
  if (attempts >= opts.maxAttempts) {
    return { allowed: false, attempts };
  }

  await supabase.from('rate_limits').insert({
    ip_hash: ipHash,
    form_key: opts.formKey,
  });

  return { allowed: true, attempts: attempts + 1 };
}
```

### Recommended thresholds

| Form type    | Window | Max attempts |
|--------------|--------|--------------|
| Contact      | 60 min | 3            |
| Newsletter   | 60 min | 3            |
| Booking      | 60 min | 5            |
| Generic lead | 60 min | 5            |

These are starting points. Tune based on actual traffic. A real customer rarely submits the same contact form twice in an hour.

### Cleanup

Old rows accumulate. Schedule a daily cleanup via Supabase scheduled function or a Vercel cron:

```sql
delete from rate_limits where created_at < now() - interval '7 days';
```

---

## Layer 4 — Email validation (email-collecting forms)

Three checks, ordered cheapest first.

### 4a. Syntactic (Zod)

```ts
import { z } from 'zod';

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: 'Please enter a valid email address.' })
  .max(254); // RFC 5321 max
```

### 4b. Disposable domain check

Maintain a denylist. The `disposable-email-domains` npm package is community-maintained but goes stale; consider keeping your own short list of the offenders you actually see.

```ts
// lib/forms/email-disposable.ts
const DISPOSABLE = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'tempmail.com',
  '10minutemail.com',
  'throwaway.email',
  'yopmail.com',
  'temp-mail.org',
  // append as you encounter them
]);

export function isDisposable(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return true;
  return DISPOSABLE.has(domain);
}
```

### 4c. MX record check (optional)

Confirms the domain can actually receive mail. Slow (DNS roundtrip) but catches typos like `gnail.com`.

```ts
// lib/forms/email-mx.ts
import { promises as dns } from 'node:dns';

export async function hasMxRecord(email: string): Promise<boolean> {
  const domain = email.split('@')[1];
  if (!domain) return false;
  try {
    const records = await dns.resolveMx(domain);
    return records.length > 0;
  } catch {
    return false;
  }
}
```

Use 4c only if the form is genuinely high-stakes. The DNS lookup adds 50–500ms to every submission.

---

## Layer 5 — Double opt-in (newsletter only)

The single most important defense against subscription bombing. Confirmation email with a token link required before email enters the active list.

### State machine

```
[submitted] → email sent with token
            ↓
[pending] (token in DB, expires in 24h)
            ↓
user clicks link
            ↓
[confirmed] (token consumed, email is now active)
```

If the user never clicks: row expires, list stays clean.

### Schema

```sql
create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status text not null check (status in ('pending', 'confirmed', 'unsubscribed')),
  confirmation_token text,
  token_expires_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index newsletter_subscribers_token_idx
  on newsletter_subscribers (confirmation_token)
  where confirmation_token is not null;

alter table newsletter_subscribers enable row level security;

create policy "service_role_all" on newsletter_subscribers
  for all using (auth.role() = 'service_role');

-- Required when "Automatically expose new tables" was disabled at project setup.
-- Without this, service_role lacks table-level privileges and queries fail with
-- "permission denied for table X" — RLS policy is irrelevant if Postgres
-- rejects at the privilege layer first.
grant select, insert, update, delete on public.newsletter_subscribers to service_role;
```

### Resend setup

1. `resend.com` → API Keys → create. Verify your sending domain (DNS records).
2. Env:

```bash
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=hello@yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

3. Install: `npm i resend`

### Send confirmation email

```ts
// lib/forms/newsletter-confirm.ts
import { Resend } from 'resend';
import { randomBytes } from 'node:crypto';
import { createSupabaseServiceRole } from '@/lib/supabase/service';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function startNewsletterOptIn(email: string): Promise<{
  ok: boolean;
  alreadyConfirmed: boolean;
}> {
  const supabase = createSupabaseServiceRole();

  // Check existing
  const { data: existing } = await supabase
    .from('newsletter_subscribers')
    .select('id, status')
    .eq('email', email)
    .maybeSingle();

  if (existing?.status === 'confirmed') {
    // Don't reveal subscription state to attackers — just succeed silently.
    return { ok: true, alreadyConfirmed: true };
  }

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // Upsert: pending row with fresh token, even if a stale pending exists.
  await supabase
    .from('newsletter_subscribers')
    .upsert(
      {
        email,
        status: 'pending',
        confirmation_token: token,
        token_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    );

  const confirmUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/newsletter/confirm?token=${token}`;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: email,
    subject: 'Confirm your subscription',
    html: confirmationEmailHtml(confirmUrl),
    text: `Confirm your subscription: ${confirmUrl}\n\nThis link expires in 24 hours. If you didn't request this, ignore this email.`,
  });

  return { ok: true, alreadyConfirmed: false };
}

function confirmationEmailHtml(url: string): string {
  // Editorial, restrained. Adjust per project brand.
  return `
    <div style="font-family: 'Satoshi', system-ui, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px; color: #1a1a1a;">
      <h1 style="font-size: 22px; font-weight: 500; letter-spacing: -0.01em; margin: 0 0 24px;">
        Confirm your subscription
      </h1>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 32px;">
        Click the link below to confirm. This link expires in 24 hours.
      </p>
      <p style="margin: 0 0 32px;">
        <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #1a1a1a; color: #fff; text-decoration: none; font-size: 14px; letter-spacing: 0.02em;">
          Confirm subscription
        </a>
      </p>
      <p style="font-size: 13px; color: #666; line-height: 1.6; margin: 0;">
        If you didn't request this, ignore this email and you won't be subscribed.
      </p>
    </div>
  `;
}
```

### Confirm endpoint

```ts
// app/api/newsletter/confirm/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceRole } from '@/lib/supabase/service';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

  if (!token) {
    return NextResponse.redirect(`${siteUrl}/newsletter/error`);
  }

  const supabase = createSupabaseServiceRole();

  const { data: row } = await supabase
    .from('newsletter_subscribers')
    .select('id, status, token_expires_at')
    .eq('confirmation_token', token)
    .maybeSingle();

  if (!row) {
    return NextResponse.redirect(`${siteUrl}/newsletter/error`);
  }

  if (row.status === 'confirmed') {
    return NextResponse.redirect(`${siteUrl}/newsletter/confirmed`);
  }

  if (row.token_expires_at && new Date(row.token_expires_at) < new Date()) {
    return NextResponse.redirect(`${siteUrl}/newsletter/expired`);
  }

  await supabase
    .from('newsletter_subscribers')
    .update({
      status: 'confirmed',
      confirmation_token: null,
      token_expires_at: null,
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id);

  return NextResponse.redirect(`${siteUrl}/newsletter/confirmed`);
}
```

### Cleanup

Drop expired pending rows nightly:

```sql
delete from newsletter_subscribers
where status = 'pending'
  and token_expires_at < now() - interval '7 days';
```

---

## Layer 6 — Reputation API (optional)

Kickbox or ZeroBounce. Pay-per-check API that flags risky/disposable/role-based addresses (e.g. `info@`, `admin@`).

Use only when each subscriber meaningfully matters — luxury hospitality client whose newsletter drives bookings, a law firm whose intake emails are leads worth $5k+. Skip for general marketing lists.

Integration is straightforward (single API call, returns a score) and not worth snippets here. Add when needed, not by default.

---

## Environment variable conventions

Standardize across every Vizantir project. `.env.local` for dev, Vercel env for prod.

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

# Rate limiting
RATE_LIMIT_SALT=

# Resend (only if newsletter)
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Site
NEXT_PUBLIC_SITE_URL=
```

`SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SECRET_KEY`, `RATE_LIMIT_SALT`, and `RESEND_API_KEY` are server-only. Never prefix with `NEXT_PUBLIC_`. If you ever see one in client bundle output, rotate immediately.

---

## Project setup checklist

When starting a new Vizantir project with forms:

- [ ] Create Cloudflare Turnstile site, save keys
- [ ] Generate `RATE_LIMIT_SALT` (`openssl rand -hex 32`)
- [ ] Add `rate_limits` table + RLS policy
- [ ] If newsletter: add `newsletter_subscribers` table + RLS policy
- [ ] If newsletter: verify Resend sending domain (DNS), set `RESEND_FROM_EMAIL`
- [ ] Copy `lib/forms/*` from reference implementation
- [ ] Copy `components/forms/Honeypot.tsx` and `TurnstileWidget.tsx`
- [ ] Wire form: client component + `route.ts` server handler
- [ ] Add cleanup cron (Vercel cron or Supabase scheduled function)

---

## Pre-ship testing checklist

Before any form goes to prod, verify each layer manually:

- [ ] **Honeypot:** Submit with the hidden field populated → 200 response, no DB row written
- [ ] **Turnstile:** Submit without solving widget → rejected with clear error
- [ ] **Turnstile:** Submit with stale token (wait 6+ minutes) → rejected
- [ ] **Rate limit:** Submit 4× in quick succession → 4th request rejected with 429
- [ ] **Rate limit:** Verify `rate_limits` table has hashed IPs only (no raw IPs)
- [ ] **Email validation:** Submit `not-an-email` → rejected
- [ ] **Email validation:** Submit `test@mailinator.com` → rejected
- [ ] **Newsletter only — Double opt-in:** Submit valid email → confirmation email arrives
- [ ] **Newsletter only — Double opt-in:** Click confirm link → status flips to `confirmed`
- [ ] **Newsletter only — Double opt-in:** Wait 24h+, click expired link → redirected to expired page
- [ ] **Newsletter only — Double opt-in:** Submit same email twice → second submission silent-succeeds, doesn't reveal subscription state
- [ ] **Server logs:** Verify no PII (raw IPs, full email bodies) in logs

---

## Deploying to production (Vercel)

When deploying a form-protected project to Vercel, complete this checklist before going live:

1. Set every env var from the project's `.env.local` in Vercel dashboard → Settings → Environment Variables. Mark them for Production (and Preview, if you want forms to work on preview deploys). Do not commit `.env.local`.

2. `NEXT_PUBLIC_SITE_URL` must be the production URL (`https://vizantir.com`), not localhost.

3. Cloudflare Turnstile widget: add the production hostname (`vizantir.com`, `www.vizantir.com` if applicable) to the widget's allowed hostnames list. The development widget can stay configured with localhost; you can use one widget for both, or split into a dev widget and prod widget if you want to keep stats separate.

4. Resend: verify the production sending domain is fully verified (DKIM, SPF, MX, DMARC all green). Test by sending a real email from the Resend Emails page before the first form submission.

5. Run the SQL migration against the production Supabase project (if different from dev). Verify with: `select count(*) from rate_limits;` `select count(*) from contact_submissions;` — both should return 0 with no errors.

6. After deploy, do one real end-to-end test: submit the live form with a real address you can check, verify the email arrives at `CONTACT_NOTIFICATION_EMAIL`, verify the row lands in `contact_submissions`.

7. Set up a recurring cleanup of the `rate_limits` table to prevent indefinite growth. Either:
   - Supabase scheduled function running nightly: `delete from rate_limits where created_at < now() - interval '7 days';`
   - Or a Vercel cron hitting an admin endpoint that runs the same query.

---

## What this doesn't cover

- **Auth forms** (login, signup, password reset). Need account lockout, optional 2FA, audit logs, session security. Separate doc.
- **File upload forms.** Need MIME validation, size limits, virus scanning. Add when first project requires it.
- **Payment forms.** Stripe Elements handles its own protection. Don't roll your own.
- **Multi-step / progressive forms.** State persistence introduces its own attack surface. Treat as a separate design exercise.

---

## Decision log

When the standard changes, log it here.

| Date       | Change                                       | Reason |
|------------|----------------------------------------------|--------|
| 2026-04-30 | Initial standard. Six-layer model. Resend chosen for transactional. | Foundation. |
| 2026-04-30 | Added explicit service_role GRANTs to all migrations. RLS alone insufficient when auto-expose disabled. | Production debugging revealed Postgres rejects at privilege layer before RLS. |

---

## Rollout signal: when to extract a package

This stays a doc until any of the following:

- Five+ projects have copy-pasted `lib/forms/*` unchanged
- A bug fix needs to land in three+ projects simultaneously
- A new layer (e.g. behavioral analytics) is worth standardizing across all live forms

At that point, extract `@vizantir/forms` as a private npm package. Versioning, semver, the whole bit. Until then: copy is cheaper than abstraction.
