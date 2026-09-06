'use client'

import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'

import { useArcade } from '@/components/arcade/ArcadeProvider'
import { GAMES, getGame } from '@/lib/arcade/games'

export function MobileGameSelect() {
  const { currentGame } = useArcade()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([])
  const menuId = useId()

  const label = currentGame ? `${getGame(currentGame).title} ▾` : 'Select Game'

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const selectedIndex = GAMES.findIndex((game) => game.id === currentGame)
    const focusIndex = selectedIndex >= 0 ? selectedIndex : 0
    itemRefs.current[focusIndex]?.focus()
  }, [open, currentGame])

  const moveFocus = (direction: 1 | -1) => {
    const items = itemRefs.current.filter((item): item is HTMLAnchorElement => item !== null)
    if (items.length === 0) return
    const currentIndex = items.findIndex((item) => item === document.activeElement)
    const nextIndex =
      currentIndex === -1
        ? direction === 1
          ? 0
          : items.length - 1
        : (currentIndex + direction + items.length) % items.length
    items[nextIndex]?.focus()
  }

  const closeAndRestore = () => {
    setOpen(false)
    buttonRef.current?.focus()
  }

  return (
    <div className="arcade-select" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="arcade-select-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            setOpen(true)
          }
        }}
      >
        <span className="arcade-select-btn-label">{label}</span>
      </button>
      {open ? (
        <ul
          id={menuId}
          className="arcade-select-panel"
          role="menu"
          aria-label="Arcade games"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault()
              closeAndRestore()
              return
            }
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              moveFocus(1)
              return
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault()
              moveFocus(-1)
            }
          }}
        >
          {GAMES.map((game, index) => {
            const active = currentGame === game.id
            return (
              <li key={game.id} role="none">
                <a
                  href={game.href}
                  role="menuitem"
                  className="arcade-select-option"
                  aria-current={active ? 'page' : undefined}
                  style={{ '--option-accent': game.accent } as CSSProperties}
                  ref={(node) => {
                    itemRefs.current[index] = node
                  }}
                  onClick={() => setOpen(false)}
                >
                  {game.title}
                </a>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
