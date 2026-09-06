import type { GameId } from '@/lib/arcade/games'

export function MobileControls({ game }: { game: GameId }) {
  if (game !== 'stack') return null

  return <div className="arcade-mobile-controls" aria-hidden="true" />
}
