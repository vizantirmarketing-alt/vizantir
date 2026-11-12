-- MUST BE APPLIED MANUALLY IN THE SUPABASE SQL EDITOR.
-- This project has no migrate runner. Pasting this file is the apply step.
-- This file has not been applied to the database.
--
-- Outreach: first-contact email drafts the owner reviews, approves and sends
-- from his own mail application. The server never sends email.
--
-- Additive only. Creates three new tables and touches nothing that exists:
--   outreach_drafts        one row per written draft; at most one active
--                          (draft or approved) row per lead
--   outreach_suppressions  the do-not-contact list
--   outreach_settings      a single row: sender, studio, reply-to, postal address
--
-- RLS follows the 0028 and 0031 pattern: enabled, a service_role policy,
-- explicit grants.
--
-- Safe for the code deployed before this change: nothing existing reads or
-- writes these tables.
--
-- The final statement is a SELECT that returns one row per new table with its
-- RLS status.

begin;

create table if not exists public.outreach_drafts (
  id              uuid        primary key default gen_random_uuid(),
  subject_type    text        not null,
  -- The prospect id, or the business's group key so every license row is covered.
  subject_ref     text        not null,
  -- Where the lead's name links: the prospect id, or the business's primary row id.
  lead_id         text        not null,
  lead_name       text        not null,
  to_email        text,
  subject         text        not null,
  body            text        not null,
  -- Sender, studio, postal address and opt-out line, appended by code from
  -- outreach_settings when the draft was written. Never edited.
  footer          text        not null,
  status          text        not null default 'draft',
  model           text        not null,
  prompt_version  text        not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  approved_at     timestamptz,
  sent_at         timestamptz,
  constraint outreach_drafts_subject_type_check
    check (subject_type in ('prospect', 'new_business')),
  constraint outreach_drafts_status_check
    check (status in ('draft', 'approved', 'sent', 'discarded')),
  constraint outreach_drafts_to_email_length_check
    check (to_email is null or char_length(to_email) <= 254),
  constraint outreach_drafts_subject_length_check
    check (char_length(subject) between 1 and 300),
  constraint outreach_drafts_body_length_check
    check (char_length(body) between 1 and 5000),
  -- No line break in a header field.
  constraint outreach_drafts_single_line_check
    check (position(chr(10) in subject) = 0 and position(chr(13) in subject) = 0
       and (to_email is null or (position(chr(10) in to_email) = 0 and position(chr(13) in to_email) = 0))),
  constraint outreach_drafts_approved_at_check
    check (status not in ('approved', 'sent') or approved_at is not null),
  constraint outreach_drafts_sent_at_check
    check (status <> 'sent' or sent_at is not null)
);

-- One active (draft or approved) draft per lead.
create unique index if not exists outreach_drafts_one_active_idx
  on public.outreach_drafts (subject_type, subject_ref)
  where status in ('draft', 'approved');
-- The daily cap and the sent-today count.
create index if not exists outreach_drafts_created_at_idx
  on public.outreach_drafts (created_at);
create index if not exists outreach_drafts_sent_at_idx
  on public.outreach_drafts (sent_at)
  where status = 'sent';
-- The Outreach page lists by status, newest first.
create index if not exists outreach_drafts_status_updated_at_idx
  on public.outreach_drafts (status, updated_at desc);

create table if not exists public.outreach_suppressions (
  id          uuid        primary key default gen_random_uuid(),
  -- Normalized: trimmed and lower-cased.
  email       text        not null,
  -- Set when every address at this domain is suppressed.
  domain      text,
  reason      text        not null,
  created_at  timestamptz not null default now(),
  constraint outreach_suppressions_email_key unique (email),
  constraint outreach_suppressions_email_normalized_check
    check (email = lower(btrim(email)) and char_length(email) between 3 and 254),
  constraint outreach_suppressions_domain_normalized_check
    check (domain is null or domain = lower(btrim(domain))),
  constraint outreach_suppressions_reason_check
    check (reason in ('do_not_contact', 'manual'))
);

create index if not exists outreach_suppressions_domain_idx
  on public.outreach_suppressions (domain)
  where domain is not null;

create table if not exists public.outreach_settings (
  -- Always true: the table holds a single row.
  id              boolean     primary key default true,
  sender_name     text        not null default '',
  studio_name     text        not null default '',
  reply_to_email  text        not null default '',
  postal_address  text        not null default '',
  updated_at      timestamptz not null default now(),
  constraint outreach_settings_single_row_check check (id)
);

-- Access. RLS enabled with a service-role policy, PLUS explicit grants.
-- Tables created through the SQL editor do not receive the automatic role
-- grants. Without them the service role gets Postgres 42501 on every write.
alter table public.outreach_drafts enable row level security;
alter table public.outreach_suppressions enable row level security;
alter table public.outreach_settings enable row level security;

-- Created only when missing, so the file can be re-run without a drop.
do $$
declare
  t text;
begin
  foreach t in array array['outreach_drafts', 'outreach_suppressions', 'outreach_settings']
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

grant select, insert, update, delete on public.outreach_drafts to service_role;
grant select, insert, update, delete on public.outreach_suppressions to service_role;
grant select, insert, update, delete on public.outreach_settings to service_role;

grant select on public.outreach_drafts to authenticated;
grant select on public.outreach_suppressions to authenticated;
grant select on public.outreach_settings to authenticated;

commit;

-- Proof: expect three rows, each with rls_enabled = true and one policy.
select c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       (select count(*) from pg_policies p
         where p.schemaname = 'public' and p.tablename = c.relname) as policies
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('outreach_drafts', 'outreach_suppressions', 'outreach_settings')
order by c.relname;
