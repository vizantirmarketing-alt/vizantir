import 'server-only';
import { loadActiveClients, type IntelClient } from '@/lib/clients/load';
import { fetchPsiReport } from '@/lib/reports/psi';
import { createSupabaseServiceRole } from '@/lib/supabase/service';

const UPSERT_CONFLICT = 'client_id,strategy';

export type SyncPsiResult = {
  status: 'success' | 'partial' | 'failed';
  recordsProcessed: number;
  message?: string;
};

type ServiceClient = ReturnType<typeof createSupabaseServiceRole>;

type PsiResultRow = {
  client_id: string;
  url: string;
  strategy: string;
  performance_score: number;
  lcp_ms: number;
  tbt_ms: number;
  cls: number;
  fetched_at: string;
};

export async function syncPsi(): Promise<SyncPsiResult> {
  let runId: number | null = null;
  let recordsProcessed = 0;

  try {
    const supabase = createSupabaseServiceRole();

    const inserted = await supabase
      .from('sync_runs')
      .insert({ provider: 'psi', status: 'running' })
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

    const loaded = await loadActiveClients();
    if (!loaded.ok) {
      const message = 'Failed to load active clients';
      console.error('PSI sync failed');
      await finishRun(supabase, runId, {
        status: 'failed',
        recordsProcessed: 0,
        dataThroughDate: null,
        message,
      });
      return { status: 'failed', recordsProcessed: 0, message };
    }

    const clients = loaded.clients.filter(hasCruxOrigin);
    if (clients.length === 0) {
      const message = 'No clients were configured';
      await finishRun(supabase, runId, {
        status: 'success',
        recordsProcessed: 0,
        dataThroughDate: null,
        message,
      });
      return { status: 'success', recordsProcessed: 0, message };
    }

    let succeeded = 0;
    let failed = 0;

    for (const client of clients) {
      const upserted = await syncClient(supabase, client);
      if (upserted) {
        succeeded += 1;
        recordsProcessed += 1;
        continue;
      }
      failed += 1;
    }

    const status: SyncPsiResult['status'] =
      failed === 0 ? 'success' : succeeded === 0 ? 'failed' : 'partial';
    const message =
      failed > 0 ? `${failed} of ${clients.length} clients failed` : undefined;

    await finishRun(supabase, runId, {
      status,
      recordsProcessed,
      dataThroughDate: null,
      message,
    });
    return { status, recordsProcessed, message };
  } catch {
    console.error('PSI sync failed');
    if (runId !== null) {
      try {
        const supabase = createSupabaseServiceRole();
        await finishRun(supabase, runId, {
          status: 'failed',
          recordsProcessed,
          dataThroughDate: null,
          message: 'Sync failed',
        });
      } catch {
        // Swallow so the function never throws.
      }
    }

    return { status: 'failed', recordsProcessed, message: 'Sync failed' };
  }
}

async function syncClient(
  supabase: ServiceClient,
  client: IntelClient & { cruxOrigin: string }
): Promise<boolean> {
  try {
    const result = await fetchPsiReport({ url: client.cruxOrigin });
    if (!result.ok) {
      console.error('PSI client fetch failed');
      return false;
    }

    const row: PsiResultRow = {
      client_id: client.id,
      url: client.cruxOrigin,
      strategy: result.data.strategy,
      performance_score: result.data.performanceScore,
      lcp_ms: result.data.lcp.value,
      tbt_ms: result.data.tbt.value,
      cls: result.data.cls.value,
      fetched_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('psi_results')
      .upsert(row, { onConflict: UPSERT_CONFLICT });
    if (error) {
      console.error('PSI upsert failed');
      return false;
    }

    return true;
  } catch {
    console.error('PSI client sync failed');
    return false;
  }
}

async function finishRun(
  supabase: ServiceClient,
  runId: number,
  result: {
    status: SyncPsiResult['status'];
    recordsProcessed: number;
    dataThroughDate: string | null;
    message?: string;
  }
): Promise<void> {
  await supabase
    .from('sync_runs')
    .update({
      status: result.status,
      completed_at: new Date().toISOString(),
      records_processed: result.recordsProcessed,
      data_through_date: result.dataThroughDate,
      administrator_message: result.message ?? null,
      error_code: result.status === 'success' ? null : result.status,
    })
    .eq('id', runId);
}

function hasCruxOrigin(
  client: IntelClient
): client is IntelClient & { cruxOrigin: string } {
  return client.cruxOrigin !== null && client.cruxOrigin.trim().length > 0;
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
