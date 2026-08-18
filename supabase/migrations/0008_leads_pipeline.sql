alter table public.contact_submissions
  add column if not exists landing_page          text,
  add column if not exists referrer              text,
  add column if not exists utm_source            text,
  add column if not exists utm_medium            text,
  add column if not exists utm_campaign          text,
  add column if not exists initial_channel       text,
  add column if not exists status                text not null default 'new',
  add column if not exists estimated_value_cents bigint,
  add column if not exists notes                 text,
  add column if not exists updated_at            timestamptz not null default now();

alter table public.contact_submissions
  drop constraint if exists contact_submissions_status_check;

alter table public.contact_submissions
  add constraint contact_submissions_status_check
    check (status in (
      'new', 'reviewing', 'contacted', 'discovery_scheduled',
      'proposal_sent', 'won', 'lost', 'not_qualified', 'spam'
    ));

create index if not exists contact_submissions_status_created_idx
  on public.contact_submissions (status, created_at desc);

create index if not exists contact_submissions_created_idx
  on public.contact_submissions (created_at desc);

create table if not exists public.lead_status_history (
  id              bigint generated always as identity primary key,
  lead_id         uuid        not null references public.contact_submissions(id) on delete cascade,
  previous_status text,
  new_status      text        not null,
  changed_by      text,
  changed_at      timestamptz not null default now()
);

create index if not exists lead_status_history_lead_idx
  on public.lead_status_history (lead_id, changed_at desc);

alter table public.lead_status_history enable row level security;

create policy lead_status_history_service_role
  on public.lead_status_history
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

grant select, insert, update, delete on public.lead_status_history to service_role;
grant usage, select on all sequences in schema public to service_role;
