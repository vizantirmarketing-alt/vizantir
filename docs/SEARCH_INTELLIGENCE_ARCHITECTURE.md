# Search Intelligence Architecture

How Vizantir turns Search Console data into operator decisions. Written 2026-09-09
by reading the source at `bc1ab1e`. Every claim below is traceable to a file and
line; claims that could not be confirmed in source are marked **unverified**.

This document is two things. **Sections 1–13 describe the system as built** and
are verified against source. **Sections 14–20 are a Phase 2 proposal** — nothing
in them exists yet, and no production code has been written against them. The
boundary is marked explicitly.

For status, open risks, and priorities see `docs/intel/PLAN.md` — where the two
disagree, this document was checked against source more recently and Section 12
lists the specific disagreements.

---

## 1. What this system is

A single-tenant pipeline that ingests Google Search Console into Postgres,
aggregates it under fixed statistical rules, runs pure-function detectors over a
completed 28-day window, and presents the survivors as a triageable feed at
`/intel`.

It is not a rank tracker and it does not recommend actions with confidence. Every
detector's `recommendedAction` string explicitly disclaims causality — see
`lib/intel/decisions/detectors/within-reach.ts:70` ("This does not establish that
changes would increase clicks"). That restraint is a design property, not
hedging: the system surfaces facts that deserve a human decision, and the human
decides.

Four things live under the same roof and are easy to confuse:

| System | Tenancy | Credential | GSC client |
|---|---|---|---|
| Intel search pipeline (this doc, §3–§9) | Single-tenant, one site from `GSC_SITE_URL` | `GSC_SERVICE_ACCOUNT_KEY` | Hand-rolled fetch (`lib/gsc/`) |
| Client monthly reports (§10) | Multi-tenant, `client_id` on every query | Same `GSC_SERVICE_ACCOUNT_KEY` | `googleapis` SDK (`lib/reports/gsc.ts`) |
| AI crawler tracking (§11.1) | Single-tenant | None — inbound only | n/a |
| Local presence / GBP (§11.2) | Mixed | `PLACES_API_KEY` | n/a |

The two GSC clients are independent implementations sharing one credential. One
key rotation failure takes down both.

---

## 2. Data flow

```
Google Search Console API
         │  webmasters/v3 searchAnalytics/query   (raw fetch + hand-signed JWT)
         │  scope: webmasters.readonly
         ▼
  lib/gsc/client.ts ──── 25 000-row pages, startRow paging
         │
         ▼
  lib/gsc/sync.ts ────── window today−5 … today−2, zero-fills absent dates
         │               chunked upsert, 500 rows
         ▼
┌──────────────────────┬───────────────────────────┐
│  gsc_site_daily      │  gsc_query_page_daily     │   unique (date) / (date,query,page)
└──────────┬───────────┴─────────────┬─────────────┘
           │                         │
           │                         ▼
           │              lib/intel/decisions/grouping.ts
           │              query→group assignment, impression-weighted rollup
           │                         │
           │                         ▼
           │              lib/intel/decisions/detectors/*  (pure, no I/O)
           │              buried-demand · within-reach · geo-signal
           │                         │
           │                         ▼
           │              decision_items (emissions)  ──FK──▶  finding_state (operator state)
           │                         │                              │
           ▼                         ▼                              ▼
  lib/intel/search.ts      lib/intel/decisions/feed.ts    app/intel/(app)/actions.ts
  display aggregation      latest emission per finding    status mutations
           │               × exp(−age/14) novelty decay
           ▼                         ▼
   /intel/search                  /intel  (Overview)
```

Every write path also records a row in `sync_runs`, consumed by the health panel
(§9) and the activity feed.

---

## 3. Ingest

### 3.1 Authentication

`lib/gsc/auth.ts`. A service-account JWT is signed in-process with
`node:crypto.createSign` and exchanged at `oauth2.googleapis.com/token` for an
access token. Scope is `webmasters.readonly` (`lib/gsc/auth.ts:7`) — read-only,
which is why onboarding a *new* property needs the separate `webmasters` scope
described in `CLAUDE.md`.

The token is cached in a module-level variable with a 60-second expiry skew
(`lib/gsc/auth.ts:9`, `:36-45`). On a serverless platform that cache lives only
for the lifetime of one warm instance; it saves round-trips inside a single sync
run, not across runs.

Failures are a closed union — `not_configured | unauthorized | forbidden |
rate_limited | http_error | network_error | invalid_json` (`lib/gsc/auth.ts:21-34`).
Nothing throws; every caller pattern-matches.

Credentials come from `GSC_SERVICE_ACCOUNT_KEY`, base64-encoded JSON
(`lib/env/server.ts:10`). Never print the whole value — extract fields with
targeted commands.

### 3.2 The API client

`lib/gsc/client.ts`. One function, `fetchSearchAnalytics`, POSTing to
`webmasters/v3/sites/{siteUrl}/searchAnalytics/query`.

- Row limit is 25 000 per request (`SEARCH_ANALYTICS_ROW_LIMIT`,
  `lib/gsc/client.ts:5`); the caller pages with `startRow`.
- `cache: 'no-store'` — this data must never be served from a Next.js fetch cache.
- HTTP status is mapped to the same closed union: 401 → `unauthorized`,
  403 → `forbidden`, 429 → `rate_limited`, other non-2xx → `http_error`.
- Response parsing is total and strict (`parseSearchAnalyticsRows`,
  `lib/gsc/client.ts:105`). A single malformed row rejects the **entire** page
  as `invalid_json` rather than silently dropping it. Missing `rows` is a valid
  empty result, not a parse failure.
- `clicks` and `impressions` are rounded to integers on the way in
  (`lib/gsc/client.ts:159-160`); `ctr` and `position` stay floating point.

### 3.3 The sync

`lib/gsc/sync.ts`, invoked by `GET|POST /api/cron/gsc-sync` at `30 9 * * *` UTC.

**Daily window: today−5 through today−2** (`lib/gsc/sync.ts:58`, `:93`). Both
bounds are UTC. The window is four days wide and overlapping — each day is
re-fetched on four consecutive runs and upserted, so Google's late revisions to
recent days are picked up. `data_through_date` on the `sync_runs` row is always
today−2 regardless of what actually arrived.

**Two dimension sets per run:**

| Set | Dimensions | Table | Conflict target |
|---|---|---|---|
| Site | `['date']` | `gsc_site_daily` | `date` |
| Query-page | `['date','query','page']` | `gsc_query_page_daily` | `date,query,page` |

Partial success is first-class. If one set fails and the other succeeds the run
is `partial` with a typed `administrator_message` naming the failed set and its
reason (`syncDailyWindow`, `lib/gsc/sync.ts:191-238`). Both failing is `failed`.

**Zero-fill is the single most important ingest behaviour.** Before merging API
rows, `siteRowsForWindow` seeds a row of zeros for *every* date in the window
(`lib/gsc/sync.ts:453-466`), then overwrites the dates Google returned. A date
Google omits is therefore stored as `clicks 0, impressions 0, position 0` —
indistinguishable in the table from a real zero-traffic day.

This is why the display layer exists in the shape it does. GSC finalizes a day
2–3 days after the fact; the 09:30 UTC cron frequently reads today−2 before it
is final, writes zeros, and a later run overwrites them with real numbers. Between
those two runs the table contains a phantom traffic collapse. §5 explains the cap
that hides it. Note that the zero-fill applies only to the site dimension —
`toQueryPageRows` (`lib/gsc/sync.ts:486`) maps API rows straight through, so
absent query-page slices are genuinely absent rather than zero.

**Upserts are chunked at 500 rows** (`UPSERT_CHUNK_SIZE`, `lib/gsc/sync.ts:13`),
sequentially, aborting on the first error.

**Backfill** (`?backfill=1`) reads the earliest existing `gsc_site_daily` date and
walks month-sized windows backwards to `BACKFILL_FLOOR = '2025-12-18'`
(`lib/gsc/sync.ts:12`, `iterateBackfillWindows:425`). It stops at the first failed
window and reports `partial` with the earliest date it reached — no retry, no gap
filling. Backfill runs the query-page set *before* the site set
(`syncWindow:240`), the opposite order from the daily path; since the earliest-date
probe reads `gsc_site_daily`, a crash between the two writes leaves query-page rows
that a subsequent backfill will re-fetch rather than skip.

### 3.4 Cron authorization

Every cron route requires `Authorization: Bearer ${CRON_SECRET}`, compared with
`timingSafeEqual` over SHA-256 digests of the full header
(`app/api/cron/gsc-sync/route.ts:44-56`). Hashing first makes the comparison
length-independent, which is what makes `timingSafeEqual` safe to call on
attacker-controlled input. A missing `CRON_SECRET` returns 500, not 401 — the
route fails closed.

The route returns `{ status, recordsProcessed, message }` in the response body.
That is deliberate: **Vercel does not surface `console.error` from cron routes**
in either the CLI or the dashboard log detail view. The HTTP response is the only
place an actual error message is legible.

---

## 4. Storage

### 4.1 Tables

`supabase/migrations/0009_gsc_daily.sql`:

```
gsc_site_daily          unique (date)
gsc_query_page_daily    unique (date, query, page)
```

Both carry `clicks integer`, `impressions integer`, `ctr double precision`,
`position double precision`, all `not null default 0`. `query` and `page` default
to `''`, so an empty-string key is storable and the aggregation layer relabels it
`'—'` for display (`lib/intel/search.ts:264`).

Indexes: `gsc_query_page_daily (date desc)` and `(page, date desc)`.
`gsc_site_daily` has only its unique constraint on `date`.

`supabase/migrations/0010_decision_feed.sql`:

```
gsc_query_groups        unique (slug); match_type in (contains_any, exact_any)
decision_items          unique (detector, emission_key)
```

`supabase/migrations/0014_finding_identity_state.sql`:

```
finding_state           primary key (finding_key)
decision_items.finding_key  → FK to finding_state, on delete cascade
```

### 4.2 Grants

RLS is enabled on all of these with a `service_role`-only policy, and every
migration additionally issues explicit table grants. **This is required.** Tables
created through the SQL editor do not receive the automatic role grants Supabase
applies to tables created through its UI; without them the service role gets a
403 on every write, which reads as an RLS problem and is not. The error to
recognize is Postgres `42501`, `permission denied for table <name>` — its `hint`
field names the exact grant. RLS enabled with no policies is normal here and is
never the cause.

Every migration also re-issues `grant usage, select on all sequences in schema
public to service_role`, because the identity columns need it.

### 4.3 Coverage gating

`provider_coverage` (`0003_provider_coverage.sql`) records `started_on` per
provider. `0009` backdates the `gsc` row to `2025-12-18` to match
`BACKFILL_FLOOR`.

This row is the sole authority on whether a prior-period comparison is honest. If
the prior window starts before `started_on`, comparison is refused rather than
computed against absent data — see §5.3. The check constraint still allows only
`ga4 | gsc | clarity`; `decisions`, `psi`, and `gbp` write no coverage row.

### 4.4 Growth

Nothing prunes `gsc_query_page_daily`, and nothing prunes `decision_items`. See
§12.3 for the consequence.

---

## 5. Aggregation rules

Three rules govern every number the system displays. They are implemented twice —
once for display (`lib/intel/search.ts`) and once for detection
(`lib/intel/decisions/grouping.ts`) — and the implementations agree.

### 5.1 Impression weighting

```
CTR      = sum(clicks) / sum(impressions)
Position = sum(position × impressions) / sum(impressions)
```

`aggregateSiteMetrics` (`lib/intel/search.ts:224`) and `weightedTotals`
(`lib/intel/decisions/grouping.ts:214`). **Daily averages are never averaged
together.** A day with three impressions at position 2 must not pull the monthly
average as hard as a day with three thousand at position 40. Both functions
return `null` rather than `0` when impressions are zero, so "no data" and "position
zero" stay distinguishable all the way to the UI.

### 5.2 The completed-day cap

`latestCompleteDay` (`lib/intel/search-params.ts:97`):

```ts
const trailing = addUtcDays(utcToday(), -2)
if (latest >= trailing) return addUtcDays(trailing, -1)
return latest
```

Display never shows a day newer than **today−3 UTC**. today−2 is the trailing edge
of the sync window and is the day most likely to be holding zero-fill (§3.3).
Ingest is untouched — no rows are filtered or deleted, only the display span
shrinks.

Missing days inside a displayed span render as `null`, not zero: `dailySeries`
(`lib/intel/search.ts:289`) enumerates the span and looks up each date, yielding
`clicks: null` for absent rows so the chart skips the point instead of plotting a
false floor.

**The detector path does not use this rule.** `completedPeriodEnd`
(`lib/intel/decisions/run.ts:49`) only backs off when `latest >= today`, which
never happens given a sync that writes through today−2. Detectors therefore run
on a window ending today−2 while the dashboard displays through today−3. See
§12.1.

### 5.3 Comparison availability

`resolveComparison` (`lib/intel/search.ts:395`) computes the prior span of equal
length and refuses it when `coverageStartedOn === null || prior.start <
coverageStartedOn`. The result is a discriminated union — `{ available: false,
coverageStartedOn }` — and the UI renders "Movers unavailable" with the coverage
date rather than a misleading zero baseline.

Percentages have a second guard: `MEANINGFUL_COMPARISON_BASE = 10`
(`lib/intel/format-change.ts:2`). A prior value below 10 returns `null` and the
caller shows the absolute delta instead. Three clicks becoming six is not a 100%
improvement worth reading.

### 5.4 Query pagination

Both readers page `gsc_query_page_daily` at 1 000 rows × 80 pages
(`QUERY_PAGE_SIZE` / `QUERY_PAGE_CAP`, `lib/intel/search.ts:15-16` and
`grouping.ts:14-15`) — an 80 000-row ceiling per span. Hitting the cap returns
`null`, which the caller treats as a hard query failure, not a truncated result.
Failing closed here is correct: a silently truncated window would produce wrong
aggregates.

---

## 6. Detection

### 6.1 The contract

```ts
type Detector = {
  name: string
  needsComparison?: boolean
  detect(input: DetectorInput): Finding[]
}
```

`lib/intel/decisions/types.ts:73`. **Detectors are pure functions. No I/O inside
a detector.** All data arrives pre-loaded in `DetectorInput` — groups, grouped
rollups, site dailies, per-query stats, and a `comparisonAvailable` boolean.

`needsComparison` detectors are skipped entirely when comparison is unavailable
(`run.ts:414`). No current detector sets it, so crossing a coverage boundary is
never computed.

### 6.2 Grouping

`gsc_query_groups` maps query text to named topics. `assignQueryToGroup`
(`grouping.ts:326`) returns the **first** match in id order — a query belongs to
at most one group. Matching is `contains_any` (substring, lowercased) or
`exact_any` (full equality, lowercased).

Six groups seeded in `0010`: `wordpress-security`, `law-firm`, `cre`,
`platform-compare`, `brand`, `vegas-web-design`.

First-match-wins means seed order is semantically load-bearing. `law-firm` (id 2)
precedes `platform-compare` (id 4), so "law firm website vs squarespace" counts
as law-firm and never reaches the comparison group.

### 6.3 The three detectors

All three emit category `opportunity`.

**`buried-demand`** — `detectors/buried-demand.ts`. Operates on *groups*.

| Gate | Threshold |
|---|---|
| Group impressions | ≥ 100 |
| Impression-weighted position | > 40 |
| Group CTR | < 0.5% |

Score `= impressions × 100 / position`. Confidence always `medium`.
Emission key is the group slug. It inspects member queries for informational
markers (`how`, `why`, `what`, `hacked`) using whole-word regex, excluding
anything containing `vs`, and swaps the recommended action accordingly — deepen
existing content versus contest rankings. Evidence caps member queries at 20.

**`within-reach`** — `detectors/within-reach.ts`. Operates on *individual
queries*.

| Gate | Threshold |
|---|---|
| Query impressions | ≥ 8 |
| Position | ≤ 30 |
| Clicks / CTR | zero clicks, **or** CTR < 1% |

Score `= (31 − position) × impressions`. Confidence is `medium` at position ≤ 25,
otherwise `exploratory`. Flags commercial-comparison intent on substring match of
`vs`, `compare`, or `best` — note this is a plain `includes`, so "best" matches
inside "bestseller".

**`geo-signal`** — `detectors/geo-signal.ts`. Operates on *individual queries*,
scanning for 25 hardcoded non-focus city names.

| Gate | Threshold |
|---|---|
| Combined impressions for the term | ≥ 15 |

Score `= impressions`. Confidence always `exploratory`. Matching uses whole-word
regex with whitespace flexibility, so "salt lake city" matches across variable
spacing. `'nevada'` is deliberately excluded from the non-focus list — ambiguous
statewide queries must not fire. The detector emits both readings and refuses to
choose: "That may be a mis-association to correct, or an expansion to consider.
This finding does not recommend either reading."

Score scales are not comparable across the three (§12.4).

### 6.4 Identity versus emission

This is the subtlest part of the system and it has been wrong before.

```
emission_key = "{stable_id}:{YYYY-MM-DD}"     one row per finding per window
finding_key  = "{detector}:{stable_id}"       stable identity, no date
```

`emissionKeyFor` / `findingKeyFor`, `types.ts:88-105`. `findingKeyFor` strips the
trailing date and prefixes the detector name **only when the remainder does not
already start with it** — `within-reach` builds its stable id as
`within-reach:{slug}`, so naive prefixing would double it.

- `decision_items` holds **emissions**. One row per finding per window. New window
  → new row.
- `finding_state` holds **operator state** — `status`, `result_note`,
  `completed_at` — one row per finding, forever, keyed by `finding_key`.

**`decision_items.status`, `result_note`, and `completed_at` are dead columns.**
Nothing reads or writes them; they stay `'new'` in perpetuity. Querying them by
hand in the SQL editor will mislead you about what an operator has triaged.

The failure this design fixes: when `emission_key` was treated as identity, every
advance of the completed-day window minted a duplicate row and reset triage to
`'new'`.

### 6.5 Persistence

`persistFindings` (`run.ts:205`):

1. Collapse duplicate `(findingKey, emissionKey)` pairs, keeping the highest score
   (`collapseKeyedFindings:174`).
2. Upsert `finding_state` rows with `ignoreDuplicates: true` — the FK parent must
   exist first, and an existing row's triage state must not be clobbered.
3. Select existing `(detector, emission_key)` pairs.
4. Insert the new ones with full payload.
5. Update the existing ones with **`score`, `evidence_json`, `description`,
   `finding_key`, `updated_at` only** — never `title`, `category`, `confidence`, or
   `period_start`, and never operator state.

Updates are issued one row at a time in a loop (`run.ts:294`), not batched.

Run status: all detectors clean → `success`; all attempted detectors failed →
`failed`; mixed → `partial` with a typed message truncated to 500 characters
naming each failure as `{detector} ({reason}: {detail})`. Zero findings because
nothing crossed threshold is `success` with `records_processed = 0`, not a partial.

---

## 7. The feed

`fetchDecisionFeed` (`lib/intel/decisions/feed.ts:306`).

1. Load all `decision_items` ordered by `period_end desc`, and all
   `finding_state`, in parallel.
2. `latestEmissionPerFinding` (`:226`) keeps one emission per `finding_key`,
   sorting by `period_end` then `created_at`, both descending.
3. Join to `finding_state`. An emission with **no** state row is counted as
   `missingState` and dropped. If *every* emission is missing state the whole
   query returns `{ ok: false }` — that pattern means `0014` was never applied,
   and rendering an empty feed would hide it.
4. Drop `completed` and `dismissed` unless `?triaged=1`; count them as
   `hiddenCount` either way.
5. Rank.

**Novelty decay:**

```
effectiveScore = score × exp(−daysSinceCreated / 14)
```

`DECISION_NOVELTY_TAU_DAYS = 14` (`decision-params.ts:87`), applied at
`feed.ts:257-259`. A finding halves in rank roughly every 9.7 days. `created_at`
is the *emission's* creation, so a finding that keeps re-emitting keeps
resurfacing — decay measures how long this observation has been on screen, not how
old the underlying problem is.

Sections are emitted in fixed category order — `needs_attention`, `opportunity`,
`working`, `system` — with empty sections omitted entirely.

Parsing is strict and total throughout: `toEmission` (`:142`) returns `null` on
any malformed field and the row is skipped rather than rendered half-populated.

---

## 8. Surfaces

### 8.1 `/intel` — Overview

`app/intel/(app)/page.tsx`. Seven independent server queries fan out under one
`Promise.all`, each rendering its own loaded / empty / failed state:

`fetchDecisionFeed` · `fetchSiteRangeTotals('28d')` ·
`fetchLeadDailySeriesInLastDays(28)` · `fetchActivity` ·
`fetchCrawlerPlatformOverview` · `fetchSyncHealth` · `fetchLocalPresence`

Stat strip: findings with `status === 'new'`, leads in 28 days, and GSC clicks and
impressions for 28 days. **The lead window and the GSC window are not the same
28 days** — leads are rolling from `now`, GSC ends at the latest complete day.
Both are labelled "28 days".

### 8.2 `/intel/search` — Search

`app/intel/(app)/search/page.tsx`. Ranges `28d | 90d | 180d`
(`SEARCH_RANGES`), default `28d`, invalid values silently coerced.

`fetchSearchIntelligence` returns a four-way discriminated union — `{ok:false}`,
`no_data`, `empty_range`, `ready` — and the page renders a distinct surface for
each. A failed query never looks like an empty result.

One optimisation worth knowing: when comparison is available the loader widens the
DB query to `{ comparison.start … span.end }` and slices in memory
(`search.ts:533`), so current and prior periods cost one round-trip, not two.

Panels on `ready`: summary cards, trend chart, top 20 queries by impressions,
gaining/losing movers (min 10 impressions on either side, top 10 each), near-page-one
(impressions ≥ 20, position 8–20), and a standing caveat that average position is
directional.

### 8.3 Mutations

`updateDecisionStatus` (`app/intel/(app)/actions.ts`). Zod-validated,
allowlist-authenticated, writes only `finding_state`. `isFindingKey`
(`decision-params.ts:76`) rejects any key carrying a date suffix — a guard against
an emission key being passed where an identity key belongs.

Idempotent: setting the current status again is a no-op returning `{ok:true}`
unless it carries a new completion note. `completed_at` is set on the transition
into `completed` and cleared on any transition out.

---

## 9. Failure semantics

The governing rule: **a failed query and an empty result must never render
identically.** Every data function returns a discriminated union; every panel has
three states; `PanelRetry` calls `router.refresh()`.

### `sync_runs`

Written by `gsc`, `ga4`, `clarity`, `decisions`, and — in code — `psi` and `gbp`.
Status is `running | success | partial | failed`. The provider column has a
**closed check constraint**, widened by `0015` (adds `decisions`), `0017_psi_results`
(adds `psi`), and `0022_gbp_tracking` (adds `gbp`).

This constraint is a landmine. A new provider that writes before its migration is
applied fails its opening insert, and the sync aborts before doing any work. Both
`0017_psi_results.sql` and `0022_gbp_tracking.sql` carry the header "This file has
not been applied to the database" — if that is still true, the PSI and GBP crons
fail closed at their first insert. **Unverified against the live database.**

The reports cron deliberately does *not* write `sync_runs` — it is a report run,
not a data sync, and adding a provider would have meant widening the constraint
again. Judge that run from its HTTP response.

### Health panel

`lib/intel/sync-health.ts`. Latest run per provider plus a consecutive-unhealthy
streak over a 30-run lookback. Healthy providers collapse to one summary line;
only failing providers get a row. A success older than 48 hours is stale. A
provider with no runs at all is a distinct state from a failed run.

**The panel is built to stay quiet when everything is fine.** Four green rows
every day would stop being read. Do not treat "four green `sync_runs` rows" as the
success criterion for unattended crons.

`SYNC_PROVIDERS` is hardcoded to `['gsc','ga4','clarity','decisions']`
(`sync-health.ts:5`) — see §12.2.

### Activity feed

`fetchActivity` fans out to seven sources and **fails the whole panel if any one
fails** (`lib/intel/activity.ts:85-95`). Deliberate — a partial chronological feed
hides what is missing — but one flaky query takes down a panel that would
otherwise be mostly useful, and the logging is generic from all seven call sites,
so a failure does not name its source.

---

## 10. The second GSC path: client reports

`lib/reports/gsc.ts` is a completely separate implementation for monthly client
reports. It uses the `googleapis` SDK with `google.auth.JWT` rather than the
hand-rolled signing in `lib/gsc/`, reads `siteUrl` from the `clients` row rather
than env, and issues six parallel queries (current and prior × totals, queries,
pages) at a 25-row fetch limit, trimmed to a top 10.

`careTier === 'essential'` short-circuits to `{ ok: true, skipped: true }` before
any network call — Essential Care reports contain no Search Console section. Both
`care` and `growth` include it.

Report blockers versus warnings matter here: `gsc_failed` and `gsc_empty_rows` are
**blockers** — the report is `failed` and not sendable, because Search Console is
the report's substance. CrUX and uptime failures are warnings that omit a section
and still send.

Note that `emptyRows` is derived from the *totals* query returning no rows, and a
freshly verified property returns no rows for several days. That is expected
post-onboarding behaviour, not a misconfiguration.

---

## 11. Adjacent search signals

### 11.1 AI crawler tracking

`lib/intel/crawlers.ts` + `app/robots.txt/route.ts`. Six platform buckets —
OpenAI, Perplexity, Anthropic, Google, Microsoft, Other — over 20 named bots.

**Hits are recorded on `/robots.txt` only.** `recordCrawlerHit` hardcodes
`path: '/robots.txt'` (`crawlers.ts:98`) and the only caller is the robots.txt
route. This measures robots.txt fetches, not page crawls — it is a proxy for AI
crawler interest, and the panel copy says so. The route is `force-dynamic` with
`Cache-Control: no-store` so every fetch is observed.

Recording runs inside `after()` so it never delays or fails the robots.txt
response, and `recordCrawlerHit` swallows its own errors for the same reason.

Matching is longest-name-first (`BOT_MATCH_ORDER`, `:69`) so `OAI-SearchBot` is
not shadowed by a shorter substring. The overview reads a 30-day window capped at
10 000 hits; first-seen detection additionally probes for any prior hit and **fails
toward "not new"** on error (`botHasHitBefore:271`) — a false "first visit" alert
is worse than a missed one.

The bot list and the robots.txt allowlist are maintained separately and have
drifted: robots.txt names `Claude-Web`, which is not in `BOTS_BY_PLATFORM`; the
bot list names `Claude-User`, `OAI-SearchBot`, `Applebot`, `Bytespider`,
`Amazonbot`, and `meta-externalagent`, which robots.txt does not name explicitly.
Neither list is wrong — the `User-Agent: *` block covers everything — but they are
not a single source of truth.

### 11.2 Local presence

`lib/intel/gbp.ts` + `lib/intel/local-presence.ts`, cron `0 8 * * *`. Google Places
API (`places:searchText` and Place Details) captures a daily snapshot of rating and
review count for named places, biased to a 50 km radius around Las Vegas
(`gbp.ts:12-14`). Snapshots are unique on `(gbp_place_id, captured_on)`. The
Overview panel shows rating, review count, and review delta. Rows with
`client_id is null` are the operator's own competitive set.

### 11.3 PSI

`lib/psi/sync.ts`, cron `45 9 * * *`, writes `psi_results` per client per strategy.
Lab data — not comparable to CrUX field data, and never a substitute for it.

---

## 12. Divergences found while writing this

These were found by reading source on 2026-09-09. They are stated as observations,
not as work items.

### 12.1 Detectors and display use different completed-day rules

`latestCompleteDay` caps display at today−3. `completedPeriodEnd`
(`run.ts:49`) caps only at today−1, which given a sync writing through today−2 is
never binding — detectors run on a 28-day window ending **today−2**, the exact day
the display layer excludes as unreliable.

Consequence: detectors see the zero-filled trailing day. A day of zeros inside a
28-day sum slightly depresses group impressions and CTR, which can move a finding
across a threshold. The comment at `search-params.ts:93` states detectors already
share this rule; they do not.

### 12.2 `psi` and `gbp` are invisible to the health panel and activity feed

`SYNC_PROVIDERS` (`sync-health.ts:5`) and `SyncProvider` (`activity.ts:38`) are
both still the four-value union. `lib/psi/sync.ts:36` and `lib/intel/gbp.ts:79`
write `sync_runs` rows with providers `psi` and `gbp`. Those rows are read and
silently discarded — `isSyncProvider` rejects them and the row is skipped
(`activity.ts:649`).

This is the same defect PLAN.md records as having been fixed for `decisions`,
recurring for the two providers added since. A PSI or GBP sync can fail every day
without appearing anywhere on the dashboard.

### 12.3 The decision feed has no pagination

`fetchDecisionFeed` selects `decision_items` and `finding_state` with no `.range()`
and no `.limit()` (`feed.ts:313-317`). PostgREST applies its default row cap
(Supabase default 1 000). `decision_items` gains one row per finding per daily run
and nothing prunes it — a steady 5 findings/day reaches 1 000 rows in about
200 days.

Past that point the feed silently reads only the newest 1 000 emissions. Because
the query orders by `period_end desc` the newest windows survive, so the visible
symptom is not an empty feed but findings quietly disappearing. Every Overview
render also pays for the full scan.

### 12.4 Detector scores are not comparable

All three detectors emit `opportunity`, so they rank against each other in one
section, but their score formulas have unrelated scales: `impressions×100/position`
(≈222 for a threshold buried-demand finding), `(31−position)×impressions` (≈168 for
a strong within-reach finding), and bare `impressions` (15 at the geo-signal
threshold). geo-signal findings therefore sort below almost everything, regardless
of how interesting they are.

### 12.5 Smaller items

- `geoSignalDetector` builds `focusSet` from `GEO_FOCUS` and checks it against
  `NON_FOCUS_GEO_TERMS` (`geo-signal.ts:66-69`). The two lists are disjoint by
  construction, so the guard can never skip a term. Harmless, but it reads as
  protection that is not doing anything.
- `hasCommercialComparisonIntent` (`within-reach.ts:23`) uses substring `includes`
  where the sibling detectors use whole-word regex. "best" matches inside
  "bestseller".
- Two migrations share the number `0017` — `0017_psi_results.sql` and
  `0017_reports_pdf_storage.sql`. Ordering between them is filename-alphabetical
  by accident.
- `CLAUDE.md` documents `care_tier` as `essential | care` only.
  `0019_care_tier_growth.sql` adds `growth` but is marked not applied. If it has
  since been applied, `CLAUDE.md` is stale; if not, a `growth` client cannot be
  inserted. **Unverified against the live database.**
- `provider_coverage`'s check constraint still allows only `ga4 | gsc | clarity`.
- PLAN.md lists `percentChangeFromPrior` as a dead export in
  `lib/intel/format-change.ts`; that file now exports only
  `MEANINGFUL_COMPARISON_BASE` and `formatPercentAgainstMeaningfulBase`.
- PLAN.md lists the AI platforms 30-day window as unlabelled; the panel now says
  "Crawler visits to robots.txt in the last 30 days"
  (`AiPlatformsPanel.tsx:19`).

---

## 13. Invariants

Rules that hold today and should be preserved deliberately rather than by accident.

1. **Detectors are pure.** No I/O inside `detect()`. All data arrives in
   `DetectorInput`.
2. **`finding_key` is identity; `emission_key` is an observation.** Operator state
   lives only in `finding_state`.
3. **Never average daily averages.** CTR and position are impression-weighted,
   everywhere.
4. **Zero and null are different.** `null` means no data; `0` means measured zero.
   This survives from the aggregation functions to the chart.
5. **A failed query renders differently from an empty result.** Every data
   function returns a discriminated union.
6. **Percentages require a base of at least 10.**
7. **Display never shows a day newer than today−3 UTC.**
8. **Comparison is refused, not approximated, outside `provider_coverage`.**
9. **Cron routes return errors in the response body.** Vercel does not surface
   `console.error` from them.
10. **Every new table needs explicit `service_role` grants.** The SQL editor does
    not add them.
11. **Verify what actually applied.** A migration file reporting success does not
    guarantee every statement ran. Check `pg_constraint` and row counts directly
    after applying anything.
12. **A new `sync_runs` provider requires widening the check constraint first.**
    The insert fails closed and the sync never runs.

---

## Verification notes

| Claim | Status |
|---|---|
| GSC scope `webmasters.readonly` | Verified — `lib/gsc/auth.ts:7` |
| Sync window today−5 … today−2 | Verified — `lib/gsc/sync.ts:58,93` |
| Zero-fill of absent site dates | Verified — `lib/gsc/sync.ts:453-466` |
| Backfill floor `2025-12-18` | Verified — `lib/gsc/sync.ts:12`; matches `0009` coverage backdate |
| 25 000-row API pages, 500-row upsert chunks | Verified — `client.ts:5`, `sync.ts:13` |
| Display cap today−3 | Verified — `search-params.ts:97-115` |
| Detector cap today−1 (effectively today−2) | Verified — `run.ts:49-55` |
| Impression-weighted CTR and position | Verified — `search.ts:224`, `grouping.ts:214` |
| Detector thresholds as tabled in §6.3 | Verified — all three detector files |
| Novelty tau 14 days | Verified — `decision-params.ts:87`, `feed.ts:257` |
| `decision_items` status columns dead | Verified — no reader or writer in `lib/` or `app/` |
| Feed has no pagination | Verified — `feed.ts:313-317`; no `db.max_rows` override in `lib/supabase/service.ts` |
| `psi`/`gbp` discarded by activity + health | Verified — `activity.ts:38`, `sync-health.ts:5` |
| Crawler hits only from `/robots.txt` | Verified — `crawlers.ts:98`, sole caller `app/robots.txt/route.ts` |
| Cron schedules | Verified — `vercel.json`. UTC is the Vercel platform default and is not restated in the file |
| `0017_psi`/`0022_gbp` unapplied | **Unverified.** File headers say so; live DB not inspected |
| `0019_care_tier_growth` unapplied | **Unverified.** Same |
| Row counts, backfill completeness | **Unverified.** Not in the repo |
| Vercel env matrix | **Unverified.** Not in the repo |

---
---

# Part II — Phase 2 proposal

**Nothing below this line exists.** Sections 14–20 are a proposal, written
2026-09-09. No production code has been written against them and none should be
until Section 20 is signed off.

---

## 14. Scope and decisions of record

Phase 2 adds three scan types — SEO, AEO, GEO — to the Intel pipeline. Four
decisions were taken 2026-09-09 and are recorded here so later readers can see
what was chosen and what was rejected.

| Decision | Choice | Rejected alternative |
|---|---|---|
| Tenancy | **Vizantir-only.** Single-tenant, no `client_id` on any new table. | Multi-tenant from the start; schema-ready-but-unused `client_id` |
| Findings storage | **Reuse `decision_items` + `finding_state`**, with a new category so scan findings render as their own section. | Separate `scan_findings` tables |
| Client exposure | **Internal only.** No report path touched. | Add to Care/Growth reports; snapshot-shaped for later |
| Scan types | **All three** — SEO, AEO, GEO | Any subset |

Choosing all three makes Section 15 non-optional: the four defects in §12 are
inherited and amplified by every detector added, and two of them become
load-bearing rather than latent.

### 14.1 Implementation order

**This order is binding.** Each phase completes and is confirmed in production
before the next begins. The sequence is not arbitrary: 2a removes defects that
every later phase would inherit, and 2b builds the fetch-and-parse infrastructure
that 2c and 2d both depend on.

| Phase | Scope | Depends on | Section |
|---|---|---|---|
| **2a** | Fix the existing Intel defects found in the architecture review. No new detectors. | — | §15 |
| **2b** | Deterministic **SEO** scanning and findings. Builds `lib/scan/*`, both snapshot tables, the cron, and the first detectors. | 2a | §18.1, §18.4 |
| **2c** | Deterministic **AEO** scanning and findings. Adds schema extraction and the route-to-expected-types map. | 2b | §18.2 |
| **2d** | **GEO** foundations and AI crawler visibility. | 2b | §18.3 |

Why this order and not another:

- **2a first** because §15.1 and §15.2 are silent failure modes. Adding detectors
  on top of an unpaginated feed and a misaligned window means new findings that
  quietly never appear, diagnosed later at much greater cost.
- **2b before 2c and 2d** because SEO is the only scan that is purely
  deterministic end to end. It builds the fetcher, the parser, the snapshot
  tables, and the cron — infrastructure both later phases reuse. It is also the
  phase whose findings are least arguable, which makes it the right place to
  calibrate noise levels before adding anything with judgment in it.
- **2c before 2d** only because AEO reuses the page-level parse output directly,
  where GEO is mostly site-level and touches a separate existing table
  (`crawler_hits`). The two are close to independent and could swap if
  something forces it.

Each phase is independently shippable. Stopping after 2b leaves a working,
useful system — that is a deliberate property of the split, not a coincidence.

---

## 15. Phase 2a — prerequisite fixes

These are the §12 defects that Phase 2 makes worse. They should land, and be
confirmed in production, **before** any scan code is written. None of them are
scan work; all of them are cheap relative to what they prevent.

### 15.1 Paginate the decision feed — blocking

`fetchDecisionFeed` (`feed.ts:313-317`) has no `.range()` and no `.limit()`, so
PostgREST's 1 000-row default silently truncates, and nothing prunes
`decision_items`. Phase 2 adds roughly six detectors to the existing three, and
`scan_page_snapshots` will drive per-URL findings rather than per-group ones —
the emission rate goes from single digits per day to potentially dozens.

Two changes, both required:

1. Page the query, or scope it to recent `period_end` values rather than loading
   all history. The feed only ever uses the latest emission per `finding_key`,
   so loading every historical emission to throw nearly all of them away is
   wasted work regardless of the cap.
2. Add retention. A finding whose latest emission is older than some window is
   not being surfaced anyway; its emission history is audit data, not feed data.

This is the one item I would not start Phase 2 without. The failure mode is
silent — findings stop appearing, the feed still renders, nothing errors.

### 15.2 Align the detector window with the display window — blocking

`completedPeriodEnd` (`run.ts:49`) caps at today−1, which never binds; detectors
run on a window ending today−2, the zero-filled day the display layer excludes
(§12.1). Every new detector inherits this.

Fix by having `run.ts` call `latestCompleteDay` from `lib/intel/search-params.ts`
rather than its own local helper, so there is one implementation of the rule.

**This changes existing detector output.** Dropping the zero-filled trailing day
raises 28-day group impressions and CTR slightly, so findings sitting near a
threshold may appear or disappear once. That is a visible change on a production
surface and should be expected rather than treated as a regression.

### 15.3 Teach the health panel and activity feed about new providers — blocking

`SYNC_PROVIDERS` (`sync-health.ts:5`) and `SyncProvider` (`activity.ts:38`) are
four-value unions; `psi` and `gbp` rows are already written and silently
discarded (§12.2). A `scan` provider added the same way would be equally
invisible — a scan cron could fail every day with nothing on the dashboard.

Fix `psi` and `gbp` at the same time. They are the same one-line-per-file change
and leaving them broken while adding a third instance of the same bug is not
defensible.

### 15.4 Decide what to do about score scales — not blocking

§12.4: the three existing detectors emit incomparable scores into one ranked
section. The chosen category split (§14) sidesteps this for scan findings by
giving them their own section, but does **not** fix it for the existing three,
and does not stop the six new scan detectors from being mutually incomparable
within their own section.

The principled fix is normalizing score to a common scale before ranking. The
pragmatic fix is accepting that ranking is within-detector-ish and leaning on
categories. Phase 2 can ship on the pragmatic answer; it should do so knowingly.

---

## 16. The central constraint

**Invariant 1 says detectors are pure functions with no I/O. Scans are nothing
but I/O.** This is the one real architectural problem in Phase 2, and the whole
design follows from how it is resolved.

The resolution is to not make scans detectors. Mirror the shape the GSC pipeline
already uses:

```
                    ── existing ──                    ── proposed ──

  I/O, cron      lib/gsc/sync.ts                  lib/scan/sync.ts
                        │                                │
  raw storage    gsc_site_daily                   scan_site_snapshots
                 gsc_query_page_daily             scan_page_snapshots
                        │                                │
  pure load      grouping.ts                      lib/scan/load.ts
                        └──────────┬─────────────────────┘
                                   ▼
  pure detect            detectors/*  ── detect(input): Finding[]
                                   │
                                   ▼
                    decision_items ──FK──▶ finding_state
                                   │
                                   ▼
                                /intel
```

Fetching, parsing, and HTTP failure handling happen in a cron-driven sync that
writes observations to Postgres. Detectors then read those observations out of
`DetectorInput` exactly as they read GSC rows today. No detector ever makes a
network call.

Two consequences worth stating:

- **Detectors stay testable and deterministic.** A scan detector is a pure
  function over a snapshot row, same as `buried-demand` is over a group rollup.
- **Cross-source detectors become possible and cheap.** Because GSC rows and
  scan rows arrive in the same `DetectorInput`, a detector can join them. §18.4
  is where this pays off, and it is the strongest argument for the reuse
  decision taken in §14.

### `DetectorInput` extension

Follow the `needsComparison` idiom exactly rather than inventing a new one:

```ts
type DetectorInput = {
  // ... existing fields unchanged
  scanAvailable: boolean
  scan?: {
    capturedOn: string
    pages: PageSnapshot[]
    site: SiteSnapshot
  }
}

type Detector = {
  name: string
  needsComparison?: boolean
  needsScan?: boolean          // new — skipped when scanAvailable is false
  detect(input: DetectorInput): Finding[]
}
```

`scan` is optional and `needsScan` defaults falsy, so the three existing
detectors compile and behave unchanged. `run.ts` skips `needsScan` detectors when
no snapshot exists for the period, the same way it already skips
`needsComparison` ones (`run.ts:414`).

Unlike `needsComparison` — which no detector currently sets, so the branch is
dead — `needsScan` will be exercised from day one, including on the first run
before any scan has happened.

---

## 17. New infrastructure

### 17.1 Migrations

Order is load-bearing. Per invariant 12, the constraint widening must be applied
and **verified** before any code writes a row that depends on it.

**`0023_scan_constraints.sql`** — constraints only, no tables:

```sql
alter table public.sync_runs drop constraint if exists sync_runs_provider_check;
alter table public.sync_runs add constraint sync_runs_provider_check
  check (provider in ('ga4','gsc','clarity','decisions','psi','gbp','scan'));

alter table public.decision_items
  drop constraint if exists decision_items_category_check;
alter table public.decision_items add constraint decision_items_category_check
  check (category in ('needs_attention','working','opportunity','system','site_health'));
```

Note this restates `psi` and `gbp`, which per §9 may never have been applied.
Applying `0023` therefore also repairs that, and the verification query in
§17.5 will show whether it was needed.

**`0024_scan_snapshots.sql`** — tables, RLS, and explicit grants (invariant 10).

```sql
create table if not exists public.scan_page_snapshots (
  id               bigint generated always as identity primary key,
  captured_on      date    not null,
  url              text    not null,
  http_status      integer,
  redirected_to    text,
  title            text,
  meta_description text,
  h1               text,
  canonical        text,
  robots_noindex   boolean not null default false,
  word_count       integer,
  schema_types     text[]  not null default '{}',
  internal_links   integer,
  fetch_ms         integer,
  error_reason     text,
  created_at       timestamptz not null default now(),
  constraint scan_page_snapshots_slice_key unique (url, captured_on)
);

create table if not exists public.scan_site_snapshots (
  id                 bigint generated always as identity primary key,
  captured_on        date    not null,
  robots_status      integer,
  sitemap_status     integer,
  sitemap_url_count  integer,
  llms_txt_status    integer,
  llms_full_status   integer,
  llms_missing_urls  integer,
  error_reason       text,
  created_at         timestamptz not null default now(),
  constraint scan_site_snapshots_day_key unique (captured_on)
);
```

`unique (url, captured_on)` and `unique (captured_on)` mirror the
`gbp_snapshots (gbp_place_id, captured_on)` pattern already in the codebase, so
a re-run on the same day upserts rather than duplicating.

**Retention is part of `0024`, not a later thought.** `scan_page_snapshots` grows
by one row per URL per day forever. At ~60 sitemap URLs that is ~22 000 rows a
year — not alarming, but it is the same unbounded shape as §12.3 and §4.4, and
this is the moment to not repeat it. Either a scheduled delete or a documented
retention window, decided in §20.

**`error_reason` is a column, not a dropped row.** A URL that failed to fetch
must be storable as a failure rather than absent, or "the scan did not run" and
"this page is down" become indistinguishable — the same distinction invariant 4
protects for zero versus null.

### 17.2 Modules

Each mirrors an existing file so the patterns are already established:

| New module | Mirrors | Responsibility |
|---|---|---|
| `lib/scan/frontier.ts` | — | URL list to crawl, read from the site's own `/sitemap.xml` |
| `lib/scan/fetch.ts` | `lib/gsc/client.ts` | One page fetch, closed failure union, no throwing |
| `lib/scan/parse.ts` | — | Pure HTML → `PageObservation`. No I/O, no network |
| `lib/scan/sync.ts` | `lib/gsc/sync.ts` | Orchestration, `sync_runs`, chunked upserts, partial status |
| `lib/scan/load.ts` | `decisions/grouping.ts` | Read snapshots for a date into `DetectorInput` |
| `app/api/cron/scan/route.ts` | `app/api/cron/gsc-sync/route.ts` | Bearer auth, errors in the response body |

**The frontier comes from `app/sitemap.ts`**, fetched over HTTP as
`/sitemap.xml` rather than imported. Two reasons: it exercises the same artifact
Google consumes, so a broken sitemap is itself a finding; and importing it would
pull Sanity fetching into the scan process. `app/sitemap.ts` has
`revalidate = 3600` and hand-maintained `lastmod` dates whose staleness the doc
comment already flags as consequential — a scan is the natural place to detect
that drift.

`lib/scan/parse.ts` must be pure and separately testable. It is the only place
in Phase 2 where a subtle bug produces plausible-looking wrong findings rather
than a visible failure.

### 17.3 Cron

Add to `vercel.json`:

```json
{ "path": "/api/cron/scan", "schedule": "0 7 * * *" }
```

07:00 UTC, ahead of every existing job. It must complete before `/api/cron/decisions`
at 10:00 so detectors see the same day's snapshot; three hours is generous
headroom for the slowest job in the system.

It also needs a `functions` entry. Page fetching is far slower than any existing
sync — at ~60 URLs and a few hundred milliseconds each, sequential execution
exceeds the default limit:

```json
"app/api/cron/scan/route.ts": { "maxDuration": 300 }
```

Bounded concurrency (4–6 parallel fetches) rather than sequential, and rather
than unbounded — this is the site fetching itself, and an unbounded fan-out from
a 2048MB function against your own origin is a self-inflicted load spike.

### 17.4 The new category

`site_health` is proposed for the new `DECISION_CATEGORIES` value.

Being straight about what this is: the existing four categories are *semantic* —
they describe what the operator should do (`needs_attention`, `opportunity`,
`working`, `system`). `site_health` is closer to a *source* bucket, and adding
it slightly breaks that scheme. Its real job is presentational: keeping scan
findings from competing against GSC findings on incomparable score scales
(§12.4, §15.4).

That is a legitimate reason, but it is a workaround for a ranking problem, not a
taxonomy improvement. Named `site_health` rather than `scan` it at least reads
as a category an operator would recognize. Whether it should instead be three
categories — `seo`, `aeo`, `geo` — is left open in §20; three would add seven
total sections to the Overview, which is a lot of vertical space for a page that
already fans out seven queries.

### 17.5 Verification after applying

Per invariant 11, applying a migration file does not prove every statement ran:

```sql
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.sync_runs'::regclass and contype = 'c';

select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.decision_items'::regclass and contype = 'c';

select count(*) from public.scan_page_snapshots;
select count(*) from public.scan_site_snapshots;
```

The first two must show `scan` and `site_health` respectively. If they do not,
the scan cron will fail closed at its opening `sync_runs` insert and no scan
will ever run.

---

## 18. The three scans

Every proposed detector below is a pure function over snapshot rows, sets
`needsScan: true`, and emits category `site_health`.

Sections map to phases: **§18.1 and §18.4 are Phase 2b**, **§18.2 is Phase 2c**,
**§18.3 is Phase 2d**. See §14.1 for why that order is binding.

### 18.1 Phase 2b — SEO: technical and on-page

Fully deterministic. No external API, no judgment, cheapest to verify.

Per-page observations: HTTP status, redirect target, title, meta description,
first `h1`, canonical, `robots` noindex, word count, internal link count.

| Detector | Fires when | Why it matters |
|---|---|---|
| `sitemap-contradiction` | A URL in `sitemap.xml` returns non-200, redirects, or is `noindex` | The site is telling Google to crawl something it then refuses to serve. Unambiguous, and always a defect |
| `metadata-gap` | Missing or empty title, meta description, or `h1`; duplicate title across URLs | Deterministic and directly actionable |
| `thin-page` | Word count below a threshold on an indexable sitemap URL | Needs a threshold decision; noisier than the other two |

`sitemap-contradiction` is the highest-value detector in Phase 2 and the one I
would build first. It is unambiguous, cheap, and the sitemap is already
hand-maintained in `app/sitemap.ts` in a way that invites drift.

### 18.2 Phase 2c — AEO: structured data

The site already generates JSON-LD centrally: `lib/schema/index.ts` exports 16
builders (`faqSchema`, `articleSchema`, `breadcrumbSchema`, `serviceSchema`, and
so on), and `/schema-debug/[[...path]]` already renders what a given path emits.

That makes the valuable AEO check **drift between intent and output**, not
presence:

| Detector | Fires when | Why it matters |
|---|---|---|
| `schema-drift` | A page's rendered JSON-LD is absent, unparseable, or missing a type its route is built to emit | The builders exist; the failure mode is a page that stopped rendering one. Invisible without a scan |

**`schema-drift` is in scope for Phase 2c and stays in scope**, including the
work of building the route-to-expected-types map. That map is the largest single
unknown in the plan and the most likely source of schedule slip — it is not
derivable automatically and has to be written by reading the existing schema
files: `app/landing-pages/_schema.tsx`, `app/las-vegas-web-design/_schema.tsx`,
`app/website-redesign-las-vegas/_schema.tsx`,
`app/landing-pages/_lib/build-schema.tsx`, and the call sites of the builders in
`lib/schema/index.ts`.

That cost is accepted deliberately. Without the map, `schema-drift` degrades to
"is there any JSON-LD on this page", which the site would pass everywhere while
still being broken in the way that matters — a route that silently stopped
emitting `FAQPage` or `BlogPosting` renders valid, parseable JSON-LD of the
wrong shape. Presence-only checking would report that as healthy. The map is
what makes the detector worth building at all.

Mitigation for the slip risk: the map can start partial. A route absent from the
map is simply not checked, so Phase 2c can ship covering the highest-value routes
(services, landing pages, blog posts, case studies) and grow coverage later
without any schema or detector change.

#### `answer-gap` is excluded from Phase 2

Passage-level answerability — a heading phrased as a question with no answer
paragraph nearby — was considered and is **out of scope for the whole of
Phase 2**, not deferred within it.

The reason is a standard this codebase already holds elsewhere. Every existing
detector fires on a stated numeric threshold that can be argued about explicitly:
impressions ≥ 100, position > 40, CTR < 0.5%. `answer-gap` has no equivalent.
"Close proximity", "phrased as a question", and "answers it" are all judgment
calls dressed as rules, and a detector that fires on judgment produces findings
an operator cannot evaluate — which is precisely the noise the §6 design
deliberately avoids.

It becomes eligible for a later phase only if a defensible deterministic scoring
method is established first — a stated rule, with stated bounds, that a person can
disagree with concretely. Absent that, it stays out.

### 18.3 Phase 2d — GEO: foundations and AI crawler visibility

#### Crawler activity is not citation. This distinction is load-bearing.

`crawler_hits` records that a named bot fetched `/robots.txt` (§11.1). Read
precisely, one row is evidence of exactly one thing: **a crawler belonging to
that platform made an HTTP request to this site.**

It is not evidence, and must never be presented as evidence, that:

- the site's pages were crawled beyond `/robots.txt`
- any page was ingested into a training corpus or a retrieval index
- an answer engine retrieved a Vizantir page while composing an answer
- ChatGPT, Gemini, Perplexity, Google AI Overviews, or Bing Copilot **cited,
  linked, quoted, or named Vizantir** in any response
- any human being saw the brand in an AI-generated answer

The chain from a robots.txt fetch to a citation a person actually reads has at
least six links:

```
robots.txt fetch  →  page crawl  →  index/corpus inclusion  →
retrieval at query time  →  citation in a rendered answer  →  user impression
        ▲
   crawler_hits observes THIS ONE ONLY
```

Every link after the first is unobserved by this system, and the drop-off across
them is both large and unknowable from our side. A platform can crawl daily and
cite never. A platform can cite from a corpus crawled months ago while showing
no recent hits at all. **The correlation between the two ends of that chain is
not established, and Phase 2 must not imply it is.**

Measuring genuine citation visibility requires something categorically different
from what Phase 2 builds — referral traffic attributed to AI surfaces, direct
prompt testing against each platform on a fixed question set, or a third-party AI
visibility API. **None of those are in Phase 2, and Phase 2 does not approximate
them.**

Two rules follow, and they are binding on implementation:

1. **No GEO surface, detector title, description, or `recommendedAction` may use
   the words "cited", "citation", "mentioned", or "AI visibility" to describe
   `crawler_hits` data.** The honest vocabulary is "crawler activity", "crawler
   visits", and "crawler accessibility".
2. **The existing panel copy is the standard to hold.** `AiPlatformsPanel.tsx:19`
   currently reads "Crawler visits to robots.txt in the last 30 days. A proxy for
   AI…" — accurate about both the source and its status as a proxy. Anything
   added in Phase 2d must be at least that careful.

This restraint is the same one §1 describes for the detectors generally: the
system surfaces facts that deserve a human decision, and refuses to dress a weak
signal as a strong one. Presenting crawler hits as citation evidence would be the
single most misleading thing this system could do — and the most tempting, because
it is the number a client would most want to hear.

#### What Phase 2d actually builds

`app/llms.txt` and `app/llms-full.txt` both already exist, so presence checks are
trivially satisfied and not worth building. The useful checks are consistency
and accessibility.

| Detector | Fires when | Why it matters |
|---|---|---|
| `llms-drift` | URLs present in `sitemap.xml` are absent from `llms-full.txt`, or either file returns non-200 | Two hand-maintained inventories of the same site drift apart silently |
| `crawler-absence` | A platform with prior `crawler_hits` history records zero hits in the current 30-day window | A crawler that **stopped requesting robots.txt** is a signal worth a look. It says nothing about whether that platform ever cited the site, or still does |

Note the wording of `crawler-absence` carefully. It detects a change in crawler
request behaviour and nothing more. Its finding text must describe it that way —
a platform going quiet is a prompt to investigate accessibility, not a report of
lost citations.

**Per-path crawler tracking stays deferred.** Doing it properly means widening
`proxy.ts` — whose matcher is currently `'/'` — to every path, and calling
`recordCrawlerHit` with a real path instead of the hardcoded `'/robots.txt'`
(`crawlers.ts:98`). That puts a database write in the request path of every page
view from a matched bot, on a table with no pruning, behind a proxy that
currently does almost nothing.

The cost is real and immediate; the payoff is incremental over the robots.txt
proxy already in place. Critically, it would **not** close the gap described
above — knowing which pages a crawler fetched still tells us nothing about
retrieval or citation. It moves one link along a six-link chain. That is why it
is deferred rather than prioritized: it is more expensive than it looks and
buys less than it appears to.

`crawler-absence` and `llms-drift` together extract most of the available value
from `crawler_hits` as it already exists, with no ingest change at all.

### 18.4 Phase 2b — cross-source detectors, the payoff

These exist only because scan rows and GSC rows arrive in the same
`DetectorInput`. They are the concrete return on the §14 decision to reuse
`decision_items` rather than build a separate scan store.

| Detector | Fires when | Why it matters |
|---|---|---|
| `indexed-but-broken` | A URL with GSC impressions in the window returns non-200 or `noindex` in the latest scan | Google is sending people to a page the site no longer serves. Highest-severity finding available in the whole system |
| `demand-without-page` | A `within-reach` query's `topPage` fails its scan | Connects a ranking opportunity to a concrete technical cause |

`indexed-but-broken` is the single best argument for the architecture in §16.
Neither data source can produce it alone, and it is the only proposed detector
that would plausibly warrant category `needs_attention` rather than
`site_health` — which is worth deciding rather than defaulting.

---

## 19. What Phase 2 does not touch

Stated explicitly because the isolation is the reason the plan is safe to ship
incrementally.

- **No client report changes.** No report code path reads `gsc_site_daily`,
  `decision_items`, `finding_state`, or the new scan tables. `lib/reports/gsc.ts`
  is an independent implementation (§10) and is not modified.
- **No `REPORT_SNAPSHOT_VERSION` bump.** Snapshots stay at version 2 and remain
  immutable. No regenerated report changes.
- **No `clients` table changes.** `care_tier` is untouched; the
  `essential`-skips-GSC behavior is unchanged.
- **No `client_id` anywhere in Phase 2.** Both new tables are single-tenant, in
  line with the §14 decision.
- **No new external credential.** Scans fetch the public site over HTTP. No API
  key, and no additional exposure on `GSC_SERVICE_ACCOUNT_KEY`.
- **No change to the GSC ingest path.** `lib/gsc/*` is read-only from Phase 2's
  perspective. §15.2 changes `run.ts`, not the sync.

The one shared surface is `/intel` itself: the Overview grows a section, and the
decision feed carries more findings. That is the intended change.

---

## 20. Decisions

### 20.1 Settled — do not relitigate without a stated reason

These are decided. They are recorded here so a later reader can see they were
chosen rather than overlooked.

| # | Decision | Where |
|---|---|---|
| S1 | **Implementation order is 2a → 2b → 2c → 2d**, each confirmed in production before the next starts. | §14.1 |
| S2 | **Phase 2a fixes existing Intel defects first.** No new detectors until §15.1–§15.3 are live and verified. | §15 |
| S3 | **`answer-gap` is out of Phase 2 entirely.** It becomes eligible only if a defensible deterministic scoring method — a stated rule with stated bounds — is established first. | §18.2 |
| S4 | **`schema-drift` stays in scope**, including the cost of hand-building the route-to-expected-schema-type map from the existing schema files. The map may start partial and grow. | §18.2 |
| S5 | **Per-path crawler tracking stays deferred.** It is more expensive than it looks and moves one link along a six-link chain. | §18.3 |
| S6 | **Crawler activity is never presented as citation evidence.** Binding on all surfaces, titles, descriptions, and recommended actions. | §18.3 |
| S7 | **Internal only.** No client report path is touched in any phase of Phase 2. | §14, §19 |
| S8 | **Single-tenant.** No `client_id` on any new table. | §14 |

### 20.2 Open — needed before implementation starts

Five items. The first three are blocking.

**Blocking**

1. **Confirm Phase 2a's visible side effect is acceptable.** §15.2 will change
   existing detector output once — findings sitting near a threshold will appear
   or disappear when the zero-filled trailing day drops out of the window. That
   is a live surface changing, and it should be expected rather than diagnosed
   as a regression after the fact.
2. **Retention on `scan_page_snapshots`, decided now.** A window (90 days? 180?)
   or a scheduled delete, written into `0024` rather than added later. This is
   the one chance not to repeat §4.4 and §12.3.
3. **One category or three.** `site_health` alone, or `seo` / `aeo` / `geo`.
   Three gives cleaner separation and worse Overview density — seven sections on
   a page that already runs seven queries. I lean to one.

**Non-blocking — can be settled during Phase 2a**

4. **Crawl budget and concurrency.** 300s `maxDuration` and 4–6 parallel fetches
   against your own origin, on the Sanity-backed sitemap. Confirm the URL count
   is what you expect before sizing this.
5. **`indexed-but-broken` category.** It is the most severe finding in the
   system and arguably belongs in `needs_attention`, not `site_health` — which
   partly undercuts the clean source split in §17.4. Worth deciding deliberately.
6. **`thin-page` threshold.** Needs a number, and the number is a judgment call
   about your own content.
7. **Score normalization (§15.4).** Ship on the pragmatic answer — categories
   instead of comparable scores — or fix it properly first.

**Known risks accepted by this plan**

- `schema-drift` needs a route-to-expected-types map derived from the existing
  `_schema.tsx` files. This is the largest unknown in the plan and the most
  likely source of schedule slip.
- `lib/scan/parse.ts` is the one component where a bug yields plausible wrong
  findings rather than a visible failure. It should be pure and tested — noting
  that the repo currently has no test runner at all, which is itself a decision
  to make rather than inherit.
- Scan findings will initially be noisy. Every existing detector was tuned
  against real data after first run; these will need the same, and the first
  week of output should be read as calibration rather than a work queue.
