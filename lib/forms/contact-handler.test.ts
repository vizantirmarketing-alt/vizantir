// Run with: NODE_OPTIONS=--conditions=react-server pnpm exec tsx --test lib/forms/contact-handler.test.ts
// The contact form's handler over an in-memory store and a recording notifier.
// A filled honeypot (under its own cap) and a disposable address are stored as
// spam with no notification, through the same path as scored spam; enrichment
// runs only after an abuse check; the submitter sees the same response. No network or
// database. Fictional data only.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { ContactEnrichment, EnrichContactInput } from '@/lib/contact/enrich'
import { autoSpamNote } from '@/lib/intel/lead-params'

import {
  CONTACT_FORM_KEY,
  CONTACT_HONEYPOT_FORM_KEY,
  CONTACT_HONEYPOT_MAX_ATTEMPTS,
  CONTACT_MAX_ATTEMPTS,
  handleContactPost,
  honeypotFilled,
  type ContactHandlerDeps,
} from './contact-handler'
import { saveContactSubmission, type ContactSubmissionRow } from './contact-submission'

const CLEAN_MESSAGE = 'We are planning a new website for our bakery and would like a quote.'
const SPAMMY_MESSAGE = 'We help teams with a free audit and health check. Our engineers are ready. See https://fictional-agency.example.'

function enrichmentFor(input: EnrichContactInput, extraReasons: string[] = []): ContactEnrichment {
  const reasons = [...(honeypotFilled(input.honeypot) ? ['honeypot'] : []), ...extraReasons]
  return {
    ip: '203.0.113.7',
    country: null,
    region: null,
    city: null,
    timezone: null,
    browser: null,
    browserVersion: null,
    os: null,
    osVersion: null,
    deviceType: null,
    deviceSummary: null,
    userAgent: null,
    acceptLanguage: null,
    httpReferrer: null,
    pagePath: input.pagePath,
    mxValid: true,
    vpn: extraReasons.includes('vpn') ? true : null,
    proxy: null,
    tor: null,
    isDatacenter: null,
    fraudScore: null,
    isSuspect: reasons.length > 0,
    suspectReason: reasons.length > 0 ? reasons.join(',') : null,
    submitDurationMs: 12_000,
  }
}

type HarnessOptions = { extraReasons?: string[]; enrichThrows?: boolean; turnstile?: boolean; limiter?: MemoryRateLimit }

/** Counts allowed attempts per form key and IP, like checkRateLimit. */
class MemoryRateLimit {
  readonly attempts = new Map<string, number>()
  readonly checks: string[] = []
  check = async (opts: { ip: string; formKey: string; maxAttempts: number }) => {
    this.checks.push(opts.formKey)
    const key = `${opts.formKey}:${opts.ip}`
    const used = this.attempts.get(key) ?? 0
    if (used >= opts.maxAttempts) return { allowed: false }
    this.attempts.set(key, used + 1)
    return { allowed: true }
  }
}

function harness(options: HarnessOptions = {}) {
  const stored: Record<string, unknown>[] = []
  const notified: ContactSubmissionRow[] = []
  const limiter = options.limiter ?? new MemoryRateLimit()
  const calls = { turnstile: 0, enrich: 0 }
  const deps: ContactHandlerDeps = {
    enrich: async (input) => {
      calls.enrich += 1
      if (options.enrichThrows) throw new Error('enrichment timed out')
      return enrichmentFor(input, options.extraReasons ?? [])
    },
    getClientIp: () => '203.0.113.7',
    hashIp: (ip) => `hash:${ip}`,
    verifyTurnstile: async () => {
      calls.turnstile += 1
      return options.turnstile ?? true
    },
    checkRateLimit: limiter.check,
    submit: (row) =>
      saveContactSubmission(row, {
        insert: async (record) => {
          stored.push(record)
          return `60000000-0000-4000-8000-${stored.length.toString().padStart(12, '0')}`
        },
        notify: async (notifyRow) => {
          notified.push(notifyRow)
        },
      }),
  }
  return { deps, stored, notified, calls, limiter }
}

function post(fields: { website?: string; message?: string; email?: string } = {}) {
  return new Request('https://vizantir.example/api/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'Fictional Baker',
      email: fields.email ?? 'baker@fictional-bakery.example',
      phone: '',
      company: 'Fictional Bakery',
      service: 'New Website',
      budget: '',
      message: fields.message ?? CLEAN_MESSAGE,
      website: fields.website ?? '',
      startedAt: Date.now() - 12_000,
      turnstileToken: 'fictional-token',
    }),
  })
}

const OK = { status: 200, body: { ok: true } }

describe('contact form: the honeypot', () => {
  it('a filled honeypot is stored as spam with its reason, and no notification is sent', async () => {
    const { deps, stored, notified } = harness()
    await handleContactPost(post({ website: 'https://bot.example' }), deps)
    assert.equal(stored.length, 1)
    assert.equal(stored[0]!.status, 'spam')
    assert.equal(stored[0]!.suspect_reason, 'honeypot')
    assert.equal(stored[0]!.is_suspect, true)
    assert.equal(notified.length, 0)
  })

  it('an empty honeypot with a clean submission is stored as New and notified', async () => {
    const { deps, stored, notified } = harness()
    await handleContactPost(post(), deps)
    assert.equal(stored.length, 1)
    // No status is written, so the column default (new) applies.
    assert.equal('status' in stored[0]!, false)
    assert.equal(stored[0]!.suspect_reason, null)
    assert.equal(notified.length, 1)
  })

  it('a whitespace-only honeypot counts as empty', async () => {
    const { deps, stored, notified } = harness()
    await handleContactPost(post({ website: '   ' }), deps)
    assert.equal('status' in stored[0]!, false)
    assert.equal(notified.length, 1)
  })

  it('the submitter gets the same response either way', async () => {
    const caught = await handleContactPost(post({ website: 'filled' }), harness().deps)
    const clean = await handleContactPost(post(), harness().deps)
    assert.deepEqual(caught, clean)
    assert.deepEqual(clean, { status: 200, body: { ok: true } })
  })

  it('the same response even when storing the honeypot catch fails', async () => {
    const { deps } = harness()
    const failing: ContactHandlerDeps = { ...deps, submit: async () => Promise.reject(new Error('insert failed')) }
    assert.deepEqual(await handleContactPost(post({ website: 'filled' }), failing), { status: 200, body: { ok: true } })
  })
})

describe('contact form: other signals behave as before', () => {
  it('a VPN reason alone on a clean submission is stored as New, with its reason, and notified', async () => {
    const { deps, stored, notified } = harness({ extraReasons: ['vpn'] })
    await handleContactPost(post(), deps)
    assert.equal('status' in stored[0]!, false)
    assert.equal(stored[0]!.suspect_reason, 'vpn')
    assert.equal(stored[0]!.is_suspect, true)
    assert.equal(notified.length, 1)
  })

  it('a fast submit or datacenter reason alone does not mark spam either', async () => {
    for (const reason of ['fast_submit', 'datacenter', 'high_fraud_score']) {
      const { deps, stored, notified } = harness({ extraReasons: [reason] })
      await handleContactPost(post(), deps)
      assert.equal('status' in stored[0]!, false, reason)
      assert.equal(notified.length, 1, reason)
    }
  })

  it('scored spam is still stored as spam with no notification, after Turnstile and the rate limit', async () => {
    const { deps, stored, notified, calls, limiter } = harness({ extraReasons: ['vpn'] })
    const reply = await handleContactPost(post({ message: SPAMMY_MESSAGE }), deps)
    assert.equal(stored[0]!.status, 'spam')
    assert.equal(stored[0]!.suspect_reason, 'vpn')
    assert.equal(notified.length, 0)
    assert.equal(calls.turnstile, 1)
    assert.deepEqual(limiter.checks, [CONTACT_FORM_KEY])
    assert.deepEqual(reply, OK)
  })

  it('a honeypot catch skips Turnstile and uses only its own rate limit key', async () => {
    const { deps, calls, limiter } = harness()
    await handleContactPost(post({ website: 'filled' }), deps)
    assert.equal(calls.turnstile, 0)
    assert.deepEqual(limiter.checks, [CONTACT_HONEYPOT_FORM_KEY])
  })

  it('a failed Turnstile check still refuses a submission with an empty honeypot', async () => {
    const { deps, stored } = harness()
    const reply = await handleContactPost(post(), { ...deps, verifyTurnstile: async () => false })
    assert.deepEqual(reply, { status: 400, body: { ok: false, error: 'Verification failed. Please try again.' } })
    assert.equal(stored.length, 0)
  })
})

describe('contact form: the honeypot cap', () => {
  it('honeypot hits under the cap are each stored as spam', async () => {
    const { deps, stored, notified } = harness()
    for (let i = 0; i < CONTACT_HONEYPOT_MAX_ATTEMPTS; i += 1) {
      assert.deepEqual(await handleContactPost(post({ website: 'filled' }), deps), OK)
    }
    assert.equal(stored.length, CONTACT_HONEYPOT_MAX_ATTEMPTS)
    assert.ok(stored.every((record) => record.status === 'spam' && record.suspect_reason === 'honeypot'))
    assert.equal(notified.length, 0)
  })

  it('over the cap nothing is stored and enrichment is not called, with an identical response', async () => {
    const { deps, stored, calls } = harness()
    for (let i = 0; i < CONTACT_HONEYPOT_MAX_ATTEMPTS; i += 1) await handleContactPost(post({ website: 'filled' }), deps)
    const enrichBefore = calls.enrich
    const over = await handleContactPost(post({ website: 'filled' }), deps)
    assert.deepEqual(over, OK)
    assert.deepEqual(over, await handleContactPost(post(), harness().deps))
    assert.equal(stored.length, CONTACT_HONEYPOT_MAX_ATTEMPTS)
    assert.equal(calls.enrich, enrichBefore)
    assert.equal(calls.turnstile, 0)
  })

  it('a failed cap check stores nothing and still answers with success', async () => {
    const { deps, stored, calls } = harness()
    const failing: ContactHandlerDeps = { ...deps, checkRateLimit: async () => ({ allowed: false }) }
    assert.deepEqual(await handleContactPost(post({ website: 'filled' }), failing), OK)
    assert.equal(stored.length, 0)
    assert.equal(calls.enrich, 0)
  })

  it('the honeypot cap does not use the normal form allowance', async () => {
    const limiter = new MemoryRateLimit()
    const bot = harness({ limiter })
    for (let i = 0; i < CONTACT_HONEYPOT_MAX_ATTEMPTS + 3; i += 1) await handleContactPost(post({ website: 'filled' }), bot.deps)
    const visitor = harness({ limiter })
    for (let i = 0; i < CONTACT_MAX_ATTEMPTS; i += 1) {
      assert.deepEqual(await handleContactPost(post(), visitor.deps), OK)
    }
    assert.equal(visitor.stored.length, CONTACT_MAX_ATTEMPTS)
    assert.equal(visitor.notified.length, CONTACT_MAX_ATTEMPTS)
    // The normal limit itself is unchanged: the next one is refused as before.
    assert.equal((await handleContactPost(post(), visitor.deps)).status, 429)
  })
})

describe('contact form: no enrichment before an abuse check', () => {
  it('enrichment is not called when Turnstile fails', async () => {
    const { deps, calls, stored } = harness({ turnstile: false })
    assert.equal((await handleContactPost(post(), deps)).status, 400)
    assert.equal(calls.enrich, 0)
    assert.equal(stored.length, 0)
  })

  it('enrichment is not called when the rate limit is hit', async () => {
    const { deps, calls } = harness()
    for (let i = 0; i < CONTACT_MAX_ATTEMPTS; i += 1) await handleContactPost(post(), deps)
    const enrichBefore = calls.enrich
    assert.deepEqual(await handleContactPost(post(), deps), { status: 429, body: { ok: false, error: 'Too many attempts. Please try again later.' } })
    assert.equal(calls.enrich, enrichBefore)
  })

  it('enrichment throwing still stores and notifies a clean inquiry', async () => {
    const { deps, stored, notified, calls } = harness({ enrichThrows: true })
    assert.deepEqual(await handleContactPost(post(), deps), OK)
    assert.equal(calls.enrich, 1)
    assert.equal(stored.length, 1)
    assert.equal('status' in stored[0]!, false)
    assert.equal(stored[0]!.suspect_reason, null)
    assert.equal(notified.length, 1)
  })

  it('enrichment throwing on a honeypot catch still records the honeypot reason', async () => {
    const { deps, stored } = harness({ enrichThrows: true })
    await handleContactPost(post({ website: 'filled' }), deps)
    assert.equal(stored[0]!.status, 'spam')
    assert.equal(stored[0]!.suspect_reason, 'honeypot')
  })

  it('a clean inquiry is unchanged: Turnstile, the normal limit, stored as New, notified once', async () => {
    const { deps, stored, notified, calls, limiter } = harness()
    assert.deepEqual(await handleContactPost(post(), deps), OK)
    assert.equal(calls.turnstile, 1)
    assert.deepEqual(limiter.checks, [CONTACT_FORM_KEY])
    assert.equal(stored.length, 1)
    assert.equal('status' in stored[0]!, false)
    assert.equal(stored[0]!.is_suspect, false)
    assert.equal(stored[0]!.email, 'baker@fictional-bakery.example')
    assert.equal(notified.length, 1)
  })
})

describe('contact form: disposable email addresses', () => {
  it('are stored as spam with their reason, with no notification and the same response', async () => {
    const { deps, stored, notified } = harness()
    const reply = await handleContactPost(post({ email: 'someone@mailinator.com' }), deps)
    assert.deepEqual(reply, OK)
    assert.equal(stored.length, 1)
    assert.equal(stored[0]!.status, 'spam')
    assert.equal(stored[0]!.suspect_reason, 'disposable_email')
    assert.equal(stored[0]!.is_suspect, true)
    assert.equal(notified.length, 0)
  })

  it('keep enrichment reasons beside the disposable reason', async () => {
    const { deps, stored } = harness({ extraReasons: ['vpn'] })
    await handleContactPost(post({ email: 'someone@mailinator.com' }), deps)
    assert.equal(stored[0]!.suspect_reason, 'vpn,disposable_email')
  })

  it('still answer with success when storing fails', async () => {
    const { deps } = harness()
    const failing: ContactHandlerDeps = { ...deps, submit: async () => Promise.reject(new Error('insert failed')) }
    assert.deepEqual(await handleContactPost(post({ email: 'someone@mailinator.com' }), failing), OK)
  })

  it('still pass Turnstile and the normal rate limit first, as before', async () => {
    const { deps, stored, calls } = harness({ turnstile: false })
    assert.equal((await handleContactPost(post({ email: 'someone@mailinator.com' }), deps)).status, 400)
    assert.equal(stored.length, 0)
    assert.equal(calls.enrich, 0)
  })
})

describe('the lead detail note for a disposable address', () => {
  it('names a disposable email address', () => {
    assert.equal(
      autoSpamNote('spam', 0, 'disposable_email'),
      'Marked as spam automatically when it was submitted, because its email address is from a disposable email service. No notification email was sent.',
    )
    assert.equal(autoSpamNote('spam', 1, 'disposable_email'), null)
  })

  it('names the hidden form field for a honeypot catch', () => {
    const note = autoSpamNote('spam', 0, 'honeypot') ?? ''
    assert.match(note, /^Marked as spam automatically when it was submitted, because it filled in the hidden form field/)
    assert.match(note, /No notification email was sent\.$/)
    assert.equal(autoSpamNote('spam', 0, 'honeypot,fast_submit'), note)
  })

  it('keeps the no-reason wording for other auto-flagged spam', () => {
    const plain = 'Marked as spam automatically when it was submitted, so no notification email was sent. No reason was stored for this.'
    assert.equal(autoSpamNote('spam', 0), plain)
    assert.equal(autoSpamNote('spam', 0, null), plain)
    assert.equal(autoSpamNote('spam', 0, 'vpn,fast_submit'), plain)
  })

  it('shows nothing once the status was changed by hand, or for a lead that is not spam', () => {
    assert.equal(autoSpamNote('spam', 1, 'honeypot'), null)
    assert.equal(autoSpamNote('new', 0, 'honeypot'), null)
  })

  it('has no em-dash', () => {
    assert.equal(/—/.test(autoSpamNote('spam', 0, 'honeypot') ?? ''), false)
  })
})
