'use client'

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import Link from 'next/link'

import { GameMount, useGameActions, type GameMountCore } from '@/components/arcade/GameMount'
import { MobileControls } from '@/components/arcade/MobileControls'
import { StageHud } from '@/components/arcade/ScoreDisplay'
import { LoadingSnake, SnakeFailed } from '@/components/arcade/SnakeChrome'
import { useArcade } from '@/components/arcade/ArcadeProvider'
import { useSwipe, type SwipeDirection } from '@/components/arcade/useSwipe'
import type { ArcadeGameHost } from '@/lib/arcade/types'

type OverlayPhase = 'boot' | 'ready' | 'playing' | 'gameOver'

function formatScore(score: number): string {
  return score.toLocaleString('en-US')
}

function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(pointer: coarse)').matches ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia('(max-width: 767px)').matches
  )
}

function SnakeSwipe({
  canvasRef,
  onEngage,
}: {
  canvasRef: RefObject<HTMLCanvasElement | null>
  onEngage: () => void
}) {
  const actions = useGameActions()

  const applySwipe = useCallback(
    (direction: SwipeDirection) => {
      onEngage()
      if (direction === 'up') actions?.turnUp()
      else if (direction === 'down') actions?.turnDown()
      else if (direction === 'left') actions?.turnLeft()
      else actions?.turnRight()
    },
    [actions, onEngage],
  )

  const applyTap = useCallback(() => {
    onEngage()
    actions?.launch()
  }, [actions, onEngage])

  useSwipe(canvasRef, {
    onSwipe: applySwipe,
    onTap: applyTap,
  })

  return null
}

export function SnakeStage() {
  const { recordScore, setHud, bestScores, paused } = useArcade()
  const recordRef = useRef(recordScore)
  const setHudRef = useRef(setHud)
  const pausedRef = useRef(paused)

  useEffect(() => {
    recordRef.current = recordScore
    setHudRef.current = setHud
    pausedRef.current = paused
  }, [paused, recordScore, setHud])

  const [phase, setPhase] = useState<OverlayPhase>('boot')
  const [finalScore, setFinalScore] = useState(0)
  const [finalLength, setFinalLength] = useState(4)
  const [isNewBest, setIsNewBest] = useState(false)
  const [touchStart, setTouchStart] = useState(false)
  const phaseRef = useRef<OverlayPhase>('boot')
  const lengthRef = useRef(4)

  useEffect(() => {
    const id = window.setTimeout(() => setTouchStart(isTouchDevice()), 0)
    return () => window.clearTimeout(id)
  }, [])

  const buildHost = useCallback((core: GameMountCore): ArcadeGameHost => {
    const nextHud = { score: 0, length: 4 }
    return {
      canvas: core.canvas,
      soundEnabled: core.soundEnabled,
      reducedMotion: core.reducedMotion,
      onScore: (value) => {
        nextHud.score = value
        setHudRef.current({ ...nextHud })
      },
      onLives: () => undefined,
      onLevel: () => undefined,
      onLevelClear: () => undefined,
      onLength: (value) => {
        nextHud.length = value
        lengthRef.current = value
        setHudRef.current({ ...nextHud })
      },
      onReady: () => {
        phaseRef.current = 'ready'
        setPhase('ready')
      },
      onGameOver: (value) => {
        const best = recordRef.current('snake', value)
        setFinalScore(value)
        setFinalLength(lengthRef.current)
        setIsNewBest(best)
        phaseRef.current = 'gameOver'
        setPhase('gameOver')
      },
      onPauseRequest: core.requestPause,
    }
  }, [])

  const resetOverlay = useCallback(() => {
    phaseRef.current = 'ready'
    setPhase('ready')
    setIsNewBest(false)
  }, [])

  const markPlaying = useCallback(() => {
    if (phaseRef.current === 'ready' && !pausedRef.current) {
      phaseRef.current = 'playing'
      setPhase('playing')
    }
  }, [])

  const onBooted = useCallback(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        event.code === 'ArrowUp' ||
        event.code === 'ArrowDown' ||
        event.code === 'ArrowLeft' ||
        event.code === 'ArrowRight' ||
        event.code === 'KeyW' ||
        event.code === 'KeyA' ||
        event.code === 'KeyS' ||
        event.code === 'KeyD'
      ) {
        markPlaying()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
    }
  }, [markPlaying])

  const terminal = phase === 'gameOver'
  const best = bestScores.snake

  return (
    <GameMount
      gameId="snake"
      stageLabel="Snake stage"
      load={() => import('@/games/snake/SnakeGame').then((mod) => mod.createSnakeGame)}
      buildHost={buildHost}
      onRestart={resetOverlay}
      onBooted={onBooted}
      terminal={terminal}
      failedFallback={(retry) => <SnakeFailed onRetry={retry} />}
      loadingFallback={<LoadingSnake />}
    >
      {(mount) => {
        const showReady = phase === 'ready' && !paused && !mount.countdown && !mount.loading

        return (
          <>
            <StageHud />
            <div ref={mount.frameRef} className="arcade-stage-frame arcade-snake-board">
              <canvas ref={mount.canvasRef} className="arcade-stage-canvas" aria-label="Snake playfield" />
              {mount.loading ? <LoadingSnake /> : null}
              {showReady ? (
                <div className="arcade-overlay arcade-overlay-pass">
                  <p className="arcade-overlay-title">
                    {touchStart ? 'TAP OR SWIPE TO START' : 'PRESS ANY ARROW TO START'}
                  </p>
                  <p className="arcade-overlay-copy">
                    {touchStart
                      ? 'Swipe or use the controls below. Walls wrap.'
                      : 'Move: arrows or WASD. Walls wrap.'}
                  </p>
                </div>
              ) : null}
              {phase === 'gameOver' ? (
                <div className="arcade-overlay">
                  <p className="arcade-overlay-title">SIGNAL LOST</p>
                  {isNewBest ? <p className="arcade-overlay-best">NEW BEST</p> : null}
                  <p className="arcade-overlay-copy">Score {formatScore(finalScore)}</p>
                  <p className="arcade-overlay-copy">Length {finalLength}</p>
                  <p className="arcade-overlay-copy">Best {formatScore(best ?? finalScore)}</p>
                  <div className="arcade-overlay-actions">
                    <button type="button" className="arcade-overlay-btn" onClick={mount.playAgain}>
                      PLAY AGAIN
                    </button>
                    <a href="/play" className="arcade-overlay-btn">
                      ARCADE
                    </a>
                    <Link href="/" className="arcade-overlay-btn">
                      EXIT ARCADE
                    </Link>
                  </div>
                </div>
              ) : null}
              {mount.showPause ? (
                <div className="arcade-overlay">
                  <p className="arcade-overlay-title">PAUSED</p>
                  <button type="button" className="arcade-overlay-btn" onClick={mount.beginCountdown}>
                    RESUME
                  </button>
                </div>
              ) : null}
              {mount.countdown ? (
                <div className="arcade-overlay arcade-overlay-pass arcade-countdown" aria-live="assertive">
                  <p className="arcade-overlay-title">{mount.countdown}</p>
                </div>
              ) : null}
            </div>
            {!mount.loading ? <SnakeSwipe canvasRef={mount.canvasRef} onEngage={markPlaying} /> : null}
            <MobileControls game="snake" onEngage={markPlaying} />
          </>
        )
      }}
    </GameMount>
  )
}
