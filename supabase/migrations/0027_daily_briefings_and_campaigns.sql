-- MUST BE APPLIED MANUALLY IN THE SUPABASE SQL EDITOR.
-- This project has no migrate runner. Pasting this file is the apply step.
-- This file has not been applied to the database.
--
-- Daily briefing and scheduled prospect research.
--
-- Additive only. Creates two new tables and touches nothing that exists.
--
--   daily_briefings     one row per local (America/Los_Angeles) briefing date
--   prospect_campaigns  recurring research requests; the briefing cron queues
--                       a requested prospect_runs row when one is due
--
-- Apply this BEFORE deploying the code that reads these tables. The briefing
-- page and the campaigns section select from them, and a select on a missing
-- table fails the query.
--
-- The final statement is a SELECT that returns both table names with their
-- RLS status, so running this file shows proof that it applied.

begin;

create table if not exists public.daily_briefings (
  id                uuid        primary key default gen_random_uuid(),
  briefing_date     date        not null,
  generated_at      timestamptz not null default now(),
  status            text        not null,
  content           jsonb       not null,
  narrative         text,
  source_freshness  jsonb       not null default '[]'::jsonb,
  error             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint daily_briefings_briefing_date_key unique (briefing_date),
  constraint daily_briefings_status_check
    check (status in ('complete', 'no_narrative', 'failed')),
  constraint daily_briefings_content_object_check
    check (jsonb_typeof(content) = 'object'),
  constraint daily_briefings_source_freshness_array_check
    check (jsonb_typeof(source_freshness) = 'array')
);

comment on column public.daily_briefings.briefing_date is
  'Local briefing date in America/Los_Angeles. One row per date.';
comment on column public.daily_briefings.content is
  'Structured sections built by code from read-only loaders. The page renders these; the narrative is supplementary.';
comment on column public.daily_briefings.error is
  'Why the narrative is missing (model not configured, call failed, invalid output), or why the briefing failed.';

create index if not exists daily_briefings_briefing_date_idx
  on public.daily_briefings (briefing_date desc);

create table if not exists public.prospect_campaigns (
  id              uuid        primary key default gen_random_uuid(),
  market          text        not null,
  industry        text        not null,
  target_count    integer     not null,
  exclusions      text[]      not null default '{}',
  cadence_days    integer     not null,
  active          boolean     not null default true,
  last_queued_at  timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint prospect_campaigns_target_count_check
    check (target_count between 1 and 50),
  constraint prospect_campaigns_cadence_days_check
    check (cadence_days between 1 and 90),
  constraint prospect_campaigns_market_check
    check (length(btrim(market)) between 1 and 120),
  constraint prospect_campaigns_industry_check
    check (length(btrim(industry)) between 1 and 120)
);

create index if not exists prospect_campaigns_active_idx
  on public.prospect_campaigns (active, last_queued_at);

-- Access. RLS enabled with a service-role policy, PLUS explicit grants.
-- Tables created through the SQL editor do not receive the automatic role
-- grants. Without them the service role gets Postgres 42501 on every write.
alter table public.daily_briefings enable row level security;
alter table public.prospect_campaigns enable row level security;

drop policy if exists daily_briefings_service_role on public.daily_briefings;
drop policy if exists prospect_campaigns_service_role on public.prospect_campaigns;

create policy daily_briefings_service_role
  on public.daily_briefings
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy prospect_campaigns_service_role
  on public.prospect_campaigns
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

grant select, insert, update, delete on public.daily_briefings to service_role;
grant select, insert, update, delete on public.prospect_campaigns to service_role;

grant select on public.daily_briefings to authenticated;
grant select on public.prospect_campaigns to authenticated;

commit;

-- Proof: both tables exist and RLS is enabled on each. Expect two rows, both
-- with rls_enabled = true.
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('daily_briefings', 'prospect_campaigns')
order by c.relname;
