export const LOGICAL_W = 360
export const LOGICAL_H = 640

export const COLS = 10
export const VISIBLE_ROWS = 20
export const HIDDEN_ROWS = 2
export const ROWS = VISIBLE_ROWS + HIDDEN_ROWS

export const CELL = 30
export const BOARD_W = COLS * CELL
export const BOARD_H = VISIBLE_ROWS * CELL
export const BOARD_X = 20
export const BOARD_Y = 20

export const SPAWN_COL = 3
export const SPAWN_ROW = 0

export const LOCK_DELAY = 0.5
export const LOCK_RESET_MAX = 15

export const DAS = 0.17
export const ARR = 0.03

export const CLEAR_FLASH = 0.12

export const SOFT_DROP_FACTOR = 20
export const SOFT_DROP_MIN = 0.03
export const SOFT_DROP_POINTS = 1
export const HARD_DROP_POINTS = 2

export const LINES_PER_LEVEL = 10
export const B2B_QUAD_MULT = 1.5

export const MOVE_TICK_MS = 60

export const LINE_SCORES = [0, 100, 300, 500, 800] as const

const GRAVITY_BY_LEVEL: Record<number, number> = {
  1: 0.8,
  2: 0.72,
  3: 0.63,
  4: 0.55,
  5: 0.47,
  6: 0.38,
  7: 0.3,
  8: 0.22,
  9: 0.16,
  10: 0.12,
}

export function secondsPerRow(level: number): number {
  if (level >= 15) return 0.06
  if (level >= 11) return 0.09
  return GRAVITY_BY_LEVEL[Math.max(1, level)] ?? 0.8
}

export function softDropInterval(level: number): number {
  return Math.max(SOFT_DROP_MIN, secondsPerRow(level) / SOFT_DROP_FACTOR)
}

export function scoreForLines(count: number, level: number, backToBack: boolean): number {
  const base = (LINE_SCORES[count] ?? 0) * level
  if (count === 4 && backToBack) return Math.round(base * B2B_QUAD_MULT)
  return base
}

export function levelForLines(lines: number): number {
  return Math.floor(Math.max(0, lines) / LINES_PER_LEVEL) + 1
}

export function visibleRowToY(row: number): number {
  return BOARD_Y + (row - HIDDEN_ROWS) * CELL
}

export function colToX(col: number): number {
  return BOARD_X + col * CELL
}
