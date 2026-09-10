import type { CrawlerPlatformPresence } from '@/lib/intel/crawlers'
import {
  emissionKeyFor,
  type Detector,
  type DetectorInput,
  type Finding,
} from '@/lib/intel/decisions/types'

/**
 * A named platform that previously requested robots.txt has recorded zero
 * crawler visits in the current 30-day window.
 *
 * Architecture §18.3: this is a change in crawler request behaviour and
 * nothing more. It does not speak to retrieval, ranking, or whether that
 * platform ever used the site's content. Copy is limited to "crawler
 * activity", "crawler visits", and "crawler accessibility".
 *
 * `other` is excluded by design — it is a leftover bucket, not a platform.
 * Score is this detector's own scale: one quiet platform is 700.
 */

const SCORE_ABSENT_PLATFORM = 700

export const crawlerAbsenceDetector: Detector = {
  name: 'crawler-absence',
  needsCrawler: true,
  detect(input: DetectorInput): Finding[] {
    const crawler = input.crawler
    if (crawler === undefined) {
      return []
    }

    const findings: Finding[] = []
    for (const platform of crawler.platforms) {
      if (platform.id === 'other') {
        continue
      }
      if (!platform.hasPriorHistory) {
        continue
      }
      if (platform.hitsInWindow !== 0) {
        continue
      }
      findings.push(
        absenceFinding(platform, input.periodEnd, crawler.windowStart, crawler.windowEnd),
      )
    }
    return findings
  },
}

function absenceFinding(
  platform: CrawlerPlatformPresence,
  periodEnd: string,
  windowStart: string,
  windowEnd: string,
): Finding {
  const lastSeen =
    platform.lastSeenBeforeWindowAt === null
      ? ''
      : ` Last crawler visit before this window: ${platform.lastSeenBeforeWindowAt}.`

  return {
    emissionKey: emissionKeyFor(`crawler-absence:${platform.id}`, periodEnd),
    category: 'search_intelligence',
    title: `${platform.label} recorded no crawler visits to robots.txt in the last 30 days`,
    description:
      `${platform.label} requested robots.txt before ${windowStart} and recorded ` +
      `zero crawler visits between ${windowStart} and ${windowEnd}.${lastSeen}`,
    evidence: {
      platform: platform.id,
      label: platform.label,
      hitsInWindow: platform.hitsInWindow,
      hasPriorHistory: platform.hasPriorHistory,
      windowStart,
      windowEnd,
      lastSeenBeforeWindowAt: platform.lastSeenBeforeWindowAt,
    },
    recommendedAction: `Review crawler accessibility for ${platform.label}.`,
    confidence: 'high',
    score: SCORE_ABSENT_PLATFORM,
  }
}
