/**
 * Prospect research runner helper. Talks only to the Prospect Research claim
 * and ingest routes.
 *
 *   pnpm prospect:runner claim
 *   pnpm prospect:runner ingest <batch.json>
 *   pnpm prospect:runner measure <domain>
 *
 * Token: PROSPECT_INGEST_TOKEN from the environment, else from .env.local
 * (only that one key is read). It is never printed.
 * Base URL: PROSPECT_RUNNER_BASE_URL, default http://localhost:3000. https is
 * required for any host other than localhost.
 *
 * Proxy-auth mode: with PROSPECT_RUNNER_PROXY_AUTH=1 the token is not read
 * and no Authorization header is sent (a network proxy attaches it).
 * PROSPECT_RUNNER_BASE_URL must then be set to an https, non-local URL.
 *
 * Exit codes: 0 ok, 1 failure, 2 no run queued (claim), 64 usage.
 */

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { runRunnerCli, type RunnerFetch } from '../lib/prospects/runner-client'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const ENV_FILE = join(ROOT, '.env.local')
// Long enough for a PageSpeed measurement (up to 90s plus one quick retry).
const REQUEST_TIMEOUT_MS = 150_000

const runnerFetch: RunnerFetch = (url, init) =>
  fetch(url, {
    method: init.method,
    headers: init.headers,
    body: init.body,
    redirect: 'error',
    cache: 'no-store',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

void runRunnerCli(process.argv.slice(2), {
  fetch: runnerFetch,
  env: process.env,
  readEnvFile: () => (existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8') : null),
  readFile: (path) => readFileSync(path, 'utf8'),
  stdout: (line) => process.stdout.write(`${line}\n`),
  stderr: (line) => process.stderr.write(`${line}\n`),
}).then((code) => {
  process.exitCode = code
})
