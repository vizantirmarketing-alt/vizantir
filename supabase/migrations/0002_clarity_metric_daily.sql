create table if not exists public.clarity_metric_daily (
  id           bigint generated always as identity primary key,
  date         date        not null,
  metric_name  text        not null,
  dim1_name    text        not null default '',
  dim1_value   text        not null default '',
  dim2_name    text        not null default '',
  dim2_value   text        not null default '',
  dim3_name    text        not null default '',
  dim3_value   text        not null default '',
  metrics      jsonb       not null,
  collected_at timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint clarity_metric_daily_slice_key unique (
    date, metric_name,
    dim1_name, dim1_value,
    dim2_name, dim2_value,
    dim3_name, dim3_value
  )
);

create index if not exists clarity_metric_daily_metric_date_idx
  on public.clarity_metric_daily (metric_name, date desc);

alter table public.clarity_metric_daily enable row level security;

create policy clarity_metric_daily_service_role
  on public.clarity_metric_daily
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
