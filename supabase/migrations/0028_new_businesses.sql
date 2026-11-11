-- MUST BE APPLIED MANUALLY IN THE SUPABASE SQL EDITOR.
-- This project has no migrate runner. Pasting this file is the apply step.
-- This file has not been applied to the database.
--
-- New Businesses: Clark County's monthly new business license lists.
--
-- Additive only. Creates three new tables and touches nothing that exists.
--
--   new_business_imports     one row per source and period (year, month)
--   new_business_categories  every category seen; new categories are DISABLED
--   new_businesses           rows in enabled categories only
--
-- Privacy rule, enforced in application code (lib/new-businesses/import.ts):
-- only rows whose category is enabled are stored. Rows in disabled categories
-- are counted per category and discarded. Enabling a category later lets a
-- re-import of a stored period pick its rows up.
--
-- Re-importing the same file is idempotent: new_businesses is unique on
-- (source, period_year, period_month, dedupe_key), and rows are written with
-- insert-or-ignore so reviews are never overwritten.
--
-- Apply this BEFORE deploying the code that reads these tables. The final
-- statement is a SELECT that returns all three tables with their RLS status.

begin;

create table if not exists public.new_business_imports (
  id              uuid        primary key default gen_random_uuid(),
  source          text        not null,
  period_year     integer     not null,
  period_month    integer     not null,
  file_url        text        not null,
  state           text        not null default 'importing',
  rows_total      integer     not null default 0,
  rows_stored     integer     not null default 0,
  rows_discarded  integer     not null default 0,
  rows_inserted   integer     not null default 0,
  unparsed_lines  integer     not null default 0,
  error           text,
  started_at      timestamptz not null default now(),
  finished_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint new_business_imports_source_period_key unique (source, period_year, period_month),
  constraint new_business_imports_state_check
    check (state in ('importing', 'imported', 'failed')),
  constraint new_business_imports_month_check
    check (period_month between 1 and 12),
  constraint new_business_imports_year_check
    check (period_year between 2000 and 2100)
);

create table if not exists public.new_business_categories (
  id               uuid        primary key default gen_random_uuid(),
  source           text        not null,
  category         text        not null,
  enabled          boolean     not null default false,
  last_seen_count  integer     not null default 0,
  last_seen_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint new_business_categories_source_category_key unique (source, category)
);

create table if not exists public.new_businesses (
  id              uuid        primary key default gen_random_uuid(),
  source          text        not null,
  period_year     integer     not null,
  period_month    integer     not null,
  dedupe_key      text        not null,
  business_name   text        not null,
  address         text,
  suite           text,
  city            text,
  state           text,
  zip             text,
  phone           text,
  category        text        not null,
  review_status   text        not null default 'unreviewed',
  owner_note      text,
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint new_businesses_identity_key unique (source, period_year, period_month, dedupe_key),
  constraint new_businesses_review_status_check
    check (review_status in ('unreviewed', 'accepted', 'rejected', 'archived')),
  constraint new_businesses_month_check
    check (period_month between 1 and 12)
);

comment on column public.new_businesses.phone is
  'The phone number on the public business license record.';

create index if not exists new_business_imports_period_idx
  on public.new_business_imports (source, period_year desc, period_month desc);

create index if not exists new_businesses_period_idx
  on public.new_businesses (period_year desc, period_month desc);
create index if not exists new_businesses_category_idx
  on public.new_businesses (category);
create index if not exists new_businesses_review_status_idx
  on public.new_businesses (review_status);
create index if not exists new_businesses_created_at_idx
  on public.new_businesses (created_at desc);

-- Access. RLS enabled with a service-role policy, PLUS explicit grants.
-- Tables created through the SQL editor do not receive the automatic role
-- grants. Without them the service role gets Postgres 42501 on every write.
alter table public.new_business_imports enable row level security;
alter table public.new_business_categories enable row level security;
alter table public.new_businesses enable row level security;

drop policy if exists new_business_imports_service_role on public.new_business_imports;
drop policy if exists new_business_categories_service_role on public.new_business_categories;
drop policy if exists new_businesses_service_role on public.new_businesses;

create policy new_business_imports_service_role
  on public.new_business_imports
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy new_business_categories_service_role
  on public.new_business_categories
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy new_businesses_service_role
  on public.new_businesses
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

grant select, insert, update, delete on public.new_business_imports to service_role;
grant select, insert, update, delete on public.new_business_categories to service_role;
grant select, insert, update, delete on public.new_businesses to service_role;

grant select on public.new_business_imports to authenticated;
grant select on public.new_business_categories to authenticated;
grant select on public.new_businesses to authenticated;

commit;

-- Proof: all three tables exist and RLS is enabled on each. Expect three
-- rows, all with rls_enabled = true.
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('new_business_imports', 'new_business_categories', 'new_businesses')
order by c.relname;
