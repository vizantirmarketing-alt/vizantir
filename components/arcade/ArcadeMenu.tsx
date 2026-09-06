'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'

import { useArcade } from '@/components/arcade/ArcadeProvider'
import { GAMES } from '@/lib/arcade/games'

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

function formatArcadeScore(score: number | undefined): string {
  if (score === undefined) return '-'
  return score.toLocaleString('en-US')
}

export function ArcadeMenu() {
  const {
    menuOpen,
    setMenuOpen,
    soundEnabled,
    toggleSound,
    fullscreenSupported,
    isFullscreen,
    toggleFullscreen,
    currentGame,
    bestScores,
    paused,
    setPaused,
    pongDifficulty,
    cyclePongDifficulty,
  } = useArcade()

  const panelRef = useRef<HTMLDivElement>(null)
  const lastFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!menuOpen) return

    lastFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const panel = panelRef.current
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setMenuOpen(false)
        return
      }

      if (event.key !== 'Tab' || !panel) return

      const nodes = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)]
      if (nodes.length === 0) return

      const firstNode = nodes[0]
      const lastNode = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === firstNode) {
        event.preventDefault()
        lastNode.focus()
      } else if (!event.shiftKey && document.activeElement === lastNode) {
        event.preventDefault()
        firstNode.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
      lastFocusRef.current?.focus()
    }
  }, [menuOpen, setMenuOpen])

  if (!menuOpen) return null

  const restart = () => {
    window.dispatchEvent(new CustomEvent('arcade:restart'))
    setMenuOpen(false)
  }

  const onPauseResume = () => {
    if (paused) {
      setMenuOpen(false)
      return
    }
    setPaused(true)
  }

  return (
    <div className="arcade-menu" role="dialog" aria-modal="true" aria-label="Arcade menu">
      <button
        type="button"
        className="arcade-menu-backdrop"
        tabIndex={-1}
        aria-label="Close menu"
        onClick={() => setMenuOpen(false)}
      />
      <div className="arcade-menu-panel" ref={panelRef}>
        {currentGame ? (
          <button type="button" className="arcade-menu-item" onClick={onPauseResume}>
            {paused ? 'Resume' : 'Pause'}
          </button>
        ) : null}
        <button type="button" className="arcade-menu-item" onClick={restart}>
          Restart
        </button>
        <button type="button" className="arcade-menu-item" onClick={toggleSound}>
          <span>Sound</span>
          <span className="arcade-menu-meta">{soundEnabled ? 'On' : 'Off'}</span>
        </button>
        {currentGame === 'pong' ? (
          <button type="button" className="arcade-menu-item" onClick={cyclePongDifficulty}>
            <span>Difficulty</span>
            <span className="arcade-menu-meta">{pongDifficulty.toUpperCase()}</span>
          </button>
        ) : null}
        {fullscreenSupported ? (
          <button type="button" className="arcade-menu-item" onClick={toggleFullscreen}>
            <span>Fullscreen</span>
            <span className="arcade-menu-meta">{isFullscreen ? 'On' : 'Off'}</span>
          </button>
        ) : null}
        <div className="arcade-menu-item">
          <span>High Score</span>
          {currentGame ? (
            <span className="arcade-menu-meta">BEST {formatArcadeScore(bestScores[currentGame])}</span>
          ) : null}
        </div>
        {currentGame ? null : (
          <div className="arcade-menu-scores">
            {GAMES.map((game) => (
              <div key={game.id} className="arcade-menu-score-row">
                <span>
                  {game.index} {game.title}
                </span>
                <span>{formatArcadeScore(bestScores[game.id])}</span>
              </div>
            ))}
          </div>
        )}
        <Link href="/" className="arcade-menu-item" onClick={() => setMenuOpen(false)}>
          Exit Arcade
        </Link>
      </div>
    </div>
  )
}
