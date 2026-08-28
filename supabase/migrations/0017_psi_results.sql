-- MUST BE APPLIED MANUALLY IN THE SUPABASE SQL EDITOR.
-- This project has no migrate runner. Pasting this file is the apply step.
-- This file has not been applied to the database.
--
-- PageSpeed Insights: latest PSI result per client per strategy.

alter table public.sync_runs
  drop constraint if exists sync_runs_provider_check;

alter table public.sync_runs
  add constraint sync_runs_provider_check
    check (provider in ('ga4', 'gsc', 'clarity', 'decisions', 'psi'));

create table if not exists public.psi_results (
  id                 uuid             primary key default gen_random_uuid(),
  client_id          uuid             not null references public.clients(id) on delete cascade,
  url                text             not null,
  strategy           text             not null,
  performance_score  integer          not null,
  lcp_ms             double precision not null,
  tbt_ms             double precision not null,
  cls                double precision not null,
  fetched_at         timestamptz      not null default now(),
  constraint psi_results_client_strategy_key unique (client_id, strategy),
  constraint psi_results_strategy_check
    check (strategy in ('mobile', 'desktop')),
  constraint psi_results_score_check
    check (performance_score between 0 and 100)
);

create index if not exists psi_results_client_id_idx
  on public.psi_results (client_id);

alter table public.psi_results enable row level security;

grant select, insert, update, delete on public.psi_results to service_role;
grant select on public.psi_results to authenticated;
