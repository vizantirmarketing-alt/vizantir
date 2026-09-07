-- MUST BE APPLIED MANUALLY IN THE SUPABASE SQL EDITOR.
-- This project has no migrate runner. Pasting this file is the apply step.
-- This file has not been applied to the database.
--
-- Google Business Profile tracking: named places plus daily snapshots.

alter table public.sync_runs
  drop constraint if exists sync_runs_provider_check;

alter table public.sync_runs
  add constraint sync_runs_provider_check
    check (provider in ('ga4', 'gsc', 'clarity', 'decisions', 'psi', 'gbp'));

create table if not exists public.gbp_places (
  id            uuid        primary key default gen_random_uuid(),
  display_name  text        not null,
  place_id      text,
  search_query  text,
  is_self       boolean     not null default false,
  client_id     uuid        references public.clients(id),
  created_at    timestamptz default now(),
  constraint gbp_places_place_id_key unique (place_id),
  constraint gbp_places_place_or_search_check
    check (place_id is not null or search_query is not null)
);

create table if not exists public.gbp_snapshots (
  id           bigint generated always as identity primary key,
  gbp_place_id uuid        not null references public.gbp_places(id) on delete cascade,
  found        boolean     not null,
  rating       double precision,
  review_count integer,
  captured_on  date        not null default current_date,
  created_at   timestamptz default now(),
  constraint gbp_snapshots_gbp_place_id_captured_on_key unique (gbp_place_id, captured_on)
);

alter table public.gbp_places enable row level security;
alter table public.gbp_snapshots enable row level security;

grant select, insert, update on public.gbp_places to service_role;
grant select, insert, update on public.gbp_snapshots to service_role;

insert into public.gbp_places (display_name, place_id, search_query, is_self, client_id) values
  ('Vizantir Design Studio', null, 'Vizantir Design Studio Las Vegas', true, null),
  ('K2 Analytics INC', 'ChIJ2U3Lq5bGyIARN7l-Y_-8vo0', null, false, null),
  ('702 Pros', 'ChIJlxa4-YPsyIAR3Z0KLAj2kGc', null, false, null),
  ('Once Interactive', 'ChIJMb0pwbjJyIARG1maPVvOMpU', null, false, null),
  ('Designer 1 Media', 'ChIJ5dRHuPLPyIARTJtNjv40xR8', null, false, null);
