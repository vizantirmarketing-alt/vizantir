'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'

import { EngineErrorBoundary } from '@/components/arcade/EngineErrorBoundary'
import { useArcade } from '@/components/arcade/ArcadeProvider'
import type { GameId } from '@/lib/arcade/games'
import type { ArcadeGame, ArcadeGameHost, GameFactory, SnakeActions, StackActions } from '@/lib/arcade/types'

export interface GameMountCore {
  canvas: HTMLCanvasElement
  soundEnabled: () => boolean
  reducedMotion: () => boolean
  isAlive: () => boolean
  requestPause: () => void
  openMenu: () => void
}

export interface GameMountApi {
  canvasRef: RefObject<HTMLCanvasElement | null>
  frameRef: RefObject<HTMLDivElement | null>
  gameRef: RefObject<ArcadeGame | null>
  loading: boolean
  failed: boolean
  retry: () => void
  countdown: string | null
  beginCountdown: () => void
  clearCountdown: () => void
  playAgain: () => void
  showPause: boolean
}

export interface GameActions extends StackActions, SnakeActions {
  launch(): void
}

const GameActionsContext = createContext<GameActions | null>(null)

export function useGameActions(): GameActions | null {
  return useContext(GameActionsContext)
}

function callGameAction(
  game: (ArcadeGame & Partial<GameActions>) | null,
  name: keyof GameActions,
  ...args: unknown[]
): void {
  if (!game) return
  const method = game[name]
  if (typeof method === 'function') {
    ;(method as (...next: unknown[]) => void).apply(game, args)
  }
}

export function GameMount({
  gameId,
  stageLabel,
  load,
  buildHost,
  onRestart,
  onBooted,
  terminal = false,
  failedFallback,
  children,
}: {
  gameId: GameId
  stageLabel: string
  load: () => Promise<GameFactory>
  buildHost: (core: GameMountCore) => ArcadeGameHost
  onRestart?: () => void
  onBooted?: (canvas: HTMLCanvasElement) => void | (() => void)
  terminal?: boolean
  failedFallback: (retry: () => void) => ReactNode
  loadingFallback?: ReactNode
  children: (mount: GameMountApi) => ReactNode
}) {
  const {
    paused,
    setPaused,
    menuOpen,
    setMenuOpen,
    soundEnabled,
    reducedMotion,
    stageRef,
    setHud,
  } = useArcade()

  const rootRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<ArcadeGame | null>(null)
  const countdownTimers = useRef<number[]>([])
  const menuWasOpen = useRef(menuOpen)
  const soundRef = useRef(soundEnabled)
  const motionRef = useRef(reducedMotion)
  const setPausedRef = useRef(setPaused)
  const setHudRef = useRef(setHud)
  const pausedRef = useRef(paused)
  const menuOpenRef = useRef(menuOpen)
  const buildHostRef = useRef(buildHost)
  const loadRef = useRef(load)
  const onRestartRef = useRef(onRestart)
  const onBootedRef = useRef(onBooted)
  const countdownActive = useRef(false)
  const actions = useMemo<GameActions>(
    () => ({
      launch: () => callGameAction(gameRef.current, 'launch'),
      moveLeft: () => callGameAction(gameRef.current, 'moveLeft'),
      moveRight: () => callGameAction(gameRef.current, 'moveRight'),
      rotate: () => callGameAction(gameRef.current, 'rotate'),
      softDrop: (down) => callGameAction(gameRef.current, 'softDrop', down),
      hardDrop: () => callGameAction(gameRef.current, 'hardDrop'),
      hold: () => callGameAction(gameRef.current, 'hold'),
      turnUp: () => callGameAction(gameRef.current, 'turnUp'),
      turnDown: () => callGameAction(gameRef.current, 'turnDown'),
      turnLeft: () => callGameAction(gameRef.current, 'turnLeft'),
      turnRight: () => callGameAction(gameRef.current, 'turnRight'),
    }),
    [],
  )

  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [countdown, setCountdown] = useState<string | null>(null)
  const [engineKey, setEngineKey] = useState(0)

  const openMenu = useCallback(() => {
    if (countdownActive.current) return
    setMenuOpen(true)
  }, [setMenuOpen])

  const openMenuRef = useRef(openMenu)

  useEffect(() => {
    soundRef.current = soundEnabled
    motionRef.current = reducedMotion
    setPausedRef.current = setPaused
    setHudRef.current = setHud
    pausedRef.current = paused
    menuOpenRef.current = menuOpen
    buildHostRef.current = buildHost
    loadRef.current = load
    onRestartRef.current = onRestart
    onBootedRef.current = onBooted
    openMenuRef.current = openMenu
  }, [buildHost, load, onBooted, onRestart, openMenu, soundEnabled, reducedMotion, setPaused, setHud, paused, menuOpen])

  useLayoutEffect(() => {
    const node = frameRef.current
    if (!node) return
    const previous = stageRef.current
    stageRef.current = node
    return () => {
      if (stageRef.current === node) stageRef.current = previous
    }
  }, [stageRef, loading, failed])

  const clearCountdown = useCallback(() => {
    for (const id of countdownTimers.current) window.clearTimeout(id)
    countdownTimers.current = []
    countdownActive.current = false
    setCountdown(null)
  }, [])

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

  const requestPause = useCallback(() => {
    if (countdownActive.current) return
    if (menuOpenRef.current) return
    if (pausedRef.current) beginCountdown()
    else setPausedRef.current(true)
  }, [beginCountdown])

  useEffect(() => {
    let alive = true
    let observer: ResizeObserver | null = null
    let game: ArcadeGame | null = null
    let extraCleanup: (() => void) | undefined

    const boot = async () => {
      try {
        const factory = await loadRef.current()
        if (!alive || !canvasRef.current || !frameRef.current) return

        const host = buildHostRef.current({
          canvas: canvasRef.current,
          soundEnabled: () => soundRef.current,
          reducedMotion: () => motionRef.current,
          isAlive: () => alive,
          requestPause,
          openMenu: () => openMenuRef.current(),
        })

        game = factory(host)
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

        const booted = onBootedRef.current?.(canvasRef.current)
        if (typeof booted === 'function') extraCleanup = booted

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

    const onRestartEvent = () => {
      gameRef.current?.restart()
      setPausedRef.current(false)
      clearCountdown()
      onRestartRef.current?.()
    }
    window.addEventListener('arcade:restart', onRestartEvent)

    return () => {
      alive = false
      window.removeEventListener('arcade:restart', onRestartEvent)
      extraCleanup?.()
      observer?.disconnect()
      game?.destroy()
      gameRef.current = null
      setHudRef.current(null)
      for (const id of countdownTimers.current) window.clearTimeout(id)
    }
  }, [clearCountdown, engineKey, requestPause])

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
    if (terminal || failed) return
    const id = window.setTimeout(() => beginCountdown(), 0)
    return () => window.clearTimeout(id)
  }, [beginCountdown, failed, menuOpen, paused, terminal])

  const playAgain = useCallback(() => {
    gameRef.current?.restart()
    setPaused(false)
    clearCountdown()
    onRestartRef.current?.()
  }, [clearCountdown, setPaused])

  const retry = useCallback(() => {
    setFailed(false)
    setLoading(true)
    setEngineKey((key) => key + 1)
  }, [])

  const showPause = paused && !menuOpen && !countdown && !loading && !failed && !terminal

  const api: GameMountApi = {
    canvasRef,
    frameRef,
    gameRef,
    loading,
    failed,
    retry,
    countdown,
    beginCountdown,
    clearCountdown,
    playAgain,
    showPause,
  }

  if (failed) {
    return <>{failedFallback(retry)}</>
  }

  return (
    <EngineErrorBoundary
      key={engineKey}
      fallback={failedFallback(retry)}
    >
      <GameActionsContext.Provider value={actions}>
        <div ref={rootRef} className="arcade-stage" data-game={gameId} tabIndex={0} aria-label={stageLabel}>
          {children(api)}
        </div>
      </GameActionsContext.Provider>
    </EngineErrorBoundary>
  )
}
