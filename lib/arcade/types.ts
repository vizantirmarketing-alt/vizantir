export interface ArcadeGame {
  start(): void
  pause(): void
  resume(): void
  restart(): void
  destroy(): void
  resize(width: number, height: number, dpr: number): void
  launch(): void
}

export interface ArcadeGameHost {
  canvas: HTMLCanvasElement
  soundEnabled: () => boolean
  reducedMotion: () => boolean
  onScore: (score: number) => void
  onGameOver: (finalScore: number) => void
  onLives: (lives: number) => void
  onLevel: (level: number) => void
  onLevelClear: (payload: { level: number; score: number; isFinal: boolean }) => void
  onReady: () => void
  onPowerUp?: (name: string) => void
  onPauseRequest?: () => void
}

export type GameFactory = (host: ArcadeGameHost) => ArcadeGame
