import { trackEvent } from '@/lib/analytics'
import type { GameId } from '@/lib/arcade/games'

export function trackArcadeOpen(): void {
  trackEvent('arcade_open')
}

export function trackGameChange(gameId: GameId): void {
  trackEvent('arcade_game_change', { game_id: gameId })
}

export function trackFullscreenEnter(gameId: GameId | null): void {
  trackEvent('arcade_fullscreen_enter', { game_id: gameId })
}
