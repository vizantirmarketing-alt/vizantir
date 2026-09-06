export type GameId = 'breakout' | 'stack' | 'snake' | 'pong'

export interface GameEntry {
  id: GameId
  index: '01' | '02' | '03' | '04'
  title: string
  tagline: string
  href: string
  accent: string
}

export const GAMES: readonly GameEntry[] = [
  {
    id: 'breakout',
    index: '01',
    title: 'BREAKOUT',
    tagline: 'Clear the wall. Keep the signal alive.',
    href: '/play/breakout',
    accent: '#22F0FF',
  },
  {
    id: 'stack',
    index: '02',
    title: 'STACK',
    tagline: 'Build clean. Leave no gaps.',
    href: '/play/stack',
    accent: '#FF2E88',
  },
  {
    id: 'snake',
    index: '03',
    title: 'SNAKE',
    tagline: 'Keep moving. Keep growing.',
    href: '/play/snake',
    accent: '#32FF9C',
  },
  {
    id: 'pong',
    index: '04',
    title: 'PONG',
    tagline: 'One paddle. One opponent. No excuses.',
    href: '/play/pong',
    accent: '#FFD447',
  },
]

const GAME_IDS: readonly GameId[] = GAMES.map((game) => game.id)

export function isGameId(value: unknown): value is GameId {
  return typeof value === 'string' && (GAME_IDS as readonly string[]).includes(value)
}

export function getGame(id: GameId): GameEntry {
  const game = GAMES.find((entry) => entry.id === id)
  if (!game) {
    throw new Error(`Unknown arcade game: ${id}`)
  }
  return game
}

export function getGameFromPathname(pathname: string): GameId | null {
  const normalized = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname
  const match = GAMES.find((game) => normalized === game.href)
  return match?.id ?? null
}
