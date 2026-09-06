'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from 'react'
import { usePathname } from 'next/navigation'

import { trackArcadeOpen, trackFullscreenEnter, trackGameChange } from '@/lib/arcade/analytics'
import { getGameFromPathname, type GameId } from '@/lib/arcade/games'
import { readArcadeState, setBestScore, writeArcadeState } from '@/lib/arcade/storage'
import { useReducedMotion } from '@/lib/arcade/useReducedMotion'

const OPENED_FLAG = 'vizantir.arcade.opened'

export interface ArcadeHud {
  score: number
  lives: number
  level: number
}

interface ArcadeContextValue {
  soundEnabled: boolean
  toggleSound: () => void
  bestScores: Partial<Record<GameId, number>>
  recordScore: (gameId: GameId, score: number) => boolean
  paused: boolean
  setPaused: (paused: boolean) => void
  menuOpen: boolean
  setMenuOpen: (open: boolean) => void
  isFullscreen: boolean
  toggleFullscreen: () => void
  fullscreenSupported: boolean
  currentGame: GameId | null
  reducedMotion: boolean
  stageRef: RefObject<HTMLElement | null>
  hud: ArcadeHud | null
  setHud: (hud: ArcadeHud | null) => void
}

const ArcadeContext = createContext<ArcadeContextValue | null>(null)

function readSessionFlag(key: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.sessionStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function writeSessionFlag(key: string): void {
  try {
    window.sessionStorage.setItem(key, '1')
  } catch {
    // Ignore quota / private mode.
  }
}

function subscribeFullscreenEnabled(): () => void {
  return () => {}
}

function getFullscreenEnabled(): boolean {
  return !!document.fullscreenEnabled
}

function getFullscreenEnabledServer(): boolean {
  return false
}

export function ArcadeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const currentGame = getGameFromPathname(pathname)
  const reducedMotion = useReducedMotion()
  const stageRef = useRef<HTMLElement | null>(null)
  const currentGameRef = useRef<GameId | null>(currentGame)
  const fullscreenSupported = useSyncExternalStore(
    subscribeFullscreenEnabled,
    getFullscreenEnabled,
    getFullscreenEnabledServer,
  )

  const [soundEnabled, setSoundEnabled] = useState(true)
  const [bestScores, setBestScores] = useState<Partial<Record<GameId, number>>>({})
  const [paused, setPaused] = useState(false)
  const [menuOpen, setMenuOpenState] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hud, setHud] = useState<ArcadeHud | null>(null)

  useEffect(() => {
    currentGameRef.current = currentGame
  }, [currentGame])

  useEffect(() => {
    const state = readArcadeState()
    const frame = window.requestAnimationFrame(() => {
      setSoundEnabled(state.sound)
      setBestScores(state.bestScores)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (readSessionFlag(OPENED_FLAG)) return
    writeSessionFlag(OPENED_FLAG)
    trackArcadeOpen()
  }, [])

  useEffect(() => {
    if (!currentGame) return
    trackGameChange(currentGame)
    writeArcadeState({ lastGame: currentGame })
  }, [currentGame])

  useEffect(() => {
    const hide = () => {
      setPaused(true)
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') hide()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', hide)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', hide)
    }
  }, [])

  useEffect(() => {
    const onChange = () => {
      const active = !!document.fullscreenElement
      setIsFullscreen(active)
      if (active) {
        trackFullscreenEnter(currentGameRef.current)
      }
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
    }
  }, [])

  const setMenuOpen = useCallback((open: boolean) => {
    setMenuOpenState(open)
    if (open) {
      setPaused(true)
    }
  }, [])

  const toggleSound = useCallback(() => {
    setSoundEnabled((current) => {
      const next = !current
      writeArcadeState({ sound: next })
      return next
    })
  }, [])

  const recordScore = useCallback((gameId: GameId, score: number) => {
    const isBest = setBestScore(gameId, score)
    if (isBest) {
      setBestScores((current) => ({ ...current, [gameId]: score }))
    }
    return isBest
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenEnabled) return
    if (document.fullscreenElement) {
      void document.exitFullscreen()
      return
    }
    const target = stageRef.current
    if (target) {
      void target.requestFullscreen()
    }
  }, [])

  const value = useMemo<ArcadeContextValue>(
    () => ({
      soundEnabled,
      toggleSound,
      bestScores,
      recordScore,
      paused,
      setPaused,
      menuOpen,
      setMenuOpen,
      isFullscreen,
      toggleFullscreen,
      fullscreenSupported,
      currentGame,
      reducedMotion,
      stageRef,
      hud,
      setHud,
    }),
    [
      soundEnabled,
      toggleSound,
      bestScores,
      recordScore,
      paused,
      menuOpen,
      setMenuOpen,
      isFullscreen,
      toggleFullscreen,
      fullscreenSupported,
      currentGame,
      reducedMotion,
      hud,
    ],
  )

  return <ArcadeContext.Provider value={value}>{children}</ArcadeContext.Provider>
}

export function useArcade(): ArcadeContextValue {
  const context = useContext(ArcadeContext)
  if (!context) {
    throw new Error('useArcade must be used within ArcadeProvider')
  }
  return context
}
