-- MUST BE APPLIED MANUALLY IN THE SUPABASE SQL EDITOR.
-- This project has no migrate runner. Pasting this file is the apply step.
-- This file has not been applied to the database.
--
-- APPLY THIS BEFORE DEPLOYING THE CODE THAT USES IT. Until it is applied the
-- Outreach page shows "Contact addresses are not available yet", the lead
-- pages leave out the contact line, Find contact email refuses, and the
-- morning cron records an error for its contact step. Drafting and sending
-- keep working.
--
-- Outreach contact addresses: the research runner reads a lead's own
-- published contact address, and the server validates, classifies and keeps
-- at most one per lead. New drafts start with To filled in. Nothing is sent
-- automatically.
--
-- Additive only. Two new tables; nothing existing is changed:
--   outreach_contact_runs   the queue of contact-address runs, as
--                           new_business_check_runs (0031)
--   outreach_contacts       one row per lead (prospect id, or a business's
--                           group key), holding the result and the run that
--                           holds or checked it
--
-- The server decides every status (lib/outreach/contacts/rules.ts). The
-- runner never sends a status or a classification. Only the chosen address
-- is stored; an address that may be a person's is never stored, only counted.
--
-- RLS follows the 0031 and 0032 pattern: enabled, one service_role policy,
-- explicit grants. Tables created through the SQL editor do not receive the
-- automatic role grants; without them the service role gets Postgres 42501.
--
-- After applying, check every column of the final SELECT's single row.

begin;

create table if not exists public.outreach_contact_runs (
  id                   uuid        primary key default gen_random_uuid(),
  source               text        not null default 'dashboard',
  state                text        not null default 'requested',
  -- Set for a one-lead run queued from a lead page.
  target_subject_type  text,
  target_subject_ref   text,
  -- The outreach_contacts ids in the run, set at claim time.
  lead_ids             uuid[]      not null default '{}',
  lead_count           integer     not null default 0,
  counts               jsonb       not null default '{"checked": 0, "rejected": 0}'::jsonb,
  record_outcomes      jsonb       not null default '{}'::jsonb,
  -- Typed lines, as on prospect_runs: "Note: ", "Runner: ", "System: ".
  error_summary        text,
  requested_at         timestamptz not null default now(),
  claimed_at           timestamptz,
  finished_at          timestamptz,
  updated_at           timestamptz not null default now(),
  constraint outreach_contact_runs_state_check
    check (state in ('requested', 'claimed', 'completed', 'failed', 'cancelled')),
  constraint outreach_contact_runs_source_check
    check (source in ('dashboard', 'schedule')),
  constraint outreach_contact_runs_target_check
    check ((target_subject_type is null) = (target_subject_ref is null)
       and (target_subject_type is null or target_subject_type in ('prospect', 'new_business'))),
  constraint outreach_contact_runs_counts_object_check
    check (jsonb_typeof(counts) = 'object'),
  constraint outreach_contact_runs_record_outcomes_object_check
    check (jsonb_typeof(record_outcomes) = 'object')
);

create index if not exists outreach_contact_runs_state_requested_at_idx
  on public.outreach_contact_runs (state, requested_at);
create index if not exists outreach_contact_runs_requested_at_idx
  on public.outreach_contact_runs (requested_at desc);

create table if not exists public.outreach_contacts (
  id               uuid        primary key default gen_random_uuid(),
  subject_type     text        not null,
  -- The prospect id, or the business's group key, as on outreach_drafts.
  subject_ref      text        not null,
  -- Where the lead links: the prospect id, or the business's primary row id.
  lead_id          text        not null,
  -- null until a result is written.
  status           text,
  email            text,
  source_url       text,
  kind             text,
  rejected_count   integer     not null default 0,
  named_count      integer     not null default 0,
  -- What the rules read, for re-deriving under a new rules version.
  evidence         jsonb,
  rules_version    text,
  checked_at       timestamptz,
  run_id           uuid        references public.outreach_contact_runs(id) on delete set null,
  -- The open run holding this lead, cleared when a result is written or the run is released.
  held_by_run_id   uuid        references public.outreach_contact_runs(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint outreach_contacts_subject_key unique (subject_type, subject_ref),
  constraint outreach_contacts_subject_type_check
    check (subject_type in ('prospect', 'new_business')),
  constraint outreach_contacts_status_check
    check (status is null or status in ('found', 'none_found', 'named_only', 'no_page', 'unclear')),
  constraint outreach_contacts_kind_check
    check (kind is null or kind in ('own_domain', 'shared_provider')),
  -- An address, its page and its kind exist exactly when the status is found.
  -- CASE so a null status takes the second branch instead of making the check null.
  constraint outreach_contacts_found_check
    check (case when status = 'found'
                then email is not null and source_url is not null and kind is not null
                else email is null and source_url is null and kind is null
           end),
  constraint outreach_contacts_email_check
    check (email is null or (email = lower(btrim(email)) and char_length(email) between 3 and 254
       and position(chr(10) in email) = 0 and position(chr(13) in email) = 0)),
  constraint outreach_contacts_source_url_length_check
    check (source_url is null or char_length(source_url) <= 2048),
  constraint outreach_contacts_counts_check
    check (rejected_count >= 0 and named_count >= 0)
);

-- Releasing a run's leads.
create index if not exists outreach_contacts_held_by_run_idx
  on public.outreach_contacts (held_by_run_id)
  where held_by_run_id is not null;
-- Which run checked a lead.
create index if not exists outreach_contacts_run_idx
  on public.outreach_contacts (run_id);
create index if not exists outreach_contacts_status_idx
  on public.outreach_contacts (status);

alter table public.outreach_contact_runs enable row level security;
alter table public.outreach_contacts enable row level security;

-- Created only when missing, so the file can be re-run without a drop.
do $$
declare
  t text;
begin
  foreach t in array array['outreach_contact_runs', 'outreach_contacts']
  loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = t
        and policyname = t || '_service_role'
    ) then
      execute format(
        'create policy %I on public.%I for all using (auth.role() = %L) with check (auth.role() = %L)',
        t || '_service_role', t, 'service_role', 'service_role'
      );
    end if;
  end loop;
end
$$;

grant select, insert, update, delete on public.outreach_contact_runs to service_role;
grant select, insert, update, delete on public.outreach_contacts to service_role;

grant select on public.outreach_contact_runs to authenticated;
grant select on public.outreach_contacts to authenticated;

commit;

-- Proof: one row. Expect runs_table and contacts_table true, both
-- rls flags true, both policy counts 1, every index true, and
-- contacts_checks 6 (status, kind, found, email, source_url length, counts,
-- not counting subject_type).
select
  to_regclass('public.outreach_contact_runs') is not null as runs_table,
  to_regclass('public.outreach_contacts') is not null as contacts_table,
  (select c.relrowsecurity from pg_class c where c.oid = to_regclass('public.outreach_contact_runs')) as runs_rls,
  (select c.relrowsecurity from pg_class c where c.oid = to_regclass('public.outreach_contacts')) as contacts_rls,
  (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = 'outreach_contact_runs') as runs_policies,
  (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = 'outreach_contacts') as contacts_policies,
  to_regclass('public.outreach_contact_runs_state_requested_at_idx') is not null as runs_state_idx,
  to_regclass('public.outreach_contact_runs_requested_at_idx') is not null as runs_requested_idx,
  to_regclass('public.outreach_contacts_subject_key') is not null as contacts_subject_key,
  to_regclass('public.outreach_contacts_held_by_run_idx') is not null as contacts_held_idx,
  to_regclass('public.outreach_contacts_run_idx') is not null as contacts_run_idx,
  to_regclass('public.outreach_contacts_status_idx') is not null as contacts_status_idx,
  (select count(*) from pg_constraint
     where conrelid = to_regclass('public.outreach_contacts') and contype = 'c'
       and conname <> 'outreach_contacts_subject_type_check') as contacts_checks;
