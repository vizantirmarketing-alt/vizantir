create table if not exists public.crawler_hits (
  id          bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  bot         text        not null,
  user_agent  text        not null,
  path        text        not null default '/robots.txt',
  created_at  timestamptz not null default now()
);

create index if not exists crawler_hits_bot_occurred_at_idx
  on public.crawler_hits (bot, occurred_at desc);

create index if not exists crawler_hits_occurred_at_idx
  on public.crawler_hits (occurred_at desc);

alter table public.crawler_hits enable row level security;

create policy crawler_hits_service_role
  on public.crawler_hits
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

grant select, insert, update, delete on public.crawler_hits to service_role;

grant usage, select on all sequences in schema public to service_role;
