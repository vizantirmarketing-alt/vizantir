'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'

import { BreakoutFailed, LoadingBreakout } from '@/components/arcade/BreakoutChrome'
import { StageHud } from '@/components/arcade/ScoreDisplay'
import { useArcade } from '@/components/arcade/ArcadeProvider'
import { writeArcadeState, readArcadeState } from '@/lib/arcade/storage'
import type { ArcadeGame, ArcadeGameHost } from '@/lib/arcade/types'

type OverlayPhase = 'boot' | 'ready' | 'playing' | 'levelClear' | 'gameOver' | 'complete'

function formatScore(score: number): string {
  return score.toLocaleString('en-US')
}

function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0
}

export function BreakoutStage() {
  const {
    paused,
    setPaused,
    menuOpen,
    setMenuOpen,
    soundEnabled,
    reducedMotion,
    recordScore,
    stageRef,
    setHud,
    bestScores,
  } = useArcade()

  const rootRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<ArcadeGame | null>(null)
  const countdownTimers = useRef<number[]>([])
  const menuWasOpen = useRef(menuOpen)
  const soundRef = useRef(soundEnabled)
  const motionRef = useRef(reducedMotion)
  const recordRef = useRef(recordScore)
  const setPausedRef = useRef(setPaused)
  const setHudRef = useRef(setHud)
  const pausedRef = useRef(paused)
  const menuOpenRef = useRef(menuOpen)

  useEffect(() => {
    soundRef.current = soundEnabled
    motionRef.current = reducedMotion
    recordRef.current = recordScore
    setPausedRef.current = setPaused
    setHudRef.current = setHud
    pausedRef.current = paused
    menuOpenRef.current = menuOpen
  }, [soundEnabled, reducedMotion, recordScore, setPaused, setHud, paused, menuOpen])

  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [phase, setPhase] = useState<OverlayPhase>('boot')
  const [clearInfo, setClearInfo] = useState<{ level: number; score: number } | null>(null)
  const [finalScore, setFinalScore] = useState(0)
  const [isNewBest, setIsNewBest] = useState(false)
  const [countdown, setCountdown] = useState<string | null>(null)
  const [touchLaunch, setTouchLaunch] = useState(false)
  const [engineKey, setEngineKey] = useState(0)
  const countdownActive = useRef(false)
  const phaseRef = useRef<OverlayPhase>('boot')

  useLayoutEffect(() => {
    const node = frameRef.current
    if (!node) return
    const previous = stageRef.current
    stageRef.current = node
    return () => {
      if (stageRef.current === node) stageRef.current = previous
    }
  }, [stageRef])

  const clearCountdown = () => {
    for (const id of countdownTimers.current) window.clearTimeout(id)
    countdownTimers.current = []
    countdownActive.current = false
    setCountdown(null)
  }

  const beginCountdown = useCallback(() => {
    if (countdownActive.current) return
    countdownActive.current = true
    const steps = ['3', '2', '1', 'GO'] as const
    const delays = [0, 300, 600, 900]
    steps.forEach((step, index) => {
      const id = window.setTimeout(() => {
        setCountdown(step)
        if (step === 'GO') {
          gameRef.current?.resume()
          setPausedRef.current(false)
        }
      }, delays[index])
      countdownTimers.current.push(id)
    })
    const done = window.setTimeout(() => {
      countdownActive.current = false
      setCountdown(null)
    }, 1150)
    countdownTimers.current.push(done)
  }, [])

  useEffect(() => {
    const id = window.setTimeout(() => setTouchLaunch(isTouchDevice()), 0)
    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    let alive = true
    let observer: ResizeObserver | null = null
    let game: ArcadeGame | null = null
    let extraCleanup: (() => void) | undefined

    const boot = async () => {
      try {
        const mod = await import('@/games/breakout/BreakoutGame')
        if (!alive || !canvasRef.current || !frameRef.current) return

        const hud = { score: 0, lives: 3, level: 1 }
        const host: ArcadeGameHost = {
          canvas: canvasRef.current,
          soundEnabled: () => soundRef.current,
          reducedMotion: () => motionRef.current,
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
                if (alive) setPhase('complete')
              }, 900)
            }
          },
          onGameOver: (value) => {
            const best = recordRef.current('breakout', value)
            setFinalScore(value)
            setIsNewBest(best)
            setPhase('gameOver')
          },
          onPauseRequest: () => {
            if (countdownActive.current) return
            if (menuOpenRef.current) return
            if (pausedRef.current) beginCountdown()
            else setPausedRef.current(true)
          },
        }

        game = mod.createBreakoutGame(host)
        gameRef.current = game
        const box = frameRef.current.getBoundingClientRect()
        game.resize(box.width, box.height, Math.min(window.devicePixelRatio || 1, 2))
        game.start()

        observer = new ResizeObserver((entries) => {
          const entry = entries[0]
          if (!entry || !gameRef.current) return
          const { width, height } = entry.contentRect
          gameRef.current.resize(width, height, Math.min(window.devicePixelRatio || 1, 2))
        })
        observer.observe(frameRef.current)

        const markPlaying = () => {
          if (phaseRef.current === 'ready' && !pausedRef.current) {
            phaseRef.current = 'playing'
            setPhase('playing')
          }
        }
        const canvasEl = canvasRef.current
        canvasEl.addEventListener('pointerdown', markPlaying)
        const onSpace = (event: KeyboardEvent) => {
          if (event.code === 'Space') markPlaying()
        }
        window.addEventListener('keydown', onSpace)
        extraCleanup = () => {
          canvasEl.removeEventListener('pointerdown', markPlaying)
          window.removeEventListener('keydown', onSpace)
        }

        setLoading(false)
        if (!menuOpenRef.current) {
          rootRef.current?.focus({ preventScroll: true })
        }
      } catch {
        game?.destroy()
        gameRef.current = null
        setFailed(true)
        setLoading(false)
      }
    }

    void boot()

    const onRestart = () => {
      gameRef.current?.restart()
      phaseRef.current = 'ready'
      setPhase('ready')
      setClearInfo(null)
      setIsNewBest(false)
      setPausedRef.current(false)
      clearCountdown()
    }
    window.addEventListener('arcade:restart', onRestart)

    return () => {
      alive = false
      window.removeEventListener('arcade:restart', onRestart)
      extraCleanup?.()
      observer?.disconnect()
      game?.destroy()
      gameRef.current = null
      setHudRef.current(null)
      for (const id of countdownTimers.current) window.clearTimeout(id)
    }
  }, [beginCountdown, engineKey])

  useEffect(() => {
    if (loading || failed) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (menuOpenRef.current) return
      if (event.defaultPrevented) return
      const target = event.target
      if (target instanceof HTMLElement) {
        if (target.closest('.arcade-menu')) return
        if (target.isContentEditable) return
        const tag = target.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      }
      if (!gameRef.current) return
      event.preventDefault()
      setMenuOpen(true)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [failed, loading, setMenuOpen])

  useEffect(() => {
    if (paused) {
      gameRef.current?.pause()
    }
  }, [paused])

  useEffect(() => {
    const closed = menuWasOpen.current && !menuOpen
    menuWasOpen.current = menuOpen
    if (!closed || !paused) return
    if (phase === 'gameOver' || phase === 'complete' || failed) return
    const id = window.setTimeout(() => beginCountdown(), 0)
    return () => window.clearTimeout(id)
  }, [beginCountdown, failed, menuOpen, paused, phase])

  const playAgain = () => {
    gameRef.current?.restart()
    phaseRef.current = 'ready'
    setPhase('ready')
    setClearInfo(null)
    setIsNewBest(false)
    setPaused(false)
    clearCountdown()
  }

  const terminal = phase === 'gameOver' || phase === 'complete'
  const showPause = paused && !menuOpen && !countdown && !loading && !failed && !terminal
  const showReady = phase === 'ready' && !paused && !countdown && !loading && !failed
  const showClear = phase === 'levelClear' && !failed && !loading

  if (failed) {
    return <BreakoutFailed onRetry={() => { setFailed(false); setLoading(true); setEngineKey((key) => key + 1) }} />
  }

  const best = bestScores.breakout

  return (
    <div ref={rootRef} className="arcade-stage" data-game="breakout" tabIndex={0} aria-label="Breakout stage">
      <StageHud />
      <div ref={frameRef} className="arcade-stage-frame">
        <canvas ref={canvasRef} className="arcade-stage-canvas" aria-label="Breakout playfield" />
        {loading ? <LoadingBreakout /> : null}
        {showReady ? (
          <div className="arcade-overlay arcade-overlay-pass">
            <p className="arcade-overlay-title">{touchLaunch ? 'TAP TO LAUNCH' : 'CLICK OR SPACE TO LAUNCH'}</p>
            <p className="arcade-overlay-copy">Move: drag, mouse, arrows, or A D</p>
          </div>
        ) : null}
        {showClear ? (
          <div className="arcade-overlay arcade-overlay-pass">
            <p className="arcade-overlay-title">LEVEL {clearInfo?.level ?? 1} CLEAR</p>
            <p className="arcade-overlay-copy">Bonus 500 per remaining life</p>
          </div>
        ) : null}
        {phase === 'gameOver' ? (
          <div className="arcade-overlay">
            <p className="arcade-overlay-title">SIGNAL LOST</p>
            {isNewBest ? <p className="arcade-overlay-best">NEW BEST</p> : null}
            <p className="arcade-overlay-copy">Score {formatScore(finalScore)}</p>
            <p className="arcade-overlay-copy">Best {formatScore(best ?? finalScore)}</p>
            <div className="arcade-overlay-actions">
              <button type="button" className="arcade-overlay-btn" onClick={playAgain}>
                PLAY AGAIN
              </button>
              <Link href="/play" className="arcade-overlay-btn">
                CHANGE GAME
              </Link>
              <Link href="/" className="arcade-overlay-btn">
                EXIT ARCADE
              </Link>
            </div>
          </div>
        ) : null}
        {phase === 'complete' ? (
          <div className="arcade-overlay">
            <p className="arcade-overlay-title">SITE CLEARED</p>
            <p className="arcade-overlay-copy">Nothing left but the experience.</p>
            {isNewBest ? <p className="arcade-overlay-best">NEW BEST</p> : null}
            <p className="arcade-overlay-copy">Score {formatScore(finalScore)}</p>
            <div className="arcade-overlay-actions">
              <button type="button" className="arcade-overlay-btn" onClick={playAgain}>
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
        {showPause ? (
          <div className="arcade-overlay">
            <p className="arcade-overlay-title">PAUSED</p>
            <button type="button" className="arcade-overlay-btn" onClick={beginCountdown}>
              RESUME
            </button>
          </div>
        ) : null}
        {countdown ? (
          <div className="arcade-overlay arcade-overlay-pass arcade-countdown" aria-live="assertive">
            <p className="arcade-overlay-title">{countdown}</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
