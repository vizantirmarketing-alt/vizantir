export type GamePhase = 'ready' | 'playing' | 'waveClear' | 'gameOver'
export type AlienTier = 1 | 2 | 3

export interface Ship {
  x: number
  px: number
  y: number
}

export interface Alien {
  col: number
  row: number
  tier: AlienTier
  points: number
  color: string
  alive: boolean
}

export interface Projectile {
  x: number
  y: number
  px: number
  py: number
  vy: number
  trail: Array<{ x: number; y: number }>
}

export interface ShieldCell {
  col: number
  row: number
  x: number
  y: number
  alive: boolean
}

export interface Shield {
  cx: number
  cells: ShieldCell[]
}

export interface Craft {
  x: number
  px: number
  y: number
  vx: number
  points: number
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

export interface ScorePopup {
  x: number
  y: number
  text: string
  life: number
  maxLife: number
}
