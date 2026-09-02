-- MUST BE APPLIED MANUALLY IN THE SUPABASE SQL EDITOR.
-- This project has no migrate runner. Pasting this file is the apply step.
-- This file has not been applied to the database.
--
-- IP reputation on contact_submissions from ProxyCheck.io.
-- All columns nullable; a failed or skipped lookup stores nulls.

alter table public.contact_submissions
  add column if not exists vpn boolean,
  add column if not exists proxy boolean,
  add column if not exists tor boolean,
  add column if not exists is_datacenter boolean,
  add column if not exists fraud_score integer;
