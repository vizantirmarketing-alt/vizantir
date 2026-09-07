'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'

import { GameMount, type GameMountCore } from '@/components/arcade/GameMount'
import { PaddleSurface } from '@/components/arcade/PaddleTouchStrip'
import { StageHud } from '@/components/arcade/ScoreDisplay'
import { LoadingSwarm, SwarmFailed } from '@/components/arcade/SwarmChrome'
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

export function SwarmStage() {
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
  const [finalWave, setFinalWave] = useState(1)
  const [overReason, setOverReason] = useState<'breach' | 'lives'>('lives')
  const [isNewBest, setIsNewBest] = useState(false)
  const [touchStart, setTouchStart] = useState(false)
  const phaseRef = useRef<OverlayPhase>('boot')
  const waveRef = useRef(1)

  useEffect(() => {
    const id = window.setTimeout(() => setTouchStart(isTouchDevice()), 0)
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
        waveRef.current = value
        setHudRef.current({ ...hud })
      },
      onLevelClear: () => undefined,
      onReady: () => {
        phaseRef.current = 'ready'
        setPhase('ready')
        setHudRef.current({ ...hud })
      },
      onGameOver: (value, extra) => {
        const best = recordRef.current('swarm', value)
        setFinalScore(value)
        setFinalWave(waveRef.current)
        setOverReason(extra?.reason === 'breach' ? 'breach' : 'lives')
        setIsNewBest(best)
        phaseRef.current = 'gameOver'
        setPhase('gameOver')
      },
      onPauseRequest: core.requestPause,
      onPointerLockChange: (locked) => {
        if (!locked && (phaseRef.current === 'playing' || phaseRef.current === 'ready')) {
          if (phaseRef.current === 'playing') core.openMenu()
        }
      },
    }
  }, [])

  const resetOverlay = useCallback(() => {
    phaseRef.current = 'ready'
    setPhase('ready')
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

  const terminal = phase === 'gameOver'
  const best = bestScores.swarm

  return (
    <GameMount
      gameId="swarm"
      stageLabel="Swarm stage"
      load={() => import('@/games/swarm/SwarmGame').then((mod) => mod.createSwarmGame)}
      buildHost={buildHost}
      onRestart={resetOverlay}
      onBooted={onBooted}
      terminal={terminal}
      failedFallback={(retry) => <SwarmFailed onRetry={retry} />}
      loadingFallback={<LoadingSwarm />}
    >
      {(mount) => {
        const showReady = phase === 'ready' && !paused && !mount.countdown && !mount.loading

        return (
          <>
            <StageHud />
            <PaddleSurface>
              <div ref={mount.frameRef} className="arcade-stage-frame">
                <canvas
                  ref={mount.canvasRef}
                  className={phase === 'playing' ? 'arcade-stage-canvas is-hidden-cursor' : 'arcade-stage-canvas'}
                  role="img"
                  aria-label="Swarm playfield"
                />
                {mount.loading ? <LoadingSwarm /> : null}
                {showReady ? (
                  <div className="arcade-overlay arcade-overlay-pass">
                    <p className="arcade-overlay-title">
                      {touchStart ? 'TAP TO START' : 'CLICK OR SPACE TO START'}
                    </p>
                    <p className="arcade-overlay-copy">
                      {touchStart
                        ? 'Drag to move. Fire is automatic.'
                        : 'Move: drag, mouse, arrows, or A D. Fire is automatic.'}
                    </p>
                    {touchStart ? null : (
                      <p className="arcade-overlay-mono">
                        CLICK TO LOCK THE MOUSE TO THE SHIP. ESC RELEASES IT.
                      </p>
                    )}
                  </div>
                ) : null}
                {phase === 'gameOver' ? (
                  <div className="arcade-overlay" role="dialog" aria-labelledby="swarm-over-title" aria-modal="true">
                    <p id="swarm-over-title" className="arcade-overlay-title">
                      {overReason === 'breach' ? 'LINE BREACHED' : 'SHIP LOST'}
                    </p>
                    {isNewBest ? <p className="arcade-overlay-best">NEW BEST</p> : null}
                    <p className="arcade-overlay-copy">Score {formatScore(finalScore)}</p>
                    <p className="arcade-overlay-copy">Wave {finalWave}</p>
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
            </PaddleSurface>
          </>
        )
      }}
    </GameMount>
  )
}
