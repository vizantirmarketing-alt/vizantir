// Run with: pnpm exec tsx --test lib/prospects/domain.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { normalizeDomain } from './domain';

describe('normalizeDomain', () => {
  it('reduces a full URL to its lowercase host', () => {
    assert.equal(normalizeDomain('https://www.Example.com/about?x=1#top'), 'example.com');
  });

  it('accepts a bare domain', () => {
    assert.equal(normalizeDomain('example.org'), 'example.org');
  });

  it('strips www, trailing dot, port and whitespace', () => {
    assert.equal(normalizeDomain('  WWW.example.net.:8443/path  '), 'example.net');
  });

  it('keeps meaningful subdomains', () => {
    assert.equal(normalizeDomain('http://shop.example.com'), 'shop.example.com');
  });

  it('only strips one leading www', () => {
    assert.equal(normalizeDomain('www.www.example.com'), 'www.example.com');
  });

  it('maps equivalent inputs to the same key', () => {
    const inputs = [
      'example.com',
      'https://example.com/',
      'http://www.example.com',
      'EXAMPLE.COM/contact',
    ];
    assert.deepEqual(new Set(inputs.map(normalizeDomain)), new Set(['example.com']));
  });

  it('converts internationalized names to punycode', () => {
    assert.equal(normalizeDomain('bücher.example'), 'xn--bcher-kva.example');
  });

  it('rejects non-http schemes', () => {
    assert.equal(normalizeDomain('ftp://example.com'), null);
    assert.equal(normalizeDomain('javascript:alert(1)'), null);
    assert.equal(normalizeDomain('mailto:someone@example.com'), null);
  });

  it('rejects IP addresses, single labels and localhost', () => {
    assert.equal(normalizeDomain('http://192.168.1.10'), null);
    assert.equal(normalizeDomain('http://[::1]/'), null);
    assert.equal(normalizeDomain('localhost'), null);
    assert.equal(normalizeDomain('intranet'), null);
  });

  it('rejects credentials, empty input and malformed hosts', () => {
    assert.equal(normalizeDomain('https://user:pass@example.com'), null);
    assert.equal(normalizeDomain(''), null);
    assert.equal(normalizeDomain('   '), null);
    assert.equal(normalizeDomain('-bad-.example.com'), null);
    assert.equal(normalizeDomain('example.c0m'), null);
    assert.equal(normalizeDomain('exa mple.com'), null);
  });
});
