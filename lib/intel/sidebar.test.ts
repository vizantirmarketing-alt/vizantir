// Run with: pnpm exec tsx --test lib/intel/sidebar.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { SIDEBAR_COOKIE_MAX_AGE, parseSidebarCookie, sidebarCookie } from './sidebar';

describe('parseSidebarCookie', () => {
  it('defaults to expanded when absent or unrecognised', () => {
    assert.equal(parseSidebarCookie(undefined), 'expanded');
    assert.equal(parseSidebarCookie(null), 'expanded');
    assert.equal(parseSidebarCookie(''), 'expanded');
    assert.equal(parseSidebarCookie('COLLAPSED'), 'expanded');
    assert.equal(parseSidebarCookie('1'), 'expanded');
    assert.equal(parseSidebarCookie('expanded'), 'expanded');
  });

  it('reads collapsed', () => {
    assert.equal(parseSidebarCookie('collapsed'), 'collapsed');
    assert.equal(parseSidebarCookie(' collapsed '), 'collapsed');
  });
});

describe('sidebarCookie', () => {
  it('is scoped to /intel, Lax, about a year, and not HttpOnly', () => {
    const cookie = sidebarCookie('collapsed');
    assert.equal(cookie, `intel_sidebar=collapsed; Path=/intel; Max-Age=${SIDEBAR_COOKIE_MAX_AGE}; SameSite=Lax`);
    assert.equal(SIDEBAR_COOKIE_MAX_AGE, 31_536_000);
    assert.ok(!/httponly/i.test(cookie));
  });

  it('adds Secure on https and round-trips through the parser', () => {
    assert.ok(sidebarCookie('expanded', true).endsWith('; Secure'));
    for (const state of ['expanded', 'collapsed'] as const) {
      const value = sidebarCookie(state).split(';')[0]!.split('=')[1];
      assert.equal(parseSidebarCookie(value), state);
    }
  });
});
