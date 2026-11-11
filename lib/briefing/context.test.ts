// Run with: pnpm exec tsx --test lib/briefing/context.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  assembleBriefingContent,
  briefingWindows,
  contextRecordIds,
  performanceLine,
  pickHighlight,
  recordLink,
  selectRuns,
  type RawRun,
} from './context';
import {
  FIXTURE_FINDING_KEY,
  FIXTURE_INQUIRY_ID,
  FIXTURE_MEASUREMENT_CLAIM,
  FIXTURE_NOW,
  FIXTURE_OLD_INQUIRY_ID,
  FIXTURE_OLD_RUN_ID,
  FIXTURE_PERSONAL,
  FIXTURE_PROSPECT_ID,
  FIXTURE_RUN_ID,
  FIXTURE_STANDALONE_FAILED_RUN_ID,
  FIXTURE_SUPERSEDED_RUN_ID,
  FIXTURE_SUPERSEDING_RUN_ID,
  FIXTURE_TOP_PROSPECT_ID,
  FIXTURE_UNFINISHED_RUN_ID,
  FIXTURE_UNREVIEWED_ID,
  FIXTURE_UNSCORED_PROSPECT_ID,
  FIXTURE_WINDOWS,
  fixtureInputs,
  quietInputs,
} from './fixtures/briefing-inputs.fixture';
import { buildUserMessage } from './narrative';
import type { FactorRatings } from '../prospects/rubric';

function assemble(inputs = fixtureInputs()) {
  return assembleBriefingContent(inputs, { now: FIXTURE_NOW, windows: FIXTURE_WINDOWS });
}

describe('briefing windows', () => {
  it('uses 7 days for prospects and 24 hours for runs when there is no previous briefing', () => {
    assert.deepEqual(briefingWindows(FIXTURE_NOW, null), {
      prospectsSince: '2026-11-03T16:00:00.000Z',
      runsSince: '2026-11-09T16:00:00.000Z',
      inquiriesSince: '2026-10-11T16:00:00.000Z',
    });
  });

  it('uses the previous briefing for prospects and runs; inquiries stay at 30 days', () => {
    assert.deepEqual(briefingWindows(FIXTURE_NOW, '2026-11-09T15:05:00.000Z'), {
      prospectsSince: '2026-11-09T15:05:00.000Z',
      runsSince: '2026-11-09T15:05:00.000Z',
      inquiriesSince: '2026-10-11T16:00:00.000Z',
    });
  });
});

describe('new prospects', () => {
  it('orders by priority, highest first, with missing scores last, and keeps the total', () => {
    const content = assemble();
    assert.deepEqual(
      content.newProspects.map((p) => p.id),
      [FIXTURE_TOP_PROSPECT_ID, FIXTURE_PROSPECT_ID, FIXTURE_UNSCORED_PROSPECT_ID],
    );
    assert.deepEqual(content.newProspects.map((p) => p.priority), [78, 62, null]);
    assert.equal(content.newProspectsTotal, 14);
  });

  it('builds a compact performance line from the measurement, without the lab data sentence', () => {
    const content = assemble();
    const measured = content.newProspects.find((p) => p.id === FIXTURE_PROSPECT_ID);
    assert.equal(measured?.performance, 'Mobile performance 33/100, LCP 16.2 s');
    assert.ok(!JSON.stringify(content).includes('Lab data'));
    const unmeasured = content.newProspects.find((p) => p.id === FIXTURE_TOP_PROSPECT_ID);
    assert.equal(unmeasured?.performance, null);
    assert.equal(performanceLine([{ factorKey: 'performance_technical_issues', kind: 'measurement', claim: FIXTURE_MEASUREMENT_CLAIM, sourceUrl: 'https://example.com/' }]), 'Mobile performance 33/100, LCP 16.2 s');
  });

  it('keeps exactly one highlight per prospect and never a performance item', () => {
    const content = assemble();
    const byId = Object.fromEntries(content.newProspects.map((p) => [p.id, p.highlight?.claim]));
    // Opportunity strong (navigation, weight 35) beats fit strong and opportunity weak.
    assert.equal(byId[FIXTURE_PROSPECT_ID], 'Fixture: service pages have no contact link.');
    // Opportunity strong (content, weight 20) beats opportunity weak (navigation, weight 35).
    assert.equal(byId[FIXTURE_TOP_PROSPECT_ID], 'Fixture: service pages repeat the same text.');
    // Only fit evidence available.
    assert.equal(byId[FIXTURE_UNSCORED_PROSPECT_ID], 'Fixture: says it is growing.');
  });
});

describe('pickHighlight', () => {
  const none: FactorRatings = {
    market_industry_match: 'unknown',
    business_complexity: 'unknown',
    custom_web_relevance: 'unknown',
    growth_signals: 'unknown',
    navigation_conversion_friction: 'unknown',
    performance_technical_issues: 'unknown',
    content_information_architecture: 'unknown',
    integration_cms_opportunity: 'unknown',
  };
  const item = (factorKey: string, claim: string) => ({ factorKey, kind: 'observation', claim, sourceUrl: 'https://example.com/' });

  it('prefers opportunity strong by weight, then opportunity weak, then fit', () => {
    const ratings: FactorRatings = {
      ...none,
      integration_cms_opportunity: 'strong',
      content_information_architecture: 'strong',
      navigation_conversion_friction: 'weak',
      business_complexity: 'strong',
    };
    const evidence = [
      item('business_complexity', 'fit strong'),
      item('navigation_conversion_friction', 'opp weak'),
      item('integration_cms_opportunity', 'opp strong 15'),
      item('content_information_architecture', 'opp strong 20'),
    ];
    assert.equal(pickHighlight(ratings, evidence)?.claim, 'opp strong 20');
    assert.equal(pickHighlight({ ...ratings, content_information_architecture: 'unknown', integration_cms_opportunity: 'unknown' }, evidence)?.claim, 'opp weak');
    assert.equal(pickHighlight({ ...none, business_complexity: 'strong' }, evidence)?.claim, 'fit strong');
  });

  it('ignores performance evidence and returns null when there is nothing else', () => {
    assert.equal(
      pickHighlight({ ...none, performance_technical_issues: 'strong' }, [
        { factorKey: 'performance_technical_issues', kind: 'measurement', claim: FIXTURE_MEASUREMENT_CLAIM, sourceUrl: 'https://example.com/' },
      ]),
      null,
    );
  });
});

describe('inbound inquiries', () => {
  it('lists at most 5 from the last 30 days, newest first, and counts older ones', () => {
    const content = assemble();
    assert.equal(content.inquiries.recent.length, 5);
    assert.equal(content.inquiries.recent[0]?.id, FIXTURE_INQUIRY_ID);
    const created = content.inquiries.recent.map((i) => i.ageDays ?? -1);
    assert.deepEqual(created, [...created].sort((a, b) => a - b), 'newest first');
    assert.equal(content.inquiries.recentTotal, 6);
    assert.equal(content.inquiries.olderCount, 2);
  });

  it('keeps inquiries older than 30 days out of the context, so they cannot drive actions', () => {
    const content = assemble();
    assert.ok(!contextRecordIds(content).has(FIXTURE_OLD_INQUIRY_ID));
    assert.ok(!buildUserMessage(content).includes(FIXTURE_OLD_INQUIRY_ID));
    assert.ok(!buildUserMessage(content).includes('Fictional Stale Inquiry'));
  });

  it('never carries inquiry names, emails, phones or messages', () => {
    const content = assemble();
    const stored = JSON.stringify(content);
    const sent = buildUserMessage(content);
    for (const value of Object.values(FIXTURE_PERSONAL)) {
      assert.ok(!stored.includes(value), `stored content leaked ${value}`);
      assert.ok(!sent.includes(value), `model input leaked ${value}`);
    }
    assert.deepEqual(Object.keys(content.inquiries.recent[0] ?? {}).sort(), ['ageDays', 'company', 'id', 'status']);
  });
});

describe('research runs', () => {
  it('includes only runs finished in the window, newest first, and drops superseded failures', () => {
    const content = assemble();
    assert.deepEqual(
      content.runs.map((r) => r.id),
      [FIXTURE_RUN_ID, FIXTURE_SUPERSEDING_RUN_ID, FIXTURE_STANDALONE_FAILED_RUN_ID],
    );
    const ids = contextRecordIds(content);
    for (const excluded of [FIXTURE_SUPERSEDED_RUN_ID, FIXTURE_OLD_RUN_ID, FIXTURE_UNFINISHED_RUN_ID]) {
      assert.ok(!ids.has(excluded), excluded);
    }
  });

  it('keeps notes and errors separate', () => {
    const content = assemble();
    const withNotes = content.runs.find((r) => r.id === FIXTURE_RUN_ID);
    const failed = content.runs.find((r) => r.id === FIXTURE_STANDALONE_FAILED_RUN_ID);
    assert.deepEqual(withNotes?.notes, ['Skipped excluded-firm.example.net: HTTP 403']);
    assert.deepEqual(withNotes?.errors, []);
    assert.deepEqual(failed?.errors, ['Runner crashed']);
  });

  it('keeps a failed run when the completed run for the same pair finished earlier', () => {
    const base: RawRun = {
      id: 'a', state: 'completed', market: 'M', industry: 'I', saved: 1, requested: 1,
      errors: [], notes: [], requestedAt: '2026-11-10T00:00:00Z', finishedAt: '2026-11-10T09:00:00Z',
    };
    const failedLater: RawRun = { ...base, id: 'b', state: 'failed', finishedAt: '2026-11-10T11:00:00Z' };
    assert.deepEqual(selectRuns([base, failedLater], '2026-11-09T16:00:00Z').map((r) => r.id), ['b', 'a']);
  });

  describe('superseded failed runs', () => {
    const failed: RawRun = {
      id: 'f', state: 'failed', market: 'M', industry: 'I', saved: 0, requested: 5,
      errors: ['x'], notes: [], requestedAt: '2026-11-10T00:00:00Z', finishedAt: '2026-11-10T09:00:00Z',
    };
    const later = (overrides: Partial<RawRun>): RawRun => ({
      ...failed, id: 'later', errors: [], finishedAt: '2026-11-10T10:00:00Z', ...overrides,
    });
    const ids = (runs: RawRun[]) => selectRuns(runs, '2026-11-09T16:00:00Z').map((r) => r.id);

    it('drops the failure when a later run saved at least one prospect, whatever its state', () => {
      for (const state of ['completed', 'partial', 'failed', 'cancelled']) {
        assert.deepEqual(ids([failed, later({ state, saved: 1 })]), ['later'], state);
      }
    });

    it('keeps the failure when the later run saved nothing', () => {
      for (const state of ['completed', 'partial']) {
        assert.deepEqual(ids([failed, later({ state, saved: 0 })]), ['later', 'f'], state);
      }
    });

    it('keeps the failure when the run that saved prospects finished earlier', () => {
      assert.deepEqual(ids([failed, later({ saved: 3, finishedAt: '2026-11-10T08:00:00Z' })]), ['f', 'later']);
    });

    it('keeps the failure when the later run is for a different market or industry, or has not finished', () => {
      assert.deepEqual(ids([failed, later({ saved: 3, market: 'Elsewhere' })]), ['later', 'f']);
      assert.deepEqual(ids([failed, later({ saved: 3, industry: 'Other' })]), ['later', 'f']);
      assert.deepEqual(ids([failed, later({ state: 'claimed', saved: 3, finishedAt: null })]), ['f']);
    });

    it('matches market and industry ignoring case and spacing', () => {
      assert.deepEqual(ids([failed, later({ saved: 2, market: ' m ', industry: 'i' })]), ['later']);
    });
  });
});

describe('findings and other sections', () => {
  it('shows at most 5 findings with the total', () => {
    const content = assemble();
    assert.equal(content.findings.items.length, 5);
    assert.equal(content.findings.openCount, 7);
    assert.equal(content.findings.items[0]?.findingKey, FIXTURE_FINDING_KEY);
  });

  it('marks failed loaders unavailable rather than empty', () => {
    const content = assemble(fixtureInputs({ findings: { ok: false }, sources: { ok: false } }));
    assert.deepEqual(content.unavailable, ['findings', 'sources']);
    assert.equal(content.quiet, false);
  });

  it('is quiet when nothing needs attention', () => {
    assert.equal(assemble(quietInputs()).quiet, true);
  });

  it('collects every record id and links each to its page', () => {
    const content = assemble();
    const ids = contextRecordIds(content);
    for (const id of [FIXTURE_PROSPECT_ID, FIXTURE_UNREVIEWED_ID, FIXTURE_INQUIRY_ID, FIXTURE_FINDING_KEY, FIXTURE_RUN_ID, 'clarity']) {
      assert.ok(ids.has(id), id);
    }
    assert.equal(recordLink(content, FIXTURE_PROSPECT_ID)?.href, `/intel/prospects/${FIXTURE_PROSPECT_ID}`);
    assert.equal(recordLink(content, FIXTURE_INQUIRY_ID)?.href, `/intel/leads/${FIXTURE_INQUIRY_ID}`);
    assert.equal(recordLink(content, FIXTURE_OLD_INQUIRY_ID), null);
  });
});

describe('unreviewed prospects', () => {
  it('never repeats a prospect already listed as new', () => {
    const content = assemble(
      fixtureInputs({
        topUnreviewed: {
          ok: true,
          value: [
            { id: FIXTURE_TOP_PROSPECT_ID, name: 'Fictional Mesa Dental', domain: 'example.org', fitScore: 90, opportunityScore: 60 },
            { id: FIXTURE_UNREVIEWED_ID, name: 'Fictional Desert Bloom Dental', domain: 'bloom.example.org', fitScore: 80, opportunityScore: 50 },
            { id: FIXTURE_PROSPECT_ID, name: 'Fictional Harbor Legal Group', domain: 'example.com', fitScore: 73, opportunityScore: 45 },
          ],
        },
      }),
    );
    assert.deepEqual(content.topUnreviewed.map((p) => p.id), [FIXTURE_UNREVIEWED_ID]);
  });

  it('is empty, so the section is omitted, when every unreviewed prospect is new', () => {
    const content = assemble(
      fixtureInputs({
        topUnreviewed: {
          ok: true,
          value: [{ id: FIXTURE_PROSPECT_ID, name: 'Fictional Harbor Legal Group', domain: 'example.com', fitScore: 73, opportunityScore: 45 }],
        },
      }),
    );
    assert.deepEqual(content.topUnreviewed, []);
    assert.ok(!content.unavailable.includes('topUnreviewed'));
  });
});

describe('new businesses line', () => {
  it('saves a count since the previous briefing but never sends it to the model', () => {
    const content = assemble();
    assert.deepEqual(content.newBusinesses, { count: 4, since: FIXTURE_WINDOWS.prospectsSince });
    const sent = JSON.parse(buildUserMessage(content));
    assert.ok(!('newBusinesses' in sent));
  });

  it('is not quiet when new businesses arrived, and marks a failed count unavailable without telling the model', () => {
    assert.equal(assemble({ ...quietInputs(), newBusinesses: { ok: true, value: 2 } }).quiet, false);
    const failed = assemble(fixtureInputs({ newBusinesses: { ok: false } }));
    assert.ok(failed.unavailable.includes('newBusinesses'));
    assert.ok(!JSON.parse(buildUserMessage(failed)).unavailable.includes('newBusinesses'));
  });
});

describe('new businesses with no website found', () => {
  it('adds the unreviewed no-website count to the saved content only', () => {
    const content = assemble(fixtureInputs({ newBusinessesNoWebsite: { ok: true, value: 7 } }));
    assert.deepEqual(content.newBusinesses, { count: 4, since: FIXTURE_WINDOWS.prospectsSince, noWebsite: 7 });
    assert.ok(!('newBusinesses' in JSON.parse(buildUserMessage(content))));
  });

  it('leaves the field out when the count is not loaded', () => {
    assert.deepEqual(assemble(fixtureInputs({ newBusinessesNoWebsite: { ok: false } })).newBusinesses, { count: 4, since: FIXTURE_WINDOWS.prospectsSince });
    assert.deepEqual(assemble().newBusinesses, { count: 4, since: FIXTURE_WINDOWS.prospectsSince });
  });
});
