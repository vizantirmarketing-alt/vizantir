-- MUST BE APPLIED MANUALLY IN THE SUPABASE SQL EDITOR.
-- This project has no migrate runner. Pasting this file is the apply step.
-- This file has not been applied to the database.
--
-- Private Storage bucket for monthly report PDFs.
-- Do not create this bucket at runtime. Service role uploads to object
-- keys of the form {client_slug}/{period}.pdf (e.g. acme/2026-07-01.pdf).
-- The bucket is private: no anon or authenticated policies, so only
-- the service role can read or write objects.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'reports',
  'reports',
  false,
  10485760,
  array['application/pdf']::text[]
)
on conflict (id) do nothing;
