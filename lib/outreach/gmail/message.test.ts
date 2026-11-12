// Run with: pnpm exec tsx --test lib/outreach/gmail/message.test.ts
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { decodeMultipart } from '../fixtures/mime.fixture'
import { messageText } from '../mailto'

import { buildRawMessage, encodeHeaderText, encodeWords, formatMailbox, type MessageInput } from './message'

const INPUT: MessageInput = {
  fromName: 'James',
  fromEmail: 'studio@vizantir.example',
  to: 'owner@halcyon-fictional.example',
  replyTo: 'studio@vizantir.example',
  subject: 'Your contact page',
  text: 'Hello,\n\nA short note.\n\nJames',
}

/** The top-level headers and the decoded plain part. */
function decode(raw: string): { headers: string; text: string } {
  const { headers, parts } = decodeMultipart(raw)
  return { headers, text: parts[0]?.text ?? '' }
}

/** Decodes RFC 2047 B-encoded words back to text. */
function decodeWords(value: string): string {
  const parts: Buffer[] = []
  for (const word of value.split(/\r\n /).join(' ').split(' ')) {
    const match = /^=\?UTF-8\?B\?([A-Za-z0-9+/=]+)\?=$/.exec(word)
    if (match) parts.push(Buffer.from(match[1]!, 'base64'))
  }
  return Buffer.concat(parts).toString('utf8')
}

describe('the raw message', () => {
  it('is plain text, UTF-8, with From, To, Reply-To and Subject', () => {
    const built = buildRawMessage(INPUT)
    assert.ok(built.ok)
    if (!built.ok) return
    const { headers, text } = decode(built.raw)
    assert.deepEqual(headers.split('\r\n'), [
      'From: "James" <studio@vizantir.example>',
      'To: owner@halcyon-fictional.example',
      'Reply-To: studio@vizantir.example',
      'Subject: Your contact page',
      'MIME-Version: 1.0',
      'Content-Type: multipart/alternative;',
      ` boundary="${decodeMultipart(built.raw).boundary}"`,
    ])
    assert.equal(text, 'Hello,\r\n\r\nA short note.\r\n\r\nJames')
    assert.ok(!/[+/=]/.test(built.raw), 'base64url, unpadded')
  })

  it('refuses a carriage return or line feed in any header value', () => {
    for (const field of ['fromName', 'fromEmail', 'to', 'replyTo', 'subject'] as const) {
      for (const injected of ['\r\nBcc: someone@attacker.example', '\nBcc: someone@attacker.example', '\rX']) {
        const built = buildRawMessage({ ...INPUT, [field]: `${INPUT[field]}${injected}` })
        assert.equal(built.ok, false, `${field} ${JSON.stringify(injected)}`)
        if (!built.ok) assert.match(built.error, /line break/)
      }
    }
  })

  it('encodes a non-ASCII subject as RFC 2047 encoded words of at most 75 characters', () => {
    const subject = 'Café menu, a note about your piñata page and the façade photos 🌵 on the home page'
    const built = buildRawMessage({ ...INPUT, subject })
    assert.ok(built.ok)
    if (!built.ok) return
    const line = /Subject: ([\s\S]*?)\r\nMIME-Version/.exec(decode(built.raw).headers)![1]!
    assert.ok(!/[^\x20-\x7E\r\n]/.test(line), 'ASCII only on the wire')
    for (const word of line.split(/\r\n /)) assert.ok(word.length <= 75, word)
    assert.equal(decodeWords(line), subject)
    assert.equal(encodeHeaderText('Plain ASCII'), 'Plain ASCII')
  })

  it('never splits a character across encoded words', () => {
    const value = '🌵'.repeat(30)
    assert.equal(decodeWords(encodeWords(value).join(' ')), value)
  })

  it('quotes an ASCII sender name and encodes a non-ASCII one', () => {
    assert.equal(formatMailbox('James "Jim" Tram', 'a@b.example'), '"James \\"Jim\\" Tram" <a@b.example>')
    const encoded = formatMailbox('José', 'a@b.example')
    assert.match(encoded, /^=\?UTF-8\?B\?[A-Za-z0-9+/=]+\?= <a@b\.example>$/)
    assert.equal(decodeWords(encoded.replace(/ <a@b\.example>$/, '')), 'José')
    assert.equal(formatMailbox('', 'a@b.example'), 'a@b.example')
  })

  it('refuses an invalid recipient, sender or reply-to address', () => {
    assert.equal(buildRawMessage({ ...INPUT, to: 'not-an-address' }).ok, false)
    assert.equal(buildRawMessage({ ...INPUT, to: 'a@b.example, c@d.example' }).ok, false)
    assert.equal(buildRawMessage({ ...INPUT, fromEmail: '' }).ok, false)
    assert.equal(buildRawMessage({ ...INPUT, replyTo: 'x' }).ok, false)
  })
})

describe('the text body', () => {
  const LONG =
    'I was looking at your site and noticed that the management services page has no contact form or booking option. ' +
    'Its only call to action is a phone number in the footer, which is easy to miss on a phone and gives no way to ask a question after hours.'
  const BODY = `Hello Zoë,\n\n${LONG}\n\nThe café menu page loads quickly, and the façade photos look great. 🌵\n\nWould a short call next week help?`
  const FOOTER = 'James\nVizantir Design Studio\nReply "no thanks" and I will not write again.'
  const built = buildRawMessage({ ...INPUT, text: messageText(BODY, FOOTER) })

  it('keeps a paragraph longer than 200 characters on one line', () => {
    assert.ok(LONG.length > 200)
    assert.ok(built.ok)
    if (!built.ok) return
    assert.ok(decode(built.raw).text.split('\r\n').includes(LONG))
  })

  it('keeps the blank lines between paragraphs', () => {
    assert.ok(built.ok)
    if (!built.ok) return
    const lines = decode(built.raw).text.split('\r\n')
    assert.deepEqual(
      lines.map((line) => line === ''),
      [false, true, false, true, false, true, false, true, false, false, false],
    )
  })

  it('keeps every encoded line within 76 characters plus CRLF', () => {
    assert.ok(built.ok)
    if (!built.ok) return
    const message = Buffer.from(built.raw, 'base64url').toString('utf8')
    assert.ok(message.endsWith('\r\n'))
    assert.ok(!/\r(?!\n)|(?<!\r)\n/.test(message), 'CRLF only')
    for (const line of message.split('\r\n')) assert.ok(line.length <= 76, line)
  })

  it('decodes to exactly the body and the footer, with CRLF line endings', () => {
    assert.ok(built.ok)
    if (!built.ok) return
    const expected =
      `Hello Zoë,\r\n\r\n${LONG}\r\n\r\n` +
      'The café menu page loads quickly, and the façade photos look great. 🌵\r\n\r\n' +
      'Would a short call next week help?\r\n\r\n' +
      'James\r\nVizantir Design Studio\r\nReply "no thanks" and I will not write again.'
    assert.equal(decode(built.raw).text, expected)
  })
})

describe('the multipart message', () => {
  const LONG =
    'I was looking at your site and noticed that the management services page has no contact form or booking option. ' +
    'Its only call to action is a phone number in the footer, which is easy to miss on a phone and gives no way to ask a question after hours.'
  const OPT_OUT = "If you'd rather not hear from me again, reply and say so, and I won't write again."
  const FOOTER = `James\nVizantir Design Studio\n100 Example Plaza, Suite 2\n\n${OPT_OUT}`
  const BODY = `Hello Zoë,\n\n${LONG}\n\nThe café menu page loads quickly, and the façade photos on vizantir.com look great. 🌵\n\nWould a short call next week help?`
  const built = buildRawMessage({ ...INPUT, text: messageText(BODY, FOOTER) })
  assert.ok(built.ok)
  const decoded = decodeMultipart(built.ok ? built.raw : '')
  const html = decoded.parts[1]?.text ?? ''
  const ALLOWED_TAGS = new Set(['html', 'head', 'meta', 'body', 'p', 'br'])

  const tagNames = (value: string) =>
    [...value.replace(/^<!DOCTYPE html>/, '').matchAll(/<\/?([A-Za-z][A-Za-z0-9]*)/g)].map((match) => match[1]!.toLowerCase())
  const unescape = (value: string) =>
    value.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
  const bodyParagraphs = (value: string) => [...value.matchAll(/<p>(.*?)<\/p>/g)].map((match) => match[1]!)

  it('is multipart/alternative with exactly two parts, plain first and HTML second', () => {
    assert.match(decoded.headers, /\r\nContent-Type: multipart\/alternative;\r\n boundary="=_vz_[0-9a-f]{24}"$/)
    assert.equal(decoded.parts.length, 2)
    assert.deepEqual(decoded.parts[0]!.headers, ['Content-Type: text/plain; charset="UTF-8"', 'Content-Transfer-Encoding: base64'])
    assert.deepEqual(decoded.parts[1]!.headers, ['Content-Type: text/html; charset="UTF-8"', 'Content-Transfer-Encoding: base64'])
    assert.ok(decoded.message.endsWith(`\r\n--${decoded.boundary}--\r\n`))
  })

  it('uses a new boundary for every message', () => {
    const again = buildRawMessage({ ...INPUT, text: messageText(BODY, FOOTER) })
    assert.ok(again.ok)
    if (!again.ok) return
    assert.notEqual(decodeMultipart(again.raw).boundary, decoded.boundary)
  })

  it('keeps a paragraph longer than 200 characters as one <p> with no line break inside', () => {
    const paragraph = bodyParagraphs(html).find((p) => p.startsWith('I was looking'))!
    assert.equal(paragraph, LONG)
    assert.ok(!/<br>|[\r\n]/.test(paragraph))
  })

  it('joins the footer lines with <br> in one <p>, and gives the opt-out line its own <p>', () => {
    const ps = bodyParagraphs(html)
    assert.ok(ps.includes('James<br>Vizantir Design Studio<br>100 Example Plaza, Suite 2'))
    assert.equal(ps[ps.length - 1], OPT_OUT.replace(/'/g, '&#39;'))
  })

  it('escapes markup, ampersands, quotes and an angle-bracket address', () => {
    const text = 'Hi <script>alert("x")</script> & co,\n\nWrite to "Jo" <jo@b.example> or it\'s fine.'
    const hostile = buildRawMessage({ ...INPUT, text })
    assert.ok(hostile.ok)
    if (!hostile.ok) return
    const out = decodeMultipart(hostile.raw).parts[1]!.text
    assert.ok(tagNames(out).every((tag) => ALLOWED_TAGS.has(tag)), tagNames(out).join(','))
    assert.ok(out.includes('Hi &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; co,'))
    assert.ok(out.includes('Write to &quot;Jo&quot; &lt;jo@b.example&gt; or it&#39;s fine.'))
    assert.deepEqual(bodyParagraphs(out).map(unescape), text.split('\n\n'))
  })

  it('has no links, images, styles or URLs of its own', () => {
    assert.ok(tagNames(html).every((tag) => ALLOWED_TAGS.has(tag)), tagNames(html).join(','))
    assert.ok(!/<a\b/i.test(html))
    assert.ok(!/<img\b/i.test(html))
    assert.ok(!/\bstyle\s*=/i.test(html))
    const urls = html.match(/\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(?:com|net|org|io)\b/gi) ?? []
    assert.deepEqual(urls, ['vizantir.com'])
    assert.ok(BODY.includes('vizantir.com'))
  })

  it('shows the same words in the same order as the plain part', () => {
    const plain = decoded.parts[0]!.text
    const visible = unescape(html.replace(/^<!DOCTYPE html>/, '').replace(/<br>/g, '\n').replace(/<[^>]+>/g, ' '))
    const words = (value: string) => value.split(/\s+/).filter((word) => word.length > 0)
    assert.deepEqual(words(visible), words(plain))
    assert.deepEqual(
      bodyParagraphs(html).map((p) => p.split('<br>').map(unescape).join('\r\n')),
      plain.split('\r\n\r\n'),
    )
  })

  it('keeps the plain part exactly the body and the footer', () => {
    assert.equal(decoded.parts[0]!.text, messageText(BODY, FOOTER).split('\n').join('\r\n'))
  })

  it('never lets the boundary appear in either part, and keeps every line within 76 characters', () => {
    for (const part of decoded.parts) assert.ok(!part.text.includes(decoded.boundary))
    const body = decoded.message.slice(decoded.message.indexOf('\r\n\r\n') + 4)
    assert.equal(body.split(decoded.boundary).length - 1, 3, 'two delimiters and the close')
    for (const line of decoded.message.split('\r\n')) assert.ok(line.length <= 76, line)
  })
})
