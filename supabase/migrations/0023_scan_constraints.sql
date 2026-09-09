-- MUST BE APPLIED MANUALLY IN THE SUPABASE SQL EDITOR.
-- This project has no migrate runner. Pasting this file is the apply step.
--
-- Search Intelligence Phase 2b, part 1 of 2. Constraints and columns only;
-- 0024 creates the tables.
--
-- ORDER IS LOAD-BEARING (invariant 12). Apply and VERIFY this file before
-- deploying any code that writes a `scan` sync_runs row or a
-- `search_intelligence` decision_items row. Both constraints fail closed: the
-- scan cron would die at its opening insert, and every scan finding would be
-- rejected at persist time, in each case with nothing on the dashboard saying
-- why.
--
-- Verification queries are at the bottom of this file.

begin;

-- 1. New sync provider: the site scan.
--
-- This restates psi and gbp deliberately. Their own migration files carry
-- headers claiming they were never applied; verification on 2026-09-09 showed
-- all three ARE applied. Restating them is harmless if so and repairs the
-- constraint if some environment genuinely lacks them.
alter table public.sync_runs
  drop constraint if exists sync_runs_provider_check;

alter table public.sync_runs
  add constraint sync_runs_provider_check
    check (provider in ('ga4', 'gsc', 'clarity', 'decisions', 'psi', 'gbp', 'scan'));

-- 2. New top-level finding category (S11).
--
-- One category for all Search Intelligence findings. There is deliberately no
-- separate seo / aeo / geo category: discipline lives in the column added
-- below, so the UI can render three sections without three categories.
alter table public.decision_items
  drop constraint if exists decision_items_category_check;

alter table public.decision_items
  add constraint decision_items_category_check
    check (category in (
      'needs_attention',
      'working',
      'opportunity',
      'system',
      'search_intelligence'
    ));

-- 3. Sub-identity within search_intelligence.
--
-- DELIBERATELY UNCONSTRAINED TEXT. Do not add a check constraint here.
--
-- The values are governed by lib/intel/decisions/registry.ts, in TypeScript,
-- at compile time. A check constraint would mean a migration hand-applied
-- through this editor before every new detector family, and a slipped order
-- would fail the insert closed and silently stop the detector running. That is
-- invariant 12, and it is the exact failure that left psi and gbp writing rows
-- nothing could read.
--
-- Null is valid and expected: the three pre-existing GSC detectors
-- (buried-demand, within-reach, geo-signal) keep category `opportunity` and
-- carry no discipline.
alter table public.decision_items
  add column if not exists discipline text;

alter table public.decision_items
  add column if not exists detector_family text;

create index if not exists decision_items_discipline_idx
  on public.decision_items (discipline, detector_family);

commit;

-- ── VERIFY AFTER APPLYING (invariant 11) ────────────────────────────────────
-- A file reporting success does not guarantee every statement ran.
--
-- 1. Must include 'scan':
--   select conname, pg_get_constraintdef(oid)
--   from pg_constraint
--   where conrelid = 'public.sync_runs'::regclass and contype = 'c';
--
-- 2. Must include 'search_intelligence':
--   select conname, pg_get_constraintdef(oid)
--   from pg_constraint
--   where conrelid = 'public.decision_items'::regclass and contype = 'c';
--
-- 3. Must return two rows, both text, and NEITHER may appear in the
--    constraint list from query 2:
--   select column_name, data_type
--   from information_schema.columns
--   where table_schema = 'public' and table_name = 'decision_items'
--     and column_name in ('discipline', 'detector_family');
