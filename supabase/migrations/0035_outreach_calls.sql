-- MUST BE APPLIED MANUALLY IN THE SUPABASE SQL EDITOR.
-- This project has no migrate runner. Pasting this file is the apply step.
-- This file has not been applied to the database.
--
-- Until it is applied the Outreach page and the draft page leave out every
-- call feature: no Log a call, no call history, no Closed section. Drafting,
-- sending and contact addresses keep working.
--
-- Outreach call log: what the owner recorded after phoning a lead. Nothing
-- here dials, texts or contacts anyone; it only records what the owner did.
--
-- Additive only. One new table; nothing existing is changed:
--   outreach_calls   one row per call the owner logged, for a lead
--                    (prospect id, or a business's group key)
--
-- RLS follows the 0032 and 0034 pattern: enabled, one service_role policy,
-- explicit grants. Tables created through the SQL editor do not receive the
-- automatic role grants; without them the service role gets Postgres 42501.
--
-- The final statement is a SELECT that returns one row proving the table, its
-- RLS flag, its policy count, its check constraints and its index.

begin;

create table if not exists public.outreach_calls (
  id            uuid        primary key default gen_random_uuid(),
  subject_type  text        not null,
  -- The prospect id, or the business's group key so every license row is covered.
  subject_ref   text        not null,
  -- Where the lead's name links: the prospect id, or the business's primary row id.
  lead_id       text        not null,
  outcome       text        not null,
  note          text,
  created_at    timestamptz not null default now(),
  -- The signed-in owner's email.
  created_by    text        not null,
  constraint outreach_calls_subject_type_check
    check (subject_type in ('prospect', 'new_business')),
  constraint outreach_calls_outcome_check
    check (outcome in ('no_answer', 'left_message', 'spoke_interested', 'spoke_not_interested', 'wrong_number', 'asked_not_to_contact')),
  constraint outreach_calls_note_length_check
    check (note is null or char_length(note) between 1 and 500)
);

-- A lead's calls, newest first.
create index if not exists outreach_calls_subject_created_at_idx
  on public.outreach_calls (subject_type, subject_ref, created_at desc);

alter table public.outreach_calls enable row level security;

-- Created only when missing, so the file can be re-run without a drop.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'outreach_calls'
      and policyname = 'outreach_calls_service_role'
  ) then
    create policy outreach_calls_service_role on public.outreach_calls
      for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
  end if;
end
$$;

grant select, insert, update, delete on public.outreach_calls to service_role;
grant select on public.outreach_calls to authenticated;

commit;

-- Proof: one row. Expect calls_table true, calls_rls true, calls_policies 1,
-- calls_checks 3 (subject_type, outcome, note length) and calls_index true.
select
  to_regclass('public.outreach_calls') is not null as calls_table,
  (select c.relrowsecurity from pg_class c where c.oid = to_regclass('public.outreach_calls')) as calls_rls,
  (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = 'outreach_calls') as calls_policies,
  (select count(*) from pg_constraint
     where conrelid = to_regclass('public.outreach_calls') and contype = 'c') as calls_checks,
  to_regclass('public.outreach_calls_subject_created_at_idx') is not null as calls_index;
