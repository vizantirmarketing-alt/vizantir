import 'server-only';

import { generateReport, type CareTier } from '@/lib/reports/generate';
import { renderReportPdf } from '@/lib/reports/pdf';
import { sendReport } from '@/lib/reports/send';
import { createSupabaseServiceRole } from '@/lib/supabase/service';

export type MonthlyReportOutcome =
  | 'sent'
  | 'pending_review'
  | 'failed'
  | 'skipped'
  | 'error';

export type MonthlyClientOutcome = {
  clientId: string;
  clientName: string;
  careTier: CareTier;
  reportId: string | null;
  outcome: MonthlyReportOutcome;
  reason: string | null;
};

export type MonthlyReportsRunResult =
  | {
      ok: true;
      period: string;
      clients: number;
      outcomes: MonthlyClientOutcome[];
    }
  | {
      ok: false;
      period: string;
      clients: number;
      outcomes: MonthlyClientOutcome[];
      reason: 'db_error';
    };

type ActiveClient = {
  id: string;
  name: string;
  careTier: CareTier;
};

type ServiceClient = ReturnType<typeof createSupabaseServiceRole>;

/**
 * Monthly report job. This is a report run, not a data sync — do not write
 * sync_runs. That table's provider check is closed (ga4|gsc|clarity|decisions);
 * an insert here fails closed and the job appears to do nothing.
 *
 * Scheduled on the 4th: Search Console lags two to three days and GA4 needs
 * roughly 48 hours to finish processing. Earlier produces incomplete numbers.
 */
export async function runMonthlyReports(
  now: Date = new Date()
): Promise<MonthlyReportsRunResult> {
  const period = priorMonthPeriod(now);
  const outcomes: MonthlyClientOutcome[] = [];

  try {
    const supabase = createSupabaseServiceRole();
    const loaded = await loadActiveClients(supabase);
    if (!loaded.ok) {
      return {
        ok: false,
        period,
        clients: 0,
        outcomes,
        reason: 'db_error',
      };
    }

    for (const client of loaded.clients) {
      try {
        outcomes.push(await processClient(client, period));
      } catch {
        outcomes.push({
          clientId: client.id,
          clientName: client.name,
          careTier: client.careTier,
          reportId: null,
          outcome: 'error',
          reason: 'unexpected_error',
        });
      }
    }

    return {
      ok: true,
      period,
      clients: loaded.clients.length,
      outcomes,
    };
  } catch {
    console.error('Monthly report run failed');
    return {
      ok: false,
      period,
      clients: 0,
      outcomes,
      reason: 'db_error',
    };
  }
}

export function priorMonthPeriod(now: Date): string {
  const prior = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)
  );
  const year = prior.getUTCFullYear();
  const month = prior.getUTCMonth() + 1;
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

async function processClient(
  client: ActiveClient,
  period: string
): Promise<MonthlyClientOutcome> {
  const generated = await generateReport(client.id, period);
  if (!generated.ok) {
    return {
      clientId: client.id,
      clientName: client.name,
      careTier: client.careTier,
      reportId: null,
      outcome: generated.reason === 'already_sent' ? 'skipped' : 'error',
      reason: generated.reason,
    };
  }

  if (generated.status === 'failed') {
    return {
      clientId: client.id,
      clientName: client.name,
      careTier: client.careTier,
      reportId: generated.reportId,
      outcome: 'failed',
      reason:
        generated.blockers.length > 0
          ? generated.blockers.join(',')
          : 'failed',
    };
  }

  const pdf = await renderReportPdf(generated.reportId);
  if (!pdf.ok) {
    return {
      clientId: client.id,
      clientName: client.name,
      careTier: client.careTier,
      reportId: generated.reportId,
      outcome: 'error',
      reason: `pdf_${pdf.reason}`,
    };
  }

  if (client.careTier === 'care' || client.careTier === 'growth') {
    return {
      clientId: client.id,
      clientName: client.name,
      careTier: client.careTier,
      reportId: generated.reportId,
      outcome: 'pending_review',
      reason: null,
    };
  }

  const sent = await sendReport(generated.reportId);
  if (!sent.ok) {
    return {
      clientId: client.id,
      clientName: client.name,
      careTier: client.careTier,
      reportId: generated.reportId,
      outcome: 'error',
      reason: `send_${sent.reason}`,
    };
  }

  return {
    clientId: client.id,
    clientName: client.name,
    careTier: client.careTier,
    reportId: generated.reportId,
    outcome: 'sent',
    reason: null,
  };
}

async function loadActiveClients(
  supabase: ServiceClient
): Promise<
  { ok: true; clients: ActiveClient[] } | { ok: false; reason: 'db_error' }
> {
  const result = await supabase
    .from('clients')
    .select('id, name, care_tier, active')
    .eq('active', true);

  if (result.error) {
    console.error('Active client lookup failed');
    return { ok: false, reason: 'db_error' };
  }

  const clients: ActiveClient[] = [];
  for (const row of result.data ?? []) {
    const parsed = parseActiveClient(row);
    if (parsed === null) {
      console.error('Active client row was invalid');
      continue;
    }
    clients.push(parsed);
  }

  return { ok: true, clients };
}

function parseActiveClient(value: unknown): ActiveClient | null {
  if (!isPlainObject(value)) {
    return null;
  }
  const id = asNonEmptyString(value.id);
  const name = asNonEmptyString(value.name);
  const careTier = value.care_tier;
  if (
    id === null ||
    name === null ||
    (careTier !== 'essential' && careTier !== 'care' && careTier !== 'growth')
  ) {
    return null;
  }
  return { id, name, careTier };
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
