'use client'

import { useEffect, useRef, useState, type PointerEvent } from 'react'

import { useGameActions } from '@/components/arcade/GameMount'
import type { GameId } from '@/lib/arcade/games'

const DAS_MS = 170
const ARR_MS = 30

function useHeldRepeat(action: () => void) {
  const dasId = useRef(0)
  const arrId = useRef(0)

  const stop = () => {
    if (dasId.current) window.clearTimeout(dasId.current)
    if (arrId.current) window.clearInterval(arrId.current)
    dasId.current = 0
    arrId.current = 0
  }

  const start = () => {
    stop()
    action()
    dasId.current = window.setTimeout(() => {
      action()
      arrId.current = window.setInterval(action, ARR_MS)
    }, DAS_MS)
  }

  useEffect(() => stop, [])

  return { start, stop }
}

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

  const classes = className ? [className] : ['arcade-stack-ctrl']
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
  const left = useHeldRepeat(() => actions?.moveLeft())
  const right = useHeldRepeat(() => actions?.moveRight())

  const engage = () => onEngage?.()

  if (game === 'snake') {
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

  if (game !== 'stack') return null

  return (
    <div className="arcade-mobile-controls arcade-stack-controls">
      <div className="arcade-stack-controls-row">
        <ControlButton
          label="LEFT"
          ariaLabel="Move left"
          onPress={() => {
            engage()
            left.start()
          }}
          onRelease={left.stop}
        />
        <ControlButton
          label="ROTATE"
          ariaLabel="Rotate piece"
          onPress={() => {
            engage()
            actions?.rotate()
          }}
        />
        <ControlButton
          label="RIGHT"
          ariaLabel="Move right"
          onPress={() => {
            engage()
            right.start()
          }}
          onRelease={right.stop}
        />
      </div>
      <div className="arcade-stack-controls-row">
        <ControlButton
          label="DOWN"
          ariaLabel="Soft drop"
          onPress={() => {
            engage()
            actions?.softDrop(true)
          }}
          onRelease={() => actions?.softDrop(false)}
        />
        <ControlButton
          label="DROP"
          ariaLabel="Hard drop"
          onPress={() => {
            engage()
            actions?.hardDrop()
          }}
        />
        <ControlButton
          label="HOLD"
          ariaLabel="Hold piece"
          className="arcade-stack-ctrl arcade-stack-ctrl-hold"
          onPress={() => {
            engage()
            actions?.hold()
          }}
        />
      </div>
    </div>
  )
}
