'use client'

import type { CSSProperties } from 'react'

import { useArcade } from '@/components/arcade/ArcadeProvider'
import { GAMES } from '@/lib/arcade/games'

export function GameSelector() {
  const { currentGame } = useArcade()

  return (
    <nav className="arcade-game-tabs" aria-label="Arcade games">
      {GAMES.map((game) => {
        const active = currentGame === game.id
        return (
          <a
            key={game.id}
            href={game.href}
            className="arcade-game-tab"
            aria-current={active ? 'page' : undefined}
            style={{ '--tab-accent': game.accent } as CSSProperties}
          >
            {game.title}
          </a>
        )
      })}
    </nav>
  )
}
