// Run with: pnpm exec tsx --test lib/briefing/generate.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { RawBriefingInputs } from './context';
import { FIXTURE_PROSPECT_ID, fixtureInputs, quietInputs } from './fixtures/briefing-inputs.fixture';
import { MemoryBriefingStore } from './fixtures/memory-stores';
import {
  generateBriefing,
  generateScheduledBriefing,
  type BriefingRecord,
  type GenerateDeps,
} from './generate';
import type { CallModel } from './narrative';

const GOOD_MODEL: CallModel = async () => ({
  ok: true,
  text: JSON.stringify({ narrative: 'One new prospect worth a look.', actions: [{ recordId: FIXTURE_PROSPECT_ID, text: 'Review it.' }] }),
});

function deps(options: {
  now: string;
  store?: MemoryBriefingStore;
  inputs?: RawBriefingInputs;
  callModel?: CallModel | null;
  sinceSeen?: string[];
}): GenerateDeps & { store: MemoryBriefingStore; modelCalls: { count: number } } {
  const modelCalls = { count: 0 };
  const model = options.callModel === undefined ? GOOD_MODEL : options.callModel;
  return {
    store: options.store ?? new MemoryBriefingStore(),
    sources: {
      async load({ windows }) {
        options.sinceSeen?.push(`${windows.prospectsSince} ${windows.runsSince}`);
        return options.inputs ?? fixtureInputs();
      },
    },
    callModel:
      model === null
        ? null
        : async (input) => {
            modelCalls.count += 1;
            return model(input);
          },
    now: () => new Date(options.now),
    modelCalls,
  };
}

const MORNING = '2026-11-10T15:30:00Z'; // Nov 10, 7:30 AM PST

describe('generateBriefing', () => {
  it('saves content, narrative and validated actions', async () => {
    const d = deps({ now: MORNING });
    const result = await generateBriefing(d, { overwrite: false });
    assert.deepEqual(result, { outcome: 'saved', briefingDate: '2026-11-10', status: 'complete', error: null });
    const saved = d.store.rows.get('2026-11-10');
    assert.equal(saved?.narrative, 'One new prospect worth a look.');
    assert.equal(saved?.content.suggestedActions?.[0]?.recordId, FIXTURE_PROSPECT_ID);
    assert.equal(saved?.sourceFreshness.length, 3);
  });

  it('saves without a narrative when the model is not configured', async () => {
    const d = deps({ now: MORNING, callModel: null });
    const result = await generateBriefing(d, { overwrite: false });
    assert.equal(result.status, 'no_narrative');
    assert.equal(result.error, 'model_not_configured');
    assert.equal(d.store.rows.get('2026-11-10')?.narrative, null);
    assert.equal(d.store.rows.get('2026-11-10')?.content.newProspects.length, 3, 'sections still saved');
  });

  it('falls back when the call fails', async () => {
    const d = deps({ now: MORNING, callModel: async () => ({ ok: false, reason: 'model_call_failed (HTTP 500)' }) });
    const result = await generateBriefing(d, { overwrite: false });
    assert.equal(result.status, 'no_narrative');
    assert.equal(result.error, 'model_call_failed (HTTP 500)');
  });

  it('falls back when the output does not validate', async () => {
    const d = deps({
      now: MORNING,
      callModel: async () => ({ ok: true, text: JSON.stringify({ narrative: 'x', actions: [{ recordId: 'made-up', text: 'y' }] }) }),
    });
    const result = await generateBriefing(d, { overwrite: false });
    assert.equal(result.status, 'no_narrative');
    assert.match(result.error ?? '', /^invalid_output: unknown recordId/);
    assert.equal(d.store.rows.get('2026-11-10')?.content.suggestedActions, null);
  });

  it('keeps a trimmed summary when both replies are over the length cap', async () => {
    const long = JSON.stringify({ narrative: Array.from({ length: 140 }, (_, i) => ((i + 1) % 20 === 0 ? 'word.' : 'word')).join(' '), actions: [] });
    const d = deps({ now: MORNING, callModel: async () => ({ ok: true, text: long }) });
    const result = await generateBriefing(d, { overwrite: false });
    assert.equal(result.status, 'complete');
    assert.equal(result.error, null);
    assert.equal(d.modelCalls.count, 2);
    const narrative = d.store.rows.get('2026-11-10')?.narrative ?? '';
    assert.equal(narrative.split(/\s+/).length, 120);
  });

  it('says a quiet day plainly without calling the model', async () => {
    const d = deps({ now: MORNING, inputs: quietInputs() });
    const result = await generateBriefing(d, { overwrite: false });
    assert.equal(result.status, 'complete');
    assert.equal(d.modelCalls.count, 0);
    assert.equal(d.store.rows.get('2026-11-10')?.content.quiet, true);
  });

  it('marks the briefing failed when every source is unavailable', async () => {
    const d = deps({ now: MORNING });
    d.sources = {
      async load() {
        throw new Error('db down');
      },
    };
    const result = await generateBriefing(d, { overwrite: false });
    assert.equal(result.status, 'failed');
    assert.equal(result.error, 'all_sources_unavailable');
    assert.equal(d.modelCalls.count, 0);
  });

  it('looks back to the previous briefing, or 7 days for prospects and 24 hours for runs when there is none', async () => {
    const sinceSeen: string[] = [];
    const store = new MemoryBriefingStore();
    await generateBriefing(deps({ now: '2026-11-09T15:10:00Z', store, sinceSeen }), { overwrite: false });
    await generateBriefing(deps({ now: MORNING, store, sinceSeen }), { overwrite: false });
    assert.deepEqual(sinceSeen, [
      '2026-11-02T15:10:00.000Z 2026-11-08T15:10:00.000Z',
      '2026-11-09T15:10:00.000Z 2026-11-09T15:10:00.000Z',
    ]);
  });

  it('regenerates today when asked to overwrite', async () => {
    const store = new MemoryBriefingStore();
    await generateBriefing(deps({ now: MORNING, store, callModel: null }), { overwrite: false });
    const again = await generateBriefing(deps({ now: '2026-11-10T18:00:00Z', store }), { overwrite: true });
    assert.equal(again.outcome, 'saved');
    assert.equal(store.rows.get('2026-11-10')?.status, 'complete');
    assert.equal(store.saves, 2);
  });
});

describe('generateScheduledBriefing', () => {
  it('skips before 7:00 local', async () => {
    const d = deps({ now: '2026-11-10T14:30:00Z' }); // 6:30 AM PST
    assert.deepEqual(await generateScheduledBriefing(d), { action: 'skipped', reason: 'before_local_hour', briefingDate: '2026-11-10' });
    assert.equal(d.store.saves, 0);
  });

  it('generates once per local day', async () => {
    const store = new MemoryBriefingStore();
    const first = await generateScheduledBriefing(deps({ now: MORNING, store }));
    const second = await generateScheduledBriefing(deps({ now: '2026-11-10T23:00:00Z', store }));
    assert.equal(first.action, 'generated');
    assert.deepEqual(second, { action: 'skipped', reason: 'already_exists', briefingDate: '2026-11-10' });
    assert.equal(store.saves, 1);
  });

  it('treats a lost insert race as already existing', async () => {
    const store = new MemoryBriefingStore();
    store.getByDate = async () => null; // first check misses
    store.rows.set('2026-11-10', {} as BriefingRecord); // but the row lands first
    const result = await generateScheduledBriefing(deps({ now: MORNING, store }));
    assert.deepEqual(result, { action: 'skipped', reason: 'already_exists', briefingDate: '2026-11-10' });
  });
});
