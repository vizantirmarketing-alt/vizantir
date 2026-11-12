-- MUST BE APPLIED MANUALLY IN THE SUPABASE SQL EDITOR.
-- This project has no migrate runner. Pasting this file is the apply step.
-- This file has not been applied to the database.
--
-- Outreach part 2: sending approved drafts through the owner's connected
-- Google mailbox (Gmail API, send permission only).
--
-- APPLY THIS BEFORE DEPLOYING THE CODE THAT USES IT. The Outreach pages read
-- the new columns and the new table; until this file is applied they show
-- "Unable to load Outreach".
--
-- Additive:
--   outreach_gmail_connection   new table, a single row: the connected address
--                               and its refresh token, encrypted with
--                               AES-256-GCM (ciphertext, IV and tag, base64)
--   outreach_drafts             new nullable columns sent_via,
--                               gmail_message_id, gmail_thread_id, send_error
--   outreach_drafts_one_active_sending_idx
--                               a second partial unique index: one active row
--                               per lead now also covers 'sending' and
--                               'send_unconfirmed'. The 0032 index is kept.
--
-- One constraint is replaced, not added: outreach_drafts_status_check gains
-- 'sending' and 'send_unconfirmed'. The new list contains every old value,
-- so no existing row can fail it.
--
-- RLS follows the 0032 pattern: enabled, one service_role policy, explicit
-- grants. The connection table is granted to service_role only, not to
-- authenticated, because it holds the encrypted token.
--
-- After applying, run the final SELECT (it runs with the file) and check
-- every column in its single row. A file that both changes a constraint and
-- creates a table has been seen to apply neither while reporting success, so
-- do not skip the check.

begin;

-- Drafts: how each was sent, Gmail's ids, and the last refusal.
alter table public.outreach_drafts
  add column if not exists sent_via         text,
  add column if not exists gmail_message_id text,
  add column if not exists gmail_thread_id  text,
  add column if not exists send_error       text;

alter table public.outreach_drafts
  drop constraint if exists outreach_drafts_status_check;
alter table public.outreach_drafts
  add constraint outreach_drafts_status_check
    check (status in ('draft', 'approved', 'sending', 'send_unconfirmed', 'sent', 'discarded'));

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'outreach_drafts_sent_via_check') then
    alter table public.outreach_drafts
      add constraint outreach_drafts_sent_via_check
        check (sent_via is null or sent_via in ('gmail', 'mail_app'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'outreach_drafts_send_error_length_check') then
    alter table public.outreach_drafts
      add constraint outreach_drafts_send_error_length_check
        check (send_error is null or char_length(send_error) <= 500);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'outreach_drafts_gmail_ids_length_check') then
    alter table public.outreach_drafts
      add constraint outreach_drafts_gmail_ids_length_check
        check ((gmail_message_id is null or char_length(gmail_message_id) <= 200)
           and (gmail_thread_id is null or char_length(gmail_thread_id) <= 200));
  end if;
end
$$;

-- One active row per lead, now including a send in flight or not confirmed.
create unique index if not exists outreach_drafts_one_active_sending_idx
  on public.outreach_drafts (subject_type, subject_ref)
  where status in ('draft', 'approved', 'sending', 'send_unconfirmed');

-- The daily Gmail send limit counts these.
create index if not exists outreach_drafts_gmail_sent_at_idx
  on public.outreach_drafts (sent_at)
  where status = 'sent' and sent_via = 'gmail';

-- The connected Google mailbox. Single row.
create table if not exists public.outreach_gmail_connection (
  -- Always true: the table holds a single row.
  id                boolean     primary key default true,
  -- The Google account's verified email; equal to the reply-to address when connected.
  email             text        not null,
  -- AES-256-GCM with OUTREACH_TOKEN_KEY, base64. The access token is never stored.
  token_ciphertext  text        not null,
  token_iv          text        not null,
  token_tag         text        not null,
  connected_at      timestamptz not null default now(),
  -- The Intel user who connected it.
  connected_by      text        not null,
  -- Set when Google answers invalid_grant: the owner must connect again.
  needs_reconnect   boolean     not null default false,
  constraint outreach_gmail_connection_single_row_check check (id),
  constraint outreach_gmail_connection_email_check
    check (email = lower(btrim(email)) and char_length(email) between 3 and 254),
  constraint outreach_gmail_connection_iv_length_check check (char_length(token_iv) = 16),
  constraint outreach_gmail_connection_tag_length_check check (char_length(token_tag) = 24)
);

alter table public.outreach_gmail_connection enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'outreach_gmail_connection'
      and policyname = 'outreach_gmail_connection_service_role'
  ) then
    create policy outreach_gmail_connection_service_role on public.outreach_gmail_connection
      for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
  end if;
end
$$;

grant select, insert, update, delete on public.outreach_gmail_connection to service_role;

commit;

-- Proof: one row. Expect table_exists = true, rls_enabled = true,
-- policies = 1, new_columns = 4, status_check listing all six states,
-- and sending_index = true.
select
  to_regclass('public.outreach_gmail_connection') is not null as table_exists,
  (select c.relrowsecurity from pg_class c
     where c.oid = to_regclass('public.outreach_gmail_connection')) as rls_enabled,
  (select count(*) from pg_policies p
     where p.schemaname = 'public' and p.tablename = 'outreach_gmail_connection') as policies,
  (select count(*) from information_schema.columns
     where table_schema = 'public' and table_name = 'outreach_drafts'
       and column_name in ('sent_via', 'gmail_message_id', 'gmail_thread_id', 'send_error')) as new_columns,
  (select pg_get_constraintdef(oid) from pg_constraint
     where conname = 'outreach_drafts_status_check'
       and conrelid = 'public.outreach_drafts'::regclass) as status_check,
  to_regclass('public.outreach_drafts_one_active_sending_idx') is not null as sending_index;
