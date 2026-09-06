'use client'

import dynamic from 'next/dynamic'
import { useLayoutEffect, useRef, useState } from 'react'

import { BreakoutFailed, LoadingBreakout } from '@/components/arcade/BreakoutChrome'
import { EngineErrorBoundary } from '@/components/arcade/EngineErrorBoundary'
import { MobileControls } from '@/components/arcade/MobileControls'
import { useArcade } from '@/components/arcade/ArcadeProvider'
import { getGame, type GameId } from '@/lib/arcade/games'

const BreakoutStage = dynamic(
  () => import('@/components/arcade/BreakoutStage').then((mod) => ({ default: mod.BreakoutStage })),
  { ssr: false, loading: () => <LoadingBreakout /> },
)

function UpcomingStage({ game }: { game: Exclude<GameId, 'breakout'> }) {
  const { stageRef } = useArcade()
  const frameRef = useRef<HTMLDivElement>(null)
  const entry = getGame(game)

  useLayoutEffect(() => {
    const node = frameRef.current
    if (!node) return
    const previous = stageRef.current
    stageRef.current = node
    return () => {
      if (stageRef.current === node) stageRef.current = previous
    }
  }, [stageRef])

  return (
    <div className="arcade-stage" data-game={game}>
      <div ref={frameRef} className="arcade-stage-frame">
        <canvas className="arcade-stage-canvas" aria-label={`${entry.title} playfield`} />
        <div className="arcade-stage-placeholder">
          <p className="arcade-stage-title">{entry.title}</p>
          <p className="arcade-stage-status">COMING ONLINE</p>
        </div>
      </div>
      <MobileControls game={game} />
    </div>
  )
}

export function GameStage({ game }: { game: GameId }) {
  const [engineKey, setEngineKey] = useState(0)

  if (game !== 'breakout') {
    return <UpcomingStage game={game} />
  }

  return (
    <EngineErrorBoundary
      key={engineKey}
      fallback={
        <BreakoutFailed onRetry={() => setEngineKey((value) => value + 1)} />
      }
    >
      <BreakoutStage />
    </EngineErrorBoundary>
  )
}
