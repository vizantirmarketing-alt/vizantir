/**
 * The email as Gmail receives it: an RFC 5322 multipart/alternative message in
 * UTF-8, base64url-encoded for messages.send. Pure apart from the random
 * boundary.
 *
 *   - A header value that contains a carriage return or line feed is refused,
 *     so no header can be added through a name, address or subject.
 *   - A non-ASCII subject or sender name is written as RFC 2047 encoded words.
 *   - Two parts, plain text then HTML, both base64 (UTF-8), so any character
 *     and any line length is safe. The plain part is exactly the text with CRLF
 *     line endings. The HTML part is built from the same text by htmlFromText,
 *     so mail apps show each paragraph as one flowing line rather than
 *     rewrapping the plain text.
 */

import { randomBytes } from 'node:crypto'

import { htmlFromText } from '@/lib/outreach/gmail/html'
import { isValidEmail } from '@/lib/outreach/params'

export type MessageInput = {
  fromName: string
  fromEmail: string
  to: string
  replyTo: string
  subject: string
  /** The locked body and the footer, joined by messageText(). */
  text: string
}

export type BuiltMessage = { ok: true; raw: string; headers: string } | { ok: false; error: string }

const LINE_BREAK = /[\r\n]/
// Other control characters are dropped from header values.
const CONTROLS = new RegExp('[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F]', 'g')
const PRINTABLE_ASCII = /^[\x20-\x7E]*$/
/** 45 bytes is 60 base64 characters: with "=?UTF-8?B?" and "?=" each word stays within 75. */
const WORD_BYTES = 45

/** RFC 2047 encoded words, split on character boundaries. */
export function encodeWords(value: string): string[] {
  const words: string[] = []
  let chunk = ''
  for (const char of value) {
    if (Buffer.byteLength(chunk + char, 'utf8') > WORD_BYTES) {
      words.push(chunk)
      chunk = ''
    }
    chunk += char
  }
  if (chunk.length > 0) words.push(chunk)
  return words.map((word) => `=?UTF-8?B?${Buffer.from(word, 'utf8').toString('base64')}?=`)
}

/** A header value: ASCII as it is, anything else as encoded words folded onto continuation lines. */
export function encodeHeaderText(value: string): string {
  if (PRINTABLE_ASCII.test(value)) return value
  return encodeWords(value).join('\r\n ')
}

/** "Name" <address>, or the address alone when there is no name. */
export function formatMailbox(name: string, email: string): string {
  const trimmed = name.trim()
  if (trimmed.length === 0) return email
  const display = PRINTABLE_ASCII.test(trimmed) ? `"${trimmed.replace(/[\\"]/g, (c) => `\\${c}`)}"` : encodeWords(trimmed).join(' ')
  return `${display} <${email}>`
}

/**
 * A boundary that cannot occur in either part: base64 never contains "_", and
 * every part is base64.
 */
export function newBoundary(): string {
  return `=_vz_${randomBytes(12).toString('hex')}`
}

function wrapBase64(text: string): string {
  const encoded = Buffer.from(text, 'utf8').toString('base64')
  return (encoded.match(/.{1,76}/g) ?? []).join('\r\n')
}

export function buildRawMessage(input: MessageInput, boundary: string = newBoundary()): BuiltMessage {
  const fields = [input.fromName, input.fromEmail, input.to, input.replyTo, input.subject]
  if (fields.some((value) => LINE_BREAK.test(value))) {
    return { ok: false, error: 'A header in this email contained a line break, so it was not sent.' }
  }
  const clean = (value: string) => value.replace(CONTROLS, '').trim()
  const fromName = clean(input.fromName)
  const fromEmail = clean(input.fromEmail)
  const to = clean(input.to)
  const replyTo = clean(input.replyTo)
  const subject = clean(input.subject)

  if (!isValidEmail(to)) return { ok: false, error: 'The recipient address is not valid.' }
  if (!isValidEmail(fromEmail)) return { ok: false, error: 'The connected address is not valid.' }
  if (!isValidEmail(replyTo)) return { ok: false, error: 'The reply-to address in Outreach settings is not valid.' }
  if (subject.length === 0) return { ok: false, error: 'The subject is empty.' }

  const headers = [
    `From: ${formatMailbox(fromName, fromEmail)}`,
    `To: ${to}`,
    `Reply-To: ${replyTo}`,
    `Subject: ${encodeHeaderText(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative;\r\n boundary="${boundary}"`,
  ].join('\r\n')
  const plain = input.text.replace(/\r\n?/g, '\n').split('\n').join('\r\n')
  const part = (type: string, content: string) =>
    [`--${boundary}`, `Content-Type: ${type}; charset="UTF-8"`, 'Content-Transfer-Encoding: base64', '', wrapBase64(content)].join('\r\n')
  const message = [
    headers,
    '',
    part('text/plain', plain),
    part('text/html', htmlFromText(input.text)),
    `--${boundary}--`,
    '',
  ].join('\r\n')
  return { ok: true, raw: Buffer.from(message, 'utf8').toString('base64url'), headers }
}
