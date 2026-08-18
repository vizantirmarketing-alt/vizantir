alter table public.clarity_metric_daily
  add column if not exists window_days smallint not null default 3;

alter table public.clarity_metric_daily
  drop constraint if exists clarity_metric_daily_slice_key;

alter table public.clarity_metric_daily
  add constraint clarity_metric_daily_slice_key unique (
    date, window_days, metric_name,
    dim1_name, dim1_value,
    dim2_name, dim2_value,
    dim3_name, dim3_value
  );
