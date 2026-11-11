-- MUST BE APPLIED MANUALLY IN THE SUPABASE SQL EDITOR.
-- This project has no migrate runner. Pasting this file is the apply step.
-- This file has not been applied to the database.
--
-- New Businesses lead ranking (lib/new-businesses/rank.ts).
--
-- Additive only: five nullable columns and one index on public.new_businesses.
-- No data is rewritten, nothing is dropped, and RLS, policies and grants are
-- unchanged (the existing service_role grant covers the new columns).
--
-- Existing rows keep NULL in every new column until the next import or
-- re-import scores them. The score only orders the list; it never hides,
-- deletes or rejects a business.
--
-- Safe for the code deployed before this change: that code reads and writes
-- explicit column lists and ignores columns it does not name.
--
-- Apply this BEFORE deploying the code that reads these columns. The final
-- statement is a SELECT that lists the five new columns.

begin;

-- Checks are inline, so each is created with its column (and skipped with it
-- if the column already exists). NULL passes both checks.
alter table public.new_businesses
  add column if not exists lead_score   smallint check (lead_score between 0 and 100),
  add column if not exists lead_tier    text     check (lead_tier in ('likely', 'possible', 'low')),
  add column if not exists lead_signals jsonb,
  add column if not exists rank_version text,
  add column if not exists scored_at    timestamptz;

-- The list orders by lead_score descending, unscored rows last, then name.
create index if not exists new_businesses_lead_score_idx
  on public.new_businesses (lead_score desc nulls last, business_name);

commit;

-- Proof: expect five rows, one per new column.
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'new_businesses'
  and column_name in ('lead_score', 'lead_tier', 'lead_signals', 'rank_version', 'scored_at')
order by column_name;
