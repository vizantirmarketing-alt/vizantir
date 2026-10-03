// Run with: NODE_OPTIONS=--conditions=react-server pnpm exec tsx --test app/intel/reports/_components/MonthlyReport.test.tsx
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ReactNode } from 'react';
import { MonthlyReport } from './MonthlyReport';
import { parseManualMetrics } from '@/lib/reports/manual-metrics';
import { parseReportSnapshot } from '@/lib/reports/parse-snapshot';
import type { ReportDocument } from '@/lib/reports/load';

const ga4Data = {
  sessions: 1200,
  totalUsers: 900,
  newUsers: 500,
  returningUsers: 400,
  newUserSessions: 600,
  returningUserSessions: 600,
  channelGroups: [{ channel: 'Organic Search', sessions: 400 }],
  topPages: [{ pagePath: '/', screenPageViews: 900, averageSessionDuration: 42 }],
  conversions: [],
};

function snapshot(version: number, extra: Record<string, unknown>) {
  return {
    version,
    generatedAt: '2026-10-04T11:00:00.000Z',
    period: {
      start: '2026-09-01',
      end: '2026-09-30',
      priorStart: '2026-08-01',
      priorEnd: '2026-08-31',
    },
    client: {
      id: 'c1',
      name: 'Acme',
      slug: 'acme',
      siteUrl: 'https://acme.example',
      careTier: 'care',
    },
    ga4: { ok: true, data: ga4Data },
    gsc: { ok: true, skipped: true },
    crux: { ok: true, kind: 'no_data' },
    uptime: { ok: false, reason: 'not_configured' },
    blockers: [],
    warnings: [],
    ...extra,
  };
}

function render(
  raw: Record<string, unknown>,
  extras: { workCompleted?: string | null; manualMetrics?: unknown } = {},
): string {
  const parsed = parseReportSnapshot(raw);
  assert.notEqual(parsed, null);
  if (parsed === null) {
    return '';
  }
  const document: ReportDocument = {
    reportId: 'r1',
    period: '2026-09-01',
    tier: 'care',
    status: 'sent',
    client: {
      id: 'c1',
      name: 'Acme',
      slug: 'acme',
      siteUrl: 'https://acme.example',
      careTier: 'care',
    },
    snapshot: parsed,
    workCompleted: extras.workCompleted ?? null,
    manualMetrics: parseManualMetrics(extras.manualMetrics),
  };
  return textOf(MonthlyReport({ document }));
}

/**
 * Expands function components and collects text. The report components are plain
 * server components with no hooks, and react-dom/server is unavailable under the
 * react-server condition that `server-only` needs.
 */
function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return '';
  }
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(textOf).join(' ');
  }
  if (typeof node === 'object' && 'type' in node && 'props' in node) {
    const element = node as {
      type: unknown;
      props: Record<string, unknown> & { children?: ReactNode };
    };
    if (typeof element.type === 'function') {
      const render = element.type as (props: unknown) => ReactNode;
      return textOf(render(element.props));
    }
    return textOf(element.props.children);
  }
  return '';
}

const v4Extra = {
  ga4Prior: { ok: true, data: { ...ga4Data, sessions: 1000, totalUsers: 720, newUsers: 5, returningUsers: 500 } },
  audience: {
    ok: true,
    data: {
      countries: [{ label: 'United States', sessions: 1000 }],
      devices: [
        { label: 'mobile', sessions: 800 },
        { label: 'desktop', sessions: 400 },
      ],
      browsers: [{ label: 'Chrome', sessions: 900 }],
    },
  },
  psi: {
    ok: true,
    data: {
      strategy: 'mobile',
      fetchedAt: '2026-10-03T09:45:00.000Z',
      performanceScore: 87,
      lcp: { value: 2100, threshold: 2500, passed: true },
      tbt: { value: 310, threshold: 200, passed: false },
      cls: { value: 0.02, threshold: 0.1, passed: true },
    },
  },
};

describe('MonthlyReport', () => {
  it('renders a v3 snapshot without any new sections or deltas', () => {
    const html = render(snapshot(3, {}));
    assert.equal(html.includes('vs August 2026'), false);
    assert.equal(html.includes('Devices'), false);
    assert.equal(html.includes('PageSpeed Insights'), false);
    assert.equal(html.includes('Sessions by channel'), true);
  });

  it('renders deltas, devices and the lab speed fallback for v4', () => {
    const html = render(snapshot(4, v4Extra));
    assert.equal(html.includes('+20% vs August 2026'), true);
    assert.equal(html.includes('+25% vs August 2026'), true);
    assert.equal(html.includes('Devices'), true);
    assert.equal(html.includes('Mobile'), true);
    assert.equal(html.includes('67%'), true);
    assert.equal(html.includes('United States'), false);
    assert.equal(html.includes('Chrome'), false);
    assert.equal(html.includes('PageSpeed Insights lab test'), true);
    assert.equal(html.includes('not real visitor data'), true);
    assert.equal(html.includes('Missed the 200ms threshold'), true);
    // New users prior (5) is below the percent base, so it falls back to an absolute change.
    assert.equal(html.includes('+495'), true);
  });

  it('keeps the CrUX section and skips the lab fallback when CrUX has data', () => {
    const html = render(
      snapshot(4, {
        ...v4Extra,
        crux: {
          ok: true,
          kind: 'metrics',
          data: {
            formFactor: 'PHONE',
            collectionPeriod: null,
            lcp: { p75: 2000, threshold: 2500, passed: true },
            inp: { p75: 150, threshold: 200, passed: true },
            cls: { p75: 0.05, threshold: 0.1, passed: true },
          },
        },
      }),
    );
    assert.equal(html.includes('Chrome User Experience Report'), true);
    assert.equal(html.includes('PageSpeed Insights lab test'), false);
  });

  it('omits new elements when prior, audience and psi are absent in v4', () => {
    const html = render(snapshot(4, {}));
    assert.equal(html.includes('vs August 2026'), false);
    assert.equal(html.includes('Devices'), false);
    assert.equal(html.includes('PageSpeed Insights'), false);
  });

  it('hides the work note and manual sections when there is no data', () => {
    for (const extras of [
      {},
      { workCompleted: '   ', manualMetrics: {} },
      { workCompleted: null, manualMetrics: { gbp: {}, youtube: {} } },
    ]) {
      const html = render(snapshot(4, {}), extras);
      assert.equal(html.includes('What I did this month'), false);
      assert.equal(html.includes('Calls and form leads'), false);
      assert.equal(html.includes('Google Business Profile'), false);
      assert.equal(html.includes('YouTube'), false);
    }
  });

  it('renders the work note right after the summary', () => {
    const html = render(snapshot(4, {}), {
      workCompleted: 'Rebuilt the pricing page.\n\nFixed the contact form.',
    });
    assert.equal(html.includes('What I did this month'), true);
    assert.equal(html.includes('Rebuilt the pricing page.'), true);
    assert.equal(html.includes('Fixed the contact form.'), true);
    assert.equal(
      html.indexOf('Summary') < html.indexOf('What I did this month'),
      true,
    );
    assert.equal(
      html.indexOf('What I did this month') < html.indexOf('Traffic'),
      true,
    );
  });

  it('renders manual sections with only the values that were entered', () => {
    const html = render(snapshot(4, {}), {
      manualMetrics: {
        calls: 0,
        gbp: { directionRequests: 12 },
        youtube: { views: 3400, watchTimeHours: 12.5 },
      },
    });
    assert.equal(html.includes('Calls and form leads'), true);
    assert.equal(html.includes('Phone calls'), true);
    assert.equal(html.includes('Form leads'), false);
    assert.equal(html.includes('Google Business Profile'), true);
    assert.equal(html.includes('Direction requests'), true);
    assert.equal(html.includes('Website clicks'), false);
    assert.equal(html.includes('YouTube'), true);
    assert.equal(html.includes('3,400'), true);
    assert.equal(html.includes('12.5'), true);
    assert.equal(html.includes('Videos published'), false);
  });

  it('shows one manual section without the others', () => {
    const html = render(snapshot(4, {}), { manualMetrics: { formLeads: 6 } });
    assert.equal(html.includes('Calls and form leads'), true);
    assert.equal(html.includes('Form leads'), true);
    assert.equal(html.includes('Google Business Profile'), false);
    assert.equal(html.includes('YouTube'), false);
  });

  it('drops malformed manual metrics without breaking the report', () => {
    const html = render(snapshot(4, {}), {
      manualMetrics: {
        calls: -5,
        formLeads: 'many',
        gbp: { calls: 1.5 },
        youtube: 'bad',
      },
    });
    assert.equal(html.includes('Calls and form leads'), false);
    assert.equal(html.includes('Google Business Profile'), false);
    assert.equal(html.includes('YouTube'), false);
    assert.equal(html.includes('Sessions by channel'), true);
  });

  it('keeps client-facing manual copy free of em dashes', () => {
    const html = render(snapshot(4, {}), {
      workCompleted: 'Updated the site.',
      manualMetrics: {
        calls: 3,
        formLeads: 2,
        gbp: { calls: 1, directionRequests: 2, websiteClicks: 3 },
        youtube: { views: 4, watchTimeHours: 5, videosPublished: 6 },
      },
    });
    const start = html.indexOf('What I did this month');
    assert.notEqual(start, -1);
    assert.equal(html.slice(start).includes('\u2014'), false);
  });
});
