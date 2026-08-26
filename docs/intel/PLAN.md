# Vizantir Intelligence — plan of record

Internal operator dashboard at `/intel`. Written 2026-08-18 from the repository. Updated 2026-08-25 from production and the database. Claims that could not be confirmed in source are marked **unverified**.

---

## 1. System state

Live surfaces (auth required except login): Overview (28-day stat strip + sync health + AI platforms + activity feed + decision feed), Search, Leads (+ detail + CSV export), Reports (Care review queue + per-report preview). Public client report at `/r/[token]` (no auth). Instrumented public site; GSC + GA4 + Clarity ingest; daily detectors; monthly client reports. Shared dashboard primitives live in `app/intel/_components/ui/`.

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

`notify_status` **is** shown per lead (`LeadDeliveryMark` on the list; labels on the detail page). The Leads page also shows an aggregate **Delivery issues** count on `LeadsStatStrip` (`fetchLeadDashboardStats` → `notify_status` in `failed` \| `not_configured`). There is no alert and Overview does not show this count. The Overview sync health panel reads `sync_runs`, not delivery issues.

Lead status update + history insert are one transaction. `updateLeadStatus` calls `update_lead_status` via `rpc()` (`supabase/migrations/0015_lead_status_transaction.sql`): updates `contact_submissions` and inserts `lead_status_history` with `FOR UPDATE` on the lead row. The manual compensating revert is gone. Verified end to end through the UI 2026-08-24.

### GSC sync

`lib/gsc/*`, cron `GET|POST /api/cron/gsc-sync`. Service-account JWT (`webmasters.readonly`), Search Analytics into:

- `gsc_site_daily` — unique `(date)`
- `gsc_query_page_daily` — unique `(date, query, page)`

Daily window: UTC today−5 through today−2 (`lib/gsc/sync.ts`). `?backfill=1` walks month-sized windows down to `BACKFILL_FLOOR = '2025-12-18'`. Migration `0009_gsc_daily.sql` sets `provider_coverage.started_on = '2025-12-18'` for `gsc`.

**242-day figure:** inclusive span `2025-12-18` … `2026-08-16` (today−2 on 2026-08-18) is 242 days. That is the intended completed window if backfill reached the floor. Row counts in Postgres are **not in the repo**. Ingest was frozen at Aug 16 until the Aug 21 service-account key fix; the completed-day window then began advancing again.

The 5-to-2-days-ago window can store an unfinalized day as clicks 0 / impressions 0. Observed 2026-08-23: the 09:30 UTC cron stored 2026-08-21 as zeros; a re-query of the same window hours later returned 61 impressions. The stored data is correct as ingested. Display now caps at today−3 UTC (see Architecture).

### Decision feed

Overview (`app/intel/(app)/page.tsx`) renders a 28-day `OverviewStatStrip`, then sync health, then AI platforms, the activity feed, then `decision_items` via `lib/intel/decisions/feed.ts`. Hidden statuses: `completed`, `dismissed` — read from `finding_state`, not from `decision_items`. Ranked by `score * exp(-days_since_created / 14)` (`DECISION_NOVELTY_TAU_DAYS`). Cards show a one-line triage fact from `formatHeadlineFact` (impressions ± position; no percents).

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

`runDecisionDetectors()` writes `sync_runs` (`provider = 'decisions'`, `records_processed` = findings persisted). Zero findings because nothing crossed threshold is success/0, not partial. Mixed detector outcomes are partial with a typed reason in `administrator_message`, matching Clarity’s annotation style.

The activity feed had to be taught about it — `SyncProvider` was a three-value union and decisions rows were read and silently discarded. Now a fourth provider, labelled “Decision scan” (not “sync” — it emits findings). The label refactor moved the word “sync” out of the title templates and into `providerLabel()`. First `sync_runs` row 2026-08-24; first activity feed entry the same day. The earlier statement that decisions runs are observable only via `decision_items` timestamps and the HTTP response is wrong.

### Client reporting

Monthly website reports per client: PDF export, emailed as a tokenized link. Separate from the intel dashboard, which is single-tenant and for James only. This module **is** multi-tenant — every query filters by `client_id`. Code in `lib/reports/`; operator queue at `/intel/reports`; public view at `/r/[token]`. Verified in production 2026-08-25.

Schema (`supabase/migrations/0016_clients_and_reports.sql`, applied 2026-08-25):

- `clients` — `name`, `slug`, `site_url`, `contact_email`, `care_tier` (`essential` \| `care`), `ga4_property_id`, `gsc_site_url`, `crux_origin`, `uptimerobot_monitor_id`, `engagement_metrics` jsonb, `active`. The four integration columns are nullable; a client can exist before granting access.
- `reports` — `client_id`, `period` (first of month), `tier`, `status` (`pending` \| `draft` \| `sent` \| `failed`), `snapshot` jsonb, `analysis`, `work_completed`, `pdf_path`, `token`, `sent_at`, `send_error`, `opened_at`.
- unique `(client_id, period)` is load-bearing: Vercel cron can retry and a client must never receive two reports for one month.
- Check constraint: status `sent` requires `sent_at` not null.

Storage (`supabase/migrations/0017_reports_pdf_storage.sql`, applied 2026-08-25): private `reports` bucket, PDF-only, 10MB cap, no policies — service role only.

Data sources, one module each in `lib/reports/`:

| Source | Credential | Notes |
|---|---|---|
| GA4 + Search Console | Existing `GSC_SERVICE_ACCOUNT_KEY` | Property and site URL come from the client row, not env. Same credential the intel dashboard uses, so a credential failure takes down both. Splitting them is deferred. |
| CrUX | `CRUX_API_KEY` | A 404 means the origin is below CrUX's reporting threshold — that is normal, returns `no_data`, and the speed section is omitted. Never substitute Lighthouse; lab and field data are not comparable. |
| UptimeRobot | `UPTIMEROBOT_API_KEY` | Coverage is `full` \| `partial` \| `none`. `uptimePercentage` is null unless coverage is full — a monitor created mid-period must not report a percentage for a month it did not watch. |

Blockers vs warnings — the distinction matters:

- **Blockers** (status `failed`, not sendable): `ga4_failed`, `zero_sessions`, `gsc_failed`, `gsc_empty_rows`. These are the report's substance.
- **Warnings** (still sendable, section omitted): `crux_failed`, `uptime_failed`. Supporting detail. Holding a report because CrUX had a bad afternoon is the wrong trade, but the warning is recorded so a source failing every month is visible rather than silently dropped.

Snapshot is immutable and versioned (`REPORT_SNAPSHOT_VERSION`, currently 2). Never re-query the sources at render time — GA4 reprocesses and GSC revises recent days, so a regenerated report would not match what the client received.

**PDF generation.** `playwright-core` + `@sparticuz/chromium-min` in a Vercel function (`app/api/reports/[reportId]/pdf`, 2048MB, 90s). Chromium screenshots the print route rather than a second template, so the PDF and the web report cannot drift.

CRITICAL, this cost an evening: chromium must navigate to `NEXT_PUBLIC_SITE_URL`, **not** `VERCEL_URL`. The deployment-specific hostname has Vercel deployment protection enabled and returns 302 to Vercel's SSO login. Chromium follows it, gets 200 on the auth page, and times out waiting for `.report-document`. The code now fails closed if `NEXT_PUBLIC_SITE_URL` is unset rather than falling back.

The print route (`app/intel/reports/[reportId]/print`) takes a 5-minute HMAC token signed with `CRON_SECRET`, so chromium can render without a session. Report id and expiry are both in the signature; comparison is timing-safe (`lib/reports/print-token.ts`).

Vercel's log viewer did not surface console output for these functions across multiple attempts. Diagnosis came from a debug flag returning diagnostics in the HTTP response. There is temporary scaffolding on the PDF route (`debug=true` after `CRON_SECRET` auth) that should be removed.

**Delivery.** Public tokenized route at `/r/[token]` — outside `/intel`, no auth. Token is 32 random bytes, base64url (`lib/reports/access-token.ts`), **not** derived from the report id. Disallowed in `app/robots.txt/route.ts`. `SiteChrome` excludes `/r/` so the report renders bare.

The PDF is served via a short-lived Supabase signed URL; the bucket stays private. `opened_at` is set on first view only.

Email sends a link, not an attachment: open tracking, typo fixes without resending, no spam filters on large attachments. Currently from `notifications@vizantir.com` — the dedicated `mail.vizantir.com` sending subdomain with its own DKIM is **not** yet set up, so report delivery shares reputation with lead notifications.

**Cron.** `/api/cron/reports`, `0 11 4 * *`. The 4th because GSC lags 2–3 days and GA4 needs ~48 hours. Each client is wrapped in its own try/catch — one bad property must not kill the run. Essential tier sends automatically. Care tier stops at `pending` for review at `/intel/reports`. Mutations: `updateReportReviewFields`, `sendReviewedReport`.

DECISION: this job does **not** write to `sync_runs`. It is a report run, not a data sync, and adding a provider would have required expanding the closed check constraint again. Outcomes are returned per client in the HTTP response.

Capacity: 300s `maxDuration`, and each client costs a snapshot pull plus a chromium render — roughly 30–40s observed. That is about 7–8 clients before the run times out.

**Onboarding a client.**

1. Insert the client row.
2. Client grants the service account Viewer on their GA4 property.
3. Client adds the service account email in Search Console **manually** — there is no API for GSC user management. Document this with screenshots.
4. Create an UptimeRobot monitor. Monitors do not backfill, so create it as early as possible.
5. Confirm their conversion events exist in GA4, or the report shows traffic without outcomes.

Open items for this module: remove the `debug=true` scaffolding on the PDF route; set up `mail.vizantir.com` with its own DKIM before real clients; cosmetic (zero deltas render as a second “0” rather than a dash; the new/returning block shows users over sessions without labelling which is which); the LLM-drafted analysis for Care tier is deliberately **not** built — the manual edit path works first; onboard Evolve Dance Center as client two.

### Crons (`vercel.json`)

| Path | Schedule | Code |
|---|---|---|
| `/api/cron/clarity-sync` | `0 9 * * *` | `syncClarity()` |
| `/api/cron/ga4-sync` | `15 9 * * *` | `syncGa4()` |
| `/api/cron/gsc-sync` | `30 9 * * *` | `syncGsc()` |
| `/api/cron/decisions` | `0 10 * * *` | `runDecisionDetectors()` |
| `/api/cron/reports` | `0 11 4 * *` | `runMonthlyReports()` |

Vercel Cron is UTC; `vercel.json` does not restate the timezone. All five routes require `Authorization: Bearer ${CRON_SECRET}` (timing-safe). Verified `sync_runs` writers: GSC and GA4 write success rows; Clarity writes success / partial / failed; decisions writes success / partial / failed (`provider = 'decisions'`). The reports job does **not** write `sync_runs` — see Client reporting.

### Intel auth

Magic link (`shouldCreateUser: false`) → `/intel/auth/callback`. Allowlist: `INTEL_ALLOWED_EMAILS`, default `vizantirmarketing@gmail.com` (`lib/auth/allowlist.ts`). `/intel` is `noindex` and disallowed in `app/robots.txt/route.ts`. `/r/` is also disallowed there — public report URLs are tokenized, not secret-by-obscurity-in-robots, but they must not be crawled.

Magic-link sign-in used to fail when a stale Supabase refresh token was present (`refresh_token_not_found`). The callback’s `exchangeCodeForSession` failed against the poisoned session and redirected to `/intel/login?error=auth`. The callback now calls `signOut()` before `exchangeCodeForSession`, so a stale refresh token cannot poison a fresh magic-link sign-in. Still **unverified in the wild** — it proves itself the next time a session would have expired. Workaround if it recurs: visit `/intel/auth/signout` and clear vizantir.com cookies.

`app/intel/auth/callback/route.ts` logs each of its four failure branches with an `Intel auth callback:` prefix, greppable in Vercel logs. Previously all four collapsed to a generic redirect with no logging.

---

## 2. Architecture decisions

**/intel, not /studio.** Sanity Studio is a catch-all at `app/studio/[[...tool]]/page.tsx` (`basePath: '/studio'`). `/intel` is a separate App Router tree.

**Auth in the `(app)` layout + `requireIntelUser()` on every mutation; no `middleware.ts`.** Protected UI lives under `app/intel/(app)/layout.tsx`. Login is `(auth)/login`. `/intel/leads/export` and `/intel/reports` are **outside** `(app)` — the layout does not wrap them; those routes call `requireIntelUser()` themselves (reports print is HMAC, not session). `/r/[token]` is public and has no Intel auth. Mutations: `updateDecisionStatus`, `updateLeadStatus`, `updateLeadValue`, `updateLeadNotes`, `updateReportReviewFields`, `sendReviewedReport`. No `middleware.ts` exists in the repo.

The build output line `ƒ Proxy (Middleware)` is `proxy.ts` at the repo root (Next 16’s middleware successor). Its matcher is `/` only and it strips `page_id` on the homepage. It does **not** protect `/intel`. Auth remains layout + `requireIntelUser()`.

**`contact_submissions` extended in place.** No parallel `leads` table. History FKs `contact_submissions(id)`.

**Clarity rows are 3-day windows.** Export client types `numOfDays: 1 \| 2 \| 3`; sync always sends `3`. `0005_clarity_window_days.sql` puts `window_days` in `clarity_metric_daily_slice_key`. Rows are stored as one slice dated UTC yesterday, not exploded into three daily rows. Operator reason (not commented in code): the export API cannot produce single-day multi-dimension rows. Dimension sets: `URL`; `Device, Browser`; `Source, Medium, Campaign`.

Two failure modes were conflated and must be kept separate. (1) Quota exhaustion is real but transient and only occurs after manual runs. (2) A separate persistent failure affects two dimension sets — URL, and Source/Medium/Campaign — which fail in **every** run including quota-healthy ones, and have never written a row. The root cause is Postgres error 21000 — “ON CONFLICT DO UPDATE command cannot affect row a second time. Ensure that no rows proposed for insertion within the same command have duplicate constrained values.” Confirmed by POSTing two rows with identical conflict keys directly to the Supabase REST endpoint and reading the error body.

Critical diagnostic note: PostgREST returns this as HTTP 500, not 400. That is why it read as a server-side failure for over a week. A constraint violation (unique, not-null, value-too-long) returns 400 with a Postgres code; 21000 returns 500. Do not assume 500 means infrastructure.

The URL and Source/Medium/Campaign sets produce rows that collapse to the same conflict key (date, window_days, metric_name, and all three dim name/value pairs). Device/Browser does not, which is why it is the only set that has ever written.

Ruled out, in order — do not re-test: table schema, the unique index (`clarity_metric_daily_slice_key` covers date, window_days, metric_name, and all three dim name/value pairs), service_role grants (INSERT/UPDATE/SELECT all true), NOT NULL violations (every field is explicitly defaulted in the row builder), and payload size. Batching was added and did **not** fix it — the request trace showed one Supabase POST per dimension set both before and after, proving every set fits inside a single 500-row batch.

Fix status: rows are now deduplicated by conflict key before upsert (last wins), with an `Intel clarity duplicate:` log when two rows sharing a key have different metrics. **DEPLOYED BUT UNVERIFIED** — the test run after deploy hit `rate_limited` 429 on two of three sets. The URL set did fetch and still returned `upsert_error`, so either there is a second cause or the dedup missed something. The 2026-08-25 09:00 UTC cron is the first clean test. As of 2026-08-24 the Clarity streak is 12 consecutive unhealthy runs. Do not trigger manually — 10 calls/day, sync uses 3.

**`sync_runs.provider` is a closed check — expand it before adding a job.** `0004_sync_runs.sql` constrained `provider` to `ga4 | gsc | clarity`. Adding the decisions cron required expanding it (`0015_lead_status_transaction.sql` also replaces that constraint). Without the new value the insert fails closed, the runner returns “Failed to record sync run”, and **the detectors do not run**. Any future sync job must expand this constraint first or it will silently disable itself. The monthly reports cron deliberately does **not** write `sync_runs` — it is a report run, not a data sync, and expanding the check again was the wrong trade.

**Client reports are multi-tenant; the intel dashboard is not.** Every reports query filters by `client_id`. The snapshot is immutable and versioned (`REPORT_SNAPSHOT_VERSION`, currently 2) — never re-query GA4/GSC at render time. Chromium PDF capture must use `NEXT_PUBLIC_SITE_URL`, not `VERCEL_URL` (deployment protection 302s to SSO; see Client reporting).

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

**Sync health on Overview stays quiet when everything is fine.** `lib/intel/sync-health.ts` + `app/intel/_components/SyncHealthPanel.tsx`, placed between the stat strip and AI platforms. Latest run per provider plus a consecutive-unhealthy streak (30-run lookback). Healthy providers collapse into one summary line; only failing providers get a row, with `administrator_message` and the streak. A success older than 48h is flagged stale. A provider with no runs is a distinct state from a failed run. Four green rows every day would stop being read.

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
| `GSC_SERVICE_ACCOUNT_KEY` | `lib/gsc/auth.ts` (base64 JSON). GSC: `webmasters.readonly`. GA4: `analytics.readonly`. Also `lib/reports/` (same credential; client property/site from the `clients` row). | no | yes | **Unverified.** |
| `CLARITY_API_TOKEN` | `lib/clarity/client.ts` | no | yes | **Unverified.** |
| `CRUX_API_KEY` | `lib/env/server.ts`, `lib/reports/crux.ts` | no | **Unverified.** | Required for report speed section. |
| `UPTIMEROBOT_API_KEY` | `lib/env/server.ts`, `lib/reports/uptime.ts` | no | **Unverified.** | Required for report uptime section. |
| `INTEL_ALLOWED_EMAILS` | `lib/auth/allowlist.ts` | yes (`vizantirmarketing@gmail.com`) | yes | **Unverified.** |
| `CRON_SECRET` | `app/api/cron/{clarity-sync,ga4-sync,gsc-sync,decisions,reports}`; also HMAC for report print route | no | yes | Required wherever Vercel Cron runs (Production). |
| `NEXT_PUBLIC_SITE_URL` | Report PDF chromium origin (`lib/reports/pdf.ts`). Fail-closed if unset. Also site metadata / robots. | yes | **Unverified.** | Required for PDF render. Do **not** substitute `VERCEL_URL`. |
| `NEXT_PUBLIC_SUPABASE_URL` | supabase server/browser/service clients | yes | yes | Required for Intel + forms. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | server + browser supabase (auth cookies) | yes | yes | Required for Intel login. |
| `SUPABASE_SERVICE_ROLE_KEY` | `lib/supabase/service.ts` (all Intel data + ingest) | yes | yes | Required. |
| `CONTACT_NOTIFICATION_EMAIL` | `lib/forms/contact-submission.ts` | yes | no | Required for `notify_status=sent`. |
| `RESEND_API_KEY` | `lib/forms/contact-submission.ts`; also `lib/reports/send.ts` | yes | no | Required for leads + report email. |
| `RESEND_FROM_EMAIL` | same. Currently `notifications@vizantir.com` — report delivery shares this reputation until `mail.vizantir.com` exists. | yes | no | same |
| `RATE_LIMIT_SALT` | `lib/forms/rate-limit.ts` | yes | yes | Forms, not the Intel UI. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `TurnstileWidget` | yes | yes | Forms. Local uses test keys (operator). |
| `TURNSTILE_SECRET_KEY` | `lib/forms/turnstile.ts` | yes | yes | Forms. |

`.env.example` does not list the GA4/Clarity/GSC/cron Intel vars, nor `CRUX_API_KEY` / `UPTIMEROBOT_API_KEY`. `NEXT_PUBLIC_SITE_URL` is listed (site + PDF origin).

`SANITY_WEBHOOK_SECRET` is dead — the live webhook reads `SANITY_REVALIDATE_SECRET`. `SANITY_API_WRITE_TOKEN` is used only by `scripts/`, not at runtime.

---

## 4. Operational notes

**Clarity export API.** Client allows 1–3 day windows; sync uses 3. Three requests per run. **10 req/day quota is not encoded** — operator/API constraint. Missed days are unrecoverable (`0003` note). `clarity_metric_daily` is written by sync only; no Intel UI reads it. Fixing the pipeline has no payoff until the deferred behavior/friction surface exists.

Do not trigger Clarity manually. Quota exhaustion is transient and only occurs after manual runs. The persistent URL and Source/Medium/Campaign failures are a separate, non-quota problem: Postgres 21000 from duplicate conflict keys in one upsert (see Architecture). Dedup is deployed but unverified. Wait for the 09:00 UTC cron on 2026-08-25 — the first clean test after the post-deploy run hit `rate_limited` 429.

**GSC lag.** Daily sync covers 5-to-2-days-ago UTC. Data-through date stored on the run is today−2. 2–3 day publishing lag is implied by that window, not commented. Display caps at today−3 UTC so an unfinalized trailing edge is not plotted as a real zero.

**Migrations.** SQL files live in `supabase/migrations/` (`0001`–`0017`). No `supabase/config.toml`, no package.json migrate script, no CLI runner. Apply by pasting into the Supabase SQL editor. `0006_service_role_grants.sql` plus per-table grants on later migrations. `0015_lead_status_transaction.sql` adds `update_lead_status` (and its `service_role` grant) and replaces the `sync_runs.provider` check. Applied manually 2026-08-24. `0016_clients_and_reports.sql` and `0017_reports_pdf_storage.sql` applied 2026-08-25.

Handoff rule 7 (file in repo AND applied in the SQL editor) was violated twice, opposite ways, and both stayed silent for days:

- `0014_finding_identity_state.sql` was applied to the database but the file was never created in the repo. A DB rebuilt from migrations could not run the current code. File now exists.
- `0012_intel_events.sql` existed in the repo but was never applied. `public.intel_events` did not exist. `fetchRecordedEvents` had been failing silently since the file was written, returning `[]` — invisible until the error-state work surfaced it as a hard panel failure. Applied 2026-08-23.

Standing check: after any migration, verify the table exists in the database AND the file exists in the repo.

**Never run `vercel env pull .env.local`.** It overwrites the local file. Local-only values (Turnstile test keys, `RATE_LIMIT_SALT`, `CRON_SECRET`, and anything else not meant to match Production) would be destroyed. This contradicts the generic `.cursorrules` sync instruction; this document is the Intel-specific rule.

**`sync_runs`.** Written by Clarity, GSC, GA4, and decisions. Overview consumes it as a health panel (`SyncHealthPanel`); the activity feed still reads recent rows as events. Decisions is labelled “Decision scan” in the feed. Do not treat “four green `sync_runs` rows” as the unattended-cron success criterion — the health panel is built to stay quiet when everything is fine. The reports cron does **not** write here; judge that run from the HTTP response (per-client outcomes).

**Undocumented tables.** `public` also contains `bot_hits`, `bot_ip_ranges`, `daily_rollups`, `deploys`, `events`, and `submissions`. None are created by any migration in `supabase/migrations/` and none are referenced by intel code. Origin is not in this repo. `submissions` and `events` are confusingly close to the live `contact_submissions` and `intel_events` and could be queried by mistake.

**Cursor claims are not evidence.** Self-reported “tsc and build passed” was wrong twice on 2026-08-23. One report claimed both passed while a missing export broke the Vercel build. Treat Vercel or a local `pnpm run build` as the authoritative result.

**Review the actual diff.** Cursor has twice modified files outside the stated scope and not reported them. Always run `git status` and review diffs before staging. Never `git add` broadly.

**Do not commit while Cursor is still writing.** Committing a mid-edit snapshot happened once and broke the production build.

---

## 5. Open risks

- **Lint:** `pnpm lint` → `33 errors, 18 warnings` (2026-08-18, before this dashboard pass). Zero findings under `lib/intel`, `lib/gsc`, `lib/clarity`, `app/intel`, `app/api/cron` at that run. **Not re-run** after `app/intel/_components/ui/` and the Overview/Leads strips. Git history was not inspected (repo rule: no git).
- **Tests:** no `test` script, no `*.test.*` / `*.spec.*`, no vitest/jest/playwright in the tree.
- **Sync failure alerting:** `sync_runs` records `status` / `error_code` / `administrator_message`. Overview has a health panel (latest run + streak; quiet when healthy). There is still no alert.
- **`notify_status`:** recorded, shown per lead, and aggregated as **Delivery issues** on the Leads stat strip (`failed` + `not_configured`). No alert, no Overview card, no dedicated health page.
- **Law-firm overlap:** `law-firm` group can emit `buried-demand`; `geo-signal` can emit on the same query set if a non-focus geo term matches. No shared identity or relation table. Dedup deferred.
- **Dead columns:** `decision_items.status` / `result_note` / `completed_at` will stay `'new'` forever. Querying them by hand misleads.
- **Activity fail-closed:** one of seven `fetchActivity` sources failing takes down the whole panel. Logs do not name the source.
- **Shared Google credential:** `GSC_SERVICE_ACCOUNT_KEY` serves intel ingest and client reports. One failure takes down both.
- **Reports cron capacity:** ~30–40s per client, 300s `maxDuration` — about 7–8 clients before timeout.
- **Report PDF debug scaffolding:** `debug=true` after `CRON_SECRET` auth still on the PDF route. Remove it.

---

## 6. Deferred (not in the repo)

Negative evidence only for the first five — none of those have code, routes, or tables beyond unused hooks:

- **GA4 Intel surfaces** — wait for ~28 days of tagged data. Coverage `started_on` for `ga4` is `current_date` at migration apply, not a hardcoded install day. Mid-September 2026 is calendar arithmetic from an ~mid-August 2026 install, **not encoded**. Ingest and the activity-feed visitor line exist; there is still no GA4 page.
- **Behavior / friction surface** — Clarity data is ingested, not displayed. No `/intel` surface consumes `clarity_metric_daily`.
- **Change impact**
- **Migration equity vault**
- **Opportunity queue as a separate surface** — `opportunity` is a feed category, not its own page.
- **LLM-drafted Care-tier analysis** — monthly client reports exist; the Care edit path is manual on purpose. Do not add a draft model until that path has been used.
- **Split GA4/GSC credentials** — reports reuse `GSC_SERVICE_ACCOUNT_KEY`. A credential failure takes down intel ingest and client reports together.

The intel dashboard remains single-tenant (one allowlist, one GSC site, one Clarity project, one GA4 property in env). Client reporting is the exception: multi-tenant, `client_id` on every query.

`GA4_PROPERTY_ID` and `needsComparison` remain unused forward hooks in intel code. Client reporting is built; it does not use those hooks.

---

## 7. Next steps (order)

1. **Clarity persistent dimension-set failures — verify the deploy.** Root cause is Postgres 21000 (duplicate conflict keys in one upsert). Dedup is deployed but unverified: the post-deploy test hit `rate_limited` 429 on two of three sets; the URL set still returned `upsert_error`. The 2026-08-25 09:00 UTC cron is the first clean test. Do not trigger manually — 10 calls/day, sync uses 3. As of 2026-08-24 the streak is 12 consecutive unhealthy runs.
2. **Clarity is ingested and read by nothing.** No `/intel` surface consumes `clarity_metric_daily`. Fixing the pipeline has no payoff until the deferred behavior/friction surface exists.
3. **Remaining audit items not yet addressed:** window-consistency mismatches (rolling-28-days leads vs complete-day GSC 28d sharing the same label; lead sparkline 29 buckets vs GSC 28; AI platforms 30-day rolling window unlabeled); dead exports `countLeadsCreatedInLastDays` and `percentChangeFromPrior`; `SANITY_WEBHOOK_SECRET` is dead (the live webhook reads `SANITY_REVALIDATE_SECRET`); `SANITY_API_WRITE_TOKEN` is used only by `scripts/`, not at runtime.
4. **Business decisions owned by James:** the Squarespace page review (pos 24.3, commercial comparison intent, zero clicks — the best single opportunity), the WordPress deepen-or-leave call, the Reno mis-association-vs-expansion question.
5. **Client reporting follow-through.** Remove the `debug=true` scaffolding on the PDF route. Set up `mail.vizantir.com` with its own DKIM before sending to real clients. Cosmetic: zero deltas render as a second “0” rather than a dash; the new/returning block shows users over sessions without labelling which is which. Onboard Evolve Dance Center as client two.

Still open from the 2026-08-18 list, not re-prioritized above: mark `lead_form_submit` and `consultation_click` as GA4 key events if not already (console **unverified**); GA4 event audit, then a GA4 surface once the property has a meaningful window.

---

## Verification notes

| Claim | Status |
|---|---|
| GA4 measurement ID `G-XHVNEPJH26` | **Unverified in source.** Property `506059011` is in `0003`. |
| Clarity `ure4592vry` | Verified (`0003`). |
| 242-day GSC backfill from `2025-12-18` | Floor + date math verified. Database completeness **unverified**. Ingest frozen at Aug 16 until the Aug 21 key fix (verified). |
| Cron 09:00 / 09:15 / 09:30 / 10:00 UTC | Schedules verified. UTC is Vercel platform default, not in `vercel.json`. Reports cron `0 11 4 * *` verified 2026-08-25. |
| No `middleware.ts` | Verified. `proxy.ts` exists; matcher `/` only; does not protect `/intel`. |
| Lint 33 / 18 | Verified `pnpm lint` 2026-08-18 **before** the dashboard primitives. Current totals **unverified**. |
| Clarity 10 req/day | **Unverified in code.** |
| Vercel env environment matrix | **Unverified.** `.env.local` key presence verified. |
| Production-only analytics tags | Consistent with missing local `NEXT_PUBLIC_*` analytics keys; dashboard **unverified**. |
| Unattended cron / `sync_runs` | GSC and GA4 write success rows. Clarity writes success / partial / failed. Decisions writes success / partial / failed (`provider = 'decisions'`). Health panel stays quiet when healthy — “four green rows” is not the criterion. Reports cron does not write `sync_runs`. |
| Clarity partials | Two problems, not one. Quota exhaustion is transient and post-manual. URL and Source/Medium/Campaign fail every run: Postgres 21000 from duplicate conflict keys in one upsert. PostgREST returns 21000 as HTTP 500. Schema, unique index, grants, NOT NULL, payload size, and batching ruled out. Dedup deployed but unverified. Streak 12 as of 2026-08-24. |
| GA4 key events configured | **Unverified** (GA4 console). |
| Overview 28d strip + ui primitives | Verified (`page.tsx`, `DecisionFeed.tsx`, `app/intel/_components/ui/*`, tokens in `globals.css`). |
| Green = improvement/completion | Verified in CSS comment + MetricCard / StatusChip / LeadDeliveryMark. Working panel left-border also uses `--positive`. |
| Leads Delivery issues count | Verified (`DELIVERY_ISSUE_STATUSES`, `LeadsStatStrip`). Live Postgres counts **unverified**. |
| Overview vs Search 28d alignment | Windows differ by design (leads rolling-now vs GSC latest complete day). Whether operators treat them as the same “28 days” is **unverified**. |
| `finding_key` / `finding_state` | Verified (`0014`, `lib/intel/decisions/run.ts`, `feed.ts`). `decision_items.status` is a dead column. |
| Display completed-day cap | Verified (`latestCompleteDay` in `lib/intel/search-params.ts`). Phantom-zero on 2026-08-21 observed in production. |
| Failed vs empty panel states | Verified (Overview GSC cards, activity, AI platforms, decision feed, Search). |
| `0012` / `0014` migration divergence | Verified. `0012` applied 2026-08-23. `0014` file now in repo. |
| `0015` lead status + provider check | Verified. File in repo. Applied manually 2026-08-24. |
| Decisions `sync_runs` + activity feed | Verified. First `sync_runs` row 2026-08-24; first activity feed entry the same day. Labelled “Decision scan”. |
| Lead status atomicity | Verified end to end through the UI 2026-08-24 (`update_lead_status` via `rpc()`). |
| Sync health panel | Verified (`lib/intel/sync-health.ts`, `SyncHealthPanel`, Overview placement). |
| `sync_runs.provider` closed check | Verified landmine. `0004` was `ga4 \| gsc \| clarity`; `0015` adds `decisions`. Insert fail-closes and detectors do not run if a new provider is missing. Reports cron does not add a provider. |
| Auth callback logging | Verified (`Intel auth callback:` prefix, four branches). Stale-session `signOut()` before exchange is in code; **unverified in the wild**. |
| Client reporting | Verified in production 2026-08-25. `0016`/`0017` applied. Unique `(client_id, period)`. Snapshot version 2, immutable. Chromium uses `NEXT_PUBLIC_SITE_URL` (fail-closed). Print HMAC 5-minute, timing-safe. Public `/r/[token]` (32-byte base64url, not derived from id). Reports cron does not write `sync_runs`. Essential auto-sends; Care stops at `pending`. PDF `debug=true` scaffolding still present. |
| Cursor tsc/build claims | Wrong twice on 2026-08-23. Vercel / local `pnpm run build` is authoritative. |
