// Run with: NODE_OPTIONS=--conditions=react-server pnpm exec tsx --test lib/reports/manual-metrics.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  EMPTY_MANUAL_METRICS_FORM,
  manualMetricsFromForm,
  manualMetricsToFormValues,
  parseManualMetrics,
} from './manual-metrics';

describe('parseManualMetrics', () => {
  it('returns null for missing or non-object values', () => {
    assert.equal(parseManualMetrics(null), null);
    assert.equal(parseManualMetrics(undefined), null);
    assert.equal(parseManualMetrics('calls'), null);
    assert.equal(parseManualMetrics([1, 2]), null);
    assert.equal(parseManualMetrics({}), null);
  });

  it('keeps a fully valid object, including zero', () => {
    const parsed = parseManualMetrics({
      calls: 0,
      formLeads: 7,
      gbp: { calls: 3, directionRequests: 4, websiteClicks: 5 },
      youtube: { views: 1200, watchTimeHours: 12.5, videosPublished: 2 },
    });
    assert.deepEqual(parsed, {
      calls: 0,
      formLeads: 7,
      gbp: { calls: 3, directionRequests: 4, websiteClicks: 5 },
      youtube: { views: 1200, watchTimeHours: 12.5, videosPublished: 2 },
    });
  });

  it('drops malformed fields and keeps the valid ones', () => {
    const parsed = parseManualMetrics({
      calls: -1,
      formLeads: 'ten',
      gbp: { calls: 3.5, directionRequests: 4, websiteClicks: null },
      youtube: { views: 10, watchTimeHours: -2, videosPublished: Number.NaN },
    });
    assert.deepEqual(parsed, {
      gbp: { directionRequests: 4 },
      youtube: { views: 10 },
    });
  });

  it('drops a group that is not an object and returns null when nothing survives', () => {
    assert.equal(
      parseManualMetrics({ calls: 'x', gbp: 'nope', youtube: [1] }),
      null
    );
    assert.deepEqual(parseManualMetrics({ calls: 4, gbp: 5 }), { calls: 4 });
  });

  it('allows a fractional watch time but rejects fractional counts', () => {
    assert.deepEqual(parseManualMetrics({ youtube: { watchTimeHours: 0.5 } }), {
      youtube: { watchTimeHours: 0.5 },
    });
    assert.equal(parseManualMetrics({ calls: 1.5 }), null);
  });
});

describe('manualMetricsFromForm', () => {
  it('treats blank fields as not entered', () => {
    const result = manualMetricsFromForm(EMPTY_MANUAL_METRICS_FORM);
    assert.deepEqual(result, { ok: true, metrics: null });
  });

  it('builds nested metrics and keeps an entered zero', () => {
    const result = manualMetricsFromForm({
      ...EMPTY_MANUAL_METRICS_FORM,
      calls: ' 0 ',
      gbpDirectionRequests: '12',
      youtubeWatchTimeHours: '3.5',
    });
    assert.deepEqual(result, {
      ok: true,
      metrics: {
        calls: 0,
        gbp: { directionRequests: 12 },
        youtube: { watchTimeHours: 3.5 },
      },
    });
  });

  it('rejects text, negatives and decimals in count fields', () => {
    for (const bad of ['abc', '-3', '2.5', '1e3']) {
      const result = manualMetricsFromForm({
        ...EMPTY_MANUAL_METRICS_FORM,
        formLeads: bad,
      });
      assert.equal(result.ok, false);
    }
  });

  it('rejects a malformed watch time and values that are too large', () => {
    assert.equal(
      manualMetricsFromForm({
        ...EMPTY_MANUAL_METRICS_FORM,
        youtubeWatchTimeHours: '1,5',
      }).ok,
      false
    );
    assert.equal(
      manualMetricsFromForm({
        ...EMPTY_MANUAL_METRICS_FORM,
        calls: '99999999999',
      }).ok,
      false
    );
  });

  it('round-trips through the form values', () => {
    const metrics = {
      calls: 4,
      gbp: { websiteClicks: 9 },
      youtube: { watchTimeHours: 2.5 },
    };
    const values = manualMetricsToFormValues(metrics);
    assert.equal(values.calls, '4');
    assert.equal(values.gbpWebsiteClicks, '9');
    assert.equal(values.youtubeWatchTimeHours, '2.5');
    assert.equal(values.formLeads, '');
    assert.deepEqual(manualMetricsFromForm(values), { ok: true, metrics });
  });
});
