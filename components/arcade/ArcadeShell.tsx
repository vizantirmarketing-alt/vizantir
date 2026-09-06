'use client'

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

import { ArcadeBackdrop } from '@/components/arcade/ArcadeBackdrop'
import { ArcadeCabinet } from '@/components/arcade/ArcadeCabinet'
import { ArcadeHeader } from '@/components/arcade/ArcadeHeader'
import { ArcadeMenu } from '@/components/arcade/ArcadeMenu'
import { useArcade } from '@/components/arcade/ArcadeProvider'

function HudLiveRegion() {
  const { hud, currentGame } = useArcade()
  const text =
    currentGame && hud
      ? hud.opponentScore !== undefined
        ? `You ${hud.score}, CPU ${hud.opponentScore}`
        : `Score ${hud.score}`
      : ''

  return (
    <div className="arcade-sr-only" aria-live="polite" aria-atomic="true">
      {text}
    </div>
  )
}

const INTRO_FLAG = 'vizantir.arcade.intro'

type IntroState = 'play' | 'reduced' | 'done'

function readSessionFlag(key: string): boolean {
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

export function ArcadeShell({ children }: { children: ReactNode }) {
  const { stageRef } = useArcade()
  const rootRef = useRef<HTMLDivElement>(null)
  const [intro, setIntro] = useState<IntroState>('play')

  useLayoutEffect(() => {
    const root = document.documentElement
    root.classList.add('arcade-active')
    return () => {
      root.classList.remove('arcade-active')
    }
  }, [])

  useLayoutEffect(() => {
    if (!stageRef.current && rootRef.current) {
      stageRef.current = rootRef.current
    }
  }, [stageRef])

  useEffect(() => {
    if (readSessionFlag(INTRO_FLAG)) {
      const skip = window.setTimeout(() => setIntro('done'), 0)
      return () => window.clearTimeout(skip)
    }

    writeSessionFlag(INTRO_FLAG)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const reduceId = reduce ? window.setTimeout(() => setIntro('reduced'), 0) : 0
    const done = window.setTimeout(() => setIntro('done'), reduce ? 300 : 1600)
    return () => {
      if (reduceId) window.clearTimeout(reduceId)
      window.clearTimeout(done)
    }
  }, [])

  return (
    <div ref={rootRef} className="arcade" data-intro={intro}>
      <ArcadeBackdrop />
      <div className="arcade-intro" aria-hidden="true">
        <span className="arcade-intro-wordmark">VIZANTIR</span>
        <span className="arcade-intro-title">ARCADE</span>
      </div>
      <ArcadeHeader />
      <HudLiveRegion />
      <main className="arcade-main arcade-chrome">
        <ArcadeCabinet>{children}</ArcadeCabinet>
      </main>
      <ArcadeMenu />
    </div>
  )
}
