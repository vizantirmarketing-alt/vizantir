-- MUST BE APPLIED MANUALLY IN THE SUPABASE SQL EDITOR.
-- This project has no migrate runner. Pasting this file is the apply step.
-- This file has not been applied to the database.
--
-- Prospect Intelligence: outbound prospect research.
--
-- Additive only. Creates three new tables and touches nothing that exists.
-- This is separate from inbound inquiries (contact_submissions), which stay
-- the lead table for people who contacted us.
--
--   prospect_runs      research requests; also the queue the external runner
--                      claims from (requested -> claimed -> completed/partial/failed,
--                      or cancelled by the owner)
--   prospects          one row per company, keyed by normalized domain
--   prospect_evidence  per-factor evidence rows backing each rating
--
-- Scores are computed in application code (lib/prospects/rubric.ts) and are
-- never accepted from the runner. factor_key and the factor_ratings keys are
-- DELIBERATELY UNCONSTRAINED TEXT: the factor set is governed by the rubric in
-- TypeScript and versioned by rubric_version, so a rubric change does not need
-- a hand-applied migration first.
--
-- Verification queries are at the bottom of this file. Run them after applying.

begin;

create table if not exists public.prospect_runs (
  id               uuid        primary key default gen_random_uuid(),
  state            text        not null default 'requested',
  config           jsonb       not null,
  requested_by     text,
  source           text        not null default 'dashboard',
  counts           jsonb       not null default '{"saved": 0, "rejected": 0}'::jsonb,
  record_outcomes  jsonb       not null default '{}'::jsonb,
  error_summary    text,
  requested_at     timestamptz not null default now(),
  claimed_at       timestamptz,
  finished_at      timestamptz,
  updated_at       timestamptz not null default now(),
  constraint prospect_runs_state_check
    check (state in ('requested', 'claimed', 'completed', 'partial', 'failed', 'cancelled')),
  constraint prospect_runs_config_object_check
    check (jsonb_typeof(config) = 'object'),
  constraint prospect_runs_counts_object_check
    check (jsonb_typeof(counts) = 'object'),
  constraint prospect_runs_record_outcomes_object_check
    check (jsonb_typeof(record_outcomes) = 'object')
);

comment on column public.prospect_runs.config is
  'Campaign config: { market, industry, targetCount, exclusions[] }. Written by the owner request form.';
comment on column public.prospect_runs.record_outcomes is
  'Per normalized domain outcome for this run ({ "example.com": { "status": "saved" | "rejected", "reasons": [] } }). Keyed by domain so re-ingesting the same batch does not double count.';

create index if not exists prospect_runs_state_requested_at_idx
  on public.prospect_runs (state, requested_at);

create index if not exists prospect_runs_requested_at_idx
  on public.prospect_runs (requested_at desc);

create table if not exists public.prospects (
  id                  uuid        primary key default gen_random_uuid(),
  canonical_name      text        not null,
  domain              text        not null,
  market              text,
  industry            text,
  factor_ratings      jsonb       not null,
  fit_score           integer,
  opportunity_score   integer,
  confidence          text        not null,
  rubric_version      text        not null,
  review_status       text        not null default 'unreviewed',
  owner_note          text,
  latest_run_id       uuid        references public.prospect_runs(id) on delete set null,
  last_researched_at  timestamptz not null default now(),
  reviewed_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint prospects_domain_key unique (domain),
  constraint prospects_domain_lowercase_check
    check (domain = lower(domain)),
  constraint prospects_fit_score_check
    check (fit_score is null or fit_score between 0 and 100),
  constraint prospects_opportunity_score_check
    check (opportunity_score is null or opportunity_score between 0 and 100),
  constraint prospects_confidence_check
    check (confidence in ('high', 'medium', 'low')),
  constraint prospects_review_status_check
    check (review_status in ('unreviewed', 'accepted', 'rejected', 'archived')),
  constraint prospects_factor_ratings_object_check
    check (jsonb_typeof(factor_ratings) = 'object')
);

create index if not exists prospects_review_status_idx
  on public.prospects (review_status, fit_score desc nulls last);

create index if not exists prospects_industry_idx
  on public.prospects (industry);

create index if not exists prospects_market_idx
  on public.prospects (market);

create table if not exists public.prospect_evidence (
  id           bigint      generated always as identity primary key,
  prospect_id  uuid        not null references public.prospects(id) on delete cascade,
  run_id       uuid        not null references public.prospect_runs(id) on delete cascade,
  factor_key   text        not null,
  kind         text        not null,
  claim        text        not null,
  source_url   text        not null,
  observed_at  timestamptz not null,
  created_at   timestamptz not null default now(),
  constraint prospect_evidence_kind_check
    check (kind in ('observation', 'measurement', 'inference'))
);

create index if not exists prospect_evidence_prospect_run_idx
  on public.prospect_evidence (prospect_id, run_id);

create index if not exists prospect_evidence_run_idx
  on public.prospect_evidence (run_id);

-- Access. RLS enabled with a service-role policy, PLUS explicit grants.
-- Tables created through the SQL editor do not receive the automatic role
-- grants. Without them the service role gets Postgres 42501 on every write.
alter table public.prospect_runs enable row level security;
alter table public.prospects enable row level security;
alter table public.prospect_evidence enable row level security;

drop policy if exists prospect_runs_service_role on public.prospect_runs;
drop policy if exists prospects_service_role on public.prospects;
drop policy if exists prospect_evidence_service_role on public.prospect_evidence;

create policy prospect_runs_service_role
  on public.prospect_runs
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy prospects_service_role
  on public.prospects
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy prospect_evidence_service_role
  on public.prospect_evidence
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

grant select, insert, update, delete on public.prospect_runs to service_role;
grant select, insert, update, delete on public.prospects to service_role;
grant select, insert, update, delete on public.prospect_evidence to service_role;

grant select on public.prospect_runs to authenticated;
grant select on public.prospects to authenticated;
grant select on public.prospect_evidence to authenticated;

grant usage, select on all sequences in schema public to service_role;

commit;

-- Verify after applying (separate statements, run each):
--
-- 1. All three tables exist and are empty:
--   select count(*) from public.prospect_runs;
--   select count(*) from public.prospects;
--   select count(*) from public.prospect_evidence;
--
-- 2. Check constraints are present:
--   select conrelid::regclass, conname, pg_get_constraintdef(oid)
--   from pg_constraint
--   where conrelid in (
--     'public.prospect_runs'::regclass,
--     'public.prospects'::regclass,
--     'public.prospect_evidence'::regclass
--   ) and contype in ('c', 'u')
--   order by 1, 2;
--
-- 3. service_role grants are present on all three:
--   select table_name, privilege_type
--   from information_schema.role_table_grants
--   where grantee = 'service_role'
--     and table_name in ('prospect_runs', 'prospects', 'prospect_evidence')
--   order by table_name, privilege_type;
