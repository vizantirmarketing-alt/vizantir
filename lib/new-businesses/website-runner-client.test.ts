// Run with: pnpm exec tsx --test lib/new-businesses/website-runner-client.test.ts
// No network: fetch is injected.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { RunnerDeps } from '@/lib/prospects/runner-client';
import { isWebsiteCheckCommand, runWebsiteCheckCli } from './website-runner-client';

const TOKEN = 'test-token-not-real';

function harness(status: number, body: unknown, env: Record<string, string> = { PROSPECT_INGEST_TOKEN: TOKEN }, files: Record<string, string> = {}) {
  const calls: { url: string; headers: Record<string, string>; body?: string }[] = [];
  const out: string[] = [];
  const err: string[] = [];
  const deps: RunnerDeps = {
    fetch: async (url, init) => {
      calls.push({ url, headers: init.headers, body: init.body });
      return { status, text: async () => JSON.stringify(body) };
    },
    env,
    readEnvFile: () => null,
    readFile: (path) => {
      if (!(path in files)) throw new Error('missing');
      return files[path]!;
    },
    stdout: (line) => out.push(line),
    stderr: (line) => err.push(line),
  };
  return { deps, calls, out, err };
}

const RUN = '00000000-0000-4000-8000-000000000009';
const VALID = JSON.stringify({ runId: RUN, businesses: [{ id: '00000000-0000-4000-8000-000000000001', searches: ['a', 'b'], candidates: [], placeholder: false, outcome_claimed: 'none_found' }] });

describe('website check helper commands', () => {
  it('recognizes only its own commands', () => {
    assert.equal(isWebsiteCheckCommand('nb-claim'), true);
    assert.equal(isWebsiteCheckCommand('nb-ingest'), true);
    assert.equal(isWebsiteCheckCommand('claim'), false);
  });

  it('nb-claim exits 2 when nothing is queued, and posts to the prospects path with the bearer token', async () => {
    const h = harness(200, { run: null });
    assert.equal(await runWebsiteCheckCli(['nb-claim'], h.deps), 2);
    assert.equal(h.calls[0]!.url, 'http://localhost:3000/api/prospects/new-businesses/claim');
    assert.equal(h.calls[0]!.headers.Authorization, `Bearer ${TOKEN}`);
    assert.ok(!h.out.join('\n').includes(TOKEN) && !h.err.join('\n').includes(TOKEN));
  });

  it('nb-claim prints the claimed run', async () => {
    const h = harness(200, { run: { id: RUN }, businesses: [], rules: {} });
    assert.equal(await runWebsiteCheckCli(['nb-claim'], h.deps), 0);
    assert.match(h.out.join('\n'), new RegExp(RUN));
  });

  it('proxy-auth mode sends no Authorization header and needs an https base URL', async () => {
    const h = harness(200, { run: null }, { PROSPECT_RUNNER_PROXY_AUTH: '1', PROSPECT_RUNNER_BASE_URL: 'https://intel.example.test' });
    assert.equal(await runWebsiteCheckCli(['nb-claim'], h.deps), 2);
    assert.equal(h.calls[0]!.url, 'https://intel.example.test/api/prospects/new-businesses/claim');
    assert.equal(h.calls[0]!.headers.Authorization, undefined);
    const local = harness(200, { run: null }, { PROSPECT_RUNNER_PROXY_AUTH: '1', PROSPECT_RUNNER_BASE_URL: 'http://localhost:3000' });
    assert.equal(await runWebsiteCheckCli(['nb-claim'], local.deps), 1);
    assert.equal(local.calls.length, 0);
  });

  it('nb-ingest validates the file locally before sending it', async () => {
    const bad = harness(200, {}, { PROSPECT_INGEST_TOKEN: TOKEN }, { '/tmp/website-checks/a.json': JSON.stringify({ runId: RUN, businesses: [], status: 'no_website' }) });
    assert.equal(await runWebsiteCheckCli(['nb-ingest', '/tmp/website-checks/a.json'], bad.deps), 1);
    assert.equal(bad.calls.length, 0);
    assert.match(bad.err.join('\n'), /Batch file is invalid/);

    const good = harness(200, { runId: RUN, runState: 'claimed', checked: [{ id: 'x', websiteStatus: 'no_website' }], rejected: [], counts: { checked: 1, rejected: 0 } }, { PROSPECT_INGEST_TOKEN: TOKEN }, { '/tmp/website-checks/b.json': VALID });
    assert.equal(await runWebsiteCheckCli(['nb-ingest', '/tmp/website-checks/b.json'], good.deps), 0);
    assert.equal(good.calls[0]!.url, 'http://localhost:3000/api/prospects/new-businesses/ingest');
    assert.match(good.out.join('\n'), /checked   x  no_website/);
  });

  it('reports server rejections and usage errors', async () => {
    const h = harness(409, { error: 'Run is not claimed', runState: 'completed' }, { PROSPECT_INGEST_TOKEN: TOKEN }, { '/tmp/website-checks/c.json': VALID });
    assert.equal(await runWebsiteCheckCli(['nb-ingest', '/tmp/website-checks/c.json'], h.deps), 1);
    assert.match(h.err.join('\n'), /HTTP 409: Run is not claimed/);
    assert.equal(await runWebsiteCheckCli(['nb-ingest'], harness(200, {}).deps), 64);
  });
});
