/**
 * Local cases for llms-drift. Not part of the production bundle
 * (tsconfig excludes scripts/).
 *
 * Run: pnpm exec tsx scripts/verify-llms-drift.ts
 */

import { llmsDriftDetector } from '@/lib/intel/decisions/detectors/llms-drift'
import { DETECTORS } from '@/lib/intel/decisions/detectors'
import { detectorIdentity } from '@/lib/intel/decisions/registry'
import { findingKeyFor, type DetectorInput } from '@/lib/intel/decisions/types'
import {
  compareKey,
  parseLlmsFullUrls,
  sitemapUrlsMissingFromLlms,
} from '@/lib/scan/llms'
import type { PageSnapshot, ScanWindow, SiteSnapshot } from '@/lib/scan/types'

const ORIGIN = 'https://www.vizantir.com'
const PERIOD_END = '2026-09-06'
const CAPTURED_ON = '2026-09-10'

const FORBIDDEN = /\b(AI|cited|citation|mentioned|visibility|GEO)\b/i

let failed = 0

function assert(name: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`ok  ${name}`)
    return
  }
  failed += 1
  console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
}

function site(overrides: Partial<SiteSnapshot> = {}): SiteSnapshot {
  return {
    capturedOn: CAPTURED_ON,
    robotsStatus: 200,
    sitemapStatus: 200,
    sitemapUrlCount: 3,
    llmsTxtStatus: 200,
    llmsFullStatus: 200,
    llmsMissingUrls: 0,
    errorReason: null,
    ...overrides,
  }
}

function page(url: string): PageSnapshot {
  return {
    url,
    capturedOn: CAPTURED_ON,
    httpStatus: 200,
    redirectedTo: null,
    title: 'Page',
    metaDescription: 'Desc',
    h1: 'Heading',
    canonical: url,
    robotsNoindex: false,
    wordCount: 800,
    schemaTypes: [],
    internalLinks: 4,
    fetchMs: 20,
    errorReason: null,
  }
}

function scanFor(siteSnapshot: SiteSnapshot, urls: readonly string[]): ScanWindow {
  return {
    capturedOn: CAPTURED_ON,
    pages: urls.map(page),
    site: siteSnapshot,
  }
}

function inputFor(scan: ScanWindow): DetectorInput {
  return {
    periodStart: '2026-08-10',
    periodEnd: PERIOD_END,
    priorStart: '2026-07-13',
    priorEnd: '2026-08-09',
    groups: [],
    groupedRows: new Map(),
    siteDaily: [],
    queries: [],
    comparisonAvailable: true,
    scanAvailable: true,
    scan,
    crawlerAvailable: false,
  }
}

function findingText(findings: ReturnType<typeof llmsDriftDetector.detect>): string {
  return findings
    .map(
      (finding) =>
        `${finding.title}\n${finding.description}\n${finding.recommendedAction ?? ''}`,
    )
    .join('\n')
}

function main(): void {
  const home = `${ORIGIN}/`
  const about = `${ORIGIN}/about`
  const contact = `${ORIGIN}/contact`
  const blogPost = `${ORIGIN}/blog/thin-content`

  assert(
    'parse: scheme-less host path matches www origin URL',
    compareKey(about) === compareKey('vizantir.com/about') &&
      parseLlmsFullUrls('- About: vizantir.com/about\n', ORIGIN).some(
        (url) => compareKey(url) === compareKey(about),
      ),
  )

  assert(
    'parse: home host with no path is /',
    parseLlmsFullUrls('Home: vizantir.com\n', ORIGIN).some(
      (url) => compareKey(url) === compareKey(home),
    ),
  )

  assert(
    'parse: email address is not a page URL',
    parseLlmsFullUrls('Email: info@vizantir.com\n', ORIGIN).length === 0,
  )

  assert(
    'parse: markdown https link counts',
    parseLlmsFullUrls(
      '[Contact](https://www.vizantir.com/contact)\n',
      ORIGIN,
    ).some((url) => compareKey(url) === compareKey(contact)),
  )

  const allPresent = sitemapUrlsMissingFromLlms(
    [home, about, contact],
    parseLlmsFullUrls(
      ['Home: vizantir.com', 'About: vizantir.com/about', 'Contact: vizantir.com/contact'].join(
        '\n',
      ),
      ORIGIN,
    ),
  )
  assert('diff: all sitemap URLs present → empty', allPresent.length === 0)

  const oneMissing = sitemapUrlsMissingFromLlms(
    [home, about, contact, blogPost],
    parseLlmsFullUrls(
      ['Home: vizantir.com', 'About: vizantir.com/about', 'Contact: vizantir.com/contact'].join(
        '\n',
      ),
      ORIGIN,
    ),
  )
  assert(
    'diff: one sitemap URL missing',
    oneMissing.length === 1 && oneMissing[0] === blogPost,
  )

  const clean = llmsDriftDetector.detect(
    inputFor(
      scanFor(
        site({ llmsMissingUrls: 0 }),
        [home, about, contact],
      ),
    ),
  )
  assert('detector: all present → no finding', clean.length === 0)

  const cleanAgain = llmsDriftDetector.detect(
    inputFor(
      scanFor(
        site({ llmsMissingUrls: 0 }),
        [home, about, contact],
      ),
    ),
  )
  assert(
    'detector: prior clean scan → still no finding',
    cleanAgain.length === 0,
  )

  const missing = llmsDriftDetector.detect(
    inputFor(
      scanFor(
        site({ llmsMissingUrls: 2 }),
        [home, about, contact, blogPost, `${ORIGIN}/play`],
      ),
    ),
  )
  assert(
    'detector: missing count → one count-only finding',
    missing.length === 1 &&
      missing[0]?.title === '2 sitemap URLs are absent from llms-full.txt' &&
      missing[0]?.emissionKey === `llms-drift:missing:${PERIOD_END}` &&
      missing[0]?.score === 400,
  )

  const missingRepeat = llmsDriftDetector.detect(
    inputFor(
      scanFor(
        site({ llmsMissingUrls: 2 }),
        [home, about, contact, blogPost, `${ORIGIN}/play`],
      ),
    ),
  )
  assert(
    'detector: same missing snapshot → identical emission keys',
    missing.map((finding) => finding.emissionKey).join('|') ===
      missingRepeat.map((finding) => finding.emissionKey).join('|'),
  )

  const txtDown = llmsDriftDetector.detect(
    inputFor(
      scanFor(
        site({
          llmsTxtStatus: 404,
          llmsFullStatus: 200,
          llmsMissingUrls: 0,
        }),
        [home],
      ),
    ),
  )
  assert(
    'detector: llms.txt non-200 → one file finding, no missing-URL findings',
    txtDown.length === 1 &&
      txtDown[0]?.title === '/llms.txt returned HTTP 404' &&
      txtDown[0]?.emissionKey === `llms-drift:status:llms-txt:${PERIOD_END}`,
  )

  const fullDown = llmsDriftDetector.detect(
    inputFor(
      scanFor(
        site({
          llmsTxtStatus: 200,
          llmsFullStatus: 500,
          llmsMissingUrls: null,
        }),
        [home, about],
      ),
    ),
  )
  assert(
    'detector: llms-full.txt non-200 → file finding only (diff not measured)',
    fullDown.length === 1 &&
      fullDown[0]?.title === '/llms-full.txt returned HTTP 500' &&
      fullDown[0]?.emissionKey === `llms-drift:status:llms-full:${PERIOD_END}`,
  )

  const bothDown = llmsDriftDetector.detect(
    inputFor(
      scanFor(
        site({
          llmsTxtStatus: 404,
          llmsFullStatus: 404,
          llmsMissingUrls: null,
        }),
        [home],
      ),
    ),
  )
  assert(
    'detector: both files non-200 → two file findings',
    bothDown.length === 2 &&
      bothDown.some((finding) => finding.title === '/llms.txt returned HTTP 404') &&
      bothDown.some((finding) => finding.title === '/llms-full.txt returned HTTP 404'),
  )

  const noScan = llmsDriftDetector.detect({
    ...inputFor(scanFor(site(), [home])),
    scanAvailable: false,
    scan: undefined,
  })
  assert('detector: no scan → no findings', noScan.length === 0)

  const nullStatus = llmsDriftDetector.detect(
    inputFor(
      scanFor(
        site({
          llmsTxtStatus: null,
          llmsFullStatus: null,
          llmsMissingUrls: null,
        }),
        [home],
      ),
    ),
  )
  assert(
    'detector: unmeasured statuses → no finding (invariant 4)',
    nullStatus.length === 0,
  )

  const countOnly = llmsDriftDetector.detect(
    inputFor(
      scanFor(
        site({ llmsMissingUrls: 3 }),
        [home, about, contact],
      ),
    ),
  )
  assert(
    'detector: count-only finding',
    countOnly.length === 1 &&
      countOnly[0]?.title === '3 sitemap URLs are absent from llms-full.txt',
  )

  const allFindings = [...missing, ...txtDown, ...fullDown, ...bothDown, ...countOnly]
  const forbiddenHit = FORBIDDEN.exec(findingText(allFindings))
  assert(
    'copy: no forbidden words in title/description/recommendedAction',
    forbiddenHit === null,
    forbiddenHit?.[0],
  )

  const identity = detectorIdentity('llms-drift')
  assert(
    'registry: llms-drift is geo / ai-crawler-visibility',
    identity?.discipline === 'geo' && identity.family === 'ai-crawler-visibility',
  )
  assert(
    'registry: crawler-absence is geo / ai-crawler-visibility',
    detectorIdentity('crawler-absence')?.discipline === 'geo' &&
      detectorIdentity('crawler-absence')?.family === 'ai-crawler-visibility',
  )
  assert(
    'wiring: llms-drift is in DETECTORS once',
    DETECTORS.filter((detector) => detector.name === 'llms-drift').length === 1,
  )

  const keys = missing.map((finding) => findingKeyFor('llms-drift', finding.emissionKey))
  assert(
    'identity: finding_key is stable without the window date',
    keys.length === 1 && keys[0] === 'llms-drift:missing',
  )

  if (failed > 0) {
    console.log(`\n${failed} failed`)
    process.exit(1)
  }
  console.log('\nall passed')
}

main()
