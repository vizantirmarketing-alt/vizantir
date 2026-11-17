-- MUST BE APPLIED MANUALLY IN THE SUPABASE SQL EDITOR.
-- This project has no migrate runner. Pasting this file is the apply step.
-- This file has not been applied to the database.
--
-- Until it is applied the Outreach page, the draft page and New Businesses
-- leave out every site-review feature: no "Review this site", no review
-- states, and a business with its own website keeps "Write it yourself"
-- only. The morning cron records an error for its site-review step and every
-- other step goes on. Drafting, sending, contact addresses and calls keep
-- working.
--
-- Outreach site reviews: for an accepted New Businesses lead whose website
-- check found its own website, the research runner reads a few pages of that
-- site and reports factual observations; the server validates them and keeps
-- at most six. Drafting may then use one of them as its finding. No prospect
-- record is created and no score is computed.
--
-- Additive only. Two new tables; nothing existing is changed:
--   outreach_site_review_runs   the queue of site-review runs, as
--                               outreach_contact_runs (0034)
--   outreach_site_reviews       one row per business (its group key),
--                               holding the result and the run that holds
--                               or reviewed it
--
-- The server decides every status (lib/outreach/site-reviews/rules.ts). The
-- runner never sends a status or a count. A rejected observation is stored
-- only as its reason, never its text.
--
-- RLS follows the 0032 and 0034 pattern: enabled, one service_role policy,
-- explicit grants. Tables created through the SQL editor do not receive the
-- automatic role grants; without them the service role gets Postgres 42501.
--
-- After applying, check every column of the final SELECT's single row.

begin;

create table if not exists public.outreach_site_review_runs (
  id                   uuid        primary key default gen_random_uuid(),
  source               text        not null default 'dashboard',
  state                text        not null default 'requested',
  -- Set for a one-lead run queued from a lead's line.
  target_subject_type  text,
  target_subject_ref   text,
  -- The outreach_site_reviews ids in the run, set at claim time.
  lead_ids             uuid[]      not null default '{}',
  lead_count           integer     not null default 0,
  counts               jsonb       not null default '{"reviewed": 0, "rejected": 0}'::jsonb,
  record_outcomes      jsonb       not null default '{}'::jsonb,
  -- Typed lines, as on prospect_runs: "Note: ", "Runner: ", "System: ".
  error_summary        text,
  requested_at         timestamptz not null default now(),
  claimed_at           timestamptz,
  finished_at          timestamptz,
  updated_at           timestamptz not null default now(),
  constraint outreach_site_review_runs_state_check
    check (state in ('requested', 'claimed', 'completed', 'failed', 'cancelled')),
  constraint outreach_site_review_runs_source_check
    check (source in ('dashboard', 'schedule')),
  constraint outreach_site_review_runs_target_check
    check ((target_subject_type is null) = (target_subject_ref is null)
       and (target_subject_type is null or target_subject_type = 'new_business')),
  constraint outreach_site_review_runs_counts_object_check
    check (jsonb_typeof(counts) = 'object'),
  constraint outreach_site_review_runs_record_outcomes_object_check
    check (jsonb_typeof(record_outcomes) = 'object')
);

create index if not exists outreach_site_review_runs_state_requested_at_idx
  on public.outreach_site_review_runs (state, requested_at);
create index if not exists outreach_site_review_runs_requested_at_idx
  on public.outreach_site_review_runs (requested_at desc);

create table if not exists public.outreach_site_reviews (
  id               uuid        primary key default gen_random_uuid(),
  subject_type     text        not null default 'new_business',
  -- The business's group key, as on outreach_drafts.
  subject_ref      text        not null,
  -- Where the lead links: the business's primary row id.
  lead_id          text        not null,
  -- null until a result is written.
  status           text,
  -- The accepted observations, at most six: category, text, pageUrl, excerpt.
  observations     jsonb       not null default '[]'::jsonb,
  -- The pages on the site that were read.
  pages_read       text[]      not null default '{}',
  accepted_count   integer     not null default 0,
  rejected_count   integer     not null default 0,
  -- What the rules read, for re-deriving under a new rules version.
  evidence         jsonb,
  rules_version    text,
  checked_at       timestamptz,
  run_id           uuid        references public.outreach_site_review_runs(id) on delete set null,
  -- The open run holding this lead, cleared when a result is written or the run is released.
  held_by_run_id   uuid        references public.outreach_site_review_runs(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint outreach_site_reviews_subject_key unique (subject_type, subject_ref),
  constraint outreach_site_reviews_subject_type_check
    check (subject_type = 'new_business'),
  constraint outreach_site_reviews_status_check
    check (status is null or status in ('reviewed', 'nothing_notable', 'unreadable', 'unclear')),
  constraint outreach_site_reviews_observations_check
    check (jsonb_typeof(observations) = 'array' and jsonb_array_length(observations) <= 6),
  -- Observations exist exactly when the status is reviewed.
  constraint outreach_site_reviews_reviewed_check
    check ((status = 'reviewed') = (jsonb_array_length(observations) > 0) or status is null),
  constraint outreach_site_reviews_pages_read_check
    check (cardinality(pages_read) <= 4),
  constraint outreach_site_reviews_counts_check
    check (accepted_count >= 0 and rejected_count >= 0)
);

-- Releasing a run's leads.
create index if not exists outreach_site_reviews_held_by_run_idx
  on public.outreach_site_reviews (held_by_run_id)
  where held_by_run_id is not null;
-- Which run reviewed a lead.
create index if not exists outreach_site_reviews_run_idx
  on public.outreach_site_reviews (run_id);
create index if not exists outreach_site_reviews_status_idx
  on public.outreach_site_reviews (status);

alter table public.outreach_site_review_runs enable row level security;
alter table public.outreach_site_reviews enable row level security;

-- Created only when missing, so the file can be re-run without a drop.
do $$
declare
  t text;
begin
  foreach t in array array['outreach_site_review_runs', 'outreach_site_reviews']
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

grant select, insert, update, delete on public.outreach_site_review_runs to service_role;
grant select, insert, update, delete on public.outreach_site_reviews to service_role;

grant select on public.outreach_site_review_runs to authenticated;
grant select on public.outreach_site_reviews to authenticated;

commit;

-- Proof: one row. Expect both table flags true, both rls flags true, both
-- policy counts 1, every index true, runs_checks 5 (state, source, target,
-- counts, record_outcomes) and reviews_checks 6 (subject_type, status,
-- observations, reviewed, pages_read, counts).
select
  to_regclass('public.outreach_site_review_runs') is not null as runs_table,
  to_regclass('public.outreach_site_reviews') is not null as reviews_table,
  (select c.relrowsecurity from pg_class c where c.oid = to_regclass('public.outreach_site_review_runs')) as runs_rls,
  (select c.relrowsecurity from pg_class c where c.oid = to_regclass('public.outreach_site_reviews')) as reviews_rls,
  (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = 'outreach_site_review_runs') as runs_policies,
  (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = 'outreach_site_reviews') as reviews_policies,
  (select count(*) from pg_constraint
     where conrelid = to_regclass('public.outreach_site_review_runs') and contype = 'c') as runs_checks,
  (select count(*) from pg_constraint
     where conrelid = to_regclass('public.outreach_site_reviews') and contype = 'c') as reviews_checks,
  to_regclass('public.outreach_site_review_runs_state_requested_at_idx') is not null as runs_state_idx,
  to_regclass('public.outreach_site_review_runs_requested_at_idx') is not null as runs_requested_idx,
  to_regclass('public.outreach_site_reviews_subject_key') is not null as reviews_subject_key,
  to_regclass('public.outreach_site_reviews_held_by_run_idx') is not null as reviews_held_idx,
  to_regclass('public.outreach_site_reviews_run_idx') is not null as reviews_run_idx,
  to_regclass('public.outreach_site_reviews_status_idx') is not null as reviews_status_idx;
