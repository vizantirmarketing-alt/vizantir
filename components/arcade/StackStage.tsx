'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'

import { GameMount, type GameMountCore } from '@/components/arcade/GameMount'
import { MobileControls } from '@/components/arcade/MobileControls'
import { PiecePreview } from '@/components/arcade/PiecePreview'
import { StageHud } from '@/components/arcade/ScoreDisplay'
import { LoadingStack, StackFailed } from '@/components/arcade/StackChrome'
import { useArcade } from '@/components/arcade/ArcadeProvider'
import type { ArcadeGameHost } from '@/lib/arcade/types'

type OverlayPhase = 'boot' | 'ready' | 'playing' | 'gameOver'

function formatScore(score: number): string {
  return score.toLocaleString('en-US')
}

function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0
}

export function StackStage() {
  const { recordScore, setHud, bestScores, paused, hud } = useArcade()
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
  const [finalLines, setFinalLines] = useState(0)
  const [isNewBest, setIsNewBest] = useState(false)
  const [touchStart, setTouchStart] = useState(false)
  const [nextFamily, setNextFamily] = useState<number | null>(null)
  const [holdFamily, setHoldFamily] = useState<number | null>(null)
  const phaseRef = useRef<OverlayPhase>('boot')
  const linesRef = useRef(0)

  useEffect(() => {
    const id = window.setTimeout(() => setTouchStart(isTouchDevice()), 0)
    return () => window.clearTimeout(id)
  }, [])

  const buildHost = useCallback((core: GameMountCore): ArcadeGameHost => {
    const nextHud = { score: 0, lines: 0, level: 1 }
    return {
      canvas: core.canvas,
      soundEnabled: core.soundEnabled,
      reducedMotion: core.reducedMotion,
      onScore: (value) => {
        nextHud.score = value
        setHudRef.current({ ...nextHud })
      },
      onLives: () => undefined,
      onLevel: (value) => {
        nextHud.level = value
        setHudRef.current({ ...nextHud })
      },
      onLevelClear: () => undefined,
      onLines: (value) => {
        nextHud.lines = value
        linesRef.current = value
        setHudRef.current({ ...nextHud })
      },
      onNext: (familyId) => setNextFamily(familyId),
      onHold: (familyId) => setHoldFamily(familyId),
      onReady: () => {
        phaseRef.current = 'ready'
        setPhase('ready')
      },
      onGameOver: (value) => {
        const best = recordRef.current('stack', value)
        setFinalScore(value)
        setFinalLines(linesRef.current)
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
    setHoldFamily(null)
  }, [])

  const markPlaying = useCallback(() => {
    if (phaseRef.current === 'ready' && !pausedRef.current) {
      phaseRef.current = 'playing'
      setPhase('playing')
    }
  }, [])

  const onBooted = useCallback((canvas: HTMLCanvasElement) => {
    canvas.addEventListener('pointerdown', markPlaying)
    const onSpace = (event: KeyboardEvent) => {
      if (event.code === 'Space') markPlaying()
    }
    window.addEventListener('keydown', onSpace)
    return () => {
      canvas.removeEventListener('pointerdown', markPlaying)
      window.removeEventListener('keydown', onSpace)
    }
  }, [markPlaying])

  const terminal = phase === 'gameOver'
  const best = bestScores.stack

  return (
    <GameMount
      gameId="stack"
      stageLabel="Stack stage"
      load={() => import('@/games/stack/StackGame').then((mod) => mod.createStackGame)}
      buildHost={buildHost}
      onRestart={resetOverlay}
      onBooted={onBooted}
      terminal={terminal}
      failedFallback={(retry) => <StackFailed onRetry={retry} />}
      loadingFallback={<LoadingStack />}
    >
      {(mount) => {
        const showReady = phase === 'ready' && !paused && !mount.countdown && !mount.loading

        return (
          <>
            <StageHud />
            <div className="arcade-stack-strip">
              <PiecePreview label="NEXT" family={nextFamily} compact />
              <PiecePreview label="HOLD" family={holdFamily} compact />
            </div>
            <div className="arcade-stack-layout">
              <div ref={mount.frameRef} className="arcade-stage-frame arcade-stack-board">
                <canvas ref={mount.canvasRef} className="arcade-stage-canvas" aria-label="Stack playfield" />
                {mount.loading ? <LoadingStack /> : null}
                {showReady ? (
                  <div className="arcade-overlay arcade-overlay-pass">
                    <p className="arcade-overlay-title">
                      {touchStart ? 'TAP TO START' : 'PRESS SPACE TO START'}
                    </p>
                    <p className="arcade-overlay-copy">
                      {touchStart
                        ? 'Use the controls below.'
                        : 'Move: arrows. Rotate: up. Drop: space. Hold: C'}
                    </p>
                  </div>
                ) : null}
                {phase === 'gameOver' ? (
                  <div className="arcade-overlay">
                    <p className="arcade-overlay-title">STACK OVERFLOW</p>
                    {isNewBest ? <p className="arcade-overlay-best">NEW BEST</p> : null}
                    <p className="arcade-overlay-copy">Score {formatScore(finalScore)}</p>
                    <p className="arcade-overlay-copy">Lines {finalLines}</p>
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
              <aside className="arcade-stack-side">
                <PiecePreview label="NEXT" family={nextFamily} />
                <PiecePreview label="HOLD" family={holdFamily} />
                <div className="arcade-stack-stat">
                  <span className="arcade-score-label">LINES</span>
                  <span className="arcade-score-value">{hud?.lines ?? 0}</span>
                </div>
                <div className="arcade-stack-stat">
                  <span className="arcade-score-label">LEVEL</span>
                  <span className="arcade-score-value">{hud?.level ?? 1}</span>
                </div>
              </aside>
            </div>
            <MobileControls game="stack" onEngage={markPlaying} />
          </>
        )
      }}
    </GameMount>
  )
}
