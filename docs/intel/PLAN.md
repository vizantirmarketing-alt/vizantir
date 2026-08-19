# Vizantir Intelligence — plan of record

Internal operator dashboard at `/intel`. Written 2026-08-18 from the repository. Claims that could not be confirmed in source are marked **unverified**.

---

## 1. System state

Live surfaces (auth required except login): Overview (decision feed), Search, Leads (+ detail + CSV export). Instrumented public site; GSC + Clarity ingest; daily detectors.

### Instrumentation

| Source | Evidence | Runtime |
|---|---|---|
| GA4 | `GoogleAnalytics` + `ClarityScript` in `app/layout.tsx`. Measurement ID from `NEXT_PUBLIC_GA4_MEASUREMENT_ID` (`lib/env/client.ts`). Scripts no-op when unset. | Property ID `506059011` seeded in `supabase/migrations/0003_provider_coverage.sql`. Measurement ID **G-XHVNEPJH26 is not in source** (build-time env). |
| Clarity tag | Same layout; `NEXT_PUBLIC_CLARITY_PROJECT_ID`. | Project `ure4592vry` in `0003_provider_coverage.sql` (`Tag reinstalled; export API history unrecoverable.`). |
| Vercel Analytics | `<Analytics />` in root layout. Custom events dual-written in `lib/analytics.ts`. | Maps `form_submission` → `lead_form_submit`, `book_strategy_call_intent` → `consultation_click`, plus phone/contact/cta/landing-page events. |
| GA4 Data API | `GA4_PROPERTY_ID` parsed in `lib/env/server.ts` only. | No `lib/ga4/`, no GA4 sync, no GA4 Intel surface. |

Both analytics `NEXT_PUBLIC_` vars are **absent from `.env.local`**. Tags therefore do not load in local dev. Operator policy: Production-only so localhost traffic is not mixed into production properties. **Vercel dashboard targeting is not in the repo.**

### Leads pipeline

`contact_submissions` (created in `0001_form_protection.sql`) is the lead table. Extended in place:

- `0007_contact_notification_status.sql` — `notified_at`, `notify_status` (`sent` \| `failed` \| `not_configured`), `notify_error`
- `0008_leads_pipeline.sql` — attribution (`landing_page`, `referrer`, `utm_*`, `initial_channel`), pipeline `status`, `estimated_value_cents`, `notes`, `updated_at`; `lead_status_history`

Write path: `lib/forms/attribution.ts` (client capture + `initial_channel`) → `lib/forms/contact-submission.ts` (insert + Resend notify + `notify_status`). Intel reads/mutates the same rows (`lib/intel/leads.ts`, `app/intel/(app)/leads/[id]/actions.ts`). CSV at `/intel/leads/export`.

`notify_status` **is** shown per lead (`LeadDeliveryMark` on the list; labels on the detail page). There is no aggregate health view or alert on failed/not_configured.

### GSC sync

`lib/gsc/*`, cron `GET|POST /api/cron/gsc-sync`. Service-account JWT (`webmasters.readonly`), Search Analytics into:

- `gsc_site_daily` — unique `(date)`
- `gsc_query_page_daily` — unique `(date, query, page)`

Daily window: UTC today−5 through today−2 (`lib/gsc/sync.ts`). `?backfill=1` walks month-sized windows down to `BACKFILL_FLOOR = '2025-12-18'`. Migration `0009_gsc_daily.sql` sets `provider_coverage.started_on = '2025-12-18'` for `gsc`.

**242-day figure:** inclusive span `2025-12-18` … `2026-08-16` (today−2 on 2026-08-18) is 242 days. That is the intended completed window if backfill reached the floor. Row counts in Postgres are **not in the repo**.

### Decision feed

Overview (`app/intel/(app)/page.tsx`) renders `decision_items` via `lib/intel/decisions/feed.ts`. Hidden statuses: `completed`, `dismissed`. Ranked by `score * exp(-days_since_created / 14)`.

Three detectors (`lib/intel/decisions/detectors/index.ts`):

| Detector | Emits when | Category |
|---|---|---|
| `buried-demand` | Query-group impressions ≥ 100, impression-weighted position > 40, CTR < 0.5% | opportunity |
| `within-reach` | Per-query impressions ≥ 8, position ≤ 30, and (0 clicks or CTR < 1%) | opportunity |
| `geo-signal` | Non-focus geo term, combined impressions ≥ 15 | opportunity |

Seeded groups in `0010_decision_feed.sql`: wordpress-security, law-firm, cre, platform-compare, brand, vegas-web-design.

Cron `runDecisionDetectors()` does **not** write `sync_runs`.

### Crons (`vercel.json`)

| Path | Schedule | Code |
|---|---|---|
| `/api/cron/clarity-sync` | `0 9 * * *` | `syncClarity()` |
| `/api/cron/gsc-sync` | `30 9 * * *` | `syncGsc()` |
| `/api/cron/decisions` | `0 10 * * *` | `runDecisionDetectors()` |

Vercel Cron is UTC; `vercel.json` does not restate the timezone. All three routes require `Authorization: Bearer ${CRON_SECRET}` (timing-safe). Clarity and GSC persist a `sync_runs` row (`running` → `success` \| `partial` \| `failed`).

### Intel auth

Magic link (`shouldCreateUser: false`) → `/intel/auth/callback`. Allowlist: `INTEL_ALLOWED_EMAILS`, default `vizantirmarketing@gmail.com` (`lib/auth/allowlist.ts`). `/intel` is `noindex` and disallowed in `app/robots.ts`.

---

## 2. Architecture decisions

**/intel, not /studio.** Sanity Studio is a catch-all at `app/studio/[[...tool]]/page.tsx` (`basePath: '/studio'`). `/intel` is a separate App Router tree.

**Auth in the `(app)` layout + `requireIntelUser()` on every mutation; no `middleware.ts`.** Protected UI lives under `app/intel/(app)/layout.tsx`. Login is `(auth)/login`. `/intel/leads/export` is **outside** `(app)`, so the layout does not wrap it — the route calls `requireIntelUser()` itself. Mutations: `updateDecisionStatus`, `updateLeadStatus`, `updateLeadValue`, `updateLeadNotes`. No `middleware.ts` exists in the repo.

**`contact_submissions` extended in place.** No parallel `leads` table. History FKs `contact_submissions(id)`.

**Clarity rows are 3-day windows.** Export client types `numOfDays: 1 \| 2 \| 3`; sync always sends `3`. `0005_clarity_window_days.sql` puts `window_days` in `clarity_metric_daily_slice_key`. Rows are stored as one slice dated UTC yesterday, not exploded into three daily rows. Operator reason (not commented in code): the export API cannot produce single-day multi-dimension rows. Dimension sets: `URL`; `Device, Browser`; `Source, Medium, Campaign`.

**`provider_coverage` gates comparisons.** Search (`lib/intel/search.ts`): if `prior.start < coverage.started_on` (or coverage missing), comparison is `{ available: false }` — UI shows “Prior period unavailable”, movers omitted. Detectors receive `comparisonAvailable`; `needsComparison` detectors are skipped. **No current detector sets `needsComparison`.** Crossing a coverage boundary is never computed.

**Detectors are pure functions** over `DetectorInput` (`detect(input): Finding[]`). No I/O inside detectors. `emissionKeyFor(id, periodEnd)` → `{id}:{periodEnd}` — keyed to finding + window end, not run date. Persist path inserts new keys; existing keys update only `score`, `evidence_json`, `description`, `updated_at`. `status`, `result_note`, `completed_at` are never overwritten by the runner.

**Percentages suppressed below a meaningful base.** `MEANINGFUL_COMPARISON_BASE = 10` in `lib/intel/format-change.ts`. Search summary + trend chart use it. `percentChangeFromPrior` wraps the same rule; no detector currently calls it. Decision cards do not render percents.

**Impression-weighted aggregation.** CTR = `sum(clicks) / sum(impressions)`. Position = `sum(position * impressions) / sum(impressions)`. Comment in `lib/intel/search.ts`: daily averages are never averaged together. Same weighting in `lib/intel/decisions/grouping.ts`.

---

## 3. Environment variables

`NEXT_PUBLIC_*` values are read via static `process.env.*` keys in `lib/env/client.ts` so Next.js inlines them at **build** time. Changing them requires a redeploy, not just a runtime env edit.

Vercel environment checkboxes are **not in the repo**. `.env.local` presence below is from key names only (2026-08-18). Operator policy: the two analytics `NEXT_PUBLIC_` vars are Production-only.

| Name | Where used | `.env.example` | `.env.local` | Vercel (repo-evident) |
|---|---|---|---|---|
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | `lib/env/client.ts`, `GoogleAnalytics` | no | no | **Unverified.** Operator: Production only. |
| `NEXT_PUBLIC_CLARITY_PROJECT_ID` | `lib/env/client.ts`, `ClarityScript` | no | no | **Unverified.** Operator: Production only. |
| `GA4_PROPERTY_ID` | `lib/env/server.ts` only (unused beyond parse) | no | yes | **Unverified.** |
| `GSC_SITE_URL` | `lib/gsc/client.ts`, `lib/gsc/sync.ts` | no | yes | **Unverified.** Coverage seed uses `https://www.vizantir.com/`. |
| `GSC_SERVICE_ACCOUNT_KEY` | `lib/gsc/auth.ts` (base64 JSON) | no | yes | **Unverified.** |
| `CLARITY_API_TOKEN` | `lib/clarity/client.ts` | no | yes | **Unverified.** |
| `INTEL_ALLOWED_EMAILS` | `lib/auth/allowlist.ts` | yes (`vizantirmarketing@gmail.com`) | yes | **Unverified.** |
| `CRON_SECRET` | `app/api/cron/{clarity-sync,gsc-sync,decisions}` | no | yes | Required wherever Vercel Cron runs (Production). |
| `NEXT_PUBLIC_SUPABASE_URL` | supabase server/browser/service clients | yes | yes | Required for Intel + forms. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | server + browser supabase (auth cookies) | yes | yes | Required for Intel login. |
| `SUPABASE_SERVICE_ROLE_KEY` | `lib/supabase/service.ts` (all Intel data + ingest) | yes | yes | Required. |
| `CONTACT_NOTIFICATION_EMAIL` | `lib/forms/contact-submission.ts` | yes | no | Required for `notify_status=sent`. |
| `RESEND_API_KEY` | same | yes | no | same |
| `RESEND_FROM_EMAIL` | same | yes | no | same |
| `RATE_LIMIT_SALT` | `lib/forms/rate-limit.ts` | yes | yes | Forms, not the Intel UI. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `TurnstileWidget` | yes | yes | Forms. Local uses test keys (operator). |
| `TURNSTILE_SECRET_KEY` | `lib/forms/turnstile.ts` | yes | yes | Forms. |

`.env.example` does not list the GA4/Clarity/GSC/cron Intel vars.

---

## 4. Operational notes

**Clarity export API.** Client allows 1–3 day windows; sync uses 3. Three requests per run. **10 req/day quota is not encoded** — operator/API constraint. Missed days are unrecoverable (`0003` note). `clarity_metric_daily` is written by sync only; no Intel UI reads it.

**GSC lag.** Daily sync covers 5-to-2-days-ago UTC. Data-through date stored on the run is today−2. 2–3 day publishing lag is implied by that window, not commented.

**Migrations.** SQL files live in `supabase/migrations/` (`0001`–`0010`). No `supabase/config.toml`, no package.json migrate script, no CLI runner. Apply by pasting into the Supabase SQL editor. `0006_service_role_grants.sql` plus per-table grants on later migrations.

**Never run `vercel env pull .env.local`.** It overwrites the local file. Local-only values (Turnstile test keys, `RATE_LIMIT_SALT`, `CRON_SECRET`, and anything else not meant to match Production) would be destroyed. This contradicts the generic `.cursorrules` sync instruction; this document is the Intel-specific rule.

**`sync_runs`.** Written by Clarity and GSC sync only. Nothing in `app/intel` or elsewhere reads it. Decisions cron does not record a run.

---

## 5. Open risks

- **Lint:** `pnpm lint` → `33 errors, 18 warnings` (2026-08-18). Zero findings under `lib/intel`, `lib/gsc`, `lib/clarity`, `app/intel`, `app/api/cron`. “Predating this work” is consistent with that split; git history was not inspected (repo rule: no git).
- **Tests:** no `test` script, no `*.test.*` / `*.spec.*`, no vitest/jest/playwright in the tree.
- **Sync failure alerting:** `sync_runs` records `status` / `error_code` / `administrator_message`. Nothing consumes it.
- **`notify_status`:** recorded and shown per lead; no site-wide failed-delivery surface.
- **Law-firm overlap:** `law-firm` group can emit `buried-demand`; `geo-signal` can emit on the same query set if a non-focus geo term matches. No shared identity or relation table. Dedup deferred.

---

## 6. Deferred (not in the repo)

Negative evidence only — none of these have code, routes, or tables beyond unused hooks:

- **GA4 Intel surfaces** — wait for ~28 days of tagged data. Coverage `started_on` for `ga4` is `current_date` at migration apply, not a hardcoded install day. Mid-September 2026 is calendar arithmetic from an ~mid-August 2026 install, **not encoded**.
- **Behavior / friction surface** — Clarity data is ingested, not displayed.
- **Change impact**
- **Migration equity vault**
- **Opportunity queue as a separate surface** — `opportunity` is a feed category, not its own page.
- **Monthly reports**
- **Multi-tenant anything** — single allowlist, single GSC site, single Clarity project.

`GA4_PROPERTY_ID` and `needsComparison` are the only forward hooks already in code.

---

## 7. Next steps (order)

1. Confirm the first unattended cron sequence in `sync_runs` (Clarity 09:00 → GSC 09:30) and that 10:00 decisions produced `decision_items`. Decisions leave no `sync_runs` row — check `decision_items.created_at` / cron logs.
2. In GA4, mark `lead_form_submit` and `consultation_click` as key events if not already. Code already sends those names (`lib/analytics.ts`). Console config is **unverified**.
3. GA4 event audit, then Stage 4 (GA4 surfaces) once the property has a meaningful window. “Stage 4” is not a name in the repo.
4. Overview metric cards. Overview is feed-only today; Search already has click/impression/CTR/position cards.
5. Site health surface that reads `sync_runs` and aggregates `notify_status`.

---

## Verification notes

| Claim | Status |
|---|---|
| GA4 measurement ID `G-XHVNEPJH26` | **Unverified in source.** Property `506059011` is in `0003`. |
| Clarity `ure4592vry` | Verified (`0003`). |
| 242-day GSC backfill from `2025-12-18` | Floor + date math verified. Database completeness **unverified**. |
| Cron 09:00 / 09:30 / 10:00 UTC | Schedules verified. UTC is Vercel platform default, not in `vercel.json`. |
| No `middleware.ts` | Verified. |
| Lint 33 / 18 | Verified `pnpm lint` 2026-08-18. |
| Clarity 10 req/day | **Unverified in code.** |
| Vercel env environment matrix | **Unverified.** `.env.local` key presence verified. |
| Production-only analytics tags | Consistent with missing local `NEXT_PUBLIC_*` analytics keys; dashboard **unverified**. |
| First unattended cron success | **Unverified** (needs `sync_runs`). |
| GA4 key events configured | **Unverified** (GA4 console). |
