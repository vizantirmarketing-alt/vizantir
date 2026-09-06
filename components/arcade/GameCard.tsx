'use client'

import type { CSSProperties } from 'react'

import { GamePreview } from '@/components/arcade/GamePreview'
import { useArcade } from '@/components/arcade/ArcadeProvider'
import type { GameEntry } from '@/lib/arcade/games'

function formatArcadeScore(score: number | undefined): string {
  if (score === undefined) return '-'
  return score.toLocaleString('en-US')
}

export function GameCard({ game }: { game: GameEntry }) {
  const { bestScores } = useArcade()

  return (
    <a
      href={game.href}
      className="arcade-game-card"
      style={{ '--game-accent': game.accent } as CSSProperties}
    >
      <div className="arcade-game-card-top">
        <span className="arcade-game-card-index">{game.index}</span>
      </div>
      <h2 className="arcade-game-card-title">{game.title}</h2>
      <p className="arcade-game-card-tagline">{game.tagline}</p>
      <p className="arcade-game-card-best">BEST {formatArcadeScore(bestScores[game.id])}</p>
      <div className="arcade-game-card-preview">
        <GamePreview game={game.id} />
      </div>
    </a>
  )
}
