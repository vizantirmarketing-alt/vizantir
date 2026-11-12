/**
 * The "Open in mail app" link for an approved draft. Pure.
 *
 * Every part is percent-encoded. Carriage returns and line feeds are removed
 * from the recipient and the subject first, so no header can be injected,
 * and the recipient must then be one plain address. A link longer than
 * MAILTO_MAX_LENGTH is not offered: some mail applications cut long links
 * off, so the page shows only Copy email with a short note instead.
 */

import { MAILTO_MAX_LENGTH, isValidEmail } from '@/lib/outreach/params'

export type MailtoInput = { to: string; subject: string; text: string }

export type MailtoResult =
  | { kind: 'link'; href: string }
  | { kind: 'copy_only'; reason: 'too_long' | 'invalid_recipient'; length?: number }

// Control characters, NEL and the Unicode line and paragraph separators.
const LINE_BREAKS_AND_CONTROLS = new RegExp('[\\u0000-\\u001F\\u007F\\u0085\\u2028\\u2029]', 'g')

/** One line: line breaks and other control characters out. */
export function singleLine(value: string): string {
  return value.replace(LINE_BREAKS_AND_CONTROLS, ' ').replace(/\s+/g, ' ').trim()
}

/** The text of the message as it will be sent: the body, a blank line, the footer. */
export function messageText(body: string, footer: string): string {
  return `${body.trim()}\n\n${footer.trim()}`
}

export function buildMailto(input: MailtoInput, maxLength: number = MAILTO_MAX_LENGTH): MailtoResult {
  const to = input.to.replace(LINE_BREAKS_AND_CONTROLS, '').trim()
  if (!isValidEmail(to)) return { kind: 'copy_only', reason: 'invalid_recipient' }

  const subject = singleLine(input.subject)
  // Line breaks in the body are kept, written as CRLF as mailto requires.
  const body = input.text.replace(/\r\n?/g, '\n').split('\n').join('\r\n')

  // "@" may stay literal in the address part; everything else is encoded.
  const href =
    `mailto:${encodeURIComponent(to).replace(/%40/g, '@')}` +
    `?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`

  if (href.length > maxLength) return { kind: 'copy_only', reason: 'too_long', length: href.length }
  return { kind: 'link', href }
}
