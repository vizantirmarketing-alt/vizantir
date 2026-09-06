'use client'

import Link from 'next/link'

import { useArcade } from '@/components/arcade/ArcadeProvider'
import { FullscreenToggle } from '@/components/arcade/FullscreenToggle'
import { GameSelector } from '@/components/arcade/GameSelector'
import { MobileGameSelect } from '@/components/arcade/MobileGameSelect'
import { ScoreDisplay } from '@/components/arcade/ScoreDisplay'
import { SoundToggle } from '@/components/arcade/SoundToggle'

function ArcadeMark({ compact = false }: { compact?: boolean }) {
  return (
    <a href="/play" className="arcade-mark" aria-label="Vizantir Arcade home">
      <span className="arcade-mark-kicker">VIZANTIR</span>
      <span className="arcade-mark-title" style={compact ? { fontSize: '1rem' } : { fontSize: '1.15rem' }}>
        ARCADE
      </span>
    </a>
  )
}

export function ArcadeHeader() {
  const { setMenuOpen } = useArcade()

  return (
    <header className="arcade-header arcade-chrome">
      <div className="arcade-header-desktop">
        <ArcadeMark />
        <GameSelector />
        <div className="arcade-header-actions">
          <ScoreDisplay />
          <SoundToggle />
          <FullscreenToggle />
          <button type="button" className="arcade-menu-btn" onClick={() => setMenuOpen(true)}>
            Menu
          </button>
          <Link href="/" className="arcade-exit">
            Exit Arcade
          </Link>
        </div>
      </div>
      <div className="arcade-header-mobile">
        <ArcadeMark compact />
        <div className="arcade-header-actions">
          <MobileGameSelect />
          <button type="button" className="arcade-menu-btn" onClick={() => setMenuOpen(true)}>
            Menu
          </button>
        </div>
      </div>
    </header>
  )
}
