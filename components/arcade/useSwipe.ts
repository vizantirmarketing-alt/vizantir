'use client'

import { useEffect, useRef, type RefObject } from 'react'

export type SwipeDirection = 'up' | 'down' | 'left' | 'right'

const SWIPE_PX = 18
const TAP_PX = 8

export function useSwipe<T extends HTMLElement>(
  targetRef: RefObject<T | null>,
  options: {
    onSwipe: (direction: SwipeDirection) => void
    onTap?: () => void
    enabled?: boolean
  },
): void {
  const swipeRef = useRef(options.onSwipe)
  const tapRef = useRef(options.onTap)
  const enabled = options.enabled !== false

  useEffect(() => {
    swipeRef.current = options.onSwipe
    tapRef.current = options.onTap
  }, [options.onSwipe, options.onTap])

  useEffect(() => {
    const node = targetRef.current
    if (!node || !enabled) return

    let originX = 0
    let originY = 0
    let active = false
    let consumed = false
    let pointerId: number | null = null

    const release = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return
      if (node.hasPointerCapture(event.pointerId)) {
        node.releasePointerCapture(event.pointerId)
      }
      if (active && !consumed) {
        const dx = event.clientX - originX
        const dy = event.clientY - originY
        if (Math.hypot(dx, dy) < TAP_PX) {
          tapRef.current?.()
        }
      }
      active = false
      consumed = false
      pointerId = null
    }

    const onDown = (event: PointerEvent) => {
      if (!event.isPrimary || pointerId !== null) return
      pointerId = event.pointerId
      originX = event.clientX
      originY = event.clientY
      active = true
      consumed = false
      node.setPointerCapture(event.pointerId)
    }

    const onMove = (event: PointerEvent) => {
      if (!event.isPrimary || pointerId !== event.pointerId || !active || consumed) return
      const dx = event.clientX - originX
      const dy = event.clientY - originY
      const absX = Math.abs(dx)
      const absY = Math.abs(dy)
      if (absX < SWIPE_PX && absY < SWIPE_PX) return
      if (absX === absY) return
      consumed = true
      if (absX > absY) {
        swipeRef.current(dx > 0 ? 'right' : 'left')
        return
      }
      swipeRef.current(dy > 0 ? 'down' : 'up')
    }

    node.addEventListener('pointerdown', onDown)
    node.addEventListener('pointermove', onMove)
    node.addEventListener('pointerup', release)
    node.addEventListener('pointercancel', release)

    return () => {
      node.removeEventListener('pointerdown', onDown)
      node.removeEventListener('pointermove', onMove)
      node.removeEventListener('pointerup', release)
      node.removeEventListener('pointercancel', release)
    }
  }, [enabled, targetRef])
}
