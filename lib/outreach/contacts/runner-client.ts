/**
 * Runner helper commands for Outreach contact addresses:
 *
 *   pnpm prospect:runner contact-claim
 *   pnpm prospect:runner contact-ingest <batch.json>
 *
 * Reuses the prospect runner client's base URL, proxy-auth and token
 * handling; lib/prospects/runner-client.ts is unchanged. The bearer token is
 * never printed: every line passes through redactSecret().
 *
 * Exit codes match the other commands: 0 ok, 1 failure, 2 nothing queued,
 * 64 usage.
 */

import {
  EXIT_FAILURE,
  EXIT_NO_RUN_QUEUED,
  EXIT_OK,
  EXIT_USAGE,
  RUNNER_BASE_URL_ENV,
  RUNNER_TOKEN_ENV,
  isProxyAuthMode,
  redactSecret,
  resolveBaseUrl,
  resolveProxyBaseUrl,
  resolveToken,
  type RunnerDeps,
} from '@/lib/prospects/runner-client'
import { leadIssues, parseContactBody } from '@/lib/outreach/contacts/schema'

export const CONTACT_COMMANDS = ['contact-claim', 'contact-ingest'] as const

export const CONTACT_CLAIM_PATH = '/api/prospects/outreach-contacts/claim'
export const CONTACT_INGEST_PATH = '/api/prospects/outreach-contacts/ingest'

export function isContactCommand(command: string | undefined): boolean {
  return CONTACT_COMMANDS.some((c) => c === command)
}

const USAGE = ['Usage:', '  pnpm prospect:runner contact-claim', '  pnpm prospect:runner contact-ingest <batch.json>'].join('\n')

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function field(value: unknown, key: string): unknown {
  return typeof value === 'object' && value !== null ? Reflect.get(value, key) : undefined
}

function failureLines(label: string, status: number, json: unknown, proxyHost: string | null): string[] {
  const error = field(json, 'error')
  const lines = [`${label} failed: HTTP ${status}${typeof error === 'string' ? `: ${error}` : ''}`]
  if (status === 503) lines.push('The server has no usable PROSPECT_INGEST_TOKEN configured.')
  if (status === 401) {
    lines.push(
      proxyHost === null
        ? 'The server rejected the token.'
        : `The network proxy did not attach credentials for ${proxyHost}. Check that this environment's proxy injects the Authorization header for that host.`,
    )
  }
  const issues = field(json, 'issues')
  if (Array.isArray(issues)) for (const issue of issues) if (typeof issue === 'string') lines.push(`  ${issue}`)
  const runState = field(json, 'runState')
  if (typeof runState === 'string') lines.push(`Run state: ${runState}`)
  return lines
}

export async function runContactCli(argv: string[], deps: RunnerDeps): Promise<number> {
  const [command, ...rest] = argv
  const usageOk = (command === 'contact-claim' && rest.length === 0) || (command === 'contact-ingest' && rest.length === 1)
  if (!usageOk) {
    deps.stderr(USAGE)
    return EXIT_USAGE
  }

  const proxyAuth = isProxyAuthMode(deps.env)
  const base = proxyAuth ? resolveProxyBaseUrl(deps.env[RUNNER_BASE_URL_ENV]) : resolveBaseUrl(deps.env[RUNNER_BASE_URL_ENV])
  if (!base.ok) {
    deps.stderr(base.error)
    return EXIT_FAILURE
  }

  // In proxy-auth mode the token is never resolved, so neither the
  // environment variable nor .env.local is read.
  const token = proxyAuth ? null : resolveToken(deps)
  const out = (line: string) => deps.stdout(redactSecret(line, token))
  const err = (line: string) => deps.stderr(redactSecret(line, token))
  if (!proxyAuth && token === null) {
    err(`${RUNNER_TOKEN_ENV} is not set in the environment or .env.local.`)
    return EXIT_FAILURE
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' }
  if (!proxyAuth && token !== null) headers.Authorization = `Bearer ${token}`
  const proxyHost = proxyAuth ? new URL(base.origin).host : null

  let body: string | undefined
  if (command === 'contact-ingest') {
    const file = rest[0] ?? ''
    try {
      body = deps.readFile(file)
    } catch {
      err(`Could not read batch file: ${file}`)
      return EXIT_FAILURE
    }
    // Validate locally with the server's own schema; the server validates again.
    const local = parseContactBody(body)
    const issues = local.ok ? leadIssues(local.batch) : (local.issues ?? [])
    if (!local.ok || issues.length > 0) {
      err(`Batch file is invalid (${local.ok ? 'Invalid lead entry' : local.error}).`)
      for (const issue of issues) err(`  ${issue}`)
      return EXIT_FAILURE
    }
  }

  const path = command === 'contact-claim' ? CONTACT_CLAIM_PATH : CONTACT_INGEST_PATH
  let status: number
  let json: unknown
  try {
    const response = await deps.fetch(`${base.origin}${path}`, { method: 'POST', headers, body })
    status = response.status
    json = parseJson(await response.text())
  } catch (error) {
    err(`Request to ${base.origin}${path} failed: ${error instanceof Error ? error.message : 'unknown error'}`)
    return EXIT_FAILURE
  }
  if (status !== 200 || json === null) {
    failureLines(command === 'contact-claim' ? 'Contact claim' : 'Contact ingest', status, json, proxyHost).forEach(err)
    return EXIT_FAILURE
  }

  if (command === 'contact-claim') {
    const run = field(json, 'run')
    if (run === null || run === undefined) {
      err('No contact address run is queued.')
      return EXIT_NO_RUN_QUEUED
    }
    out(JSON.stringify(json, null, 2))
    return EXIT_OK
  }

  out(`Run ${String(field(json, 'runId') ?? '?')}: ${String(field(json, 'runState') ?? 'unknown state')}`)
  const checked = field(json, 'checked')
  if (Array.isArray(checked)) for (const item of checked) out(`  checked   ${String(field(item, 'id'))}  ${String(field(item, 'status'))}`)
  const rejected = field(json, 'rejected')
  if (Array.isArray(rejected)) {
    for (const item of rejected) {
      const reasons = field(item, 'reasons')
      out(`  rejected  ${String(field(item, 'id'))}  ${Array.isArray(reasons) ? reasons.join(', ') : ''}`)
    }
  }
  out(JSON.stringify({ counts: field(json, 'counts') ?? null }))
  return EXIT_OK
}
