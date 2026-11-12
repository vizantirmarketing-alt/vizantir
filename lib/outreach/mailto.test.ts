// Run with: pnpm exec tsx --test lib/outreach/mailto.test.ts
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { buildMailto, messageText } from './mailto'

const TEXT = messageText('Hello there,\n\nA short note.', 'James\nVizantir Design Studio')

function decodeParts(href: string) {
  const [address, query] = href.slice('mailto:'.length).split('?')
  const params = new URLSearchParams(query!.replace(/\+/g, '%2B'))
  return { address: address!, subject: params.get('subject'), body: params.get('body'), keys: [...params.keys()] }
}

describe('buildMailto', () => {
  it('builds an encoded link with CRLF line breaks', () => {
    const result = buildMailto({ to: 'owner@firm.example', subject: 'A note & a question?', text: TEXT })
    assert.equal(result.kind, 'link')
    if (result.kind !== 'link') return
    assert.ok(result.href.startsWith('mailto:owner@firm.example?subject='))
    assert.ok(result.href.includes('%0D%0A%0D%0A'))
    assert.ok(!/[\r\n ]/.test(result.href))
    const parts = decodeParts(result.href)
    assert.equal(parts.subject, 'A note & a question?')
    assert.equal(parts.body, TEXT.split('\n').join('\r\n'))
    assert.deepEqual(parts.keys, ['subject', 'body'])
  })

  it('header injection through the subject is flattened to one line', () => {
    const result = buildMailto({ to: 'owner@firm.example', subject: 'Hello\r\nBcc: evil@attacker.example', text: TEXT })
    assert.equal(result.kind, 'link')
    if (result.kind !== 'link') return
    const parts = decodeParts(result.href)
    assert.equal(parts.subject, 'Hello Bcc: evil@attacker.example')
    assert.ok(!parts.subject!.includes('\n'))
    assert.deepEqual(parts.keys, ['subject', 'body'])
  })

  it('header injection through the recipient is refused', () => {
    for (const to of [
      'owner@firm.example?bcc=evil@attacker.example',
      'owner@firm.example&cc=evil@attacker.example',
      'owner@firm.example,evil@attacker.example',
      'owner@firm.example\r\nBcc: evil@attacker.example',
      'Owner <owner@firm.example>',
      'owner@firm.example%0D%0ABcc:evil@attacker.example',
    ]) {
      const result = buildMailto({ to, subject: 'Hi', text: TEXT })
      assert.deepEqual(result, { kind: 'copy_only', reason: 'invalid_recipient' }, to)
    }
  })

  it('line breaks around a valid recipient are stripped, not kept', () => {
    const result = buildMailto({ to: '\r\nowner@firm.example\n', subject: 'Hi', text: TEXT })
    assert.equal(result.kind, 'link')
    if (result.kind === 'link') assert.ok(result.href.startsWith('mailto:owner@firm.example?'))
  })

  it('an ampersand or equals sign in the body cannot add a parameter', () => {
    const result = buildMailto({ to: 'owner@firm.example', subject: 'Hi', text: 'a&cc=evil@attacker.example=b' })
    assert.equal(result.kind, 'link')
    if (result.kind === 'link') assert.deepEqual(decodeParts(result.href).keys, ['subject', 'body'])
  })

  it('falls back to Copy email only above 1800 characters', () => {
    const long = buildMailto({ to: 'owner@firm.example', subject: 'Hi', text: 'word '.repeat(400) })
    assert.equal(long.kind, 'copy_only')
    if (long.kind === 'copy_only') {
      assert.equal(long.reason, 'too_long')
      assert.ok((long.length ?? 0) > 1800)
    }
    const fits = buildMailto({ to: 'owner@firm.example', subject: 'Hi', text: 'word '.repeat(100) })
    assert.equal(fits.kind, 'link')
    if (fits.kind === 'link') assert.ok(fits.href.length <= 1800)
  })

  it('the limit is on the encoded length', () => {
    // 600 accented characters are 3,600 encoded characters.
    const result = buildMailto({ to: 'owner@firm.example', subject: 'Hi', text: 'é'.repeat(600) })
    assert.equal(result.kind, 'copy_only')
  })
})
