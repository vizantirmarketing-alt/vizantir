-- Separates finding identity from emission windows.
-- decision_items.emission_key stays the per-window observation key.
-- finding_key is stable identity; operator state moves to finding_state.
-- APPLIED MANUALLY IN THE SUPABASE SQL EDITOR ON 2026-08-22.

begin;

-- 1. Stable identity on every emission, independent of window.
alter table public.decision_items
  add column if not exists finding_key text;

update public.decision_items
set finding_key = case
  when regexp_replace(emission_key, ':\d{4}-\d{2}-\d{2}$', '') like detector || ':%'
    then regexp_replace(emission_key, ':\d{4}-\d{2}-\d{2}$', '')
  else detector || ':' || regexp_replace(emission_key, ':\d{4}-\d{2}-\d{2}$', '')
end
where finding_key is null;

alter table public.decision_items
  alter column finding_key set not null;

-- 2. Operator state lives once per finding, not once per observation.
create table if not exists public.finding_state (
  finding_key  text primary key,
  status       text not null default 'new',
  result_note  text,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 3. Backfill, preferring any row that was actually triaged over an untouched 'new'.
insert into public.finding_state (finding_key, status, result_note, completed_at)
select distinct on (finding_key)
  finding_key, status, result_note, completed_at
from public.decision_items
order by finding_key, (status <> 'new') desc, updated_at desc
on conflict (finding_key) do nothing;

-- 4. Integrity + feed query support.
alter table public.decision_items
  add constraint decision_items_finding_key_fkey
  foreign key (finding_key) references public.finding_state(finding_key)
  on delete cascade;

create index if not exists decision_items_finding_key_period_idx
  on public.decision_items (finding_key, period_end desc);

-- 5. Access.
alter table public.finding_state enable row level security;
grant select, insert, update, delete on public.finding_state to service_role;

commit;
