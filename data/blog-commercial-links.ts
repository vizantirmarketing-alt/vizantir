const SERVICE_LINKS = {
  '/services/website-care': 'Website Care',
  '/services/web-development': 'Web Development',
  '/services/web-design': 'Web Design',
  '/services/website-strategy': 'Website Strategy',
  '/services': 'Strategy-led websites for established businesses',
} as const

type ServiceLinkHref = keyof typeof SERVICE_LINKS

export type ArticleCtaTarget = {
  href: ServiceLinkHref
  label: string
}

/**
 * Category and tag phrases that point a post at one service subpage.
 * First matching group wins. Verticals and maintenance are checked on tags
 * before the category so a Strategy or Cost label does not hide a more
 * specific subject. Strategy itself is not a category match: that Studio
 * value mixes design, cost, and care posts, and the tags decide.
 */
const TAG_GROUPS: { href: ServiceLinkHref; terms: readonly string[] }[] = [
  { href: '/services/web-design', terms: ['hospitality', 'real estate', 'law'] },
  { href: '/services/website-care', terms: ['maintenance'] },
]

const CATEGORY_LINKS: Record<string, ServiceLinkHref> = {
  Security: '/services/website-care',
  Performance: '/services/website-care',
  Cost: '/services/web-development',
  SEO: '/services/website-strategy',
}

const REMAINING_TAG_GROUPS: { href: ServiceLinkHref; terms: readonly string[] }[] = [
  { href: '/services/website-care', terms: ['security', 'performance', 'wordpress'] },
  { href: '/services/web-development', terms: ['cost', 'pricing'] },
  { href: '/services/web-design', terms: ['design'] },
  { href: '/services/website-strategy', terms: ['strategy', 'seo'] },
]

function signalMatches(signal: string, term: string): boolean {
  const haystack = signal.toLowerCase().replace(/[-_]/g, ' ')
  const needle = term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(?:^|\\s)${needle}(?:\\s|$)`).test(haystack)
}

function matchGroups(
  signals: string[],
  groups: { href: ServiceLinkHref; terms: readonly string[] }[],
): ServiceLinkHref | undefined {
  for (const group of groups) {
    const matched = signals.some((signal) =>
      group.terms.some((term) => signalMatches(signal, term)),
    )
    if (matched) return group.href
  }
  return undefined
}

function target(href: ServiceLinkHref): ArticleCtaTarget {
  return { href, label: SERVICE_LINKS[href] }
}

export function resolveArticleCta(category?: string, tags?: string[]): ArticleCtaTarget {
  const tagList = (tags ?? []).filter((tag) => tag.trim() !== '')

  const fromSpecificTag = matchGroups(tagList, TAG_GROUPS)
  if (fromSpecificTag) return target(fromSpecificTag)

  if (category && category in CATEGORY_LINKS) {
    return target(CATEGORY_LINKS[category])
  }

  const signals = category ? [...tagList, category] : tagList
  const fromSignal = matchGroups(signals, REMAINING_TAG_GROUPS)
  if (fromSignal) return target(fromSignal)

  return target('/services')
}
