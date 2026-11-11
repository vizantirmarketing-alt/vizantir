// Run with: pnpm exec tsx --test lib/briefing/resolved-runs.test.ts
// The real shape of the Nov 10 to 11 case, with fictional ids.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { assembleBriefingContent, contextRecordIds, resolvedRunIds, type RawRun } from './context';
import { FIXTURE_WINDOWS, quietInputs } from './fixtures/briefing-inputs.fixture';
import { BRIEFING_SYSTEM_PROMPT, buildUserMessage, validateNarrativeOutput } from './narrative';

// Nov 11, 7:00 AM Pacific; the previous briefing was Nov 10, 7:00 AM Pacific.
const NOW = new Date('2026-11-11T15:00:00Z');
const WINDOWS = { ...FIXTURE_WINDOWS, runsSince: '2026-11-10T15:00:00Z', prospectsSince: '2026-11-10T15:00:00Z' };

// Law firms, Las Vegas: failed at 18:39 Pacific because no company website could be opened.
const LAW_FIRMS: RawRun = {
  id: 'run-law-firms',
  state: 'failed',
  market: 'Las Vegas',
  industry: 'Law firms',
  saved: 0,
  requested: 10,
  errors: ['Run not carried out: the research environment could not open company websites (network policy blocked the hosts).'],
  notes: [],
  requestedAt: '2026-11-11T02:30:00Z',
  finishedAt: '2026-11-11T02:39:00Z',
};
// Commercial real estate, Las Vegas: completed at 21:52 Pacific with six prospects saved.
const COMMERCIAL_REAL_ESTATE: RawRun = {
  id: 'run-commercial-real-estate',
  state: 'completed',
  market: 'Las Vegas',
  industry: 'Commercial real estate',
  saved: 6,
  requested: 10,
  errors: [],
  notes: [],
  requestedAt: '2026-11-11T05:30:00Z',
  finishedAt: '2026-11-11T05:52:00Z',
};

function briefing(runs: RawRun[]) {
  return assembleBriefingContent({ ...quietInputs(), runs: { ok: true, value: runs } }, { now: NOW, windows: WINDOWS });
}

const STALE_ACTION = JSON.stringify({
  narrative: 'Commercial real estate research saved six prospects.',
  actions: [{ recordId: 'run-law-firms', text: 'Fix the cloud environment network policy so the law firm research run can be retried.' }],
});

describe('a failure resolved by a later successful run in another industry', () => {
  const content = briefing([LAW_FIRMS, COMMERCIAL_REAL_ESTATE]);
  const lawFirms = content.runs.find((run) => run.id === 'run-law-firms');

  it('is marked resolved, keeps no error lines, and stays in the factual run list', () => {
    assert.deepEqual(resolvedRunIds([LAW_FIRMS, COMMERCIAL_REAL_ESTATE]), new Set(['run-law-firms']));
    assert.equal(lawFirms?.resolved, true);
    assert.deepEqual(lawFirms?.errors, []);
    assert.equal(content.runs.find((run) => run.id === 'run-commercial-real-estate')?.resolved, undefined);
  });

  it('is not sent to the model, so it cannot be summarised as a current problem', () => {
    const sent = JSON.parse(buildUserMessage(content)) as { runs: { id: string }[] };
    assert.deepEqual(sent.runs.map((run) => run.id), ['run-commercial-real-estate']);
    const text = buildUserMessage(content);
    assert.ok(!text.includes('run-law-firms'));
    assert.ok(!/network policy|could not open/i.test(text));
    assert.match(BRIEFING_SYSTEM_PROMPT, /never describe a resolved failure as a current problem and never propose fixing it/);
  });

  it('produces no action item, even if the model proposes one', () => {
    assert.ok(!contextRecordIds(content).has('run-law-firms'));
    const result = validateNarrativeOutput(STALE_ACTION, content);
    assert.ok(result.ok);
    assert.deepEqual(result.ok ? result.actions : null, []);
    assert.equal(result.ok ? result.narrative : null, 'Commercial real estate research saved six prospects.');
  });
});

describe('a failure with no later success', () => {
  it('stays as it is today, including its action item', () => {
    const content = briefing([LAW_FIRMS]);
    const run = content.runs[0];
    assert.equal(run?.resolved, undefined);
    assert.deepEqual(run?.errors, LAW_FIRMS.errors);
    assert.ok(buildUserMessage(content).includes('run-law-firms'));
    const result = validateNarrativeOutput(STALE_ACTION, content);
    assert.ok(result.ok && result.actions.length === 1 && result.actions[0]?.recordId === 'run-law-firms');
    assert.equal(content.quiet, false);
  });

  it('is not resolved by a later run that saved zero prospects', () => {
    const empty = { ...COMMERCIAL_REAL_ESTATE, state: 'completed', saved: 0 };
    assert.equal(resolvedRunIds([LAW_FIRMS, empty]).size, 0);
    assert.equal(briefing([LAW_FIRMS, empty]).runs.find((run) => run.id === 'run-law-firms')?.resolved, undefined);
  });

  it('is not resolved by a successful run that finished before it, or that has not finished', () => {
    assert.equal(resolvedRunIds([LAW_FIRMS, { ...COMMERCIAL_REAL_ESTATE, finishedAt: '2026-11-11T02:00:00Z' }]).size, 0);
    assert.equal(resolvedRunIds([LAW_FIRMS, { ...COMMERCIAL_REAL_ESTATE, state: 'claimed', finishedAt: null }]).size, 0);
  });
});

describe('which failures can be resolved', () => {
  it('a partial run that saved nothing is a failure of the run as a whole', () => {
    assert.deepEqual(resolvedRunIds([{ ...LAW_FIRMS, state: 'partial' }, COMMERCIAL_REAL_ESTATE]), new Set(['run-law-firms']));
  });

  it('a partial run that saved prospects is left as it is', () => {
    assert.equal(resolvedRunIds([{ ...LAW_FIRMS, state: 'partial', saved: 3 }, COMMERCIAL_REAL_ESTATE]).size, 0);
  });

  it('is decided without reading the error text', () => {
    for (const errors of [[], ['anything at all'], ['Runner crashed']]) {
      assert.deepEqual(resolvedRunIds([{ ...LAW_FIRMS, errors }, COMMERCIAL_REAL_ESTATE]), new Set(['run-law-firms']));
    }
  });

  it('a later run whose final state is partial or failed still resolves it if it saved prospects', () => {
    for (const state of ['partial', 'failed']) {
      assert.deepEqual(resolvedRunIds([LAW_FIRMS, { ...COMMERCIAL_REAL_ESTATE, state, saved: 2 }]), new Set(['run-law-firms']), state);
    }
  });
});
