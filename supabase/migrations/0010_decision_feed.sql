create table if not exists public.gsc_query_groups (
  id           bigint generated always as identity primary key,
  slug         text        not null,
  label        text        not null,
  match_terms  text[]      not null,
  match_type   text        not null default 'contains_any',
  active       boolean     not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint gsc_query_groups_slug_key unique (slug),
  constraint gsc_query_groups_match_type_check
    check (match_type in ('contains_any', 'exact_any'))
);

create table if not exists public.decision_items (
  id                 bigint generated always as identity primary key,
  detector           text             not null,
  emission_key       text             not null,
  category           text             not null,
  title              text             not null,
  description        text             not null,
  evidence_json      jsonb            not null,
  related_url        text,
  recommended_action text,
  confidence         text             not null,
  score              double precision not null default 0,
  status             text             not null default 'new',
  result_note        text,
  period_start       date             not null,
  period_end         date             not null,
  created_at         timestamptz      not null default now(),
  updated_at         timestamptz      not null default now(),
  completed_at       timestamptz,
  constraint decision_items_detector_emission_key unique (detector, emission_key),
  constraint decision_items_category_check
    check (category in ('needs_attention', 'working', 'opportunity', 'system')),
  constraint decision_items_confidence_check
    check (confidence in ('high', 'medium', 'exploratory')),
  constraint decision_items_status_check
    check (status in ('new', 'seen', 'planned', 'in_progress', 'completed', 'dismissed'))
);

create index if not exists decision_items_status_score_idx
  on public.decision_items (status, score desc);

create index if not exists decision_items_period_end_idx
  on public.decision_items (period_end desc);

alter table public.gsc_query_groups enable row level security;
alter table public.decision_items enable row level security;

create policy gsc_query_groups_service_role
  on public.gsc_query_groups
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy decision_items_service_role
  on public.decision_items
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

grant select, insert, update, delete on public.gsc_query_groups to service_role;
grant select, insert, update, delete on public.decision_items to service_role;

grant usage, select on all sequences in schema public to service_role;

insert into public.gsc_query_groups (slug, label, match_terms, match_type, active)
values
  (
    'wordpress-security',
    'WordPress security content',
    ARRAY[
      'wordpress hack',
      'hacked wordpress',
      'wordpress is hacked',
      'wordpress hacked'
    ]::text[],
    'contains_any',
    true
  ),
  (
    'law-firm',
    'Law firm web design',
    ARRAY[
      'law firm',
      'lawyer',
      'attorney',
      'legal website'
    ]::text[],
    'contains_any',
    true
  ),
  (
    'cre',
    'Commercial real estate',
    ARRAY[
      'commercial real estate',
      'cre web'
    ]::text[],
    'contains_any',
    true
  ),
  (
    'platform-compare',
    'Platform comparisons',
    ARRAY[
      'squarespace vs',
      'wix vs',
      'wordpress vs',
      'vs custom website',
      'vs next.js'
    ]::text[],
    'contains_any',
    true
  ),
  (
    'brand',
    'Brand searches',
    ARRAY['vizantir']::text[],
    'contains_any',
    true
  ),
  (
    'vegas-web-design',
    'Las Vegas web design',
    ARRAY[
      'las vegas web design',
      'web design las vegas',
      'website design las vegas'
    ]::text[],
    'contains_any',
    true
  );
