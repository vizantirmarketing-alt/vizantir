// Run with: pnpm exec tsx --test lib/new-businesses/website-hosts.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { classifyHost, parseHttpUrl } from './website-hosts';

describe('classifyHost', () => {
  it('recognizes social pages, directories and map listings', () => {
    for (const url of [
      'https://www.facebook.com/examplebakery',
      'https://m.facebook.com/examplebakery',
      'https://instagram.com/examplebakery',
      'https://www.tiktok.com/@examplebakery',
      'https://www.yelp.com/biz/example-bakery-las-vegas',
      'https://linktr.ee/examplebakery',
      'https://nextdoor.com/pages/example-bakery',
      'https://www.google.com/maps/place/Example+Bakery',
      'https://maps.google.com/?cid=123',
      'https://g.page/example-bakery',
      'https://maps.app.goo.gl/abc123',
      'https://www.bbb.org/us/nv/las-vegas/profile/example',
    ]) {
      assert.equal(classifyHost(url), 'social_or_directory', url);
    }
  });

  it('recognizes free builder addresses', () => {
    for (const url of [
      'https://examplebakery.wixsite.com/home',
      'https://example-bakery.square.site/',
      'https://examplebakery.godaddysites.com/',
      'https://examplebakery.weebly.com/',
      'https://examplebakery.wordpress.com/',
      'https://example-bakery.webflow.io/',
      'https://examplebakery.carrd.co/',
      'https://example-bakery.myshopify.com/',
      'https://example-bakery.business.site/',
      'https://sites.google.com/view/examplebakery',
    ]) {
      assert.equal(classifyHost(url), 'free_builder', url);
    }
  });

  it('treats everything else as the business’s own domain', () => {
    assert.equal(classifyHost('https://www.example-bakery.test/'), 'own_domain');
    assert.equal(classifyHost('http://examplebakery.co/menu'), 'own_domain');
    // Lookalikes are not the listed services.
    assert.equal(classifyHost('https://notfacebook.com/'), 'own_domain');
    assert.equal(classifyHost('https://facebook.com.example.test/'), 'own_domain');
    assert.equal(classifyHost('https://www.google.com/about'), 'own_domain');
  });

  it('rejects anything that is not a plain http or https URL', () => {
    for (const url of ['javascript:alert(1)', 'ftp://example.test/', 'mailto:a@example.test', 'not a url', 'https://user:pass@example.test/']) {
      assert.equal(classifyHost(url), null, url);
      assert.equal(parseHttpUrl(url), null, url);
    }
  });
});
