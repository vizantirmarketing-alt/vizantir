export const FAMILY = {
  BEAM: 1,
  CUBE: 2,
  TEE: 3,
  ARCH_L: 4,
  ARCH_R: 5,
  STEP_L: 6,
  STEP_R: 7,
} as const

export type PieceFamily = (typeof FAMILY)[keyof typeof FAMILY]
export type Rotation = 0 | 1 | 2 | 3
export type Cell = readonly [number, number]
export type GamePhase = 'ready' | 'playing' | 'clearing' | 'gameOver'

export interface ActivePiece {
  family: PieceFamily
  rotation: Rotation
  col: number
  row: number
}
