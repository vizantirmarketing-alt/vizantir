-- MUST BE APPLIED MANUALLY IN THE SUPABASE SQL EDITOR.
-- This project has no migrate runner. Pasting this file is the apply step.
-- This file has not been applied to the database.
--
-- New Businesses: one row per business in the list.
--
-- A business holding several licenses has one license row per category,
-- across periods. The rescore step after every import groups those rows by
-- normalized name and location (lib/new-businesses/group.ts), marks one
-- primary row per business, and writes the group's categories, periods and
-- license count onto every row of the business. The list then filters to
-- primary rows.
--
-- Additive only: five nullable columns and three indexes on
-- public.new_businesses. No data is rewritten, nothing is dropped, and RLS,
-- policies and grants are unchanged (the existing service_role grant covers
-- the new columns). No row is merged or deleted.
--
-- Existing rows keep NULL in the new columns until the next import or
-- re-import groups them. While any row is ungrouped, the page lists license
-- rows as before, so nothing is hidden.
--
-- Safe for the code deployed before this change: that code reads and writes
-- explicit column lists and ignores columns it does not name.
--
-- Requires 0028 and 0029. The final statement is a SELECT that lists the
-- five new columns.

begin;

alter table public.new_businesses
  add column if not exists group_key           text,
  add column if not exists group_primary       boolean,
  add column if not exists group_categories    text[],
  add column if not exists group_periods       text[],
  add column if not exists group_license_count smallint check (group_license_count >= 1);

-- Review actions update every row of a business by group_key.
create index if not exists new_businesses_group_key_idx
  on public.new_businesses (group_key);

-- The list: primary rows, highest score first, unscored last, then name.
create index if not exists new_businesses_primary_lead_idx
  on public.new_businesses (lead_score desc nulls last, business_name)
  where group_primary is true;

-- The Category filter matches any license of a business.
create index if not exists new_businesses_group_categories_idx
  on public.new_businesses using gin (group_categories);

commit;

-- Proof: expect five rows, one per new column.
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'new_businesses'
  and column_name in ('group_key', 'group_primary', 'group_categories', 'group_periods', 'group_license_count')
order by column_name;
