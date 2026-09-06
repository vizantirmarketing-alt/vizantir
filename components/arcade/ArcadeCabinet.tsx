'use client'

import { useLayoutEffect, useRef, type ReactNode } from 'react'

import { ArcadeBackdrop } from '@/components/arcade/ArcadeBackdrop'
import { useArcade } from '@/components/arcade/ArcadeProvider'
import { PiecePreview } from '@/components/arcade/PiecePreview'
import { VegasScene } from '@/components/arcade/VegasScene'
import { getGame, type GameId } from '@/lib/arcade/games'

const TICKER = '★ INSERT COIN ★ VIZANTIR ARCADE ★ LOCAL SCORES ★ '

const LEGENDS: Record<GameId | 'lobby', ReadonlyArray<{ keys: string; action: string }>> = {
  lobby: [
    { keys: 'ENTER', action: 'SELECT' },
    { keys: 'TAB', action: 'BROWSE' },
    { keys: 'M', action: 'MUTE' },
  ],
  breakout: [
    { keys: '← →', action: 'MOVE' },
    { keys: 'SPACE', action: 'LAUNCH' },
    { keys: 'CLICK', action: 'LOCK MOUSE' },
    { keys: 'P', action: 'PAUSE' },
    { keys: 'M', action: 'MUTE' },
  ],
  stack: [
    { keys: '← →', action: 'MOVE' },
    { keys: '↑', action: 'ROTATE' },
    { keys: '↓', action: 'SOFT DROP' },
    { keys: 'SPACE', action: 'DROP' },
    { keys: 'C', action: 'HOLD' },
    { keys: 'P', action: 'PAUSE' },
    { keys: 'M', action: 'MUTE' },
  ],
  snake: [
    { keys: '↑ ↓ ← →', action: 'MOVE' },
    { keys: 'WASD', action: 'MOVE' },
    { keys: 'P', action: 'PAUSE' },
    { keys: 'M', action: 'MUTE' },
  ],
  pong: [
    { keys: '← →', action: 'MOVE' },
    { keys: 'SPACE', action: 'SERVE' },
    { keys: 'CLICK', action: 'LOCK MOUSE' },
    { keys: 'P', action: 'PAUSE' },
    { keys: 'M', action: 'MUTE' },
  ],
}

function padScore(value: number | undefined): string {
  if (value === undefined) return '------'
  return String(Math.max(0, Math.floor(value))).padStart(6, '0')
}

function PixelHearts({ lives }: { lives: number }) {
  return (
    <span className="arcade-cab-hearts" role="img" aria-label={`${lives} lives`}>
      {[0, 1, 2].map((index) => (
        <svg
          key={index}
          className={index < lives ? 'arcade-cab-heart is-on' : 'arcade-cab-heart'}
          viewBox="0 0 7 6"
          width="12"
          height="10"
          aria-hidden="true"
        >
          <path d="M1 1h1v1H1zM5 1h1v1H5zM2 0h1v1H2zM4 0h1v1H4zM0 2h7v1H0zM1 3h5v1H1zM2 4h3v1H2zM3 5h1v1H3z" />
        </svg>
      ))}
    </span>
  )
}

function HudCell({
  label,
  value,
  tone = 'yellow',
}: {
  label: string
  value: ReactNode
  tone?: 'yellow' | 'mint' | 'purple' | 'magenta'
}) {
  return (
    <div className="arcade-cab-cell">
      <span className={`arcade-cab-label is-${tone}`}>{label}</span>
      <span className="arcade-cab-value">{value}</span>
    </div>
  )
}

function CabinetHud() {
  const { currentGame, hud, bestScores, soundEnabled, toggleSound } = useArcade()
  const title = currentGame ? getGame(currentGame).title : 'VIZANTIR ARCADE'
  const best = currentGame ? bestScores[currentGame] : undefined

  return (
    <div className="arcade-cab-hud">
      <p className="arcade-cab-title">{title}</p>
      <div className="arcade-cab-stats">
        {currentGame === 'breakout' ? (
          <>
            <HudCell label="SCORE" value={padScore(hud?.score ?? 0)} />
            <HudCell label="BEST" value={padScore(best)} tone="mint" />
            <HudCell label="LV" value={hud?.level ?? 1} tone="purple" />
            <HudCell label="LIVES" value={<PixelHearts lives={hud?.lives ?? 3} />} tone="magenta" />
            <HudCell label="POWER" value={hud?.power || '------'} tone="magenta" />
          </>
        ) : null}
        {currentGame === 'stack' ? (
          <>
            <HudCell label="SCORE" value={padScore(hud?.score ?? 0)} />
            <HudCell label="BEST" value={padScore(best)} tone="mint" />
            <HudCell label="LINES" value={hud?.lines ?? 0} tone="mint" />
            <HudCell label="LV" value={hud?.level ?? 1} tone="purple" />
            <div className="arcade-cab-cell">
              <span className="arcade-cab-label is-yellow">NEXT</span>
              <PiecePreview label="NEXT" family={hud?.nextFamily ?? null} compact />
            </div>
            <div className="arcade-cab-cell">
              <span className="arcade-cab-label is-mint">HOLD</span>
              <PiecePreview label="HOLD" family={hud?.holdFamily ?? null} compact />
            </div>
          </>
        ) : null}
        {currentGame === 'snake' ? (
          <>
            <HudCell label="SCORE" value={padScore(hud?.score ?? 0)} />
            <HudCell label="BEST" value={padScore(best)} tone="mint" />
            <HudCell label="LENGTH" value={hud?.length ?? 4} tone="mint" />
          </>
        ) : null}
        {currentGame === 'pong' ? (
          <>
            <HudCell label="YOU" value={padScore(hud?.score ?? 0)} />
            <HudCell label="CPU" value={padScore(hud?.opponentScore ?? 0)} tone="magenta" />
            <HudCell label="BEST" value={padScore(best)} tone="mint" />
            <PongDiffCell />
          </>
        ) : null}
      </div>
      <button
        type="button"
        className={soundEnabled ? 'arcade-cab-mute' : 'arcade-cab-mute is-off'}
        aria-label={soundEnabled ? 'Sound on' : 'Sound off'}
        aria-pressed={!soundEnabled}
        onClick={toggleSound}
      >
        [M]
      </button>
    </div>
  )
}

function PongDiffCell() {
  const { pongDifficulty } = useArcade()
  return <HudCell label="DIFF" value={pongDifficulty.toUpperCase()} tone="purple" />
}

function CabinetLegend() {
  const { currentGame, reducedMotion } = useArcade()
  const binds = LEGENDS[currentGame ?? 'lobby']

  return (
    <div className="arcade-cab-legend">
      <div className="arcade-cab-binds">
        {binds.map((bind) => (
          <span key={`${bind.keys}-${bind.action}`} className="arcade-cab-bind">
            <kbd className="arcade-cab-key">{bind.keys}</kbd>
            <span className="arcade-cab-action">{bind.action}</span>
          </span>
        ))}
      </div>
      <div className="arcade-cab-ticker">
        {reducedMotion ? (
          <p className="arcade-cab-ticker-static">{TICKER.trim()}</p>
        ) : (
          <div className="arcade-cab-ticker-track">
            <span>{TICKER.repeat(4)}</span>
            <span aria-hidden="true">{TICKER.repeat(4)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function ArcadeCabinet({ children }: { children: ReactNode }) {
  const { currentGame, stageRef } = useArcade()
  const cabinetRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const node = cabinetRef.current
    if (!node) return
    const media = window.matchMedia('(min-width: 768px)')
    const previous = stageRef.current

    const apply = () => {
      if (media.matches) {
        stageRef.current = node
        return
      }
      if (stageRef.current === node) {
        stageRef.current = previous
      }
    }

    apply()
    media.addEventListener('change', apply)
    return () => {
      media.removeEventListener('change', apply)
      if (stageRef.current === node) {
        stageRef.current = previous
      }
    }
  }, [stageRef])

  return (
    <div ref={cabinetRef} className="arcade-cabinet">
      <CabinetHud />
      <div className="arcade-cab-screen">
        {currentGame ? <VegasScene /> : <ArcadeBackdrop contained />}
        <div className="arcade-cab-scan" aria-hidden="true" />
        <div className="arcade-cab-crt" aria-hidden="true" />
        <div className="arcade-cab-stage">{children}</div>
      </div>
      <CabinetLegend />
    </div>
  )
}
