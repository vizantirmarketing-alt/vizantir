-- MUST BE APPLIED MANUALLY IN THE SUPABASE SQL EDITOR.
-- This project has no migrate runner. Pasting this file is the apply step.
-- This file has not been applied to the database.
--
-- Also expands sync_runs.provider so the decisions cron can write a row.
-- 0004 only allows ga4 | gsc | clarity; without this the insert fail-closes
-- and detectors never run.

begin;

alter table public.sync_runs
  drop constraint if exists sync_runs_provider_check;

alter table public.sync_runs
  add constraint sync_runs_provider_check
    check (provider in ('ga4', 'gsc', 'clarity', 'decisions'));


create or replace function public.update_lead_status(
  p_lead_id uuid,
  p_new_status text,
  p_changed_by text
)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_previous_status text;
begin
  select status
    into v_previous_status
  from public.contact_submissions
  where id = p_lead_id
  for update;

  if not found then
    raise exception 'lead_not_found';
  end if;

  if v_previous_status = p_new_status then
    return;
  end if;

  update public.contact_submissions
  set
    status = p_new_status,
    updated_at = now()
  where id = p_lead_id;

  insert into public.lead_status_history (
    lead_id,
    previous_status,
    new_status,
    changed_by
  ) values (
    p_lead_id,
    v_previous_status,
    p_new_status,
    p_changed_by
  );
end;
$$;

grant execute on function public.update_lead_status(uuid, text, text) to service_role;

commit;
