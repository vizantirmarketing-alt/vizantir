// Run with: pnpm exec tsx --test lib/prospects/runner-client.test.ts
// No test here makes a network request: fetch is injected.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { FIXTURE_BATCH, FIXTURE_RUN_ID, fixtureClaimedRun } from './fixtures/ingest-batch.fixture';
import { MemoryProspectStore } from './fixtures/memory-store';
import { ingestBatch } from './ingest';
import { parseIngestBody } from './ingest-schema';
import { authorizeRunner } from './runner-auth';
import {
  EXIT_FAILURE,
  EXIT_NO_RUN_QUEUED,
  EXIT_OK,
  EXIT_USAGE,
  readEnvFileValue,
  redactSecret,
  resolveBaseUrl,
  resolveToken,
  runRunnerCli,
  type RunnerDeps,
  type RunnerFetch,
} from './runner-client';

const TOKEN = 'test-runner-token-do-not-print-7f3a9c';
const BATCH_PATH = '/tmp/prospect-research/fixture-batch.json';

type Captured = {
  stdout: string[];
  stderr: string[];
  requests: { url: string; headers: Record<string, string>; body?: string }[];
};

function harness(
  fetchImpl: RunnerFetch,
  overrides: Partial<RunnerDeps> = {},
): { deps: RunnerDeps; captured: Captured } {
  const captured: Captured = { stdout: [], stderr: [], requests: [] };
  const deps: RunnerDeps = {
    fetch: async (url, init) => {
      captured.requests.push({ url, headers: init.headers, body: init.body });
      return fetchImpl(url, init);
    },
    env: { PROSPECT_INGEST_TOKEN: TOKEN },
    readEnvFile: () => null,
    readFile: (path) => {
      if (path === BATCH_PATH) return JSON.stringify(FIXTURE_BATCH);
      throw new Error(`ENOENT: ${path}`);
    },
    stdout: (line) => captured.stdout.push(line),
    stderr: (line) => captured.stderr.push(line),
    ...overrides,
  };
  return { deps, captured };
}

function respond(status: number, body: unknown) {
  return { status, text: async () => (typeof body === 'string' ? body : JSON.stringify(body)) };
}

function allOutput(captured: Captured): string {
  return [...captured.stdout, ...captured.stderr].join('\n');
}

/** A stand-in server built from the real route logic and an in-memory store. */
function fakeServer(store: MemoryProspectStore): RunnerFetch {
  return async (url, init) => {
    const auth = authorizeRunner(init.headers.Authorization ?? null, {
      token: TOKEN,
      cronSecret: 'a-different-cron-secret',
    });
    if (!auth.ok) return respond(auth.status, { error: auth.error });

    if (url.endsWith('/api/prospects/ingest')) {
      const parsed = parseIngestBody(init.body ?? '');
      if (!parsed.ok) return respond(parsed.status, { error: parsed.error, issues: parsed.issues ?? [] });
      const result = await ingestBatch(store, parsed.batch, new Date('2026-11-09T20:00:00Z'));
      if (!result.ok) return respond(result.status, { error: result.error, runState: result.runState ?? null });
      return respond(200, {
        runId: result.runId,
        runState: result.runState,
        saved: result.saved,
        rejected: result.rejected,
        counts: result.counts,
      });
    }
    return respond(404, { error: 'Not found' });
  };
}

describe('resolveBaseUrl', () => {
  it('defaults to localhost over http', () => {
    assert.deepEqual(resolveBaseUrl(undefined), { ok: true, origin: 'http://localhost:3000' });
  });

  it('allows http only for localhost', () => {
    assert.equal(resolveBaseUrl('http://127.0.0.1:3000').ok, true);
    assert.equal(resolveBaseUrl('http://[::1]:3000').ok, true);
    assert.equal(resolveBaseUrl('http://www.vizantir.com').ok, false);
    assert.equal(resolveBaseUrl('http://localhost.example.com').ok, false);
  });

  it('accepts https for remote hosts', () => {
    assert.deepEqual(resolveBaseUrl('https://www.vizantir.com'), { ok: true, origin: 'https://www.vizantir.com' });
    assert.deepEqual(resolveBaseUrl('https://www.vizantir.com/'), { ok: true, origin: 'https://www.vizantir.com' });
  });

  it('rejects other schemes, credentials, paths and garbage', () => {
    assert.equal(resolveBaseUrl('ftp://example.com').ok, false);
    assert.equal(resolveBaseUrl('https://user:pass@example.com').ok, false);
    assert.equal(resolveBaseUrl('https://example.com/api').ok, false);
    assert.equal(resolveBaseUrl('not a url').ok, false);
  });

  it('refuses to send anything when the base URL is plain http to a remote host', async () => {
    const { deps, captured } = harness(async () => respond(200, { run: null }), {
      env: { PROSPECT_INGEST_TOKEN: TOKEN, PROSPECT_RUNNER_BASE_URL: 'http://www.vizantir.com' },
    });
    const code = await runRunnerCli(['claim'], deps);
    assert.equal(code, EXIT_FAILURE);
    assert.equal(captured.requests.length, 0);
    assert.match(captured.stderr.join('\n'), /must use https/);
  });
});

describe('token handling', () => {
  it('reads only the requested key from .env.local text', () => {
    const content = [
      '# comment',
      'OTHER_SECRET=nope',
      `export PROSPECT_INGEST_TOKEN="${TOKEN}"`,
    ].join('\n');
    assert.equal(readEnvFileValue(content, 'PROSPECT_INGEST_TOKEN'), TOKEN);
    assert.equal(readEnvFileValue('PROSPECT_INGEST_TOKEN=abc # note', 'PROSPECT_INGEST_TOKEN'), 'abc');
    assert.equal(readEnvFileValue('A=1', 'PROSPECT_INGEST_TOKEN'), undefined);
  });

  it('prefers the environment and falls back to .env.local', () => {
    assert.equal(resolveToken({ env: { PROSPECT_INGEST_TOKEN: 'from-env' }, readEnvFile: () => 'PROSPECT_INGEST_TOKEN=from-file' }), 'from-env');
    assert.equal(resolveToken({ env: {}, readEnvFile: () => 'PROSPECT_INGEST_TOKEN=from-file' }), 'from-file');
    assert.equal(resolveToken({ env: { PROSPECT_INGEST_TOKEN: '  ' }, readEnvFile: () => null }), null);
  });

  it('redacts every occurrence of the secret', () => {
    assert.equal(redactSecret(`a ${TOKEN} b ${TOKEN}`, TOKEN), 'a [redacted] b [redacted]');
  });

  it('sends the token but never prints it, even when the server or network echoes it', async () => {
    const echoes: RunnerFetch[] = [
      async (_url, init) => respond(401, { error: `bad header ${init.headers.Authorization}` }),
      async (_url, init) => respond(200, { run: { id: FIXTURE_RUN_ID, echo: init.headers.Authorization } }),
      async () => { throw new Error(`socket closed while sending Bearer ${TOKEN}`); },
      async () => respond(500, `<html>${TOKEN}</html>`),
    ];
    for (const echo of echoes) {
      for (const argv of [['claim'], ['ingest', BATCH_PATH]]) {
        const { deps, captured } = harness(echo);
        await runRunnerCli(argv, deps);
        assert.equal(captured.requests[0]?.headers.Authorization, `Bearer ${TOKEN}`);
        assert.ok(!allOutput(captured).includes(TOKEN), `token leaked for ${argv.join(' ')}`);
      }
    }
  });

  it('never prints a token loaded from .env.local', async () => {
    const { deps, captured } = harness(async (_url, init) => respond(401, { error: String(init.headers.Authorization) }), {
      env: {},
      readEnvFile: () => `PROSPECT_INGEST_TOKEN=${TOKEN}\n`,
    });
    await runRunnerCli(['claim'], deps);
    assert.ok(!allOutput(captured).includes(TOKEN));
  });

  it('fails clearly without contacting the server when no token is configured', async () => {
    const { deps, captured } = harness(async () => respond(200, { run: null }), { env: {} });
    assert.equal(await runRunnerCli(['claim'], deps), EXIT_FAILURE);
    assert.equal(captured.requests.length, 0);
    assert.match(captured.stderr.join('\n'), /PROSPECT_INGEST_TOKEN is not set/);
  });

  it('does not read .env.local for a usage error', async () => {
    let reads = 0;
    const { deps } = harness(async () => respond(200, {}), { readEnvFile: () => { reads += 1; return null; } });
    assert.equal(await runRunnerCli([], deps), EXIT_USAGE);
    assert.equal(await runRunnerCli(['ingest'], deps), EXIT_USAGE);
    assert.equal(await runRunnerCli(['claim', 'extra'], deps), EXIT_USAGE);
    assert.equal(reads, 0);
  });
});

describe('claim', () => {
  it('exits non-zero with a clear message when no run is queued', async () => {
    const { deps, captured } = harness(async () => respond(200, { run: null }));
    const code = await runRunnerCli(['claim'], deps);
    assert.equal(code, EXIT_NO_RUN_QUEUED);
    assert.match(captured.stderr.join('\n'), /No research run is queued/);
    assert.equal(captured.stdout.length, 0);
    assert.equal(captured.requests[0]?.url, 'http://localhost:3000/api/prospects/claim');
  });

  it('prints the claim response when a run is claimed', async () => {
    const body = {
      run: { id: FIXTURE_RUN_ID, config: { market: 'Fixture City', industry: 'Fixture', targetCount: 3, exclusions: [] } },
      rubric: { version: 'prospect-rubric-v1', ratings: ['unknown', 'none', 'weak', 'strong'], factors: [] },
    };
    const { deps, captured } = harness(async () => respond(200, body));
    assert.equal(await runRunnerCli(['claim'], deps), EXIT_OK);
    assert.deepEqual(JSON.parse(captured.stdout.join('\n')), body);
  });

  it('reports 503 as a server configuration problem', async () => {
    const { deps, captured } = harness(async () => respond(503, { error: 'Prospect ingest is not configured' }));
    assert.equal(await runRunnerCli(['claim'], deps), EXIT_FAILURE);
    assert.match(captured.stderr.join('\n'), /HTTP 503/);
  });
});

describe('ingest', () => {
  it('posts the fixture batch and prints per-record outcomes', async () => {
    const store = new MemoryProspectStore([fixtureClaimedRun()]);
    const { deps, captured } = harness(fakeServer(store));

    const code = await runRunnerCli(['ingest', BATCH_PATH], deps);
    assert.equal(code, EXIT_OK);
    assert.equal(captured.requests[0]?.url, 'http://localhost:3000/api/prospects/ingest');

    const output = captured.stdout.join('\n');
    assert.match(output, /saved {5}example\.com {2}fit 73 {2}opportunity 60 {2}confidence high/);
    assert.match(output, /saved {5}example\.org {2}fit — {2}opportunity 65 {2}confidence low/);
    assert.match(output, /rejected {2}canyon-ridge\.example\.net {2}missing_evidence:growth_signals/);
    assert.match(output, /rejected {2}excluded-firm\.example\.net {2}excluded_domain/);
    assert.match(output, /"counts":\{"saved":2,"rejected":2\}/);
    assert.equal(store.prospects.size, 2);
  });

  it('rejects an invalid batch locally without sending it', async () => {
    const { deps, captured } = harness(async () => respond(200, {}), {
      readFile: () => JSON.stringify({ ...FIXTURE_BATCH, fitScore: 100 }),
    });
    assert.equal(await runRunnerCli(['ingest', BATCH_PATH], deps), EXIT_FAILURE);
    assert.equal(captured.requests.length, 0);
    assert.match(captured.stderr.join('\n'), /Batch file is invalid/);
  });

  it('reports a missing batch file', async () => {
    const { deps, captured } = harness(async () => respond(200, {}));
    assert.equal(await runRunnerCli(['ingest', '/tmp/prospect-research/missing.json'], deps), EXIT_FAILURE);
    assert.equal(captured.requests.length, 0);
    assert.match(captured.stderr.join('\n'), /Could not read batch file/);
  });

  it('surfaces a 409 when the run is no longer claimed', async () => {
    const store = new MemoryProspectStore([fixtureClaimedRun({ state: 'cancelled' })]);
    const { deps, captured } = harness(fakeServer(store));
    assert.equal(await runRunnerCli(['ingest', BATCH_PATH], deps), EXIT_FAILURE);
    assert.match(captured.stderr.join('\n'), /HTTP 409: Run is not claimed/);
    assert.match(captured.stderr.join('\n'), /Run state: cancelled/);
  });
});

describe('measure', () => {
  it('posts only the normalized domain and prints the server result', async () => {
    const reply = {
      ok: true,
      domain: 'example.com',
      prospectId: 'prospect-1',
      measuredUrl: 'https://example.com/',
      performanceScore: 42,
      rating: 'strong',
      fitScore: 73,
      opportunityScore: 58,
      confidence: 'high',
    };
    const { deps, captured } = harness(async () => respond(200, reply));
    const code = await runRunnerCli(['measure', 'https://www.Example.com/about'], deps);

    assert.equal(code, EXIT_OK);
    assert.equal(captured.requests.length, 1);
    assert.equal(captured.requests[0]?.url, 'http://localhost:3000/api/prospects/measure');
    assert.equal(captured.requests[0]?.headers.Authorization, `Bearer ${TOKEN}`);
    assert.deepEqual(JSON.parse(captured.requests[0]?.body ?? ''), { domain: 'example.com' });
    assert.match(
      captured.stdout.join('\n'),
      /measured {2}example\.com {2}performance 42\/100 -> strong {2}fit 73 {2}opportunity 58 {2}confidence high/,
    );
  });

  it('rejects an invalid domain locally without sending anything', async () => {
    const { deps, captured } = harness(async () => respond(200, {}));
    assert.equal(await runRunnerCli(['measure', 'http://10.0.0.1'], deps), EXIT_FAILURE);
    assert.equal(captured.requests.length, 0);
    assert.match(captured.stderr.join('\n'), /Not a valid domain/);
  });

  it('reports an unknown domain and an unconfigured PageSpeed key clearly', async () => {
    const notFound = harness(async () => respond(404, { error: 'No prospect with this domain', reason: null }));
    assert.equal(await runRunnerCli(['measure', 'example.org'], notFound.deps), EXIT_FAILURE);
    assert.match(notFound.captured.stderr.join('\n'), /HTTP 404: No prospect with this domain/);

    const unconfigured = harness(async () =>
      respond(503, { error: 'PageSpeed Insights is not configured. The performance factor was left unchanged.', reason: 'not_configured' }),
    );
    assert.equal(await runRunnerCli(['measure', 'example.com'], unconfigured.deps), EXIT_FAILURE);
    assert.match(unconfigured.captured.stderr.join('\n'), /PageSpeed Insights is not configured/);
    assert.match(unconfigured.captured.stderr.join('\n'), /Reason: not_configured/);
  });

  it('never prints the token on measure output or errors', async () => {
    const echoes: RunnerFetch[] = [
      async (_url, init) => respond(200, { domain: 'example.com', echo: init.headers.Authorization }),
      async (_url, init) => respond(502, { error: String(init.headers.Authorization), reason: TOKEN }),
      async () => { throw new Error(`reset while sending ${TOKEN}`); },
    ];
    for (const echo of echoes) {
      const { deps, captured } = harness(echo);
      await runRunnerCli(['measure', 'example.com'], deps);
      assert.ok(!allOutput(captured).includes(TOKEN));
    }
  });

  it('requires exactly one domain argument', async () => {
    const { deps, captured } = harness(async () => respond(200, {}));
    assert.equal(await runRunnerCli(['measure'], deps), EXIT_USAGE);
    assert.equal(await runRunnerCli(['measure', 'a.example.com', 'b.example.com'], deps), EXIT_USAGE);
    assert.equal(captured.requests.length, 0);
  });
});
