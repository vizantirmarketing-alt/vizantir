export interface ArcadeGame {
  start(): void
  pause(): void
  resume(): void
  restart(): void
  destroy(): void
  resize(width: number, height: number, dpr: number): void
  launch(): void
  lockPointer?(): void
  releasePointer?(): void
}

export interface StackActions {
  moveLeft(): void
  moveRight(): void
  rotate(): void
  softDrop(down: boolean): void
  hardDrop(): void
  hold(): void
}

export interface StackGame extends ArcadeGame, StackActions {}

export interface SnakeActions {
  turnUp(): void
  turnDown(): void
  turnLeft(): void
  turnRight(): void
}

export interface SnakeGame extends ArcadeGame, SnakeActions {}

export interface GameOverExtra {
  complete?: boolean
  won?: boolean
  player?: number
  cpu?: number
}

export interface ArcadeGameHost {
  canvas: HTMLCanvasElement
  soundEnabled: () => boolean
  reducedMotion: () => boolean
  onScore: (score: number) => void
  onGameOver: (finalScore: number, extra?: GameOverExtra) => void
  onLives: (lives: number) => void
  onLevel: (level: number) => void
  onLevelClear: (payload: { level: number; score: number; isFinal: boolean }) => void
  onReady: () => void
  onPowerUp?: (name: string) => void
  onPauseRequest?: () => void
  onPointerLockChange?: (locked: boolean) => void
  onLines?: (lines: number) => void
  onNext?: (familyId: number) => void
  onHold?: (familyId: number | null) => void
  onLength?: (len: number) => void
  onOpponentScore?: (score: number) => void
  onMatchPoint?: (side: 'player' | 'cpu' | 'both' | null) => void
  onRally?: (hits: number) => void
  difficulty?: () => 'easy' | 'normal' | 'hard'
}

export type GameFactory = (host: ArcadeGameHost) => ArcadeGame
