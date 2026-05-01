-- Vizantir form protection + contact submissions
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

-- =====================================================
-- Contact form submissions
-- =====================================================

create table if not exists contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  company text,
  service text not null,
  budget text,
  message text not null,
  ip_hash text,
  created_at timestamptz not null default now()
);

alter table contact_submissions enable row level security;

drop policy if exists "service_role_all" on contact_submissions;
create policy "service_role_all" on contact_submissions
  for all using (auth.role() = 'service_role');
