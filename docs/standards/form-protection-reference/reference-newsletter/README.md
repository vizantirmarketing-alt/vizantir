# Newsletter Reference Implementation

Canonical example of a fully-protected newsletter signup form. All five applicable layers wired end-to-end.

## What's here

```
reference-newsletter/
├── app/
│   ├── api/
│   │   └── newsletter/
│   │       ├── subscribe/
│   │       │   └── route.ts          # POST: handle signup
│   │       └── confirm/
│   │           └── route.ts          # GET: handle confirm link click
│   ├── newsletter/
│   │   ├── confirmed/page.tsx        # Success page
│   │   ├── expired/page.tsx          # Token expired page
│   │   └── error/page.tsx            # Invalid token / generic error
│   └── (example)/
│       └── page.tsx                  # Demo page using the form
├── components/
│   └── forms/
│       ├── Honeypot.tsx              # Layer 1
│       ├── TurnstileWidget.tsx       # Layer 2 (client widget)
│       └── NewsletterForm.tsx        # The form itself
├── lib/
│   ├── forms/
│   │   ├── turnstile.ts              # Layer 2 (server verify)
│   │   ├── rate-limit.ts             # Layer 3
│   │   ├── email-validation.ts       # Layer 4
│   │   └── newsletter-confirm.ts     # Layer 5
│   └── supabase/
│       ├── anon.ts
│       └── service.ts
├── supabase/
│   └── migrations/
│       └── 0001_form_protection.sql  # Tables + RLS
└── .env.example
```

## How to drop into a project

1. Copy `lib/`, `components/forms/`, and `app/api/newsletter/` into the target project.
2. Run the SQL migration in Supabase.
3. Fill `.env.local` from `.env.example`.
4. Use `<NewsletterForm />` anywhere in the app.

## Order of operations on submit

```
client                          server
------                          ------
NewsletterForm
  ↓
Solve Turnstile (widget)
  ↓
POST /api/newsletter/subscribe → 1. Honeypot check (silent success if filled)
  with { email, token, website } → 2. Zod parse
                                 → 3. Verify Turnstile token
                                 → 4. Rate limit (IP hash, 3/hr)
                                 → 5. Disposable email check
                                 → 6. Upsert pending row + token
                                 → 7. Send confirmation email via Resend
                                 ← 200 { ok: true }
  ↓
"Check your email" UI

(later, user opens email)
  ↓
Click confirm link → GET /api/newsletter/confirm?token=...
                                → 1. Look up token
                                → 2. Check expiry
                                → 3. Flip status to 'confirmed'
                                → 302 redirect to /newsletter/confirmed
```

Note: every failure path before sending the email returns the same response shape (`{ ok: true }`) for honeypot/disposable. This keeps the form indistinguishable to bots — they can't probe to learn what triggered a rejection. Only Turnstile failures and rate limits return errors, because those are user-correctable in the legitimate case.
