/**
 * Read-only Google Search Console diagnostic.
 * Usage: pnpm tsx scripts/gsc-check.ts
 */

import { createSign } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { config as loadEnv } from 'dotenv'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'
const TOKEN_LIFETIME_SEC = 3600
const SITES_URL = 'https://www.googleapis.com/webmasters/v3/sites'
const INSPECT_URL =
  'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect'

const INSPECTION_URLS = [
  'https://www.vizantir.com/',
  'https://www.vizantir.com/services',
  'https://www.vizantir.com/las-vegas-web-design',
] as const

const INDEX_FIELDS = [
  'verdict',
  'coverageState',
  'lastCrawlTime',
  'googleCanonical',
  'userCanonical',
  'pageFetchState',
  'crawledAs',
] as const

type ServiceAccountKey = {
  clientEmail: string
  privateKey: string
}

type SiteEntry = {
  siteUrl: string
  permissionLevel: string
}

type QueryRow = {
  query: string
  clicks: number
  impressions: number
  position: number
}

type FetchResult = {
  status: number
  bodyText: string
}

const __dirname = dirname(fileURLToPath(import.meta.url))

loadEnv({ path: join(__dirname, '..', '.env.local'), quiet: true })

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readRequiredEnv(): { encodedKey: string; siteUrl: string } {
  const encodedKey = process.env.GSC_SERVICE_ACCOUNT_KEY?.trim() ?? ''
  const siteUrl = process.env.GSC_SITE_URL?.trim() ?? ''
  const missing: string[] = []
  if (encodedKey.length === 0) missing.push('GSC_SERVICE_ACCOUNT_KEY')
  if (siteUrl.length === 0) missing.push('GSC_SITE_URL')
  if (missing.length > 0) {
    for (const name of missing) {
      console.error(`Missing ${name}`)
    }
    process.exit(1)
  }
  return { encodedKey, siteUrl }
}

function parseServiceAccountKey(encoded: string): ServiceAccountKey | null {
  try {
    const json = Buffer.from(encoded, 'base64').toString('utf8').trim()
    const parsed: unknown = JSON.parse(json)
    if (!isPlainObject(parsed)) return null
    const clientEmail = parsed.client_email
    const privateKey = parsed.private_key
    if (typeof clientEmail !== 'string' || clientEmail.length === 0) return null
    if (typeof privateKey !== 'string' || privateKey.length === 0) return null
    return { clientEmail, privateKey }
  } catch {
    return null
  }
}

function toBase64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function signServiceAccountJwt(key: ServiceAccountKey): string {
  const nowSec = Math.floor(Date.now() / 1000)
  const header = toBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = toBase64Url(
    JSON.stringify({
      iss: key.clientEmail,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: nowSec,
      exp: nowSec + TOKEN_LIFETIME_SEC,
    }),
  )
  const unsigned = `${header}.${claims}`
  const signer = createSign('RSA-SHA256')
  signer.update(unsigned)
  signer.end()
  const signature = signer.sign(key.privateKey, 'base64url')
  return `${unsigned}.${signature}`
}

function errorMessage(bodyText: string): string {
  const trimmed = bodyText.trim()
  if (trimmed.length === 0) return '(empty response body)'
  try {
    const parsed: unknown = JSON.parse(trimmed)
    if (isPlainObject(parsed)) {
      if (
        typeof parsed.error_description === 'string' &&
        parsed.error_description.length > 0
      ) {
        return parsed.error_description
      }
      if (
        isPlainObject(parsed.error) &&
        typeof parsed.error.message === 'string' &&
        parsed.error.message.length > 0
      ) {
        return parsed.error.message
      }
      if (typeof parsed.error === 'string' && parsed.error.length > 0) {
        return parsed.error
      }
    }
  } catch {
    // Response was not JSON.
  }
  return trimmed.slice(0, 500)
}

function printHttpError(step: string, status: number, bodyText: string): void {
  const statusLabel = status === 0 ? 'network error' : `HTTP ${status}`
  console.log(`${step}: ${statusLabel}`)
  console.log(errorMessage(bodyText))
}

async function googleFetch(url: string, init: RequestInit): Promise<FetchResult> {
  try {
    const response = await fetch(url, init)
    const bodyText = await response.text()
    return { status: response.status, bodyText }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'network error'
    return { status: 0, bodyText: message }
  }
}

function bearerHeaders(accessToken: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (accessToken !== null) {
    headers.Authorization = `Bearer ${accessToken}`
  }
  return headers
}

async function exchangeJwt(assertion: string): Promise<FetchResult> {
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  })
  return googleFetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
}

function readAccessToken(bodyText: string): string | null {
  try {
    const parsed: unknown = JSON.parse(bodyText)
    if (
      !isPlainObject(parsed) ||
      typeof parsed.access_token !== 'string' ||
      parsed.access_token.length === 0
    ) {
      return null
    }
    return parsed.access_token
  } catch {
    return null
  }
}

async function stepAuth(key: ServiceAccountKey | null): Promise<string | null> {
  const step = '1. Auth'
  console.log(step)
  if (key === null) {
    console.log('GSC_SERVICE_ACCOUNT_KEY could not be decoded')
    return null
  }
  console.log(`client_email: ${key.clientEmail}`)
  let assertion: string
  try {
    assertion = signServiceAccountJwt(key)
  } catch {
    console.log('JWT signing failed')
    return null
  }
  const result = await exchangeJwt(assertion)
  if (result.status !== 200) {
    printHttpError(step, result.status, result.bodyText)
    return null
  }
  const accessToken = readAccessToken(result.bodyText)
  if (accessToken === null) {
    console.log(`${step}: HTTP 200`)
    console.log('response did not include an access token')
    return null
  }
  console.log('HTTP 200')
  return accessToken
}

function readSites(bodyText: string): SiteEntry[] | null {
  try {
    const parsed: unknown = JSON.parse(bodyText)
    if (!isPlainObject(parsed)) return null
    if (!('siteEntry' in parsed) || parsed.siteEntry === undefined) return []
    if (!Array.isArray(parsed.siteEntry)) return null
    const sites: SiteEntry[] = []
    for (const entry of parsed.siteEntry) {
      if (!isPlainObject(entry) || typeof entry.siteUrl !== 'string') return null
      const permissionLevel =
        typeof entry.permissionLevel === 'string' ? entry.permissionLevel : ''
      sites.push({ siteUrl: entry.siteUrl, permissionLevel })
    }
    return sites
  } catch {
    return null
  }
}

async function stepSites(accessToken: string | null, siteUrl: string): Promise<void> {
  const step = '2. Sites'
  console.log(step)
  const result = await googleFetch(SITES_URL, {
    method: 'GET',
    headers: bearerHeaders(accessToken),
  })
  if (result.status !== 200) {
    printHttpError(step, result.status, result.bodyText)
    return
  }
  const sites = readSites(result.bodyText)
  if (sites === null) {
    console.log(`${step}: HTTP 200`)
    console.log('response could not be parsed')
    return
  }
  if (sites.length === 0) {
    console.log('(no sites)')
  }
  for (const site of sites) {
    console.log(`${site.siteUrl}  ${site.permissionLevel}`)
  }
  const matches = sites.filter((site) => site.siteUrl === siteUrl)
  if (matches.length === 0) {
    console.log('none match GSC_SITE_URL')
    return
  }
  for (const match of matches) {
    console.log(`match: ${match.siteUrl}  ${match.permissionLevel}`)
  }
}

function readIndexStatus(bodyText: string): Record<(typeof INDEX_FIELDS)[number], string | null> | null {
  try {
    const parsed: unknown = JSON.parse(bodyText)
    if (!isPlainObject(parsed) || !isPlainObject(parsed.inspectionResult)) return null
    const index = parsed.inspectionResult.indexStatusResult
    if (!isPlainObject(index)) return null
    const result = {} as Record<(typeof INDEX_FIELDS)[number], string | null>
    for (const field of INDEX_FIELDS) {
      const value = index[field]
      result[field] = typeof value === 'string' ? value : null
    }
    return result
  } catch {
    return null
  }
}

async function stepInspection(accessToken: string | null, siteUrl: string): Promise<void> {
  const step = '3. URL inspection'
  console.log(step)
  for (const inspectionUrl of INSPECTION_URLS) {
    console.log(inspectionUrl)
    const result = await googleFetch(INSPECT_URL, {
      method: 'POST',
      headers: bearerHeaders(accessToken),
      body: JSON.stringify({ inspectionUrl, siteUrl }),
    })
    if (result.status !== 200) {
      printHttpError(step, result.status, result.bodyText)
      continue
    }
    const indexStatus = readIndexStatus(result.bodyText)
    if (indexStatus === null) {
      console.log(`${step}: HTTP 200`)
      console.log('inspectionResult.indexStatusResult could not be parsed')
      continue
    }
    for (const field of INDEX_FIELDS) {
      console.log(`  ${field}: ${indexStatus[field] ?? ''}`)
    }
  }
}

function readQueryRows(bodyText: string): QueryRow[] | null {
  try {
    const parsed: unknown = JSON.parse(bodyText)
    if (!isPlainObject(parsed)) return null
    if (!('rows' in parsed) || parsed.rows === undefined) return []
    if (!Array.isArray(parsed.rows)) return null
    const rows: QueryRow[] = []
    for (const item of parsed.rows) {
      if (!isPlainObject(item) || !Array.isArray(item.keys)) return null
      const query = item.keys[0]
      if (typeof query !== 'string') return null
      if (
        typeof item.clicks !== 'number' ||
        typeof item.impressions !== 'number' ||
        typeof item.position !== 'number' ||
        !Number.isFinite(item.clicks) ||
        !Number.isFinite(item.impressions) ||
        !Number.isFinite(item.position)
      ) {
        return null
      }
      rows.push({
        query,
        clicks: item.clicks,
        impressions: item.impressions,
        position: item.position,
      })
    }
    return rows
  } catch {
    return null
  }
}

function utcDateDaysAgo(days: number): string {
  const date = new Date()
  date.setUTCHours(0, 0, 0, 0)
  date.setUTCDate(date.getUTCDate() - days)
  return date.toISOString().slice(0, 10)
}

function printQueryTable(rows: QueryRow[]): void {
  const headers = ['query', 'clicks', 'impressions', 'position']
  const body = rows.map((row) => [
    row.query,
    String(row.clicks),
    String(row.impressions),
    row.position.toFixed(1),
  ])
  const widths = headers.map((header, index) =>
    Math.max(header.length, ...body.map((cells) => cells[index]?.length ?? 0)),
  )
  const format = (cells: string[]): string =>
    cells
      .map((cell, index) => {
        const width = widths[index] ?? 0
        return index === 0 ? cell.padEnd(width) : cell.padStart(width)
      })
      .join('  ')
  console.log(format(headers))
  for (const cells of body) {
    console.log(format(cells))
  }
}

async function stepQueries(accessToken: string | null, siteUrl: string): Promise<void> {
  const step = '4. Top queries'
  console.log(step)
  const startDate = utcDateDaysAgo(31)
  const endDate = utcDateDaysAgo(3)
  console.log(`startDate: ${startDate}`)
  console.log(`endDate: ${endDate}`)
  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`
  const result = await googleFetch(endpoint, {
    method: 'POST',
    headers: bearerHeaders(accessToken),
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit: 25,
    }),
  })
  if (result.status !== 200) {
    printHttpError(step, result.status, result.bodyText)
    return
  }
  const rows = readQueryRows(result.bodyText)
  if (rows === null) {
    console.log(`${step}: HTTP 200`)
    console.log('response could not be parsed')
    return
  }
  rows.sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks || a.query.localeCompare(b.query))
  if (rows.length === 0) {
    console.log('(no rows)')
    return
  }
  printQueryTable(rows)
}

const EVOLVE_SITE_URL = 'sc-domain:evolvedancecenter.com'

type AnalyticsRow = {
  key: string | null
  clicks: number
  impressions: number
  position: number
}

type MonthTotal = {
  month: string
  clicks: number
  impressions: number
  position: number | null
}

function utcDateMonthsAgo(months: number): string {
  const date = new Date()
  date.setUTCHours(0, 0, 0, 0)
  date.setUTCMonth(date.getUTCMonth() - months)
  return date.toISOString().slice(0, 10)
}

function last28DaysEnding3DaysAgo(): { startDate: string; endDate: string } {
  return {
    startDate: utcDateDaysAgo(30),
    endDate: utcDateDaysAgo(3),
  }
}

function searchAnalyticsEndpoint(siteUrl: string): string {
  return `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`
}

async function postSearchAnalytics(
  accessToken: string | null,
  siteUrl: string,
  body: Record<string, unknown>,
): Promise<FetchResult> {
  return googleFetch(searchAnalyticsEndpoint(siteUrl), {
    method: 'POST',
    headers: bearerHeaders(accessToken),
    body: JSON.stringify(body),
  })
}

function readAnalyticsRows(bodyText: string): AnalyticsRow[] | null {
  try {
    const parsed: unknown = JSON.parse(bodyText)
    if (!isPlainObject(parsed)) return null
    if (!('rows' in parsed) || parsed.rows === undefined) return []
    if (!Array.isArray(parsed.rows)) return null
    const rows: AnalyticsRow[] = []
    for (const item of parsed.rows) {
      if (!isPlainObject(item)) return null
      let key: string | null = null
      if (item.keys !== undefined) {
        if (!Array.isArray(item.keys)) return null
        const first = item.keys[0]
        if (first !== undefined && typeof first !== 'string') return null
        key = typeof first === 'string' ? first : null
      }
      if (
        typeof item.clicks !== 'number' ||
        typeof item.impressions !== 'number' ||
        typeof item.position !== 'number' ||
        !Number.isFinite(item.clicks) ||
        !Number.isFinite(item.impressions) ||
        !Number.isFinite(item.position)
      ) {
        return null
      }
      rows.push({
        key,
        clicks: item.clicks,
        impressions: item.impressions,
        position: item.position,
      })
    }
    return rows
  } catch {
    return null
  }
}

function formatCount(value: number): string {
  if (Number.isInteger(value)) return String(value)
  const rounded = Math.round(value)
  if (Math.abs(value - rounded) < 1e-6) return String(rounded)
  return String(value)
}

function printAlignedTable(headers: string[], body: string[][]): void {
  const widths = headers.map((header, index) =>
    Math.max(header.length, ...body.map((cells) => cells[index]?.length ?? 0)),
  )
  const format = (cells: string[]): string =>
    cells
      .map((cell, index) => {
        const width = widths[index] ?? 0
        return index === 0 ? cell.padEnd(width) : cell.padStart(width)
      })
      .join('  ')
  console.log(format(headers))
  for (const cells of body) {
    console.log(format(cells))
  }
}

function aggregateByMonth(rows: AnalyticsRow[]): MonthTotal[] | null {
  const buckets = new Map<string, { clicks: number; impressions: number; weighted: number }>()
  for (const row of rows) {
    if (row.key === null || row.key.length < 7) return null
    const month = row.key.slice(0, 7)
    const bucket = buckets.get(month) ?? { clicks: 0, impressions: 0, weighted: 0 }
    bucket.clicks += row.clicks
    bucket.impressions += row.impressions
    bucket.weighted += row.position * row.impressions
    buckets.set(month, bucket)
  }
  return [...buckets.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([month, bucket]) => ({
      month,
      clicks: bucket.clicks,
      impressions: bucket.impressions,
      position: bucket.impressions > 0 ? bucket.weighted / bucket.impressions : null,
    }))
}

function printKeyedTable(
  header: string,
  rows: AnalyticsRow[],
): void {
  if (rows.length === 0) {
    console.log('(no rows)')
    return
  }
  printAlignedTable(
    [header, 'clicks', 'impressions', 'position'],
    rows.map((row) => [
      row.key ?? '',
      formatCount(row.clicks),
      formatCount(row.impressions),
      row.position.toFixed(1),
    ]),
  )
}

async function stepEvolve(accessToken: string | null): Promise<void> {
  const step = '5. Evolve trend'
  console.log(step)
  const startDate = utcDateMonthsAgo(16)
  const endDate = utcDateDaysAgo(3)
  console.log(`siteUrl: ${EVOLVE_SITE_URL}`)
  console.log(`startDate: ${startDate}`)
  console.log(`endDate: ${endDate}`)
  const daily = await postSearchAnalytics(accessToken, EVOLVE_SITE_URL, {
    startDate,
    endDate,
    dimensions: ['date'],
    rowLimit: 25000,
  })
  if (daily.status !== 200) {
    printHttpError(step, daily.status, daily.bodyText)
  } else {
    const rows = readAnalyticsRows(daily.bodyText)
    const months = rows === null ? null : aggregateByMonth(rows)
    if (rows === null || months === null) {
      console.log(`${step}: HTTP 200`)
      console.log('response could not be parsed')
    } else if (months.length === 0) {
      console.log('(no rows)')
    } else {
      printAlignedTable(
        ['month', 'clicks', 'impressions', 'position'],
        months.map((month) => [
          month.month,
          formatCount(month.clicks),
          formatCount(month.impressions),
          month.position === null ? '' : month.position.toFixed(1),
        ]),
      )
    }
  }

  console.log('')
  const recent = last28DaysEnding3DaysAgo()
  console.log(`startDate: ${recent.startDate}`)
  console.log(`endDate: ${recent.endDate}`)
  const queries = await postSearchAnalytics(accessToken, EVOLVE_SITE_URL, {
    startDate: recent.startDate,
    endDate: recent.endDate,
    dimensions: ['query'],
    rowLimit: 15,
  })
  if (queries.status !== 200) {
    printHttpError(step, queries.status, queries.bodyText)
    return
  }
  const rows = readAnalyticsRows(queries.bodyText)
  if (rows === null || rows.some((row) => row.key === null)) {
    console.log(`${step}: HTTP 200`)
    console.log('response could not be parsed')
    return
  }
  rows.sort(
    (a, b) => b.clicks - a.clicks || b.impressions - a.impressions || (a.key ?? '').localeCompare(b.key ?? ''),
  )
  printKeyedTable('query', rows)
}

async function stepVizantirTotals(accessToken: string | null, siteUrl: string): Promise<void> {
  const step = '6. Vizantir totals'
  console.log(step)
  const window = last28DaysEnding3DaysAgo()
  console.log(`startDate: ${window.startDate}`)
  console.log(`endDate: ${window.endDate}`)
  const totals = await postSearchAnalytics(accessToken, siteUrl, {
    startDate: window.startDate,
    endDate: window.endDate,
  })
  if (totals.status !== 200) {
    printHttpError(step, totals.status, totals.bodyText)
  } else {
    const rows = readAnalyticsRows(totals.bodyText)
    if (rows === null) {
      console.log(`${step}: HTTP 200`)
      console.log('response could not be parsed')
    } else if (rows.length === 0) {
      console.log('(no rows)')
    } else {
      const row = rows[0]
      if (row !== undefined) {
        console.log(`clicks: ${formatCount(row.clicks)}`)
        console.log(`impressions: ${formatCount(row.impressions)}`)
        console.log(`position: ${row.position.toFixed(1)}`)
      }
    }
  }

  console.log('')
  const pages = await postSearchAnalytics(accessToken, siteUrl, {
    startDate: window.startDate,
    endDate: window.endDate,
    dimensions: ['page'],
    rowLimit: 15,
  })
  if (pages.status !== 200) {
    printHttpError(step, pages.status, pages.bodyText)
    return
  }
  const rows = readAnalyticsRows(pages.bodyText)
  if (rows === null || rows.some((row) => row.key === null)) {
    console.log(`${step}: HTTP 200`)
    console.log('response could not be parsed')
    return
  }
  rows.sort(
    (a, b) =>
      b.impressions - a.impressions || b.clicks - a.clicks || (a.key ?? '').localeCompare(b.key ?? ''),
  )
  printKeyedTable('page', rows)
}

async function main(): Promise<void> {
  const { encodedKey, siteUrl } = readRequiredEnv()
  const key = parseServiceAccountKey(encodedKey)
  const accessToken = await stepAuth(key)
  console.log('')
  await stepSites(accessToken, siteUrl)
  console.log('')
  await stepInspection(accessToken, siteUrl)
  console.log('')
  await stepQueries(accessToken, siteUrl)
  console.log('')
  await stepEvolve(accessToken)
  console.log('')
  await stepVizantirTotals(accessToken, siteUrl)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'unknown error'
  console.error(message)
  process.exit(1)
})
