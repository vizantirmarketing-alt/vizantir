import { EXPECTED_SCHEMA_TYPES } from '@/lib/schema/expected-types'
import {
  emissionKeyFor,
  slugifyKey,
  type Detector,
  type DetectorInput,
  type Finding,
} from '@/lib/intel/decisions/types'
import { wasFetched, type PageSnapshot } from '@/lib/scan/types'

/**
 * A mapped route whose captured schema_types is missing one or more types
 * the route is built to emit.
 *
 * Architecture §18.2: the map is what makes this worth running. An unmapped
 * route is not checked. An empty schema_types array is the absent case —
 * every expected type is missing — not a separate branch.
 *
 * lib/scan/parse.ts currently skips malformed JSON-LD rather than recording
 * that a block existed and failed to parse. "Unparseable" and "absent"
 * therefore look the same in the snapshot: a type that is not in
 * schema_types. Findings describe the gap, not the cause.
 *
 * Score scales with how many mapped types are missing. Each detector's
 * score is its own scale — not comparable to thin-page or metadata-gap.
 */

const SCORE_PER_MISSING_TYPE = 100

function isIndexable(page: PageSnapshot): boolean {
  if (!wasFetched(page) || page.robotsNoindex) {
    return false
  }
  return page.httpStatus !== null && page.httpStatus >= 200 && page.httpStatus < 300
}

export const schemaDriftDetector: Detector = {
  name: 'schema-drift',
  needsScan: true,
  detect(input: DetectorInput): Finding[] {
    const scan = input.scan
    if (scan === undefined) {
      return []
    }

    const findings: Finding[] = []

    for (const page of scan.pages) {
      if (!isIndexable(page)) {
        continue
      }

      const pathname = pathForMatch(page.url)
      const expectation = matchExpectation(pathname)
      if (expectation === null) {
        continue
      }

      const actual = new Set(page.schemaTypes)
      const missing = expectation.expectedTypes.filter((type) => !actual.has(type))
      if (missing.length === 0) {
        continue
      }

      const path = pathOf(page.url)

      findings.push({
        emissionKey: emissionKeyFor(
          `schema-drift:${slugifyKey(path)}`,
          input.periodEnd,
        ),
        category: 'search_intelligence',
        title: `${path} is missing ${formatList(missing)} in captured schema types`,
        description:
          `The scan on ${scan.capturedOn} captured schema types on ${page.url} that do ` +
          `not include ${formatList(missing)}. This route is mapped to emit ` +
          `${formatList(expectation.expectedTypes)}. A type can be missing from the ` +
          `capture when the block was not rendered, or when a block was present but ` +
          `not recorded as a parseable type.`,
        evidence: {
          url: page.url,
          pattern: expectation.pattern,
          missing,
          expectedTypes: [...expectation.expectedTypes],
          schemaTypes: page.schemaTypes,
          capturedOn: scan.capturedOn,
        },
        relatedUrl: page.url,
        recommendedAction: `Review the JSON-LD on this page for ${formatList(
          missing,
        )}. This does not establish why those types are missing, or that restoring them would change rankings.`,
        confidence: 'high',
        score: missing.length * SCORE_PER_MISSING_TYPE,
      })
    }

    return findings
  },
}

function matchExpectation(
  pathname: string,
): (typeof EXPECTED_SCHEMA_TYPES)[number] | null {
  for (const entry of EXPECTED_SCHEMA_TYPES) {
    if (matchesPattern(pathname, entry.pattern)) {
      return entry
    }
  }
  return null
}

/**
 * Exact string, or a trailing `/*` that matches exactly one extra segment.
 * Same convention as lib/schema/expected-types.ts.
 */
function matchesPattern(pathname: string, pattern: string): boolean {
  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -2)
    if (!pathname.startsWith(`${prefix}/`)) {
      return false
    }
    const rest = pathname.slice(prefix.length + 1)
    return rest.length > 0 && !rest.includes('/')
  }
  return pathname === pattern
}

function pathOf(url: string): string {
  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}

/** Pathname with trailing slashes stripped — the form the route map uses. */
function pathForMatch(url: string): string {
  const path = pathOf(url)
  if (path === '/') {
    return '/'
  }
  return path.replace(/\/+$/, '')
}

function formatList(values: readonly string[]): string {
  if (values.length <= 1) {
    return values[0] ?? ''
  }
  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`
  }
  return `${values.slice(0, -1).join(', ')}, and ${values[values.length - 1]}`
}
