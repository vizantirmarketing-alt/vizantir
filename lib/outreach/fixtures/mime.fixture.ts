/** Test helper: reads back a raw multipart message built by buildRawMessage. */

export type DecodedPart = { headers: string[]; text: string }
export type DecodedMessage = { message: string; headers: string; boundary: string; parts: DecodedPart[] }

export function decodeMultipart(raw: string): DecodedMessage {
  const message = Buffer.from(raw, 'base64url').toString('utf8')
  const split = message.indexOf('\r\n\r\n')
  const headers = message.slice(0, split)
  const boundary = /boundary="([^"]+)"/.exec(headers)?.[1] ?? ''
  const rest = message.slice(split + 4)
  const chunks = rest.split(`--${boundary}`)
  // Before the first delimiter is empty; after the closing "--" is the end.
  const parts = chunks.slice(1, -1).map((chunk) => {
    const body = chunk.replace(/^\r\n/, '').replace(/\r\n$/, '')
    const end = body.indexOf('\r\n\r\n')
    return {
      headers: body.slice(0, end).split('\r\n'),
      text: Buffer.from(body.slice(end + 4).replace(/\r\n/g, ''), 'base64').toString('utf8'),
    }
  })
  return { message, headers, boundary, parts }
}
