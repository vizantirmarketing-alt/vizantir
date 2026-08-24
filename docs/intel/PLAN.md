# Vizantir Intelligence — plan of record

Internal operator dashboard at `/intel`. Written 2026-08-18 from the repository. Updated 2026-08-23 from production and the database. Claims that could not be confirmed in source are marked **unverified**.

---

## 1. System state

Live surfaces (auth required except login): Overview (28-day stat strip + AI platforms + activity feed + decision feed), Search, Leads (+ detail + CSV export). Instrumented public site; GSC + GA4 + Clarity ingest; daily detectors. Shared dashboard primitives live in `app/intel/_components/ui/`.

### Instrumentation

| Source | Evidence | Runtime |
|---|---|---|
| GA4 | `GoogleAnalytics` + `ClarityScript` in `app/layout.tsx`. Measurement ID from `NEXT_PUBLIC_GA4_MEASUREMENT_ID` (`lib/env/client.ts`). Scripts no-op when unset. | Property ID `506059011` seeded in `supabase/migrations/0003_provider_coverage.sql`. Measurement ID **G-XHVNEPJH26 is not in source** (build-time env). |
| Clarity tag | Same layout; `NEXT_PUBLIC_CLARITY_PROJECT_ID`. | Project `ure4592vry` in `0003_provider_coverage.sql` (`Tag reinstalled; export API history unrecoverable.`). |
| Vercel Analytics | `<Analytics />` in root layout. Custom events dual-written in `lib/analytics.ts`. | Maps `form_submission` → `lead_form_submit`, `book_strategy_call_intent` → `consultation_click`, plus phone/contact/cta/landing-page events. |
| GA4 Data API | `GA4_PROPERTY_ID` in `lib/env/server.ts`. Client + sync in `lib/ga4/`. Cron `GET\|POST /api/cron/ga4-sync`. | Writes `ga4_daily` + a `sync_runs` success row. Activity feed reads yesterday's `ga4_daily` users. No dedicated GA4 Intel page. |

Both analytics `NEXT_PUBLIC_` vars are **absent from `.env.local`**. Tags therefore do not load in local dev. Operator policy: Production-only so localhost traffic is not mixed into production properties. **Vercel dashboard targeting is not in the repo.**

### Leads pipeline

`contact_submissions` (created in `0001_form_protection.sql`) is the lead table. Extended in place:

- `0007_contact_notification_status.sql` — `notified_at`, `notify_status` (`sent` \| `failed` \| `not_configured`), `notify_error`
- `0008_leads_pipeline.sql` — attribution (`landing_page`, `referrer`, `utm_*`, `initial_channel`), pipeline `status`, `estimated_value_cents`, `notes`, `updated_at`; `lead_status_history`

Write path: `lib/forms/attribution.ts` (client capture + `initial_channel`) → `lib/forms/contact-submission.ts` (insert + Resend notify + `notify_status`). Intel reads/mutates the same rows (`lib/intel/leads.ts`, `app/intel/(app)/leads/[id]/actions.ts`). CSV at `/intel/leads/export`.

`notify_status` **is** shown per lead (`LeadDeliveryMark` on the list; labels on the detail page). The Leads page also shows an aggregate **Delivery issues** count on `LeadsStatStrip` (`fetchLeadDashboardStats` → `notify_status` in `failed` \| `not_configured`). There is no alert, no `sync_runs` health surface, and Overview does not show this count.

Lead status update + status history insert are two sequential writes with a manual revert, not atomic. Should be one Postgres function via `rpc()`.

### GSC sync

`lib/gsc/*`, cron `GET|POST /api/cron/gsc-sync`. Service-account JWT (`webmasters.readonly`), Search Analytics into:

- `gsc_site_daily` — unique `(date)`
- `gsc_query_page_daily` — unique `(date, query, page)`

Daily window: UTC today−5 through today−2 (`lib/gsc/sync.ts`). `?backfill=1` walks month-sized windows down to `BACKFILL_FLOOR = '2025-12-18'`. Migration `0009_gsc_daily.sql` sets `provider_coverage.started_on = '2025-12-18'` for `gsc`.

**242-day figure:** inclusive span `2025-12-18` … `2026-08-16` (today−2 on 2026-08-18) is 242 days. That is the intended completed window if backfill reached the floor. Row counts in Postgres are **not in the repo**. Ingest was frozen at Aug 16 until the Aug 21 service-account key fix; the completed-day window then began advancing again.

The 5-to-2-days-ago window can store an unfinalized day as clicks 0 / impressions 0. Observed 2026-08-23: the 09:30 UTC cron stored 2026-08-21 as zeros; a re-query of the same window hours later returned 61 impressions. The stored data is correct as ingested. Display now caps at today−3 UTC (see Architecture).

### Decision feed

Overview (`app/intel/(app)/page.tsx`) renders a 28-day `OverviewStatStrip`, then AI platforms, the activity feed, then `decision_items` via `lib/intel/decisions/feed.ts`. Hidden statuses: `completed`, `dismissed` — read from `finding_state`, not from `decision_items`. Ranked by `score * exp(-days_since_created / 14)` (`DECISION_NOVELTY_TAU_DAYS`). Cards show a one-line triage fact from `formatHeadlineFact` (impressions ± position; no percents).

Strip metrics (null → em dash):

| Card | Source | Window |
|---|---|---|
| Findings needing attention | Count of feed items with `status === 'new'` | Current feed (hidden statuses already excluded) |
| Leads this 28 days | `fetchLeadDailySeriesInLastDays(28)` | Rolling `created_at >= now − 28d`, plus a daily sparkline |
| Clicks 28d / Impressions 28d | `fetchSiteRangeTotals('28d')` | GSC site-daily span ending on latest **complete** day (today−3 UTC; same helper as Search) |

Three detectors (`lib/intel/decisions/detectors/index.ts`):

| Detector | Emits when | Category |
|---|---|---|
| `buried-demand` | Query-group impressions ≥ 100, impression-weighted position > 40, CTR < 0.5% | opportunity |
| `within-reach` | Per-query impressions ≥ 8, position ≤ 30, and (0 clicks or CTR < 1%) | opportunity |
| `geo-signal` | Non-focus geo term, combined impressions ≥ 15 | opportunity |

Seeded groups in `0010_decision_feed.sql`: wordpress-security, law-firm, cre, platform-compare, brand, vegas-web-design.

Cron `runDecisionDetectors()` does **not** write `sync_runs`. Its runs are observable only via `decision_items` timestamps and the HTTP response. That is an open instrumentation gap. The unattended-cron success criterion was never “four green rows in `sync_runs`” — that was never achievable.

### Crons (`vercel.json`)

| Path | Schedule | Code |
|---|---|---|
| `/api/cron/clarity-sync` | `0 9 * * *` | `syncClarity()` |
| `/api/cron/ga4-sync` | `15 9 * * *` | `syncGa4()` |
| `/api/cron/gsc-sync` | `30 9 * * *` | `syncGsc()` |
| `/api/cron/decisions` | `0 10 * * *` | `runDecisionDetectors()` |

Vercel Cron is UTC; `vercel.json` does not restate the timezone. All four routes require `Authorization: Bearer ${CRON_SECRET}` (timing-safe). Verified `sync_runs` writers: GSC and GA4 write success rows; Clarity writes success / partial / failed; decisions writes nothing.

### Intel auth

Magic link (`shouldCreateUser: false`) → `/intel/auth/callback`. Allowlist: `INTEL_ALLOWED_EMAILS`, default `vizantirmarketing@gmail.com` (`lib/auth/allowlist.ts`). `/intel` is `noindex` and disallowed in `app/robots.ts`.

Magic-link sign-in fails when a stale Supabase refresh token is present (`refresh_token_not_found`). The callback’s `exchangeCodeForSession` fails against the poisoned session and redirects to `/intel/login?error=auth`. Workaround: visit `/intel/auth/signout` and clear vizantir.com cookies. **Not fixed** — the callback should clear any existing session before exchanging.

`app/intel/auth/callback/route.ts` logs each of its four failure branches with an `Intel auth callback:` prefix, greppable in Vercel logs. Previously all four collapsed to a generic redirect with no logging.

---

## 2. Architecture decisions

**/intel, not /studio.** Sanity Studio is a catch-all at `app/studio/[[...tool]]/page.tsx` (`basePath: '/studio'`). `/intel` is a separate App Router tree.

**Auth in the `(app)` layout + `requireIntelUser()` on every mutation; no `middleware.ts`.** Protected UI lives under `app/intel/(app)/layout.tsx`. Login is `(auth)/login`. `/intel/leads/export` is **outside** `(app)`, so the layout does not wrap it — the route calls `requireIntelUser()` itself. Mutations: `updateDecisionStatus`, `updateLeadStatus`, `updateLeadValue`, `updateLeadNotes`. No `middleware.ts` exists in the repo.

The build output line `ƒ Proxy (Middleware)` is `proxy.ts` at the repo root (Next 16’s middleware successor). Its matcher is `/` only and it strips `page_id` on the homepage. It does **not** protect `/intel`. Auth remains layout + `requireIntelUser()`.

**`contact_submissions` extended in place.** No parallel `leads` table. History FKs `contact_submissions(id)`.

**Clarity rows are 3-day windows.** Export client types `numOfDays: 1 \| 2 \| 3`; sync always sends `3`. `0005_clarity_window_days.sql` puts `window_days` in `clarity_metric_daily_slice_key`. Rows are stored as one slice dated UTC yesterday, not exploded into three daily rows. Operator reason (not commented in code): the export API cannot produce single-day multi-dimension rows. Dimension sets: `URL`; `Device, Browser`; `Source, Medium, Campaign`.

Two failure modes were conflated and must be kept separate. (1) Quota exhaustion is real but transient and only occurs after manual runs. (2) A separate persistent failure affects two dimension sets — URL, and Source/Medium/Campaign — which fail in **every** run including quota-healthy ones, and have never written a row. Ruled out: table schema, the unique index (`clarity_metric_daily_slice_key` covers date, window_days, metric_name, and all three dim name/value pairs), and service_role grants (INSERT/UPDATE/SELECT all true). The failures are at the upsert or exception path, not the Clarity API — a third dimension set (`Device, Browser`) succeeds every run with the same credentials. The 09:00 UTC cron on 2026-08-24 is the first run with annotated failure paths (`upsert_error` vs `exception`). Do not trigger manually — 10 calls/day, sync uses 3.

**`provider_coverage` gates comparisons.** Search (`lib/intel/search.ts`): if `prior.start < coverage.started_on` (or coverage missing), comparison is `{ available: false }` — UI shows “Prior period unavailable”, movers omitted. Detectors receive `comparisonAvailable`; `needsComparison` detectors are skipped. **No current detector sets `needsComparison`.** Crossing a coverage boundary is never computed.

**Detectors are pure functions** over `DetectorInput` (`detect(input): Finding[]`). No I/O inside detectors. `emissionKeyFor(id, periodEnd)` → `{id}:{periodEnd}` — the per-window observation key and upsert target, not identity.

**Finding identity is separate from emission windows.** `decision_items.finding_key` (`{detector}:{stable_id}`, no date) is identity. `emission_key` remains the per-window observation key. Operator state (`status`, `result_note`, `completed_at`) lives ONLY in `finding_state`, keyed by `finding_key`. Persist path: ensure a `finding_state` row, then insert new emission keys or update existing ones (`score`, `evidence_json`, `description`, `updated_at` only). `decision_items.status` / `result_note` / `completed_at` still exist but are **dead columns** — nothing reads or writes them, they stay `'new'` forever, and querying them by hand in the SQL editor will mislead. Migration: `supabase/migrations/0014_finding_identity_state.sql`.

This used to be wrong the other way: `emission_key` was treated as identity, so every advance of the GSC completed-day window minted a duplicate row and reset operator triage to `'new'`. Dormant while GSC was frozen at Aug 16; activated by the Aug 21 service-account key fix.

**Display path uses the completed-day rule.** `latestCompleteDay()` in `lib/intel/search-params.ts` caps display at today−3 UTC. today−2 is the sync window’s trailing edge and is frequently unfinalized when the 09:30 UTC cron fires. Detectors already had this rule (`completedPeriodEnd` in `lib/intel/decisions/run.ts`); the display path now shares it. Ingest is unchanged — no rows are filtered or deleted.

**Failed queries render distinctly from empty results.** Across Overview GSC cards, the activity feed, the AI platforms panel, the decision feed, and the Search series, a failed query and an empty result used to render identically. Data functions now return discriminated unions; panels render loaded / empty / failed, with a Retry (`PanelRetry`) that calls `router.refresh()`. Missing GSC days in the series are null and skipped rather than plotted at zero.

Tradeoff: `fetchActivity` fails the WHOLE panel if any one of its seven sources fails. Deliberate — a partial chronological feed hides what is missing — but one flaky query takes down a panel that would otherwise be mostly useful. The logging is generic (`Intel activity query failed`) from all seven call sites, so a failure does not name its source.

**Percentages suppressed below a meaningful base.** `MEANINGFUL_COMPARISON_BASE = 10` in `lib/intel/format-change.ts`. Search summary + trend chart use it. `percentChangeFromPrior` wraps the same rule; no detector currently calls it. Decision cards do not render percents.

**Impression-weighted aggregation.** CTR = `sum(clicks) / sum(impressions)`. Position = `sum(position * impressions) / sum(impressions)`. Comment in `lib/intel/search.ts`: daily averages are never averaged together. Same weighting in `lib/intel/decisions/grouping.ts`.

**Dashboard density and color.** Intel surfaces compose five primitives in `app/intel/_components/ui/` rather than ad-hoc cards. Density is in class names, not a named token: page stacks `gap-4`; titles `text-base font-semibold tracking-tight`; panel/kicker labels `text-[0.7rem]` uppercase tracked meta; chips `text-[0.65rem]`; MetricCard `px-3 py-2`; Panel `px-4 py-3 md:px-5 md:py-4`; shell main `max-w-[1200px]`.

| Primitive | Role |
|---|---|
| `Panel` | White section (`rounded-xl border border-black/8`). Optional title + `headerAction`. Optional 3px left accent: `warning-severe` \| `cobalt` \| `positive` \| `neutral`. |
| `StatStrip` | Responsive 1 / 2 / 4-col grid (`gap-3`) for MetricCards. |
| `MetricCard` | Compact KPI: meta label, `text-2xl tabular-nums` value, optional delta chip, Sparkline, context line (`meta` \| `warning` \| `warning-severe`). |
| `Sparkline` | Polyline default 120×36. Stroke is always `stroke-cobalt-primary/40` — not judgment-colored. |
| `StatusChip` | Internal. Exported as `DecisionStatusChip`, `LeadStatusChip`, `ConfidenceChip`. Tones: `new` (cobalt), `active`, `success` (positive), `muted`. |

Semantic tokens in `app/globals.css` (`:root` + `@theme inline`):

| Token | Encoded use |
|---|---|
| `--positive` / `--positive-soft` | Improvement or completion only. CSS comment: `Intel semantic color — improvement / completion only for --positive`. |
| `--cobalt-soft` | New / selected wash (Intel nav active, StatusChip `new`). |
| `--warning-soft` / `--warning-severe-soft` | Caution / severe fills. `--warning` / `--warning-severe` remain the text colors. |

Green is not a generic “good” or “on” color. In code:

- **MetricCard deltas.** `deltaTone`: improved → positive, declined → warning, flat → neutral. Improvement respects `lowerIsBetter` (Search average position). Search clicks / impressions / CTR treat up as improved.
- **StatusChip `success`.** Decision `completed`; lead `won`. `new` is cobalt. Dismissed / lost / not_qualified / spam are muted.
- **`LeadDeliveryMark`.** `sent` is muted, not green. `failed` → warning-severe; `not_configured` → warning.
- **Panel `positive` accent.** Working feed section left border (`CATEGORY_ACCENT.working`). Needs-attention uses `warning-severe`; opportunity `cobalt`; system `neutral`.

Leads Delivery issues card: `contextTone="warning"` and copy “Failed or not configured” when the count is > 0; no green.

---

## 3. Environment variables

`NEXT_PUBLIC_*` values are read via static `process.env.*` keys in `lib/env/client.ts` so Next.js inlines them at **build** time. Changing them requires a redeploy, not just a runtime env edit.

Vercel environment checkboxes are **not in the repo**. `.env.local` presence below is from key names only (2026-08-18). Operator policy: the two analytics `NEXT_PUBLIC_` vars are Production-only.

| Name | Where used | `.env.example` | `.env.local` | Vercel (repo-evident) |
|---|---|---|---|---|
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | `lib/env/client.ts`, `GoogleAnalytics` | no | no | **Unverified.** Operator: Production only. |
| `NEXT_PUBLIC_CLARITY_PROJECT_ID` | `lib/env/client.ts`, `ClarityScript` | no | no | **Unverified.** Operator: Production only. |
| `GA4_PROPERTY_ID` | `lib/env/server.ts`, `lib/ga4/sync.ts` | no | yes | **Unverified.** |
| `GSC_SITE_URL` | `lib/gsc/client.ts`, `lib/gsc/sync.ts` | no | yes | **Unverified.** Coverage seed uses `https://www.vizantir.com/`. |
| `GSC_SERVICE_ACCOUNT_KEY` | `lib/gsc/auth.ts` (base64 JSON). GSC: `webmasters.readonly`. GA4: `analytics.readonly`. | no | yes | **Unverified.** |
| `CLARITY_API_TOKEN` | `lib/clarity/client.ts` | no | yes | **Unverified.** |
| `INTEL_ALLOWED_EMAILS` | `lib/auth/allowlist.ts` | yes (`vizantirmarketing@gmail.com`) | yes | **Unverified.** |
| `CRON_SECRET` | `app/api/cron/{clarity-sync,ga4-sync,gsc-sync,decisions}` | no | yes | Required wherever Vercel Cron runs (Production). |
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

`SANITY_WEBHOOK_SECRET` is dead — the live webhook reads `SANITY_REVALIDATE_SECRET`. `SANITY_API_WRITE_TOKEN` is used only by `scripts/`, not at runtime.

---

## 4. Operational notes

**Clarity export API.** Client allows 1–3 day windows; sync uses 3. Three requests per run. **10 req/day quota is not encoded** — operator/API constraint. Missed days are unrecoverable (`0003` note). `clarity_metric_daily` is written by sync only; no Intel UI reads it. Fixing the pipeline has no payoff until the deferred behavior/friction surface exists.

Do not trigger Clarity manually. Quota exhaustion is transient and only occurs after manual runs. The persistent URL and Source/Medium/Campaign failures are a separate, non-quota problem (see Architecture). Wait for the 09:00 UTC cron on 2026-08-24 to name `upsert_error` vs `exception`.

**GSC lag.** Daily sync covers 5-to-2-days-ago UTC. Data-through date stored on the run is today−2. 2–3 day publishing lag is implied by that window, not commented. Display caps at today−3 UTC so an unfinalized trailing edge is not plotted as a real zero.

**Migrations.** SQL files live in `supabase/migrations/` (`0001`–`0014`). No `supabase/config.toml`, no package.json migrate script, no CLI runner. Apply by pasting into the Supabase SQL editor. `0006_service_role_grants.sql` plus per-table grants on later migrations.

Handoff rule 7 (file in repo AND applied in the SQL editor) was violated twice, opposite ways, and both stayed silent for days:

- `0014_finding_identity_state.sql` was applied to the database but the file was never created in the repo. A DB rebuilt from migrations could not run the current code. File now exists.
- `0012_intel_events.sql` existed in the repo but was never applied. `public.intel_events` did not exist. `fetchRecordedEvents` had been failing silently since the file was written, returning `[]` — invisible until the error-state work surfaced it as a hard panel failure. Applied 2026-08-23.

Standing check: after any migration, verify the table exists in the database AND the file exists in the repo.

**Never run `vercel env pull .env.local`.** It overwrites the local file. Local-only values (Turnstile test keys, `RATE_LIMIT_SALT`, `CRON_SECRET`, and anything else not meant to match Production) would be destroyed. This contradicts the generic `.cursorrules` sync instruction; this document is the Intel-specific rule.

**`sync_runs`.** Written by Clarity, GSC, and GA4 sync. Nothing dedicated in `app/intel` consumes it as a health surface; the activity feed reads recent rows as events. Decisions cron does not record a run. Do not treat “four green `sync_runs` rows” as the unattended-cron success criterion — decisions has never written one.

**Undocumented tables.** `public` also contains `bot_hits`, `bot_ip_ranges`, `daily_rollups`, `deploys`, `events`, and `submissions`. None are created by any migration in `supabase/migrations/` and none are referenced by intel code. Origin is not in this repo. `submissions` and `events` are confusingly close to the live `contact_submissions` and `intel_events` and could be queried by mistake.

**Cursor claims are not evidence.** Self-reported “tsc and build passed” was wrong twice on 2026-08-23. One report claimed both passed while a missing export broke the Vercel build. Treat Vercel or a local `pnpm run build` as the authoritative result.

**Review the actual diff.** Cursor has twice modified files outside the stated scope and not reported them. Always run `git status` and review diffs before staging. Never `git add` broadly.

**Do not commit while Cursor is still writing.** Committing a mid-edit snapshot happened once and broke the production build.

---

## 5. Open risks

- **Lint:** `pnpm lint` → `33 errors, 18 warnings` (2026-08-18, before this dashboard pass). Zero findings under `lib/intel`, `lib/gsc`, `lib/clarity`, `app/intel`, `app/api/cron` at that run. **Not re-run** after `app/intel/_components/ui/` and the Overview/Leads strips. Git history was not inspected (repo rule: no git).
- **Tests:** no `test` script, no `*.test.*` / `*.spec.*`, no vitest/jest/playwright in the tree.
- **Sync failure alerting:** `sync_runs` records `status` / `error_code` / `administrator_message`. The activity feed shows recent rows; there is still no health surface or alert.
- **`notify_status`:** recorded, shown per lead, and aggregated as **Delivery issues** on the Leads stat strip (`failed` + `not_configured`). No alert, no Overview card, no dedicated health page.
- **Law-firm overlap:** `law-firm` group can emit `buried-demand`; `geo-signal` can emit on the same query set if a non-focus geo term matches. No shared identity or relation table. Dedup deferred.
- **Dead columns:** `decision_items.status` / `result_note` / `completed_at` will stay `'new'` forever. Querying them by hand misleads.
- **Activity fail-closed:** one of seven `fetchActivity` sources failing takes down the whole panel. Logs do not name the source.

---

## 6. Deferred (not in the repo)

Negative evidence only — none of these have code, routes, or tables beyond unused hooks:

- **GA4 Intel surfaces** — wait for ~28 days of tagged data. Coverage `started_on` for `ga4` is `current_date` at migration apply, not a hardcoded install day. Mid-September 2026 is calendar arithmetic from an ~mid-August 2026 install, **not encoded**. Ingest and the activity-feed visitor line exist; there is still no GA4 page.
- **Behavior / friction surface** — Clarity data is ingested, not displayed. No `/intel` surface consumes `clarity_metric_daily`.
- **Change impact**
- **Migration equity vault**
- **Opportunity queue as a separate surface** — `opportunity` is a feed category, not its own page.
- **Monthly reports**
- **Multi-tenant anything** — single allowlist, single GSC site, single Clarity project.

`GA4_PROPERTY_ID` and `needsComparison` are the only forward hooks already in code.

---

## 7. Next steps (order)

1. **Clarity persistent dimension-set failures.** URL and Source/Medium/Campaign fail in every run for a non-API, non-schema, non-grant reason. The 09:00 UTC cron on 2026-08-24 is the first run with annotated failure paths and will name `upsert_error` vs `exception`. Do not trigger manually — 10 calls/day, sync uses 3.
2. **Decisions cron does not write to `sync_runs`.** Runs are observable only via `decision_items` timestamps and the HTTP response.
3. **Lead status update + history insert** are two sequential writes with a manual revert, not atomic. Should be one Postgres function via `rpc()`.
4. **Auth callback** should clear an existing session before `exchangeCodeForSession`. Stale refresh tokens currently poison magic-link sign-in (`refresh_token_not_found` → `/intel/login?error=auth`). Workaround: `/intel/auth/signout` and clear vizantir.com cookies.
5. **Clarity is ingested and read by nothing.** No `/intel` surface consumes `clarity_metric_daily`. Fixing the pipeline has no payoff until the deferred behavior/friction surface exists.
6. **Remaining audit items not yet addressed:** window-consistency mismatches (rolling-28-days leads vs complete-day GSC 28d sharing the same label; lead sparkline 29 buckets vs GSC 28; AI platforms 30-day rolling window unlabeled); dead exports `countLeadsCreatedInLastDays` and `percentChangeFromPrior`; `SANITY_WEBHOOK_SECRET` is dead (the live webhook reads `SANITY_REVALIDATE_SECRET`); `SANITY_API_WRITE_TOKEN` is used only by `scripts/`, not at runtime.
7. **Business decisions owned by James:** the Squarespace page review (pos 24.3, commercial comparison intent, zero clicks — the best single opportunity), the WordPress deepen-or-leave call, the Reno mis-association-vs-expansion question.

Still open from the 2026-08-18 list, not re-prioritized above: mark `lead_form_submit` and `consultation_click` as GA4 key events if not already (console **unverified**); GA4 event audit, then a GA4 surface once the property has a meaningful window; a site-health surface that reads `sync_runs`.

---

## Verification notes

| Claim | Status |
|---|---|
| GA4 measurement ID `G-XHVNEPJH26` | **Unverified in source.** Property `506059011` is in `0003`. |
| Clarity `ure4592vry` | Verified (`0003`). |
| 242-day GSC backfill from `2025-12-18` | Floor + date math verified. Database completeness **unverified**. Ingest frozen at Aug 16 until the Aug 21 key fix (verified). |
| Cron 09:00 / 09:15 / 09:30 / 10:00 UTC | Schedules verified. UTC is Vercel platform default, not in `vercel.json`. |
| No `middleware.ts` | Verified. `proxy.ts` exists; matcher `/` only; does not protect `/intel`. |
| Lint 33 / 18 | Verified `pnpm lint` 2026-08-18 **before** the dashboard primitives. Current totals **unverified**. |
| Clarity 10 req/day | **Unverified in code.** |
| Vercel env environment matrix | **Unverified.** `.env.local` key presence verified. |
| Production-only analytics tags | Consistent with missing local `NEXT_PUBLIC_*` analytics keys; dashboard **unverified**. |
| Unattended cron / `sync_runs` | GSC and GA4 write success rows. Clarity writes success / partial / failed. Decisions writes nothing. “Four green rows” was never the criterion. |
| Clarity partials | Two problems, not one. Quota exhaustion is transient and post-manual. URL and Source/Medium/Campaign fail every run, including quota-healthy ones; never written a row. Schema, unique index, and grants ruled out. |
| GA4 key events configured | **Unverified** (GA4 console). |
| Overview 28d strip + ui primitives | Verified (`page.tsx`, `DecisionFeed.tsx`, `app/intel/_components/ui/*`, tokens in `globals.css`). |
| Green = improvement/completion | Verified in CSS comment + MetricCard / StatusChip / LeadDeliveryMark. Working panel left-border also uses `--positive`. |
| Leads Delivery issues count | Verified (`DELIVERY_ISSUE_STATUSES`, `LeadsStatStrip`). Live Postgres counts **unverified**. |
| Overview vs Search 28d alignment | Windows differ by design (leads rolling-now vs GSC latest complete day). Whether operators treat them as the same “28 days” is **unverified**. |
| `finding_key` / `finding_state` | Verified (`0014`, `lib/intel/decisions/run.ts`, `feed.ts`). `decision_items.status` is a dead column. |
| Display completed-day cap | Verified (`latestCompleteDay` in `lib/intel/search-params.ts`). Phantom-zero on 2026-08-21 observed in production. |
| Failed vs empty panel states | Verified (Overview GSC cards, activity, AI platforms, decision feed, Search). |
| `0012` / `0014` migration divergence | Verified. `0012` applied 2026-08-23. `0014` file now in repo. |
| Auth callback logging | Verified (`Intel auth callback:` prefix, four branches). Stale-token fix **not done**. |
| Cursor tsc/build claims | Wrong twice on 2026-08-23. Vercel / local `pnpm run build` is authoritative. |
