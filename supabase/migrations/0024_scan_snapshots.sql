-- MUST BE APPLIED MANUALLY IN THE SUPABASE SQL EDITOR.
-- This project has no migrate runner. Pasting this file is the apply step.
--
-- Search Intelligence Phase 2b, part 2 of 2. Apply 0023 FIRST.
--
-- Raw scan observations. Vizantir only (S8): neither table carries a
-- client_id, and nothing in lib/scan/ can target a client property. Phase 2
-- Search Intelligence is single-tenant by construction, not by convention.

begin;

-- Per-URL observation, one row per URL per day.
--
-- error_reason IS A COLUMN, NOT A DROPPED ROW. A URL we could not reach must
-- be storable as a failure rather than absent, or "the scan did not run" and
-- "this page is down" become indistinguishable. Same distinction invariant 4
-- protects for zero versus null. Detectors check it and skip such rows rather
-- than reporting our own network failure as a defect in the site.
--
-- Nullable columns are nullable on purpose: a non-2xx or non-HTML response has
-- no title to record, and null there means "no document was parsed", not
-- "the title is empty".
create table if not exists public.scan_page_snapshots (
  id               bigint generated always as identity primary key,
  captured_on      date        not null,
  url              text        not null,
  http_status      integer,
  redirected_to    text,
  title            text,
  meta_description text,
  h1               text,
  canonical        text,
  robots_noindex   boolean     not null default false,
  word_count       integer,
  schema_types     text[]      not null default '{}',
  internal_links   integer,
  fetch_ms         integer,
  error_reason     text,
  created_at       timestamptz not null default now(),
  constraint scan_page_snapshots_slice_key unique (url, captured_on)
);

-- Site-level observation, one row per day.
--
-- The llms_* columns are defined here but stay NULL throughout Phase 2b. They
-- are Phase 2d (GEO) and are declared now so that phase needs no migration.
create table if not exists public.scan_site_snapshots (
  id                bigint      generated always as identity primary key,
  captured_on       date        not null,
  robots_status     integer,
  sitemap_status    integer,
  sitemap_url_count integer,
  llms_txt_status   integer,
  llms_full_status  integer,
  llms_missing_urls integer,
  error_reason      text,
  created_at        timestamptz not null default now(),
  constraint scan_site_snapshots_day_key unique (captured_on)
);

-- Supports both the per-day detector load and the retention prune below.
create index if not exists scan_page_snapshots_captured_on_idx
  on public.scan_page_snapshots (captured_on);

-- Access. RLS enabled with a service-role policy, PLUS explicit grants.
--
-- The grants are required, not belt-and-braces (invariant 10). Tables created
-- through this SQL editor do not receive the automatic role grants Supabase
-- applies to tables created through its UI. Without them the service role gets
-- Postgres 42501 on every write, which reads as an RLS problem and is not.
alter table public.scan_page_snapshots enable row level security;
alter table public.scan_site_snapshots enable row level security;

drop policy if exists scan_page_snapshots_service_role on public.scan_page_snapshots;
drop policy if exists scan_site_snapshots_service_role on public.scan_site_snapshots;

create policy scan_page_snapshots_service_role
  on public.scan_page_snapshots
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy scan_site_snapshots_service_role
  on public.scan_site_snapshots
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

grant select, insert, update, delete on public.scan_page_snapshots to service_role;
grant select, insert, update, delete on public.scan_site_snapshots to service_role;

grant usage, select on all sequences in schema public to service_role;

commit;

-- ── RETENTION (S10, architecture 17.6) ──────────────────────────────────────
--
-- scan_page_snapshots rows may be pruned after 180 days. The prune runs in
-- application code at the end of each SUCCESSFUL scan
-- (SCAN_SNAPSHOT_RETENTION_DAYS in lib/scan/sync.ts), which keeps the write
-- and its cleanup in one place and leaves the rule visible in a repo file.
-- There is no migrate runner to enforce agreement between that constant and
-- this comment, so this is documentation, not a mechanism.
--
-- Equivalent to:
--   delete from public.scan_page_snapshots
--   where captured_on < (current_date - interval '180 days');
--
-- NOTHING ELSE IS PRUNED (invariant 14). decision_items, finding_state and
-- resolution history are the record of what was observed and what was decided
-- about it. They are not re-derivable from a re-scan and are kept
-- indefinitely. scan_site_snapshots is one row per day and is also kept.
--
-- The prune is a no-op until the table holds rows older than the window, so
-- the first real deletion is ~180 days after the first scan. That is the day a
-- bug in it would first show; the cron response body reports the deleted count
-- on every run so the day is visible rather than silent.

-- ── VERIFY AFTER APPLYING (invariant 11) ────────────────────────────────────
-- 1. Both tables exist and are empty:
--   select count(*) from public.scan_page_snapshots;
--   select count(*) from public.scan_site_snapshots;
--
-- 2. Grants are present for service_role on both:
--   select table_name, privilege_type
--   from information_schema.role_table_grants
--   where grantee = 'service_role'
--     and table_name in ('scan_page_snapshots', 'scan_site_snapshots')
--   order by table_name, privilege_type;
--
-- 3. Unique keys exist:
--   select conname, pg_get_constraintdef(oid)
--   from pg_constraint
--   where conrelid in (
--     'public.scan_page_snapshots'::regclass,
--     'public.scan_site_snapshots'::regclass
--   );
