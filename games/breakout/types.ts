export type BrickKind = 'standard' | 'strong' | 'locked' | 'bonus'
export type PowerKind = 'MULTI' | 'WIDE' | 'VOID' | 'SLOW'
export type GamePhase = 'ready' | 'playing' | 'levelClear' | 'gameOver' | 'complete'

export interface Brick {
  col: number
  row: number
  kind: BrickKind
  hp: number
  color: string
  alive: boolean
}

export interface Ball {
  x: number
  y: number
  vx: number
  vy: number
  speed: number
  trail: Array<{ x: number; y: number }>
}

export interface Paddle {
  x: number
  y: number
  w: number
  h: number
  vx: number
}

export interface PowerItem {
  kind: PowerKind
  x: number
  y: number
  col: number
  row: number
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}
