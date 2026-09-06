import { isGameId, type GameId } from '@/lib/arcade/games'

export const ARCADE_STORAGE_KEY = 'vizantir.arcade.v1'

export type PongDifficulty = 'easy' | 'normal' | 'hard'

export interface ArcadeState {
  version: 1
  sound: boolean
  bestScores: Partial<Record<GameId, number>>
  lastGame: GameId | null
  breakoutLevelsCleared: number
  pongDifficulty: PongDifficulty
}

const DEFAULT_STATE: ArcadeState = {
  version: 1,
  sound: true,
  bestScores: {},
  lastGame: null,
  breakoutLevelsCleared: 0,
  pongDifficulty: 'normal',
}

function isPongDifficulty(value: unknown): value is PongDifficulty {
  return value === 'easy' || value === 'normal' || value === 'hard'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseBestScores(value: unknown): Partial<Record<GameId, number>> {
  if (!isRecord(value)) return {}

  const scores: Partial<Record<GameId, number>> = {}
  for (const [key, raw] of Object.entries(value)) {
    if (isGameId(key) && typeof raw === 'number' && Number.isFinite(raw)) {
      scores[key] = raw
    }
  }
  return scores
}

function normalizeState(value: unknown): ArcadeState {
  if (!isRecord(value) || value.version !== 1) {
    return { ...DEFAULT_STATE, bestScores: {} }
  }

  return {
    version: 1,
    sound: typeof value.sound === 'boolean' ? value.sound : DEFAULT_STATE.sound,
    bestScores: parseBestScores(value.bestScores),
    lastGame: isGameId(value.lastGame) ? value.lastGame : null,
    breakoutLevelsCleared:
      typeof value.breakoutLevelsCleared === 'number' && Number.isFinite(value.breakoutLevelsCleared)
        ? value.breakoutLevelsCleared
        : 0,
    pongDifficulty: isPongDifficulty(value.pongDifficulty) ? value.pongDifficulty : 'normal',
  }
}

function persist(state: ArcadeState): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(ARCADE_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Private mode and quota errors are ignored.
  }
}

export function readArcadeState(): ArcadeState {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_STATE, bestScores: {} }
  }

  try {
    const raw = window.localStorage.getItem(ARCADE_STORAGE_KEY)
    if (!raw) {
      return { ...DEFAULT_STATE, bestScores: {} }
    }
    return normalizeState(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_STATE, bestScores: {} }
  }
}

export function writeArcadeState(patch: Partial<Omit<ArcadeState, 'version'>>): ArcadeState {
  const next: ArcadeState = {
    ...readArcadeState(),
    ...patch,
    version: 1,
  }
  persist(next)
  return next
}

export function setBestScore(gameId: GameId, score: number): boolean {
  const state = readArcadeState()
  const current = state.bestScores[gameId]
  if (current !== undefined && score <= current) {
    return false
  }

  writeArcadeState({
    bestScores: {
      ...state.bestScores,
      [gameId]: score,
    },
  })
  return true
}
