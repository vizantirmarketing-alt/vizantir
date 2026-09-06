'use client'

import { useRef, useState, type PointerEvent } from 'react'

import { useGameActions } from '@/components/arcade/GameMount'
import type { GameId } from '@/lib/arcade/games'

function ControlButton({
  label,
  ariaLabel,
  className,
  onPress,
  onRelease,
}: {
  label: string
  ariaLabel: string
  className?: string
  onPress: () => void
  onRelease?: () => void
}) {
  const pointerId = useRef<number | null>(null)
  const [held, setHeld] = useState(false)

  const down = (event: PointerEvent<HTMLButtonElement>) => {
    if (pointerId.current !== null) return
    pointerId.current = event.pointerId
    event.currentTarget.setPointerCapture(event.pointerId)
    event.preventDefault()
    event.currentTarget.blur()
    setHeld(true)
    onPress()
  }

  const up = (event: PointerEvent<HTMLButtonElement>) => {
    if (pointerId.current !== event.pointerId) return
    pointerId.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setHeld(false)
    onRelease?.()
  }

  const classes = className ? [className] : ['arcade-snake-ctrl']
  if (held) classes.push('is-held')

  return (
    <button
      type="button"
      className={classes.join(' ')}
      aria-label={ariaLabel}
      onPointerDown={down}
      onPointerUp={up}
      onPointerCancel={up}
    >
      {label}
    </button>
  )
}

export function MobileControls({
  game,
  onEngage,
}: {
  game: GameId
  onEngage?: () => void
}) {
  const actions = useGameActions()
  const engage = () => onEngage?.()

  if (game !== 'snake') return null

  return (
    <div className="arcade-mobile-controls arcade-snake-controls">
      <div className="arcade-snake-pad">
        <ControlButton
          label="UP"
          ariaLabel="Turn up"
          className="arcade-snake-ctrl arcade-snake-pad-up"
          onPress={() => {
            engage()
            actions?.turnUp()
          }}
        />
        <ControlButton
          label="LEFT"
          ariaLabel="Turn left"
          className="arcade-snake-ctrl arcade-snake-pad-left"
          onPress={() => {
            engage()
            actions?.turnLeft()
          }}
        />
        <ControlButton
          label="DOWN"
          ariaLabel="Turn down"
          className="arcade-snake-ctrl arcade-snake-pad-down"
          onPress={() => {
            engage()
            actions?.turnDown()
          }}
        />
        <ControlButton
          label="RIGHT"
          ariaLabel="Turn right"
          className="arcade-snake-ctrl arcade-snake-pad-right"
          onPress={() => {
            engage()
            actions?.turnRight()
          }}
        />
      </div>
    </div>
  )
}
