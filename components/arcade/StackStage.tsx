'use client'

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import Link from 'next/link'

import { GameMount, useGameActions, type GameMountCore } from '@/components/arcade/GameMount'
import { PiecePreview } from '@/components/arcade/PiecePreview'
import { StageHud } from '@/components/arcade/ScoreDisplay'
import { LoadingStack, StackFailed } from '@/components/arcade/StackChrome'
import { useArcade } from '@/components/arcade/ArcadeProvider'
import { useStackGestures } from '@/components/arcade/useStackGestures'
import type { ArcadeGameHost } from '@/lib/arcade/types'

type OverlayPhase = 'boot' | 'ready' | 'playing' | 'gameOver'

function formatScore(score: number): string {
  return score.toLocaleString('en-US')
}

const GESTURE_HINT_KEY = 'vizantir.arcade.stack-gesture'

function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0
}

function readGestureHintUsed(): boolean {
  try {
    return window.sessionStorage.getItem(GESTURE_HINT_KEY) === '1'
  } catch {
    return false
  }
}

function writeGestureHintUsed(): void {
  try {
    window.sessionStorage.setItem(GESTURE_HINT_KEY, '1')
  } catch {
    // Ignore quota / private mode.
  }
}

function StackGestures({
  canvasRef,
  padRef,
  onEngage,
  isReady,
  onGesture,
  enabled,
}: {
  canvasRef: RefObject<HTMLCanvasElement | null>
  padRef: RefObject<HTMLDivElement | null>
  onEngage: () => void
  isReady: () => boolean
  onGesture: () => void
  enabled: boolean
}) {
  const actions = useGameActions()

  useStackGestures(canvasRef, padRef, {
    moveLeft: () => actions?.moveLeft(),
    moveRight: () => actions?.moveRight(),
    rotate: () => actions?.rotate(),
    softDrop: (down) => actions?.softDrop(down),
    hardDrop: () => actions?.hardDrop(),
    launch: () => actions?.launch(),
    isReady,
    onEngage,
    onGesture,
    enabled,
  })

  return null
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
  const [gesturesOn, setGesturesOn] = useState(false)
  const [hintUsed, setHintUsed] = useState(false)
  const [nextFamily, setNextFamily] = useState<number | null>(null)
  const [holdFamily, setHoldFamily] = useState<number | null>(null)
  const phaseRef = useRef<OverlayPhase>('boot')
  const linesRef = useRef(0)
  const padRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const coarse = window.matchMedia('(pointer: coarse)')
    const mobile = window.matchMedia('(max-width: 767px)')
    const sync = () => {
      setTouchStart(isTouchDevice())
      setGesturesOn(coarse.matches || mobile.matches)
      setHintUsed(readGestureHintUsed())
    }
    sync()
    coarse.addEventListener('change', sync)
    mobile.addEventListener('change', sync)
    return () => {
      coarse.removeEventListener('change', sync)
      mobile.removeEventListener('change', sync)
    }
  }, [])

  const onGesture = useCallback(() => {
    writeGestureHintUsed()
    setHintUsed(true)
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
                <canvas
                  ref={mount.canvasRef}
                  className="arcade-stage-canvas"
                  role="img"
                  aria-label="Stack playfield"
                />
                {mount.loading ? <LoadingStack /> : null}
                {showReady ? (
                  <div className="arcade-overlay arcade-overlay-pass">
                    <p className="arcade-overlay-title">
                      {touchStart ? 'TAP TO START' : 'PRESS SPACE TO START'}
                    </p>
                    <p className="arcade-overlay-copy">
                      {touchStart
                        ? 'Swipe to move. Tap to rotate. Flick down to drop.'
                        : 'Move: arrows. Rotate: up. Drop: space. Hold: C'}
                    </p>
                  </div>
                ) : null}
                {phase === 'gameOver' ? (
                  <div className="arcade-overlay" role="dialog" aria-labelledby="stack-over-title" aria-modal="true">
                    <p id="stack-over-title" className="arcade-overlay-title">
                      STACK OVERFLOW
                    </p>
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
                  <div className="arcade-overlay arcade-overlay-pass arcade-countdown" aria-hidden="true">
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
            <div
              ref={padRef}
              className={hintUsed ? 'arcade-stack-pad is-used' : 'arcade-stack-pad'}
              aria-hidden="true"
            >
              <span className="arcade-touch-strip-rail" />
              <span className="arcade-touch-strip-label">SWIPE  TAP TO ROTATE</span>
            </div>
            {!mount.loading ? (
              <StackGestures
                canvasRef={mount.canvasRef}
                padRef={padRef}
                onEngage={markPlaying}
                isReady={() => phaseRef.current === 'ready'}
                onGesture={onGesture}
                enabled={gesturesOn && !paused && !mount.countdown && phase !== 'gameOver'}
              />
            ) : null}
          </>
        )
      }}
    </GameMount>
  )
}
