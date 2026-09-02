-- MUST BE APPLIED MANUALLY IN THE SUPABASE SQL EDITOR.
-- This project has no migrate runner. Pasting this file is the apply step.
-- This file has not been applied to the database.
--
-- Submission intelligence on contact_submissions: geo, UA, MX, and
-- suspect flags. `referrer` already exists (first-touch attribution);
-- the IF NOT EXISTS below is a no-op for that column.

alter table public.contact_submissions
  add column if not exists ip text,
  add column if not exists country text,
  add column if not exists region text,
  add column if not exists city text,
  add column if not exists timezone text,
  add column if not exists browser text,
  add column if not exists browser_version text,
  add column if not exists os text,
  add column if not exists os_version text,
  add column if not exists device_type text,
  add column if not exists user_agent text,
  add column if not exists accept_language text,
  add column if not exists referrer text,
  add column if not exists mx_valid boolean,
  add column if not exists is_suspect boolean not null default false,
  add column if not exists suspect_reason text,
  add column if not exists submit_duration_ms integer;
