export type GamePhase = 'ready' | 'playing' | 'holding' | 'gameOver'

export type PongSide = 'player' | 'cpu'

export type MatchPointSide = PongSide | 'both'

export interface Paddle {
  x: number
  y: number
  w: number
  h: number
  vx: number
}

export interface Ball {
  x: number
  y: number
  vx: number
  vy: number
  speed: number
  trail: Array<{ x: number; y: number }>
}

export interface Pulse {
  x: number
  y: number
  life: number
}
