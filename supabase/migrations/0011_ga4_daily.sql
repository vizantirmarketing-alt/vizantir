create table if not exists public.ga4_daily (
  id               bigint generated always as identity primary key,
  date             date        not null,
  channel_group    text        not null default '',
  users            integer     not null default 0,
  sessions         integer     not null default 0,
  engaged_sessions integer     not null default 0,
  views            integer     not null default 0,
  key_events       integer     not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint ga4_daily_date_channel_key unique (date, channel_group)
);

create index if not exists ga4_daily_date_idx
  on public.ga4_daily (date desc);

alter table public.ga4_daily enable row level security;

create policy ga4_daily_service_role
  on public.ga4_daily
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

grant select, insert, update, delete on public.ga4_daily to service_role;

grant usage, select on all sequences in schema public to service_role;
