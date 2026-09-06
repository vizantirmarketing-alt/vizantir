'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'

import { GameMount, type GameMountCore } from '@/components/arcade/GameMount'
import { PaddleSurface } from '@/components/arcade/PaddleTouchStrip'
import { LoadingPong, PongFailed } from '@/components/arcade/PongChrome'
import { useArcade } from '@/components/arcade/ArcadeProvider'
import type { PongDifficulty } from '@/lib/arcade/storage'
import type { ArcadeGameHost } from '@/lib/arcade/types'

type OverlayPhase = 'boot' | 'ready' | 'playing' | 'gameOver'

const DIFFICULTIES: readonly PongDifficulty[] = ['easy', 'normal', 'hard']

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

function matchPointFor(side: 'player' | 'cpu', value: 'player' | 'cpu' | 'both' | null): boolean {
  return value === side || value === 'both'
}

export function PongStage() {
  const { recordScore, setHud, bestScores, paused, pongDifficulty, setPongDifficulty } = useArcade()
  const recordRef = useRef(recordScore)
  const setHudRef = useRef(setHud)
  const pausedRef = useRef(paused)
  const difficultyRef = useRef(pongDifficulty)

  useEffect(() => {
    recordRef.current = recordScore
    setHudRef.current = setHud
    pausedRef.current = paused
    difficultyRef.current = pongDifficulty
  }, [paused, recordScore, setHud, pongDifficulty])

  const [phase, setPhase] = useState<OverlayPhase>('boot')
  const [playerScore, setPlayerScore] = useState(0)
  const [cpuScore, setCpuScore] = useState(0)
  const [matchPoint, setMatchPoint] = useState<'player' | 'cpu' | 'both' | null>(null)
  const [finalPlayer, setFinalPlayer] = useState(0)
  const [finalCpu, setFinalCpu] = useState(0)
  const [playerWon, setPlayerWon] = useState(false)
  const [isNewBest, setIsNewBest] = useState(false)
  const [touchServe, setTouchServe] = useState(false)
  const phaseRef = useRef<OverlayPhase>('boot')

  useEffect(() => {
    const id = window.setTimeout(() => setTouchServe(isTouchDevice()), 0)
    return () => window.clearTimeout(id)
  }, [])

  const buildHost = useCallback((core: GameMountCore): ArcadeGameHost => {
    const nextHud = { score: 0, opponentScore: 0, matchPoint: null as 'player' | 'cpu' | 'both' | null }
    return {
      canvas: core.canvas,
      soundEnabled: core.soundEnabled,
      reducedMotion: core.reducedMotion,
      difficulty: () => difficultyRef.current,
      onScore: (value) => {
        nextHud.score = value
        setPlayerScore(value)
        setHudRef.current({ ...nextHud })
      },
      onOpponentScore: (value) => {
        nextHud.opponentScore = value
        setCpuScore(value)
        setHudRef.current({ ...nextHud })
      },
      onMatchPoint: (side) => {
        nextHud.matchPoint = side
        setMatchPoint(side)
        setHudRef.current({ ...nextHud })
      },
      onLives: () => undefined,
      onLevel: () => undefined,
      onLevelClear: () => undefined,
      onReady: () => {
        phaseRef.current = 'ready'
        setPhase('ready')
        setMatchPoint(null)
      },
      onGameOver: (value, extra) => {
        const best = recordRef.current('pong', value)
        setFinalPlayer(extra?.player ?? value)
        setFinalCpu(extra?.cpu ?? 0)
        setPlayerWon(extra?.won === true)
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
    setPlayerScore(0)
    setCpuScore(0)
    setMatchPoint(null)
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
  const best = bestScores.pong

  return (
    <GameMount
      gameId="pong"
      stageLabel="Pong stage"
      load={() => import('@/games/pong/PongGame').then((mod) => mod.createPongGame)}
      buildHost={buildHost}
      onRestart={resetOverlay}
      onBooted={onBooted}
      terminal={terminal}
      failedFallback={(retry) => <PongFailed onRetry={retry} />}
      loadingFallback={<LoadingPong />}
    >
      {(mount) => {
        const showReady = phase === 'ready' && !paused && !mount.countdown && !mount.loading

        return (
          <>
            <div className="arcade-pong-hud">
              <div className="arcade-pong-score">
                <span className="arcade-score-label">YOU</span>
                <span className="arcade-pong-score-value">{formatScore(playerScore)}</span>
                <span className="arcade-pong-match">
                  {matchPointFor('player', matchPoint) ? 'MATCH POINT' : '\u00a0'}
                </span>
              </div>
              <div className="arcade-pong-score">
                <span className="arcade-score-label">CPU</span>
                <span className="arcade-pong-score-value">{formatScore(cpuScore)}</span>
                <span className="arcade-pong-match">
                  {matchPointFor('cpu', matchPoint) ? 'MATCH POINT' : '\u00a0'}
                </span>
              </div>
              <div className="arcade-pong-score">
                <span className="arcade-score-label">BEST</span>
                <span className="arcade-pong-score-value">{best === undefined ? '-' : formatScore(best)}</span>
                <span className="arcade-pong-match">{'\u00a0'}</span>
              </div>
            </div>
            <PaddleSurface>
              <div ref={mount.frameRef} className="arcade-stage-frame arcade-pong-board">
                <canvas
                  ref={mount.canvasRef}
                  className={phase === 'playing' ? 'arcade-stage-canvas is-hidden-cursor' : 'arcade-stage-canvas'}
                  aria-label="Pong playfield"
                />
                {mount.loading ? <LoadingPong /> : null}
                {showReady ? (
                  <div className="arcade-overlay arcade-overlay-pass">
                    <p className="arcade-overlay-title">
                      {touchServe ? 'TAP TO SERVE' : 'CLICK OR SPACE TO SERVE'}
                    </p>
                    <p className="arcade-overlay-copy">
                      {touchServe
                        ? 'Drag to move your paddle'
                        : 'Move: drag, mouse, arrows, or A D. Up, Down, W, and S also work.'}
                    </p>
                    {touchServe ? null : (
                      <p className="arcade-overlay-mono">
                        CLICK TO LOCK THE MOUSE TO THE PADDLE. ESC RELEASES IT.
                      </p>
                    )}
                    <div className="arcade-pong-diff" role="group" aria-label="Difficulty">
                      {DIFFICULTIES.map((level) => (
                        <button
                          key={level}
                          type="button"
                          className={
                            pongDifficulty === level ? 'arcade-pong-diff-btn is-on' : 'arcade-pong-diff-btn'
                          }
                          onClick={() => setPongDifficulty(level)}
                          onPointerDown={(event) => event.stopPropagation()}
                        >
                          {level.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                {phase === 'gameOver' ? (
                  <div className="arcade-overlay">
                    <p className="arcade-overlay-title">{playerWon ? 'YOU WIN' : 'CPU WINS'}</p>
                    {isNewBest ? <p className="arcade-overlay-best">NEW BEST</p> : null}
                    <p className="arcade-overlay-copy">
                      {formatScore(finalPlayer)} to {formatScore(finalCpu)}
                    </p>
                    <p className="arcade-overlay-copy">Best {formatScore(best ?? finalPlayer)}</p>
                    <div className="arcade-overlay-actions">
                      <button type="button" className="arcade-overlay-btn" onClick={mount.playAgain}>
                        PLAY AGAIN
                      </button>
                      <Link href="/play" className="arcade-overlay-btn">
                        ARCADE
                      </Link>
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
            </PaddleSurface>
          </>
        )
      }}
    </GameMount>
  )
}
