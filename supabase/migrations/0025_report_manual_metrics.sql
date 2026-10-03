-- MUST BE APPLIED MANUALLY IN THE SUPABASE SQL EDITOR.
-- This project has no migrate runner. Pasting this file is the apply step.
-- This file has not been applied to the database.
--
-- Operator-entered monthly metrics (calls, form leads, Google Business Profile,
-- YouTube). Stored on the report row, not in the snapshot, so regenerating a
-- report does not erase them. Null means nothing was entered.
--
-- Apply this BEFORE deploying the code that reads the column. The report loaders
-- select manual_metrics, and a select on a missing column fails the whole query.

alter table public.reports
  add column if not exists manual_metrics jsonb;

comment on column public.reports.manual_metrics is
  'Operator-entered metrics shown in the monthly report. Shape: { calls, formLeads, gbp: { calls, directionRequests, websiteClicks }, youtube: { views, watchTimeHours, videosPublished } }. Every field optional.';

-- The table already has these grants. Restated so a fresh database ends up the same.
grant select, insert, update, delete on public.reports to service_role;

-- Verify after applying (separate statements, run each):
--
-- 1. The column exists and is jsonb:
--   select column_name, data_type, is_nullable
--   from information_schema.columns
--   where table_schema = 'public'
--     and table_name = 'reports'
--     and column_name = 'manual_metrics';
--
-- 2. service_role can still write the table:
--   select privilege_type
--   from information_schema.role_table_grants
--   where grantee = 'service_role' and table_name = 'reports'
--   order by privilege_type;
--
-- 3. Existing rows were not touched:
--   select count(*) from public.reports;
