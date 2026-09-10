import {
  emissionKeyFor,
  type Detector,
  type DetectorInput,
  type Finding,
} from '@/lib/intel/decisions/types'
import type { PageSnapshot, SiteSnapshot } from '@/lib/scan/types'

/**
 * Sitemap.xml and llms-full.txt disagree, or either llms file returned a
 * non-200 status.
 *
 * This is a static file consistency check. It does not speak to retrieval,
 * ranking, or whether any platform read either file.
 *
 * Two shapes, same detector (the metadata-gap pattern: one name, two defects):
 *   - count     sitemap URLs that are not in llms-full.txt (one finding)
 *   - per file  llms.txt or llms-full.txt returned a non-200
 *
 * When llms-full.txt is not 200, the missing-URL diff is not measured
 * (llmsMissingUrls is null). A non-200 finding covers that case; we do not
 * also emit a count finding.
 *
 * Score is this detector's own scale. Each missing URL is 200, multiplied
 * into one finding. A non-200 file is 900 — the whole file is unavailable,
 * which is a larger gap than one missing path.
 */

const SCORE_MISSING_URL = 200
const SCORE_NON_200 = 900

export const llmsDriftDetector: Detector = {
  name: 'llms-drift',
  needsScan: true,
  detect(input: DetectorInput): Finding[] {
    const scan = input.scan
    if (scan === undefined) {
      return []
    }

    const findings: Finding[] = []
    findings.push(
      ...missingUrlFindings(scan.site, input.periodEnd, scan.capturedOn),
    )
    findings.push(
      ...fileStatusFindings(
        scan.site,
        scan.pages,
        input.periodEnd,
        scan.capturedOn,
      ),
    )
    return findings
  },
}

function missingUrlFindings(
  site: SiteSnapshot,
  periodEnd: string,
  capturedOn: string,
): Finding[] {
  if (site.llmsMissingUrls === null || site.llmsMissingUrls <= 0) {
    return []
  }

  return [countOnlyFinding(site.llmsMissingUrls, periodEnd, capturedOn)]
}

function countOnlyFinding(
  missingCount: number,
  periodEnd: string,
  capturedOn: string,
): Finding {
  return {
    emissionKey: emissionKeyFor('llms-drift:missing', periodEnd),
    category: 'search_intelligence',
    title: `${missingCount} sitemap URLs are absent from llms-full.txt`,
    description:
      `The scan on ${capturedOn} found ${missingCount} URLs listed in sitemap.xml ` +
      `that are not listed in llms-full.txt.`,
    evidence: {
      missingCount,
      capturedOn,
    },
    recommendedAction:
      'Add the missing URLs to llms-full.txt, or remove them from the sitemap if they should not be listed.',
    confidence: 'high',
    score: missingCount * SCORE_MISSING_URL,
  }
}

function fileStatusFindings(
  site: SiteSnapshot,
  pages: readonly PageSnapshot[],
  periodEnd: string,
  capturedOn: string,
): Finding[] {
  const findings: Finding[] = []
  const origin = originOf(pages)

  const txt = classifyFileStatus(site.llmsTxtStatus)
  if (txt !== null) {
    findings.push(
      fileStatusFinding({
        file: 'llms.txt',
        status: txt,
        origin,
        periodEnd,
        capturedOn,
      }),
    )
  }

  const full = classifyFileStatus(site.llmsFullStatus)
  if (full !== null) {
    findings.push(
      fileStatusFinding({
        file: 'llms-full.txt',
        status: full,
        origin,
        periodEnd,
        capturedOn,
      }),
    )
  }

  return findings
}

function classifyFileStatus(status: number | null): number | null {
  if (status === null) {
    return null
  }
  if (status >= 200 && status < 300) {
    return null
  }
  return status
}

function fileStatusFinding(input: {
  file: 'llms.txt' | 'llms-full.txt'
  status: number
  origin: string | null
  periodEnd: string
  capturedOn: string
}): Finding {
  const path = `/${input.file}`
  const url = input.origin === null ? path : `${input.origin}${path}`
  const key = input.file === 'llms.txt' ? 'llms-txt' : 'llms-full'

  return {
    emissionKey: emissionKeyFor(`llms-drift:status:${key}`, input.periodEnd),
    category: 'search_intelligence',
    title: `${path} returned HTTP ${input.status}`,
    description:
      `The scan on ${input.capturedOn} fetched ${url} and received HTTP ${input.status}.`,
    evidence: {
      url,
      file: input.file,
      httpStatus: input.status,
      capturedOn: input.capturedOn,
    },
    relatedUrl: input.origin === null ? undefined : url,
    recommendedAction: `Restore ${path} so it returns HTTP 200.`,
    confidence: 'high',
    score: SCORE_NON_200,
  }
}

function originOf(pages: readonly PageSnapshot[]): string | null {
  const first = pages[0]
  if (first === undefined) {
    return null
  }
  try {
    return new URL(first.url).origin
  } catch {
    return null
  }
}

function pathOf(url: string): string {
  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}
