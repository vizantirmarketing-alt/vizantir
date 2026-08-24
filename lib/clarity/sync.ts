import 'server-only';
import {
  fetchClarityInsights,
  type ClarityInsightsResult,
  type ClarityMetricGroup,
} from '@/lib/clarity/client';
import { recordSyncSuccessEvent } from '@/lib/intel/activity';
import { createSupabaseServiceRole } from '@/lib/supabase/service';

const DIMENSION_SETS: readonly (readonly string[])[] = [
  ['URL'],
  ['Device', 'Browser'],
  ['Source', 'Medium', 'Campaign'],
];

const UPSERT_CONFLICT_COLUMNS =
  'date,window_days,metric_name,dim1_name,dim1_value,dim2_name,dim2_value,dim3_name,dim3_value';

const UPSERT_BATCH_SIZE = 500;

export type SyncClarityResult = {
  status: 'success' | 'partial' | 'failed';
  recordsProcessed: number;
  message?: string;
};

type ClarityClientFailure = Extract<ClarityInsightsResult, { ok: false }>;

type DimensionSetFailure = {
  reason: ClarityClientFailure['reason'] | 'upsert_error' | 'exception';
  status?: number;
};

type ClarityMetricDailyRow = {
  date: string;
  window_days: number;
  metric_name: string;
  dim1_name: string;
  dim1_value: string;
  dim2_name: string;
  dim2_value: string;
  dim3_name: string;
  dim3_value: string;
  metrics: Record<string, string | number>;
  collected_at: string;
  updated_at: string;
};

export async function syncClarity(): Promise<SyncClarityResult> {
  let runId: number | null = null;
  let recordsProcessed = 0;
  const dataThroughDate = utcYesterdayDate();

  try {
    const supabase = createSupabaseServiceRole();

    const inserted = await supabase
      .from('sync_runs')
      .insert({ provider: 'clarity', status: 'running' })
      .select('id')
      .single();

    runId = readNumericId(inserted.data);
    if (inserted.error || runId === null) {
      return {
        status: 'failed',
        recordsProcessed: 0,
        message: 'Failed to record sync run',
      };
    }

    const failedSets: string[] = [];
    const collectedAt = new Date().toISOString();

    for (const dimensions of DIMENSION_SETS) {
      const label = dimensions.join(', ');
      try {
        const result = await fetchClarityInsights({
          numOfDays: 3,
          dimensions: [...dimensions],
        });

        if (!result.ok) {
          failedSets.push(
            formatFailedDimensionSet(label, {
              reason: result.reason,
              status: result.status,
            })
          );
          continue;
        }

        const rows = toDailyRows(
          result.data,
          dimensions,
          dataThroughDate,
          collectedAt
        );

        if (rows.length === 0) {
          continue;
        }

        let written = 0;

        for (
          let offset = 0;
          offset < rows.length;
          offset += UPSERT_BATCH_SIZE
        ) {
          const batchIndex = offset / UPSERT_BATCH_SIZE;
          const batch = rows.slice(offset, offset + UPSERT_BATCH_SIZE);
          const { error } = await supabase
            .from('clarity_metric_daily')
            .upsert(batch, {
              onConflict: UPSERT_CONFLICT_COLUMNS,
            });

          if (error) {
            console.error('Intel clarity upsert:', {
              dimensionSet: label,
              batchIndex,
              rowCount: batch.length,
              message: error.message,
              code: error.code,
              details: error.details,
              hint: error.hint,
            });
            failedSets.push(
              formatFailedDimensionSet(label, { reason: 'upsert_error' })
            );
            break;
          }

          written += batch.length;
        }

        recordsProcessed += written;
      } catch {
        failedSets.push(
          formatFailedDimensionSet(label, { reason: 'exception' })
        );
      }
    }

    const status: SyncClarityResult['status'] =
      failedSets.length === 0
        ? 'success'
        : failedSets.length === DIMENSION_SETS.length
          ? 'failed'
          : 'partial';

    const message =
      failedSets.length > 0
        ? `Failed dimension sets: ${failedSets.join('; ')}`
        : undefined;

    await supabase
      .from('sync_runs')
      .update({
        status,
        completed_at: new Date().toISOString(),
        records_processed: recordsProcessed,
        data_through_date: dataThroughDate,
        administrator_message: message ?? null,
        error_code: status === 'success' ? null : status,
      })
      .eq('id', runId);

    if (status === 'success' && recordsProcessed > 0) {
      try {
        await recordSyncSuccessEvent({
          provider: 'clarity',
          recordsProcessed,
          dataThroughDate,
        });
      } catch {
        // Recording an event must never fail a sync.
      }
    }

    return { status, recordsProcessed, message };
  } catch {
    if (runId !== null) {
      try {
        const supabase = createSupabaseServiceRole();
        await supabase
          .from('sync_runs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            records_processed: recordsProcessed,
            data_through_date: dataThroughDate,
            administrator_message: 'Sync failed',
            error_code: 'failed',
          })
          .eq('id', runId);
      } catch {
        // Swallow so the function never throws.
      }
    }

    return { status: 'failed', recordsProcessed, message: 'Sync failed' };
  }
}

function formatFailedDimensionSet(
  label: string,
  failure: Pick<DimensionSetFailure, 'reason' | 'status'>
): string {
  if (failure.status === undefined) {
    return `${label} (${failure.reason})`;
  }
  return `${label} (${failure.reason} ${failure.status})`;
}

function utcYesterdayDate(): string {
  const now = new Date();
  const yesterday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1)
  );
  return yesterday.toISOString().slice(0, 10);
}

function readNumericId(value: unknown): number | null {
  if (typeof value !== 'object' || value === null || !('id' in value)) {
    return null;
  }
  const id = value.id;
  if (typeof id === 'number' && Number.isFinite(id)) {
    return id;
  }
  if (typeof id === 'string' && /^\d+$/.test(id)) {
    return Number(id);
  }
  return null;
}

function toDailyRows(
  groups: ClarityMetricGroup[],
  dimensions: readonly string[],
  date: string,
  collectedAt: string
): ClarityMetricDailyRow[] {
  const dimensionKeys = new Set(dimensions);
  const rows: ClarityMetricDailyRow[] = [];

  for (const group of groups) {
    for (const info of group.information) {
      const metrics: Record<string, string | number> = {};
      for (const [key, field] of Object.entries(info)) {
        if (!dimensionKeys.has(key)) {
          metrics[key] = field;
        }
      }

      const dim1Name = dimensions[0];
      const dim2Name = dimensions[1];
      const dim3Name = dimensions[2];

      rows.push({
        date,
        window_days: 3,
        metric_name: group.metricName,
        dim1_name: dim1Name ?? '',
        dim1_value: dim1Name === undefined ? '' : toDimValue(info[dim1Name]),
        dim2_name: dim2Name ?? '',
        dim2_value: dim2Name === undefined ? '' : toDimValue(info[dim2Name]),
        dim3_name: dim3Name ?? '',
        dim3_value: dim3Name === undefined ? '' : toDimValue(info[dim3Name]),
        metrics,
        collected_at: collectedAt,
        updated_at: collectedAt,
      });
    }
  }

  return rows;
}

function toDimValue(value: string | number | undefined): string {
  if (value === undefined) {
    return '';
  }
  return String(value);
}
