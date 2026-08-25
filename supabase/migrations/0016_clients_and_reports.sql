-- MUST BE APPLIED MANUALLY IN THE SUPABASE SQL EDITOR.
-- This project has no migrate runner. Pasting this file is the apply step.
-- This file has not been applied to the database.
--
-- Monthly client reporting: clients + reports.

create table if not exists public.clients (
  id                     uuid        primary key default gen_random_uuid(),
  name                   text        not null,
  slug                   text        not null,
  site_url               text        not null,
  contact_email          text        not null,
  care_tier              text        not null,
  ga4_property_id        text,
  gsc_site_url           text,
  crux_origin            text,
  uptimerobot_monitor_id text,
  engagement_metrics     jsonb,
  active                 boolean     not null default true,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint clients_slug_key unique (slug),
  constraint clients_care_tier_check
    check (care_tier in ('essential', 'care'))
);

create table if not exists public.reports (
  id             uuid        primary key default gen_random_uuid(),
  client_id      uuid        not null references public.clients(id) on delete cascade,
  period         date        not null,
  tier           text        not null,
  status         text        not null default 'pending',
  snapshot       jsonb,
  analysis       text,
  work_completed text,
  pdf_path       text,
  token          text,
  sent_at        timestamptz,
  send_error     text,
  opened_at      timestamptz,
  created_at     timestamptz not null default now(),
  constraint reports_client_id_period_key unique (client_id, period),
  constraint reports_token_key unique (token),
  constraint reports_tier_check
    check (tier in ('essential', 'care')),
  constraint reports_status_check
    check (status in ('pending', 'draft', 'sent', 'failed')),
  constraint reports_sent_requires_sent_at_check
    check (status <> 'sent' or sent_at is not null)
);

create index if not exists reports_client_id_period_idx
  on public.reports (client_id, period desc);

create index if not exists clients_slug_idx
  on public.clients (slug);

alter table public.clients enable row level security;
alter table public.reports enable row level security;

create policy clients_service_role
  on public.clients
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy reports_service_role
  on public.reports
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

grant select, insert, update, delete on public.clients to service_role;
grant select, insert, update, delete on public.reports to service_role;
