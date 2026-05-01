-- Vizantir form protection foundation
-- Run once per project. Idempotent.

-- =====================================================
-- Rate limiting (shared across all forms)
-- =====================================================

create table if not exists rate_limits (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  form_key text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limits_lookup_idx
  on rate_limits (ip_hash, form_key, created_at desc);

alter table rate_limits enable row level security;

drop policy if exists "service_role_all" on rate_limits;
create policy "service_role_all" on rate_limits
  for all using (auth.role() = 'service_role');

-- Required when "Automatically expose new tables" was disabled at project setup.
-- Without this, service_role lacks table-level privileges and queries fail with
-- "permission denied for table X" — RLS policy is irrelevant if Postgres
-- rejects at the privilege layer first.
grant select, insert, update, delete on public.rate_limits to service_role;

-- =====================================================
-- Newsletter subscribers (only if newsletter form exists)
-- =====================================================

create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status text not null check (status in ('pending', 'confirmed', 'unsubscribed')),
  confirmation_token text,
  token_expires_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists newsletter_subscribers_token_idx
  on newsletter_subscribers (confirmation_token)
  where confirmation_token is not null;

alter table newsletter_subscribers enable row level security;

drop policy if exists "service_role_all" on newsletter_subscribers;
create policy "service_role_all" on newsletter_subscribers
  for all using (auth.role() = 'service_role');

-- Required when "Automatically expose new tables" was disabled at project setup.
-- Without this, service_role lacks table-level privileges and queries fail with
-- "permission denied for table X" — RLS policy is irrelevant if Postgres
-- rejects at the privilege layer first.
grant select, insert, update, delete on public.newsletter_subscribers to service_role;
