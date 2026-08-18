create table if not exists public.gsc_query_page_daily (
  id           bigint generated always as identity primary key,
  date         date             not null,
  query        text             not null default '',
  page         text             not null default '',
  clicks       integer          not null default 0,
  impressions  integer          not null default 0,
  ctr          double precision not null default 0,
  position     double precision not null default 0,
  created_at   timestamptz      not null default now(),
  updated_at   timestamptz      not null default now(),
  constraint gsc_query_page_daily_slice_key unique (date, query, page)
);

create index if not exists gsc_query_page_daily_date_idx
  on public.gsc_query_page_daily (date desc);

create index if not exists gsc_query_page_daily_page_date_idx
  on public.gsc_query_page_daily (page, date desc);

create table if not exists public.gsc_site_daily (
  id           bigint generated always as identity primary key,
  date         date             not null,
  clicks       integer          not null default 0,
  impressions  integer          not null default 0,
  ctr          double precision not null default 0,
  position     double precision not null default 0,
  created_at   timestamptz      not null default now(),
  updated_at   timestamptz      not null default now(),
  constraint gsc_site_daily_date_key unique (date)
);

alter table public.gsc_query_page_daily enable row level security;
alter table public.gsc_site_daily enable row level security;

create policy gsc_query_page_daily_service_role
  on public.gsc_query_page_daily
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy gsc_site_daily_service_role
  on public.gsc_site_daily
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

grant select, insert, update, delete on public.gsc_query_page_daily to service_role;
grant select, insert, update, delete on public.gsc_site_daily to service_role;

grant usage, select on all sequences in schema public to service_role;

update public.provider_coverage
  set started_on = '2025-12-18'
  where provider = 'gsc';
