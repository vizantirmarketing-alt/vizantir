// Run with: pnpm exec tsx --test lib/new-businesses/fetch.test.ts
// No network: fetch is injected.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  MAX_DOWNLOAD_BYTES,
  NEW_BUSINESS_USER_AGENT,
  SourceFetchError,
  fetchSourceBytes,
  fetchSourceText,
  type SourceFetch,
} from './fetch';

const PDF_URL = 'https://www.clarkcountynv.gov/adobe/assets/x/original/as/new-businesses-oct-2026.pdf';

function recorder(handler: (url: string, init: RequestInit) => Response) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetch: SourceFetch = async (url, init) => {
    calls.push({ url, init });
    return handler(url, init);
  };
  return { calls, fetch };
}

async function rejectsWith(promise: Promise<unknown>, code: SourceFetchError['code']) {
  await assert.rejects(promise, (error: unknown) => error instanceof SourceFetchError && error.code === code);
}

function streamOf(chunks: number[], onPull?: () => void): ReadableStream<Uint8Array> {
  let i = 0;
  return new ReadableStream({
    pull(controller) {
      onPull?.();
      if (i < chunks.length) controller.enqueue(new Uint8Array(chunks[i++]!));
      else controller.close();
    },
  });
}

describe('fetchSourceBytes', () => {
  it('fetches an allowlisted https URL with the user agent, no automatic redirects, and a timeout signal', async () => {
    const { calls, fetch } = recorder(() => new Response(new Uint8Array([1, 2, 3])));
    const bytes = await fetchSourceBytes(PDF_URL, { fetch });
    assert.deepEqual([...bytes], [1, 2, 3]);
    const init = calls[0]!.init;
    assert.equal((init.headers as Record<string, string>)['User-Agent'], NEW_BUSINESS_USER_AGENT);
    assert.equal(init.redirect, 'manual');
    assert.ok(init.signal instanceof AbortSignal);
  });

  it('refuses other hosts and plain http before any request', async () => {
    const { calls, fetch } = recorder(() => new Response('x'));
    for (const url of [
      'https://evil.example.com/new-businesses-oct-2026.pdf',
      'http://www.clarkcountynv.gov/new-businesses-oct-2026.pdf',
      'https://clarkcountynv.gov.evil.example.com/x.pdf',
      'https://user:pass@www.clarkcountynv.gov/x.pdf',
      'ftp://www.clarkcountynv.gov/x.pdf',
    ]) {
      await rejectsWith(fetchSourceBytes(url, { fetch }), 'disallowed_url');
    }
    assert.equal(calls.length, 0);
  });

  it('follows a redirect between the two allowlisted hosts', async () => {
    const { calls, fetch } = recorder((url) =>
      url.startsWith('https://clarkcountynv.gov/')
        ? new Response(null, { status: 301, headers: { location: 'https://www.clarkcountynv.gov/listing' } })
        : new Response('<html></html>'),
    );
    assert.equal(await fetchSourceText('https://clarkcountynv.gov/listing', { fetch }), '<html></html>');
    assert.deepEqual(calls.map((c) => c.url), ['https://clarkcountynv.gov/listing', 'https://www.clarkcountynv.gov/listing']);
  });

  it('refuses a redirect to another host or to http', async () => {
    for (const location of ['https://evil.example.com/x.pdf', 'http://www.clarkcountynv.gov/x.pdf']) {
      const { calls, fetch } = recorder(() => new Response(null, { status: 302, headers: { location } }));
      await rejectsWith(fetchSourceBytes(PDF_URL, { fetch }), 'disallowed_redirect');
      assert.equal(calls.length, 1, 'the disallowed target is never requested');
    }
  });

  it('stops after too many redirects', async () => {
    const { fetch } = recorder(() => new Response(null, { status: 302, headers: { location: '/again' } }));
    await rejectsWith(fetchSourceBytes(PDF_URL, { fetch }), 'too_many_redirects');
  });

  it('refuses a declared Content-Length over the cap without reading the body', async () => {
    let pulled = 0;
    const { fetch } = recorder(
      () => new Response(streamOf([10], () => (pulled += 1)), { headers: { 'content-length': String(MAX_DOWNLOAD_BYTES + 1) } }),
    );
    await rejectsWith(fetchSourceBytes(PDF_URL, { fetch }), 'too_large');
    assert.ok(pulled <= 1);
  });

  it('enforces the cap while streaming when no length is declared', async () => {
    let pulled = 0;
    const { fetch } = recorder(() => new Response(streamOf([400, 400, 400, 400, 400], () => (pulled += 1))));
    await rejectsWith(fetchSourceBytes(PDF_URL, { fetch, maxBytes: 1000 }), 'too_large');
    assert.ok(pulled < 5, 'reading stops once the cap is passed');
    const ok = recorder(() => new Response(streamOf([400, 400])));
    assert.equal((await fetchSourceBytes(PDF_URL, { fetch: ok.fetch, maxBytes: 1000 })).byteLength, 800);
  });

  it('reports HTTP errors and timeouts', async () => {
    const notFound = recorder(() => new Response('no', { status: 404 }));
    await rejectsWith(fetchSourceBytes(PDF_URL, { fetch: notFound.fetch }), 'http_error');
    const slow: SourceFetch = async (_url, init) => {
      throw Object.assign(new Error('timed out'), { name: (init.signal as AbortSignal).aborted ? 'AbortError' : 'TimeoutError' });
    };
    await rejectsWith(fetchSourceBytes(PDF_URL, { fetch: slow, timeoutMs: 5 }), 'timeout');
  });
});
