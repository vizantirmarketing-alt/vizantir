'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'

import { BreakoutFailed, LoadingBreakout } from '@/components/arcade/BreakoutChrome'
import { GameMount, type GameMountCore } from '@/components/arcade/GameMount'
import { PaddleSurface } from '@/components/arcade/PaddleTouchStrip'
import { StageHud } from '@/components/arcade/ScoreDisplay'
import { useArcade } from '@/components/arcade/ArcadeProvider'
import { writeArcadeState, readArcadeState } from '@/lib/arcade/storage'
import type { ArcadeGameHost } from '@/lib/arcade/types'

type OverlayPhase = 'boot' | 'ready' | 'playing' | 'levelClear' | 'gameOver' | 'complete'

function formatScore(score: number): string {
  return score.toLocaleString('en-US')
}

function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0
}

export function BreakoutStage() {
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
  const [clearInfo, setClearInfo] = useState<{ level: number; score: number } | null>(null)
  const [finalScore, setFinalScore] = useState(0)
  const [isNewBest, setIsNewBest] = useState(false)
  const [touchLaunch, setTouchLaunch] = useState(false)
  const phaseRef = useRef<OverlayPhase>('boot')

  useEffect(() => {
    const id = window.setTimeout(() => setTouchLaunch(isTouchDevice()), 0)
    return () => window.clearTimeout(id)
  }, [])

  const buildHost = useCallback((core: GameMountCore): ArcadeGameHost => {
    const hud = { score: 0, lives: 3, level: 1 }
    return {
      canvas: core.canvas,
      soundEnabled: core.soundEnabled,
      reducedMotion: core.reducedMotion,
      onScore: (value) => {
        hud.score = value
        setHudRef.current({ ...hud })
      },
      onLives: (value) => {
        hud.lives = value
        setHudRef.current({ ...hud })
      },
      onLevel: (value) => {
        hud.level = value
        setHudRef.current({ ...hud })
      },
      onReady: () => {
        phaseRef.current = 'ready'
        setPhase('ready')
        setClearInfo(null)
      },
      onLevelClear: (payload) => {
        setClearInfo({ level: payload.level, score: payload.score })
        setPhase('levelClear')
        const previous = readArcadeState().breakoutLevelsCleared
        if (payload.level > previous) {
          writeArcadeState({ breakoutLevelsCleared: payload.level })
        }
        if (payload.isFinal) {
          const best = recordRef.current('breakout', payload.score)
          setFinalScore(payload.score)
          setIsNewBest(best)
          window.setTimeout(() => {
            if (core.isAlive()) setPhase('complete')
          }, 900)
        }
      },
      onGameOver: (value) => {
        const best = recordRef.current('breakout', value)
        setFinalScore(value)
        setIsNewBest(best)
        phaseRef.current = 'gameOver'
        setPhase('gameOver')
      },
      onPauseRequest: core.requestPause,
      onPointerLockChange: (locked) => {
        if (!locked && phaseRef.current === 'playing') {
          core.openMenu()
        }
      },
    }
  }, [])

  const resetOverlay = useCallback(() => {
    phaseRef.current = 'ready'
    setPhase('ready')
    setClearInfo(null)
    setIsNewBest(false)
  }, [])

  const onBooted = useCallback((canvas: HTMLCanvasElement) => {
    const markPlaying = () => {
      if (phaseRef.current === 'ready' && !pausedRef.current) {
        phaseRef.current = 'playing'
        setPhase('playing')
      }
    }
    canvas.addEventListener('pointerdown', markPlaying)
    const onSpace = (event: KeyboardEvent) => {
      if (event.code === 'Space') markPlaying()
    }
    window.addEventListener('keydown', onSpace)
    return () => {
      canvas.removeEventListener('pointerdown', markPlaying)
      window.removeEventListener('keydown', onSpace)
    }
  }, [])

  const terminal = phase === 'gameOver' || phase === 'complete'
  const best = bestScores.breakout

  return (
    <GameMount
      gameId="breakout"
      stageLabel="Breakout stage"
      load={() => import('@/games/breakout/BreakoutGame').then((mod) => mod.createBreakoutGame)}
      buildHost={buildHost}
      onRestart={resetOverlay}
      onBooted={onBooted}
      terminal={terminal}
      failedFallback={(retry) => <BreakoutFailed onRetry={retry} />}
      loadingFallback={<LoadingBreakout />}
    >
      {(mount) => {
        const showReady = phase === 'ready' && !paused && !mount.countdown && !mount.loading
        const showClear = phase === 'levelClear' && !mount.loading

        return (
          <>
            <StageHud />
            <PaddleSurface>
              <div ref={mount.frameRef} className="arcade-stage-frame">
                <canvas
                  ref={mount.canvasRef}
                  className={phase === 'playing' ? 'arcade-stage-canvas is-hidden-cursor' : 'arcade-stage-canvas'}
                  role="img"
                  aria-label="Breakout playfield"
                />
                {mount.loading ? <LoadingBreakout /> : null}
                {showReady ? (
                  <div className="arcade-overlay arcade-overlay-pass">
                    <p className="arcade-overlay-title">{touchLaunch ? 'TAP TO LAUNCH' : 'CLICK OR SPACE TO LAUNCH'}</p>
                    <p className="arcade-overlay-copy">Move: drag, mouse, arrows, or A D</p>
                    {touchLaunch ? null : (
                      <p className="arcade-overlay-mono">
                        CLICK TO LOCK THE MOUSE TO THE PADDLE. ESC RELEASES IT.
                      </p>
                    )}
                  </div>
                ) : null}
                {showClear ? (
                  <div className="arcade-overlay arcade-overlay-pass">
                    <p className="arcade-overlay-title">LEVEL {clearInfo?.level ?? 1} CLEAR</p>
                    <p className="arcade-overlay-copy">Bonus 500 per remaining life</p>
                  </div>
                ) : null}
                {phase === 'gameOver' ? (
                  <div className="arcade-overlay" role="dialog" aria-labelledby="breakout-over-title" aria-modal="true">
                    <p id="breakout-over-title" className="arcade-overlay-title">
                      SIGNAL LOST
                    </p>
                    {isNewBest ? <p className="arcade-overlay-best">NEW BEST</p> : null}
                    <p className="arcade-overlay-copy">Score {formatScore(finalScore)}</p>
                    <p className="arcade-overlay-copy">Best {formatScore(best ?? finalScore)}</p>
                    <div className="arcade-overlay-actions">
                      <button type="button" className="arcade-overlay-btn" onClick={mount.playAgain}>
                        PLAY AGAIN
                      </button>
                      <a href="/play" className="arcade-overlay-btn">
                        CHANGE GAME
                      </a>
                      <Link href="/" className="arcade-overlay-btn">
                        EXIT ARCADE
                      </Link>
                    </div>
                  </div>
                ) : null}
                {phase === 'complete' ? (
                  <div className="arcade-overlay" role="dialog" aria-labelledby="breakout-complete-title" aria-modal="true">
                    <p id="breakout-complete-title" className="arcade-overlay-title">
                      SITE CLEARED
                    </p>
                    <p className="arcade-overlay-copy">Nothing left but the experience.</p>
                    {isNewBest ? <p className="arcade-overlay-best">NEW BEST</p> : null}
                    <p className="arcade-overlay-copy">Score {formatScore(finalScore)}</p>
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
            </PaddleSurface>
          </>
        )
      }}
    </GameMount>
  )
}
