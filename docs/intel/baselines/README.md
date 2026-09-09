# Intel baselines

Point-in-time captures of detector output taken immediately **before** a change
to how a metric is computed.

Invariant 13 in `docs/SEARCH_INTELLIGENCE_ARCHITECTURE.md`:

> A change to how a metric is computed is a methodology change, and is recorded
> as one. Capture the prior baseline, write an `intel_events` row of type
> `methodology_change` at the cutover date, and treat the first comparison
> spanning that date as not like-for-like.

A silent change to method is indistinguishable from a change in the world, which
makes every comparison across it wrong in a way nobody can see. These files are
the "before" half of that record; the `intel_events` row is the marker operators
actually encounter in the Overview activity feed.

## Reading these files

Each file is the **last output of a method that is no longer in use**. Do not
compare it to anything produced after its cutover date, and do not read a
difference across the cutover as a change in search performance. The `purpose`
and `methodology` fields in each file state what changed.

## Files

| File | Cutover | What changed |
|---|---|---|
| `2026-09-09-detector-window-pre-correction.json` | Phase 2a | Detector analysis window moved from ending today−2 (which included the zero-filled trailing GSC day) to today−3, via `latestCompleteDay`. Group impressions and CTR rise slightly; findings sitting near a threshold may appear or disappear once. Marker `dedupe_key`: `methodology:detector-window-completed-day` |

## Capturing a new baseline

Run against the live database and keep the output, before deploying the change:

```sql
select detector, finding_key, emission_key, score, period_start, period_end
from public.decision_items
where period_end = (select max(period_end) from public.decision_items)
order by detector, score desc;

select provider, status, data_through_date, records_processed, started_at
from public.sync_runs
where provider = 'decisions'
order by started_at desc
limit 10;
```

Then record the cutover:

```bash
npm run record:methodology -- --help            # options and known changes
npm run record:methodology -- detector-window   # dry run, prints the payload
npm run record:methodology -- detector-window --live
```

Run it **after** the change is deployed, not when the code is written — the row
asserts that the method has changed, which is not yet true at authoring time.

Re-running `--live` is safe. It cannot create a second event and cannot modify
one that already exists, because the request names `dedupe_key` as its
`on_conflict` target with `resolution=ignore-duplicates`, which resolves to
`ON CONFLICT (dedupe_key) DO NOTHING`.

Naming that target is the load-bearing part. `intel_events.dedupe_key` carries a
unique constraint, but a constraint only guarantees that a duplicate *fails* —
it does not make a repeated run a clean no-op. Without `on_conflict`, PostgREST
infers the conflict target from the primary key; `id` is a generated identity
the script never supplies, so the `DO NOTHING` never fires and the duplicate
surfaces as Postgres `23505` instead of being skipped.
