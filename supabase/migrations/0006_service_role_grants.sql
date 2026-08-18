grant select, insert, update, delete on public.clarity_metric_daily to service_role;
grant select, insert, update, delete on public.provider_coverage   to service_role;
grant select, insert, update, delete on public.sync_runs           to service_role;

grant usage, select on all sequences in schema public to service_role;
