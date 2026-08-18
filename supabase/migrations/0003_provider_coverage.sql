create table if not exists public.provider_coverage (
  id           bigint generated always as identity primary key,
  provider     text        not null,
  property_ref text        not null,
  started_on   date        not null,
  ended_on     date,
  note         text,
  created_at   timestamptz not null default now(),
  constraint provider_coverage_provider_check
    check (provider in ('ga4', 'gsc', 'clarity')),
  constraint provider_coverage_range_check
    check (ended_on is null or ended_on >= started_on)
);

create index if not exists provider_coverage_provider_idx
  on public.provider_coverage (provider, started_on);

alter table public.provider_coverage enable row level security;

create policy provider_coverage_service_role
  on public.provider_coverage
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

insert into public.provider_coverage (provider, property_ref, started_on, note) values
  ('ga4',     '506059011',              current_date, 'Property created empty; no pre-install history.'),
  ('clarity', 'ure4592vry',             current_date, 'Tag reinstalled; export API history unrecoverable.'),
  ('gsc',     'https://www.vizantir.com/', current_date, 'Placeholder. Backdate started_on to earliest GSC data after first backfill.');
