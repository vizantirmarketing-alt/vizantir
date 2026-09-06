import { DIR_VEC, type Cell, type Direction } from '@/games/snake/types'

export const LOGICAL_W = 360
export const DESKTOP_FIT_H = 640

export const COLS = 20
export const ROWS = 28
export const CELL = 16

export const BOARD_W = COLS * CELL
export const BOARD_H = ROWS * CELL
export const BOARD_X = 20
export const BOARD_Y = 40
export const LOGICAL_H = BOARD_Y + BOARD_H + 20

export const START_LENGTH = 4
export const START_INTERVAL = 0.16
export const INTERVAL_STEP = 0.003
export const MIN_INTERVAL = 0.07
export const FOOD_SCORE = 10
export const SPEED_BONUS_SCALE = 200

export const QUEUE_MAX = 2
export const TURN_RATE_MS = 60

export const DEATH_FLASH = 0.12
export const DEATH_FADE = 0.3
export const FOOD_PULSE = 1.2

export const MINT = '#32FF9C'
export const MAGENTA = '#FF2E88'
export const CREAM = '#E8DDC7'

export function nextInterval(current: number): number {
  return Math.max(MIN_INTERVAL, current - INTERVAL_STEP)
}

export function foodPoints(interval: number): number {
  return FOOD_SCORE + Math.floor((START_INTERVAL - interval) * SPEED_BONUS_SCALE)
}

export function colToX(col: number): number {
  return BOARD_X + col * CELL
}

export function rowToY(row: number): number {
  return BOARD_Y + row * CELL
}

export function startCells(dir: Direction): Cell[] {
  const vec = DIR_VEC[dir]
  const headCol = Math.round(9.5 + vec.col * 1.5)
  const headRow = Math.round(13.5 + vec.row * 1.5)
  const cells: Cell[] = []
  for (let i = 0; i < START_LENGTH; i += 1) {
    cells.push({
      col: headCol - vec.col * i,
      row: headRow - vec.row * i,
    })
  }
  return cells
}
