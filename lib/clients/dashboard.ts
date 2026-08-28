import 'server-only';
import { unstable_cache } from 'next/cache';
import {
  clientSources,
  type ClientSources,
  type IntelClient,
} from '@/lib/clients/load';
import { fetchCruxReport, type CruxReportData } from '@/lib/reports/crux';
import { fetchGa4Report, type Ga4ReportData } from '@/lib/reports/ga4';
import type { ReportSourceFailure } from '@/lib/reports/google-credentials';
import {
  fetchGscReport,
  type GscReportData,
  type GscTotals,
} from '@/lib/reports/gsc';
import { fetchPsiReport, type PsiReportData } from '@/lib/reports/psi';
import { fetchUptimeReport, type UptimeReportData } from '@/lib/reports/uptime';

export type DashboardWindow = {
  startDate: string;
  endDate: string;
  priorStartDate: string;
  priorEndDate: string;
};

export type DashboardGa4Result =
  | { ok: true; current: Ga4ReportData; prior: Ga4ReportData | null }
  | ReportSourceFailure;

export type DashboardGscResult =
  | { ok: true; current: GscReportData; prior: GscTotals | null }
  | ReportSourceFailure;

export type DashboardCruxResult =
  | { ok: true; kind: 'metrics'; current: CruxReportData }
  | { ok: true; kind: 'lab'; current: PsiReportData }
  | { ok: true; kind: 'no_data' }
  | ReportSourceFailure;

export type DashboardUptimeResult =
  | { ok: true; current: UptimeReportData }
  | ReportSourceFailure;

export type ClientDashboard = {
  window: DashboardWindow;
  ga4: DashboardGa4Result;
  gsc: DashboardGscResult;
  crux: DashboardCruxResult;
  uptime: DashboardUptimeResult;
};

export function dashboardWindow(now: Date): DashboardWindow {
  const todayUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const end = addUtcDays(todayUtc, -1);
  const start = addUtcDays(end, -27);
  const priorEnd = addUtcDays(start, -1);
  const priorStart = addUtcDays(priorEnd, -27);

  return {
    startDate: formatUtcYmd(start),
    endDate: formatUtcYmd(end),
    priorStartDate: formatUtcYmd(priorStart),
    priorEndDate: formatUtcYmd(priorEnd),
  };
}

export async function loadClientDashboard(
  client: IntelClient,
  now?: Date
): Promise<ClientDashboard> {
  const window = dashboardWindow(now ?? new Date());
  const sources = clientSources(client);

  try {
    const [ga4, gsc, crux, uptime] = await Promise.all([
      loadGa4Source(client, sources, window),
      loadGscSource(client, sources, window),
      loadCruxSource(client, sources, window),
      loadUptimeSource(client, sources, window),
    ]);

    return { window, ga4, gsc, crux, uptime };
  } catch {
    console.error('Client dashboard load failed');
    return {
      window,
      ga4: { ok: false, reason: 'http_error' },
      gsc: { ok: false, reason: 'http_error' },
      crux: { ok: false, reason: 'http_error' },
      uptime: { ok: false, reason: 'http_error' },
    };
  }
}

function loadGa4Source(
  client: IntelClient,
  sources: ClientSources,
  window: DashboardWindow
): Promise<DashboardGa4Result> {
  if (!sources.ga4 || client.ga4PropertyId === null) {
    return Promise.resolve({ ok: false, reason: 'not_configured' });
  }

  return loadCachedGa4(client.id, client.ga4PropertyId, window);
}

function loadGscSource(
  client: IntelClient,
  sources: ClientSources,
  window: DashboardWindow
): Promise<DashboardGscResult> {
  if (!sources.gsc || client.gscSiteUrl === null) {
    return Promise.resolve({ ok: false, reason: 'not_configured' });
  }

  return loadCachedGsc(client.id, client.gscSiteUrl, window);
}

function loadCruxSource(
  client: IntelClient,
  sources: ClientSources,
  window: DashboardWindow
): Promise<DashboardCruxResult> {
  if (!sources.crux || client.cruxOrigin === null) {
    return Promise.resolve({ ok: false, reason: 'not_configured' });
  }

  return loadCachedCrux(client.id, client.cruxOrigin, window);
}

function loadUptimeSource(
  client: IntelClient,
  sources: ClientSources,
  window: DashboardWindow
): Promise<DashboardUptimeResult> {
  if (!sources.uptime || client.uptimerobotMonitorId === null) {
    return Promise.resolve({ ok: false, reason: 'not_configured' });
  }

  return loadCachedUptime(client.id, client.uptimerobotMonitorId, window);
}

async function loadCachedGa4(
  clientId: string,
  propertyId: string,
  window: DashboardWindow
): Promise<DashboardGa4Result> {
  try {
    return await unstable_cache(
      async (
        cachedPropertyId: string,
        startDate: string,
        endDate: string,
        priorStartDate: string,
        priorEndDate: string
      ): Promise<DashboardGa4Result> => {
        const [currentResult, priorResult] = await Promise.all([
          fetchGa4Report({
            propertyId: cachedPropertyId,
            startDate,
            endDate,
          }),
          fetchGa4Report({
            propertyId: cachedPropertyId,
            startDate: priorStartDate,
            endDate: priorEndDate,
          }),
        ]);

        if (!currentResult.ok) {
          return currentResult;
        }

        return {
          ok: true,
          current: currentResult.data,
          prior: priorResult.ok ? priorResult.data : null,
        };
      },
      [
        'client-dashboard-ga4',
        clientId,
        propertyId,
        window.startDate,
        window.endDate,
        window.priorStartDate,
        window.priorEndDate,
      ],
      { revalidate: 900, tags: [`client-${clientId}-ga4`] }
    )(
      propertyId,
      window.startDate,
      window.endDate,
      window.priorStartDate,
      window.priorEndDate
    );
  } catch {
    console.error('Client dashboard GA4 fetch failed');
    return { ok: false, reason: 'http_error' };
  }
}

async function loadCachedGsc(
  clientId: string,
  siteUrl: string,
  window: DashboardWindow
): Promise<DashboardGscResult> {
  try {
    return await unstable_cache(
      async (
        cachedSiteUrl: string,
        startDate: string,
        endDate: string,
        priorStartDate: string,
        priorEndDate: string
      ): Promise<DashboardGscResult> => {
        const result = await fetchGscReport({
          careTier: 'care',
          siteUrl: cachedSiteUrl,
          startDate,
          endDate,
          priorStartDate,
          priorEndDate,
        });

        if (!result.ok) {
          return result;
        }
        if (result.skipped) {
          return { ok: false, reason: 'not_configured' };
        }

        return {
          ok: true,
          current: result.data,
          prior: result.data.prior,
        };
      },
      [
        'client-dashboard-gsc',
        clientId,
        siteUrl,
        window.startDate,
        window.endDate,
        window.priorStartDate,
        window.priorEndDate,
      ],
      { revalidate: 3600, tags: [`client-${clientId}-gsc`] }
    )(
      siteUrl,
      window.startDate,
      window.endDate,
      window.priorStartDate,
      window.priorEndDate
    );
  } catch {
    console.error('Client dashboard GSC fetch failed');
    return { ok: false, reason: 'http_error' };
  }
}

async function loadCachedCrux(
  clientId: string,
  origin: string,
  window: DashboardWindow
): Promise<DashboardCruxResult> {
  try {
    const result = await unstable_cache(
      async (cachedOrigin: string): Promise<DashboardCruxResult> => {
        const cruxResult = await fetchCruxReport({ origin: cachedOrigin });
        if (!cruxResult.ok) {
          return cruxResult;
        }
        if (cruxResult.kind === 'no_data') {
          return { ok: true, kind: 'no_data' };
        }
        return { ok: true, kind: 'metrics', current: cruxResult.data };
      },
      [
        'client-dashboard-crux',
        clientId,
        origin,
        window.startDate,
        window.endDate,
        window.priorStartDate,
        window.priorEndDate,
      ],
      { revalidate: 3600, tags: [`client-${clientId}-crux`] }
    )(origin);

    if (result.ok && result.kind === 'no_data') {
      return loadCachedPsi(clientId, origin);
    }

    return result;
  } catch {
    console.error('Client dashboard CrUX fetch failed');
    return { ok: false, reason: 'http_error' };
  }
}

async function loadCachedPsi(
  clientId: string,
  origin: string
): Promise<DashboardCruxResult> {
  try {
    return await unstable_cache(
      async (cachedOrigin: string): Promise<DashboardCruxResult> => {
        const psiResult = await fetchPsiReport({ url: cachedOrigin });
        if (!psiResult.ok) {
          return { ok: true, kind: 'no_data' };
        }
        return { ok: true, kind: 'lab', current: psiResult.data };
      },
      ['client-dashboard-psi', clientId, origin],
      { revalidate: 86400, tags: [`client-${clientId}-psi`] }
    )(origin);
  } catch {
    console.error('Client dashboard PSI fetch failed');
    return { ok: true, kind: 'no_data' };
  }
}

async function loadCachedUptime(
  clientId: string,
  monitorId: string,
  window: DashboardWindow
): Promise<DashboardUptimeResult> {
  try {
    return await unstable_cache(
      async (
        cachedMonitorId: string,
        startDate: string,
        endDate: string
      ): Promise<DashboardUptimeResult> => {
        const result = await fetchUptimeReport({
          monitorId: cachedMonitorId,
          startDate,
          endDate,
        });
        if (!result.ok) {
          return result;
        }
        return { ok: true, current: result.data };
      },
      [
        'client-dashboard-uptime',
        clientId,
        monitorId,
        window.startDate,
        window.endDate,
        window.priorStartDate,
        window.priorEndDate,
      ],
      { revalidate: 300, tags: [`client-${clientId}-uptime`] }
    )(monitorId, window.startDate, window.endDate);
  } catch {
    console.error('Client dashboard uptime fetch failed');
    return { ok: false, reason: 'http_error' };
  }
}

function addUtcDays(date: Date, days: number): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days)
  );
}

function formatUtcYmd(date: Date): string {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}
