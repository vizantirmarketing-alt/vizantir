/**
 * The HTML part of a sent email, built by code from the same locked text as
 * the plain part. Pure. It exists only so mail apps show each paragraph as one
 * flowing line instead of rewrapping the plain text.
 *
 *   - Paragraphs are split on blank lines; each becomes one <p>.
 *   - A single line break inside a paragraph (the footer's lines) becomes <br>.
 *   - Every character of text is escaped before it goes into the HTML.
 *   - Nothing else: no styles, fonts, colors, images, links or tracking.
 */

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ESCAPES[char]!)
}

/** The paragraphs of the text, each a list of its lines. Blank lines separate paragraphs. */
export function paragraphs(text: string): string[][] {
  return text
    .replace(/\r\n?/g, '\n')
    .split(/\n[ \t]*\n/)
    .map((block) => block.split('\n').filter((line) => line.trim().length > 0))
    .filter((lines) => lines.length > 0)
}

/** A minimal HTML document with the text's paragraphs, CRLF line endings. */
export function htmlFromText(text: string): string {
  const body = paragraphs(text).map((lines) => `<p>${lines.map(escapeHtml).join('<br>')}</p>`)
  return ['<!DOCTYPE html>', '<html>', '<head>', '<meta charset="UTF-8">', '</head>', '<body>', ...body, '</body>', '</html>'].join('\r\n')
}
