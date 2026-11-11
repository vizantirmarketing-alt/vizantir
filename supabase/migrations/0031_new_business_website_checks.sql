-- MUST BE APPLIED MANUALLY IN THE SUPABASE SQL EDITOR.
-- This project has no migrate runner. Pasting this file is the apply step.
-- This file has not been applied to the database.
--
-- New Businesses, stage 2: website checks carried out by the external
-- research runner.
--
-- Additive only:
--   new_business_check_runs   the queue of website-check runs (a dedicated
--                             table; prospect_runs is unchanged)
--   new_businesses            six nullable columns for the website result
--                             and the run that holds or checked the business
-- No data is rewritten and nothing is dropped. RLS on the new table follows
-- the 0028 pattern: enabled, a service_role policy, explicit grants.
--
-- The server decides every website status (lib/new-businesses/website-rules.ts)
-- from the runner's observations; the runner never sends a status or score.
--
-- Safe for the code deployed before this change: that code reads and writes
-- explicit column lists, ignores columns it does not name, and never touches
-- the new table.
--
-- Requires 0028 to 0030. The final statement is a SELECT that returns one row
-- per new column and one row for the new table with its RLS status.

begin;

create table if not exists public.new_business_check_runs (
  id               uuid        primary key default gen_random_uuid(),
  source           text        not null default 'dashboard',
  state            text        not null default 'requested',
  -- The primary license row of each business in the run, set at claim time.
  business_ids     uuid[]      not null default '{}',
  business_count   integer     not null default 0,
  counts           jsonb       not null default '{"checked": 0, "rejected": 0}'::jsonb,
  record_outcomes  jsonb       not null default '{}'::jsonb,
  -- Typed lines, as on prospect_runs: "Note: ", "Runner: ", "System: ".
  error_summary    text,
  requested_at     timestamptz not null default now(),
  claimed_at       timestamptz,
  finished_at      timestamptz,
  updated_at       timestamptz not null default now(),
  constraint new_business_check_runs_state_check
    check (state in ('requested', 'claimed', 'completed', 'failed', 'cancelled')),
  constraint new_business_check_runs_source_check
    check (source in ('dashboard', 'schedule')),
  constraint new_business_check_runs_counts_object_check
    check (jsonb_typeof(counts) = 'object'),
  constraint new_business_check_runs_record_outcomes_object_check
    check (jsonb_typeof(record_outcomes) = 'object')
);

create index if not exists new_business_check_runs_state_requested_at_idx
  on public.new_business_check_runs (state, requested_at);
create index if not exists new_business_check_runs_requested_at_idx
  on public.new_business_check_runs (requested_at desc);

alter table public.new_businesses
  add column if not exists website_status        text check (website_status in
    ('no_website', 'social_only', 'placeholder', 'free_builder', 'has_website', 'unclear')),
  add column if not exists website_url           text,
  add column if not exists website_evidence      jsonb,
  add column if not exists website_rules_version text,
  add column if not exists website_checked_at    timestamptz,
  add column if not exists website_check_run_id  uuid
    references public.new_business_check_runs(id) on delete set null;

-- Claim selection: unchecked primary rows not held by a run.
create index if not exists new_businesses_website_status_idx
  on public.new_businesses (website_status);
-- Releasing a run's businesses, and finding which run checked a business.
create index if not exists new_businesses_website_check_run_idx
  on public.new_businesses (website_check_run_id);

-- Access. RLS enabled with a service-role policy, PLUS explicit grants.
-- Tables created through the SQL editor do not receive the automatic role
-- grants. Without them the service role gets Postgres 42501 on every write.
alter table public.new_business_check_runs enable row level security;

-- Created only when missing, so the file can be re-run without a drop.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'new_business_check_runs'
      and policyname = 'new_business_check_runs_service_role'
  ) then
    create policy new_business_check_runs_service_role
      on public.new_business_check_runs
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end
$$;

grant select, insert, update, delete on public.new_business_check_runs to service_role;
grant select on public.new_business_check_runs to authenticated;

commit;

-- Proof: expect six column rows and one table row with rls_enabled = true.
select 'new_businesses column' as kind, column_name as name, data_type as detail
from information_schema.columns
where table_schema = 'public'
  and table_name = 'new_businesses'
  and column_name in ('website_status', 'website_url', 'website_evidence', 'website_rules_version', 'website_checked_at', 'website_check_run_id')
union all
select 'table', c.relname, 'rls_enabled = ' || c.relrowsecurity::text
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'new_business_check_runs'
order by kind, name;
