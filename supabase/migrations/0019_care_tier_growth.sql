-- MUST BE APPLIED MANUALLY IN THE SUPABASE SQL EDITOR.
-- This project has no migrate runner. Pasting this file is the apply step.
-- This file has not been applied to the database.
--
-- Adds 'growth' to the care_tier / tier check constraints. Growth corresponds
-- to the Growth Partner retainer and behaves the same as care for report data
-- inclusion.

alter table public.clients
  drop constraint if exists clients_care_tier_check;

alter table public.clients
  add constraint clients_care_tier_check
    check (care_tier in ('essential', 'care', 'growth'));

alter table public.reports
  drop constraint if exists reports_tier_check;

alter table public.reports
  add constraint reports_tier_check
    check (tier in ('essential', 'care', 'growth'));
