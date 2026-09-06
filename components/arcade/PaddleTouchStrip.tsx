'use client'

import { useEffect, useState, type ReactNode } from 'react'

const DRAG_HINT_KEY = 'vizantir.arcade.paddle-drag'

function readDragHintUsed(): boolean {
  try {
    return window.sessionStorage.getItem(DRAG_HINT_KEY) === '1'
  } catch {
    return false
  }
}

function writeDragHintUsed(): void {
  try {
    window.sessionStorage.setItem(DRAG_HINT_KEY, '1')
  } catch {
    // Ignore quota / private mode.
  }
}

export function PaddleSurface({ children }: { children: ReactNode }) {
  const [hintUsed, setHintUsed] = useState(readDragHintUsed)

  useEffect(() => {
    const onDrag = () => {
      writeDragHintUsed()
      setHintUsed(true)
    }
    document.addEventListener('arcade:paddle-drag', onDrag)
    return () => document.removeEventListener('arcade:paddle-drag', onDrag)
  }, [])

  return (
    <div className="arcade-paddle-surface" data-arcade-pointer="">
      {children}
      <div className={hintUsed ? 'arcade-touch-strip is-used' : 'arcade-touch-strip'} aria-hidden="true">
        <span className="arcade-touch-strip-rail" />
        <span className="arcade-touch-strip-label">DRAG</span>
      </div>
    </div>
  )
}
