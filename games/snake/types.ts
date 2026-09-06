export type Direction = 'up' | 'down' | 'left' | 'right'

export type GamePhase = 'ready' | 'playing' | 'dying' | 'gameOver'

export interface Cell {
  col: number
  row: number
}

export const DIR_VEC: Record<Direction, Cell> = {
  up: { col: 0, row: -1 },
  down: { col: 0, row: 1 },
  left: { col: -1, row: 0 },
  right: { col: 1, row: 0 },
}

export function isOpposite(a: Direction, b: Direction): boolean {
  const av = DIR_VEC[a]
  const bv = DIR_VEC[b]
  return av.col + bv.col === 0 && av.row + bv.row === 0 && a !== b
}

export function cellKey(col: number, row: number): number {
  return row * 32 + col
}

export function wrapCoord(value: number, max: number): number {
  return ((value % max) + max) % max
}

export function isEdgeWrap(from: Cell, to: Cell): boolean {
  return Math.abs(from.col - to.col) > 1 || Math.abs(from.row - to.row) > 1
}
