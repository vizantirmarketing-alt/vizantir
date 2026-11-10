/**
 * Client for the external prospect research runner. Talks only to the runner
 * routes (app/api/prospects/claim, ingest and measure).
 *
 * Everything with a side effect is injected (network, environment, file
 * reads, output), so tests never make a real request. The CLI wrapper is
 * scripts/prospect-runner.ts.
 *
 * The bearer token is never printed. Every line of output passes through
 * redactSecret() as a backstop, including error text from the network layer.
 */

import { normalizeDomain } from '@/lib/prospects/domain'
import { parseIngestBody } from '@/lib/prospects/ingest-schema'

export const DEFAULT_RUNNER_BASE_URL = 'http://localhost:3000'
export const RUNNER_TOKEN_ENV = 'PROSPECT_INGEST_TOKEN'
export const RUNNER_BASE_URL_ENV = 'PROSPECT_RUNNER_BASE_URL'

export const EXIT_OK = 0
export const EXIT_FAILURE = 1
export const EXIT_NO_RUN_QUEUED = 2
export const EXIT_USAGE = 64

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])
const REDACTED = '[redacted]'

export type RunnerResponse = {
  status: number
  text(): Promise<string>
}

export type RunnerFetch = (
  url: string,
  init: { method: 'POST'; headers: Record<string, string>; body?: string },
) => Promise<RunnerResponse>

export type RunnerDeps = {
  fetch: RunnerFetch
  env: Record<string, string | undefined>
  /** Contents of .env.local, or null if it does not exist. */
  readEnvFile(): string | null
  readFile(path: string): string
  stdout(line: string): void
  stderr(line: string): void
}

export type BaseUrlResult = { ok: true; origin: string } | { ok: false; error: string }

/** Origin only. https is required for every host except localhost. */
export function resolveBaseUrl(raw: string | undefined): BaseUrlResult {
  const value = raw?.trim() || DEFAULT_RUNNER_BASE_URL

  let url: URL
  try {
    url = new URL(value)
  } catch {
    return { ok: false, error: `${RUNNER_BASE_URL_ENV} is not a valid URL.` }
  }

  if (url.username !== '' || url.password !== '') {
    return { ok: false, error: `${RUNNER_BASE_URL_ENV} must not contain credentials.` }
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return { ok: false, error: `${RUNNER_BASE_URL_ENV} must use https.` }
  }
  if (url.protocol === 'http:' && !LOCAL_HOSTS.has(url.hostname)) {
    return {
      ok: false,
      error: `${RUNNER_BASE_URL_ENV} must use https for any host other than localhost.`,
    }
  }
  if (url.pathname !== '/' || url.search !== '' || url.hash !== '') {
    return { ok: false, error: `${RUNNER_BASE_URL_ENV} must be an origin with no path.` }
  }

  return { ok: true, origin: url.origin }
}

/**
 * Reads one key from dotenv-format text. Only the requested key is read; the
 * rest of the file is never loaded into the environment.
 */
export function readEnvFileValue(content: string, key: string): string | undefined {
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (line.length === 0 || line.startsWith('#')) {
      continue
    }
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line)
    if (match === null || match[1] !== key) {
      continue
    }
    let value = match[2] ?? ''
    const quote = value[0]
    if ((quote === '"' || quote === "'") && value.endsWith(quote) && value.length >= 2) {
      value = value.slice(1, -1)
    } else {
      const comment = value.indexOf(' #')
      if (comment !== -1) {
        value = value.slice(0, comment)
      }
    }
    return value.trim()
  }
  return undefined
}

/** Environment first, then .env.local. Returns null when unset or blank. */
export function resolveToken(deps: Pick<RunnerDeps, 'env' | 'readEnvFile'>): string | null {
  const fromEnv = deps.env[RUNNER_TOKEN_ENV]?.trim()
  if (fromEnv) {
    return fromEnv
  }
  const content = deps.readEnvFile()
  if (content === null) {
    return null
  }
  const fromFile = readEnvFileValue(content, RUNNER_TOKEN_ENV)?.trim()
  return fromFile ? fromFile : null
}

export function redactSecret(text: string, secret: string | null): string {
  if (secret === null || secret.length === 0) {
    return text
  }
  return text.split(secret).join(REDACTED)
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function readString(value: unknown, key: string): string | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }
  const field: unknown = Reflect.get(value, key)
  return typeof field === 'string' ? field : null
}

function readArray(value: unknown, key: string): unknown[] {
  if (typeof value !== 'object' || value === null) {
    return []
  }
  const field: unknown = Reflect.get(value, key)
  return Array.isArray(field) ? field : []
}

const USAGE = [
  'Usage:',
  '  pnpm prospect:runner claim',
  '  pnpm prospect:runner ingest <batch.json>',
  '  pnpm prospect:runner measure <domain>',
].join('\n')

export async function runRunnerCli(argv: string[], deps: RunnerDeps): Promise<number> {
  // Usage and base URL checks run before the token is read, so a bad
  // invocation never touches .env.local.
  const [command, ...rest] = argv
  const usageOk =
    (command === 'claim' && rest.length === 0) ||
    (command === 'ingest' && rest.length === 1) ||
    (command === 'measure' && rest.length === 1)
  if (!usageOk) {
    deps.stderr(USAGE)
    return EXIT_USAGE
  }

  const base = resolveBaseUrl(deps.env[RUNNER_BASE_URL_ENV])
  if (!base.ok) {
    deps.stderr(base.error)
    return EXIT_FAILURE
  }

  const token = resolveToken(deps)
  const out = (line: string) => deps.stdout(redactSecret(line, token))
  const err = (line: string) => deps.stderr(redactSecret(line, token))

  if (token === null) {
    err(`${RUNNER_TOKEN_ENV} is not set in the environment or .env.local.`)
    return EXIT_FAILURE
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  if (command === 'claim') {
    return runClaim(base.origin, headers, deps, out, err)
  }
  if (command === 'measure') {
    return runMeasure(base.origin, headers, rest[0] ?? '', deps, out, err)
  }
  return runIngest(base.origin, headers, rest[0] ?? '', deps, out, err)
}

async function post(
  deps: RunnerDeps,
  url: string,
  headers: Record<string, string>,
  body: string | undefined,
  err: (line: string) => void,
): Promise<{ status: number; json: unknown; text: string } | null> {
  try {
    const response = await deps.fetch(url, { method: 'POST', headers, body })
    const text = await response.text()
    return { status: response.status, json: parseJson(text), text }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error'
    err(`Request to ${url} failed: ${message}`)
    return null
  }
}

function describeFailure(label: string, status: number, json: unknown): string[] {
  const lines = [`${label} failed: HTTP ${status}${readString(json, 'error') ? `: ${readString(json, 'error')}` : ''}`]
  if (status === 503) {
    lines.push('The server has no usable PROSPECT_INGEST_TOKEN configured.')
  }
  if (status === 401) {
    lines.push('The server rejected the token.')
  }
  for (const issue of readArray(json, 'issues')) {
    if (typeof issue === 'string') {
      lines.push(`  ${issue}`)
    }
  }
  const runState = readString(json, 'runState')
  if (runState !== null) {
    lines.push(`Run state: ${runState}`)
  }
  return lines
}

async function runClaim(
  origin: string,
  headers: Record<string, string>,
  deps: RunnerDeps,
  out: (line: string) => void,
  err: (line: string) => void,
): Promise<number> {
  const result = await post(deps, `${origin}/api/prospects/claim`, headers, undefined, err)
  if (result === null) {
    return EXIT_FAILURE
  }
  if (result.status !== 200 || result.json === null) {
    describeFailure('Claim', result.status, result.json).forEach(err)
    return EXIT_FAILURE
  }

  const run: unknown = Reflect.get(result.json as object, 'run')
  if (run === null || run === undefined) {
    err('No research run is queued. Request one at /intel/prospects.')
    return EXIT_NO_RUN_QUEUED
  }

  out(JSON.stringify(result.json, null, 2))
  return EXIT_OK
}

async function runIngest(
  origin: string,
  headers: Record<string, string>,
  file: string,
  deps: RunnerDeps,
  out: (line: string) => void,
  err: (line: string) => void,
): Promise<number> {
  let raw: string
  try {
    raw = deps.readFile(file)
  } catch {
    err(`Could not read batch file: ${file}`)
    return EXIT_FAILURE
  }

  // Validate locally with the server's own schema so a malformed batch is
  // caught before it is sent. The server validates again regardless.
  const local = parseIngestBody(raw)
  if (!local.ok) {
    err(`Batch file is invalid (${local.error}).`)
    for (const issue of local.issues ?? []) {
      err(`  ${issue}`)
    }
    return EXIT_FAILURE
  }

  const result = await post(deps, `${origin}/api/prospects/ingest`, headers, raw, err)
  if (result === null) {
    return EXIT_FAILURE
  }
  if (result.status !== 200 || result.json === null) {
    describeFailure('Ingest', result.status, result.json).forEach(err)
    return EXIT_FAILURE
  }

  const json = result.json
  out(`Run ${readString(json, 'runId') ?? local.batch.runId}: ${readString(json, 'runState') ?? 'unknown state'}`)
  for (const saved of readArray(json, 'saved')) {
    const domain = readString(saved, 'domain') ?? '?'
    const fit = Reflect.get(saved as object, 'fitScore')
    const opportunity = Reflect.get(saved as object, 'opportunityScore')
    const confidence = readString(saved, 'confidence') ?? '?'
    out(`  saved     ${domain}  fit ${fit ?? '—'}  opportunity ${opportunity ?? '—'}  confidence ${confidence}`)
  }
  for (const rejected of readArray(json, 'rejected')) {
    const key = readString(rejected, 'key') ?? '?'
    const reasons = readArray(rejected, 'reasons').filter((reason) => typeof reason === 'string')
    out(`  rejected  ${key}  ${reasons.join(', ')}`)
  }
  out(JSON.stringify({ counts: Reflect.get(json as object, 'counts') ?? null }))
  return EXIT_OK
}

async function runMeasure(
  origin: string,
  headers: Record<string, string>,
  rawDomain: string,
  deps: RunnerDeps,
  out: (line: string) => void,
  err: (line: string) => void,
): Promise<number> {
  const domain = normalizeDomain(rawDomain)
  if (domain === null) {
    err(`Not a valid domain: ${rawDomain.slice(0, 200)}`)
    return EXIT_FAILURE
  }

  const result = await post(
    deps,
    `${origin}/api/prospects/measure`,
    headers,
    JSON.stringify({ domain }),
    err,
  )
  if (result === null) {
    return EXIT_FAILURE
  }
  if (result.status !== 200 || result.json === null) {
    describeFailure('Measure', result.status, result.json).forEach(err)
    const reason = readString(result.json, 'reason')
    if (reason !== null) {
      err(`Reason: ${reason}`)
    }
    return EXIT_FAILURE
  }

  const json = result.json as object
  const value = (key: string) => Reflect.get(json, key) ?? '—'
  out(
    `measured  ${readString(json, 'domain') ?? domain}  performance ${value('performanceScore')}/100 -> ${value('rating')}  ` +
      `fit ${value('fitScore')}  opportunity ${value('opportunityScore')}  confidence ${value('confidence')}`,
  )
  out(JSON.stringify(json))
  return EXIT_OK
}
