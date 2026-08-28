-- MUST BE APPLIED MANUALLY IN THE SUPABASE SQL EDITOR.
-- This project has no migrate runner. Pasting this file is the apply step.
-- This file has not been applied to the database.
--
-- Operator-written client context for the report analysis prompt.

alter table public.clients
  add column if not exists reporting_context text;

comment on column public.clients.reporting_context is
  'Operator-written notes about the client''s business, positioning, and constraints. Passed to the report analysis prompt so recommendations do not contradict what the client actually does.';
