/**
 * The only outbound fetch used by the New Businesses feature. It is not
 * shared with, and does not reuse, lib/scan.
 *
 *   - https only, and only for ALLOWED_HOSTS (clarkcountynv.gov and
 *     www.clarkcountynv.gov)
 *   - redirects are followed manually, at most MAX_REDIRECTS, and every hop
 *     must pass the same https and host checks; a redirect to any other host
 *     is refused
 *   - the size cap is enforced while streaming: a Content-Length over the cap
 *     is refused before reading, and the read is cancelled the moment the
 *     running total passes the cap
 *   - one timeout covers the whole exchange, redirects included
 *   - a descriptive user agent
 *
 * fetch is injectable so tests never make a real request.
 */

import { isAllowedSourceUrl } from '@/lib/new-businesses/discovery'

export const MAX_DOWNLOAD_BYTES = 20 * 1024 * 1024
export const FETCH_TIMEOUT_MS = 60_000
export const MAX_REDIRECTS = 3
export const NEW_BUSINESS_USER_AGENT =
  'VizantirIntelNewBusinesses/1.0 (+https://www.vizantir.com; monthly new business list import)'

export type SourceFetch = (url: string, init: RequestInit) => Promise<Response>

export type FetchOptions = {
  fetch?: SourceFetch
  maxBytes?: number
  timeoutMs?: number
  accept?: string
}

export class SourceFetchError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'disallowed_url'
      | 'disallowed_redirect'
      | 'too_many_redirects'
      | 'http_error'
      | 'too_large'
      | 'timeout'
      | 'network_error',
  ) {
    super(message)
    this.name = 'SourceFetchError'
  }
}

function checkUrl(raw: string, code: 'disallowed_url' | 'disallowed_redirect'): URL {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new SourceFetchError(`Not a valid URL: ${raw.slice(0, 200)}`, code)
  }
  if (!isAllowedSourceUrl(url)) {
    throw new SourceFetchError(
      `${code === 'disallowed_redirect' ? 'Redirect to' : 'Refused'} ${url.protocol}//${url.host}: only https on clarkcountynv.gov is allowed`,
      code,
    )
  }
  return url
}

async function readCapped(response: Response, maxBytes: number): Promise<Uint8Array> {
  const declared = Number(response.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > maxBytes) {
    await response.body?.cancel().catch(() => undefined)
    throw new SourceFetchError(`Response is ${declared} bytes, over the ${maxBytes} byte cap`, 'too_large')
  }
  if (response.body === null) {
    return new Uint8Array(0)
  }

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined)
      throw new SourceFetchError(`Response passed the ${maxBytes} byte cap while downloading`, 'too_large')
    }
    chunks.push(value)
  }

  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.byteLength
  }
  return out
}

export async function fetchSourceBytes(rawUrl: string, options: FetchOptions = {}): Promise<Uint8Array> {
  const doFetch = options.fetch ?? ((url, init) => fetch(url, init))
  const maxBytes = options.maxBytes ?? MAX_DOWNLOAD_BYTES
  const signal = AbortSignal.timeout(options.timeoutMs ?? FETCH_TIMEOUT_MS)

  let url = checkUrl(rawUrl, 'disallowed_url')
  for (let hop = 0; ; hop += 1) {
    let response: Response
    try {
      response = await doFetch(url.toString(), {
        method: 'GET',
        redirect: 'manual',
        cache: 'no-store',
        signal,
        headers: {
          'User-Agent': NEW_BUSINESS_USER_AGENT,
          Accept: options.accept ?? '*/*',
        },
      })
    } catch (error) {
      if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
        throw new SourceFetchError('Request timed out', 'timeout')
      }
      throw new SourceFetchError('Network error', 'network_error')
    }

    if (response.status >= 300 && response.status < 400) {
      await response.body?.cancel().catch(() => undefined)
      const location = response.headers.get('location')
      if (location === null) {
        throw new SourceFetchError(`HTTP ${response.status} without a Location header`, 'http_error')
      }
      if (hop >= MAX_REDIRECTS) {
        throw new SourceFetchError(`More than ${MAX_REDIRECTS} redirects`, 'too_many_redirects')
      }
      url = checkUrl(new URL(location, url).toString(), 'disallowed_redirect')
      continue
    }

    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined)
      throw new SourceFetchError(`HTTP ${response.status}`, 'http_error')
    }

    try {
      return await readCapped(response, maxBytes)
    } catch (error) {
      if (error instanceof SourceFetchError) throw error
      if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
        throw new SourceFetchError('Request timed out', 'timeout')
      }
      throw new SourceFetchError('Network error while downloading', 'network_error')
    }
  }
}

export async function fetchSourceText(rawUrl: string, options: FetchOptions = {}): Promise<string> {
  const bytes = await fetchSourceBytes(rawUrl, { accept: 'text/html', ...options })
  return new TextDecoder('utf-8').decode(bytes)
}
