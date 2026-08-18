create table if not exists public.sync_runs (
  id                    bigint generated always as identity primary key,
  provider              text        not null,
  started_at            timestamptz not null default now(),
  completed_at          timestamptz,
  status                text        not null,
  records_processed     integer     not null default 0,
  data_through_date     date,
  error_code            text,
  administrator_message text,
  created_at            timestamptz not null default now(),
  constraint sync_runs_provider_check
    check (provider in ('ga4', 'gsc', 'clarity')),
  constraint sync_runs_status_check
    check (status in ('running', 'success', 'partial', 'failed'))
);

create index if not exists sync_runs_provider_started_at_idx
  on public.sync_runs (provider, started_at desc);

alter table public.sync_runs enable row level security;

create policy sync_runs_service_role
  on public.sync_runs
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
