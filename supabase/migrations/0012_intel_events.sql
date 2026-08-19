create table if not exists public.intel_events (
  id          bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  event_type  text        not null,
  title       text        not null,
  detail      text,
  href        text,
  source      text        not null default 'system',
  dedupe_key  text,
  created_at  timestamptz not null default now(),
  constraint intel_events_dedupe_key_key unique nulls not distinct (dedupe_key)
);

create index if not exists intel_events_occurred_at_idx
  on public.intel_events (occurred_at desc);

alter table public.intel_events enable row level security;

create policy intel_events_service_role
  on public.intel_events
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

grant select, insert, update, delete on public.intel_events to service_role;

grant usage, select on all sequences in schema public to service_role;
