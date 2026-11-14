// Run with: pnpm exec tsx --test lib/outreach/contacts/rules.test.ts
// Pure rules only. Every business, domain and address is fictional.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { registrableDomain } from './hosts'
import {
  CONTACT_RULES_VERSION,
  decideContact,
  judgeAddress,
  nameTokens,
  pageAllowed,
  rederiveContact,
  siteForBusiness,
  siteForProspect,
  type LeadSite,
} from './rules'
import type { ContactLeadReport } from './schema'

const OWN: LeadSite = { kind: 'own_domain', url: 'https://www.cactusbakery.example/', domain: 'cactusbakery.example' }
const LISTING: LeadSite = { kind: 'listing', url: 'https://www.facebook.com/cactusbakerylv' }
const NAME = 'Cactus Bakery LLC'
const CONTACT_PAGE = 'https://www.cactusbakery.example/contact'

function report(addresses: { email: string; page?: string; context?: string }[], pages = [CONTACT_PAGE]): ContactLeadReport {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    pages_read: pages,
    addresses: addresses.map((a) => ({
      email: a.email,
      page_url: a.page ?? CONTACT_PAGE,
      context: a.context ?? `For orders write to ${a.email} any day.`,
    })),
  }
}

const decide = (addresses: Parameters<typeof report>[0], site: LeadSite = OWN, pages?: string[]) =>
  decideContact({ name: NAME, site }, report(addresses, pages))

describe('contact rules', () => {
  it('finds an own-domain role address', () => {
    const d = decide([{ email: 'info@cactusbakery.example' }])
    assert.equal(d.status, 'found')
    assert.equal(d.email, 'info@cactusbakery.example')
    assert.equal(d.kind, 'own_domain')
    assert.equal(d.sourceUrl, CONTACT_PAGE)
    assert.equal(d.rulesVersion, CONTACT_RULES_VERSION)
  })

  it('finds a mailto address with a subject, normalized', () => {
    const d = decide([{ email: 'mailto:Hello@CactusBakery.example?subject=Order', context: 'Email Hello@CactusBakery.example today' }])
    assert.equal(d.email, 'hello@cactusbakery.example')
  })

  it('finds a shared-provider address published on the lead own page', () => {
    const d = decide([{ email: 'cactusbakery.orders@gmail.com' }])
    // "cactusbakery.orders" is not a role and not a single name token: a named person.
    assert.equal(d.status, 'named_only')
    const role = decide([{ email: 'info.cactus@gmail.com' }])
    assert.equal(role.status, 'named_only')
    const ok = decide([{ email: 'bakery@gmail.com' }])
    assert.equal(ok.status, 'found')
    assert.equal(ok.kind, 'shared_provider')
  })

  it('finds a shared-provider address on the stored listing page', () => {
    const d = decide([{ email: 'contact@yahoo.com', page: 'https://www.facebook.com/cactusbakerylv/about' }], LISTING, [
      'https://www.facebook.com/cactusbakerylv/about',
    ])
    assert.equal(d.status, 'found')
    assert.equal(d.kind, 'shared_provider')
  })

  it('rejects an address on another domain', () => {
    const d = decide([{ email: 'info@otherbakery.example' }])
    assert.equal(d.status, 'none_found')
    assert.equal(d.rejectedCount, 1)
  })

  it('rejects a page on another host even when the runner calls it the lead page', () => {
    const d = decide([{ email: 'info@cactusbakery.example', page: 'https://directory.example/cactus-bakery' }])
    assert.equal(d.status, 'none_found')
    assert.equal(d.rejectedCount, 1)
    // A listing: another profile on the same host is not the stored page.
    assert.equal(pageAllowed('https://www.facebook.com/someoneelse', LISTING), false)
    assert.equal(pageAllowed('https://facebook.com/cactusbakerylv/about', LISTING), true)
  })

  it('rejects an address the copied text does not contain', () => {
    const d = decide([{ email: 'info@cactusbakery.example', context: 'Write to us any day.' }])
    assert.equal(d.status, 'none_found')
    assert.equal(d.rejectedCount, 1)
  })

  it('rejects file names and placeholder or platform domains', () => {
    const tokens = nameTokens(NAME)
    const judge = (email: string) => judgeAddress({ email, pageUrl: CONTACT_PAGE, context: email }, OWN, tokens)
    assert.deepEqual(judge('logo@2x.png'), { outcome: 'rejected', reason: 'filename' })
    assert.deepEqual(judge('hero@cactusbakery.example.webp'), { outcome: 'rejected', reason: 'filename' })
    assert.deepEqual(judge('info@example.com'), { outcome: 'rejected', reason: 'placeholder' })
    assert.deepEqual(judge('you@yourdomain.com'), { outcome: 'rejected', reason: 'placeholder' })
    assert.deepEqual(judge('abc123@sentry-next.wixpress.com'), { outcome: 'rejected', reason: 'placeholder' })
    assert.deepEqual(judge('x@o1.ingest.sentry.io'), { outcome: 'rejected', reason: 'placeholder' })
    assert.deepEqual(judge(`${'a'.repeat(250)}@b.example`), { outcome: 'rejected', reason: 'syntax' })
    assert.deepEqual(judge('not an address'), { outcome: 'rejected', reason: 'syntax' })
  })

  it('rejects the noreply family and other never-for-contact local parts', () => {
    for (const local of ['noreply', 'no-reply', 'no_reply', 'donotreply', 'do-not-reply', 'postmaster', 'abuse', 'privacy', 'legal', 'dmca', 'security', 'billing', 'careers', 'jobs', 'press', 'webmaster', 'unsubscribe']) {
      const d = decide([{ email: `${local}@cactusbakery.example` }])
      assert.equal(d.status, 'none_found', local)
      assert.equal(d.rejectedCount, 1, local)
    }
  })

  it('counts a named person and never stores the address, giving named_only', () => {
    const d = decide([{ email: 'maria.lopez@cactusbakery.example' }])
    assert.equal(d.status, 'named_only')
    assert.equal(d.email, null)
    assert.equal(d.namedCount, 1)
    assert.ok(!JSON.stringify(d).includes('maria'), 'the address is not in the result or its evidence')
  })

  it('a role address wins over a named person, and the named one is still not stored', () => {
    const d = decide([{ email: 'maria@cactusbakery.example' }, { email: 'office@cactusbakery.example' }])
    assert.equal(d.status, 'found')
    assert.equal(d.email, 'office@cactusbakery.example')
    assert.equal(d.namedCount, 1)
    assert.ok(!JSON.stringify(d.evidence).includes('maria'))
  })

  it('accepts the business own name token as a role', () => {
    assert.deepEqual(nameTokens('Café Cactus Bakery, LLC'), ['cafe', 'cactus', 'bakery'])
    assert.equal(decide([{ email: 'cactus@cactusbakery.example' }]).status, 'found')
  })

  it('prefers own domain, then contact, info, hello, office, then list order, then first seen', () => {
    const pick = (emails: string[]) => decide(emails.map((email) => ({ email }))).email
    assert.equal(pick(['contact@gmail.com', 'sales@cactusbakery.example']), 'sales@cactusbakery.example')
    assert.equal(pick(['sales@cactusbakery.example', 'office@cactusbakery.example', 'info@cactusbakery.example']), 'info@cactusbakery.example')
    assert.equal(pick(['hello@cactusbakery.example', 'contact@cactusbakery.example']), 'contact@cactusbakery.example')
    assert.equal(pick(['office@cactusbakery.example', 'hello@cactusbakery.example']), 'hello@cactusbakery.example')
    assert.equal(pick(['bookings@cactusbakery.example', 'admin@cactusbakery.example']), 'admin@cactusbakery.example')
    assert.equal(pick(['bakery@cactusbakery.example', 'email@cactusbakery.example']), 'email@cactusbakery.example')
    assert.equal(pick(['support@gmail.com', 'info@yahoo.com']), 'info@yahoo.com')
    assert.equal(pick(['info@cactusbakery.example', 'INFO@cactusbakery.example']), 'info@cactusbakery.example')
  })

  it('nothing read is unclear; pages read with nothing acceptable is none_found', () => {
    assert.equal(decide([], OWN, []).status, 'unclear')
    assert.equal(decide([], OWN, ['https://elsewhere.example/']).status, 'unclear')
    assert.equal(decide([], OWN, [CONTACT_PAGE]).status, 'none_found')
  })

  it('works out the lead site from what the server stored', () => {
    assert.deepEqual(siteForProspect('www.CactusBakery.example'), { ...OWN, url: 'https://cactusbakery.example/' })
    assert.equal(siteForBusiness(null, null), 'pending')
    assert.equal(siteForBusiness('no_website', null), null)
    assert.deepEqual(siteForBusiness('has_website', 'https://shop.cactusbakery.example/home'), {
      kind: 'own_domain',
      url: 'https://shop.cactusbakery.example/home',
      domain: 'cactusbakery.example',
    })
    assert.equal((siteForBusiness('social_only', 'https://www.instagram.com/cactusbakerylv') as LeadSite).kind, 'listing')
    assert.equal((siteForBusiness('free_builder', 'https://cactusbakery.wixsite.com/home') as LeadSite).kind, 'builder')
    assert.equal(registrableDomain('shop.cactusbakery.co.uk'), 'cactusbakery.co.uk')
    assert.equal(registrableDomain('co.uk'), null)
  })

  it('on a builder page only the same site counts, and the address cannot be own-domain', () => {
    const builder: LeadSite = { kind: 'builder', url: 'https://cactusbakery.wixsite.com/home' }
    assert.equal(pageAllowed('https://cactusbakery.wixsite.com/contact', builder), true)
    assert.equal(pageAllowed('https://otherbakery.wixsite.com/contact', builder), false)
    const google: LeadSite = { kind: 'builder', url: 'https://sites.google.com/view/cactusbakery/home' }
    assert.equal(pageAllowed('https://sites.google.com/view/cactusbakery/contact', google), true)
    assert.equal(pageAllowed('https://sites.google.com/view/otherbakery/contact', google), false)
    const d = decideContact({ name: NAME, site: builder }, report([{ email: 'info@wixsite.com', page: 'https://cactusbakery.wixsite.com/contact' }], ['https://cactusbakery.wixsite.com/contact']))
    assert.equal(d.status, 'none_found')
  })
})

describe('re-derivation', () => {
  it('re-decides from stored evidence and keeps redacted outcomes as they were', () => {
    const first = decide([{ email: 'maria@cactusbakery.example' }, { email: 'sales@cactusbakery.example' }, { email: 'info@otherbakery.example' }])
    assert.equal(first.status, 'found')
    const stored = JSON.parse(JSON.stringify(first.evidence)) as unknown
    const again = rederiveContact(stored)
    assert.ok(again !== null)
    assert.equal(again.status, 'found')
    assert.equal(again.email, 'sales@cactusbakery.example')
    assert.equal(again.namedCount, 1)
    assert.equal(again.rejectedCount, 1)
    assert.equal(again.rulesVersion, CONTACT_RULES_VERSION)
  })

  it('leaves a result alone when its evidence cannot be read', () => {
    assert.equal(rederiveContact(null), null)
    assert.equal(rederiveContact({ malformed: true }), null)
    assert.equal(rederiveContact({ name: 'x' }), null)
  })
})
