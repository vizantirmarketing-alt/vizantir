import 'server-only'

import { createSupabaseServiceRole } from '@/lib/supabase/service'

const DAY_MS = 86_400_000
const LOOKBACK_DAYS = 30

export const CRAWLER_PLATFORM_ORDER = [
  'openai',
  'perplexity',
  'anthropic',
  'google',
  'microsoft',
  'other',
] as const

export type CrawlerPlatformId = (typeof CRAWLER_PLATFORM_ORDER)[number]

export const CRAWLER_PLATFORM_LABELS: Record<CrawlerPlatformId, string> = {
  openai: 'OpenAI',
  perplexity: 'Perplexity',
  anthropic: 'Anthropic',
  google: 'Google',
  microsoft: 'Microsoft',
  other: 'Other',
}

export const BOTS_BY_PLATFORM = {
  openai: ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User'],
  perplexity: ['PerplexityBot', 'Perplexity-User'],
  anthropic: ['ClaudeBot', 'Claude-User', 'anthropic-ai'],
  google: ['Googlebot', 'Google-Extended'],
  microsoft: ['Bingbot'],
  other: [
    'Applebot',
    'Applebot-Extended',
    'CCBot',
    'Bytespider',
    'Amazonbot',
    'meta-externalagent',
  ],
} as const satisfies Record<CrawlerPlatformId, readonly string[]>

export type KnownBot = (typeof BOTS_BY_PLATFORM)[CrawlerPlatformId][number]

export type CrawlerPlatformRow = {
  id: CrawlerPlatformId
  label: string
  hits30d: number
  lastSeenAt: string | null
}

export type CrawlerFirstSeen = {
  bot: KnownBot
  firstSeenAt: string
}

const KNOWN_BOTS: KnownBot[] = CRAWLER_PLATFORM_ORDER.flatMap(
  (platform) => BOTS_BY_PLATFORM[platform],
)

const BOT_TO_PLATFORM = {} as Record<KnownBot, CrawlerPlatformId>
for (const platform of CRAWLER_PLATFORM_ORDER) {
  for (const bot of BOTS_BY_PLATFORM[platform]) {
    BOT_TO_PLATFORM[bot] = platform
  }
}

const BOT_MATCH_ORDER = [...KNOWN_BOTS].sort(
  (left, right) => right.length - left.length,
)

const RECENT_HIT_LIMIT = 10_000

export function matchKnownBot(userAgent: string): KnownBot | null {
  if (userAgent.trim().length === 0) {
    return null
  }

  const lower = userAgent.toLowerCase()
  for (const bot of BOT_MATCH_ORDER) {
    if (lower.includes(bot.toLowerCase())) {
      return bot
    }
  }
  return null
}

export async function recordCrawlerHit(input: {
  bot: KnownBot
  userAgent: string
}): Promise<void> {
  try {
    const supabase = createSupabaseServiceRole()
    await supabase.from('crawler_hits').insert({
      bot: input.bot,
      user_agent: input.userAgent,
      path: '/robots.txt',
    })
  } catch {
    // Recording a hit must never fail robots.txt.
  }
}

export type FetchCrawlerPlatformOverviewResult =
  | { ok: true; rows: CrawlerPlatformRow[] }
  | { ok: false }

export async function fetchCrawlerPlatformOverview(): Promise<FetchCrawlerPlatformOverviewResult> {
  const since = lookbackStartIso()

  try {
    const hits = await fetchHitsSince(since)
    if (hits === null) {
      return { ok: false }
    }
    return { ok: true, rows: aggregatePlatformRows(hits) }
  } catch {
    console.error('Intel crawler query failed')
    return { ok: false }
  }
}

export type FetchCrawlerFirstSeenResult =
  | { ok: true; items: CrawlerFirstSeen[] }
  | { ok: false }

export async function fetchCrawlerFirstSeen(): Promise<FetchCrawlerFirstSeenResult> {
  const since = lookbackStartIso()

  try {
    const hits = await fetchHitsSince(since)
    if (hits === null) {
      return { ok: false }
    }
    const firstInWindow = firstSeenInHits(hits)
    if (firstInWindow.size === 0) {
      return { ok: true, items: [] }
    }

    const supabase = createSupabaseServiceRole()
    const bots = [...firstInWindow.keys()]
    const prior = await Promise.all(
      bots.map((bot) => botHasHitBefore(supabase, bot, since)),
    )

    const items: CrawlerFirstSeen[] = []
    for (let i = 0; i < bots.length; i += 1) {
      const bot = bots[i]
      if (bot === undefined) {
        continue
      }
      const firstSeenAt = firstInWindow.get(bot)
      if (firstSeenAt === undefined) {
        continue
      }
      if (prior[i] !== false) {
        continue
      }
      items.push({ bot, firstSeenAt })
    }
    return { ok: true, items }
  } catch {
    console.error('Intel crawler query failed')
    return { ok: false }
  }
}

function lookbackStartIso(): string {
  return new Date(Date.now() - LOOKBACK_DAYS * DAY_MS).toISOString()
}

type ServiceClient = ReturnType<typeof createSupabaseServiceRole>

type CrawlerHitRow = {
  bot: KnownBot
  occurredAt: string
}

async function fetchHitsSince(since: string): Promise<CrawlerHitRow[] | null> {
  const supabase = createSupabaseServiceRole()
  const { data, error } = await supabase
    .from('crawler_hits')
    .select('bot, occurred_at')
    .gte('occurred_at', since)
    .order('occurred_at', { ascending: false })
    .limit(RECENT_HIT_LIMIT)

  if (error || !Array.isArray(data)) {
    console.error('Intel crawler query failed')
    return null
  }

  const hits: CrawlerHitRow[] = []
  for (const row of data) {
    if (typeof row !== 'object' || row === null) {
      continue
    }
    const bot = parseKnownBot(readField(row, 'bot'))
    const occurredAt = asIsoTimestamp(readField(row, 'occurred_at'))
    if (bot === null || occurredAt === null) {
      continue
    }
    hits.push({ bot, occurredAt })
  }
  return hits
}

function aggregatePlatformRows(
  hits: readonly CrawlerHitRow[],
): CrawlerPlatformRow[] {
  const counts: Record<CrawlerPlatformId, number> = {
    openai: 0,
    perplexity: 0,
    anthropic: 0,
    google: 0,
    microsoft: 0,
    other: 0,
  }
  const lastSeen: Record<CrawlerPlatformId, string | null> = {
    openai: null,
    perplexity: null,
    anthropic: null,
    google: null,
    microsoft: null,
    other: null,
  }

  for (const hit of hits) {
    const platform = BOT_TO_PLATFORM[hit.bot]
    counts[platform] += 1
    const current = lastSeen[platform]
    if (current === null || hit.occurredAt > current) {
      lastSeen[platform] = hit.occurredAt
    }
  }

  return CRAWLER_PLATFORM_ORDER.map((id) => ({
    id,
    label: CRAWLER_PLATFORM_LABELS[id],
    hits30d: counts[id],
    lastSeenAt: counts[id] > 0 ? lastSeen[id] : null,
  }))
}

function firstSeenInHits(hits: readonly CrawlerHitRow[]): Map<KnownBot, string> {
  const first = new Map<KnownBot, string>()
  for (const hit of hits) {
    const current = first.get(hit.bot)
    if (current === undefined || hit.occurredAt < current) {
      first.set(hit.bot, hit.occurredAt)
    }
  }
  return first
}

async function botHasHitBefore(
  supabase: ServiceClient,
  bot: KnownBot,
  before: string,
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('crawler_hits')
      .select('id')
      .eq('bot', bot)
      .lt('occurred_at', before)
      .limit(1)
      .maybeSingle()

    if (error) {
      return true
    }
    return data !== null
  } catch {
    return true
  }
}

function parseKnownBot(value: unknown): KnownBot | null {
  if (typeof value !== 'string') {
    return null
  }
  for (const bot of KNOWN_BOTS) {
    if (bot === value) {
      return bot
    }
  }
  return null
}

function readField(value: object, key: string): unknown {
  return Reflect.get(value, key)
}

function asIsoTimestamp(value: unknown): string | null {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    return null
  }
  return value
}
