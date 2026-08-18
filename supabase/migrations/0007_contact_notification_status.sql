alter table public.contact_submissions
  add column if not exists notified_at timestamptz,
  add column if not exists notify_status text,
  add column if not exists notify_error text;

alter table public.contact_submissions
  drop constraint if exists contact_submissions_notify_status_check;

alter table public.contact_submissions
  add constraint contact_submissions_notify_status_check
    check (notify_status is null or notify_status in ('sent', 'failed', 'not_configured'));

create index if not exists contact_submissions_notify_status_idx
  on public.contact_submissions (notify_status)
  where notify_status is distinct from 'sent';
