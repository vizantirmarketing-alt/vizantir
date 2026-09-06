'use client'

import { useEffect, useRef, type RefObject } from 'react'

const COL_PX = 28
const TAP_PX = 10
const TAP_MS = 250
const CLASSIFY_PX = 12
const SOFT_PX = 24
const HARD_PX = 90
const HARD_VEL = 0.9

type Axis = 'horizontal' | 'vertical'

function sign(value: number): -1 | 0 | 1 {
  if (value > 0) return 1
  if (value < 0) return -1
  return 0
}

export function useStackGestures(
  canvasRef: RefObject<HTMLElement | null>,
  padRef: RefObject<HTMLElement | null>,
  options: {
    moveLeft: () => void
    moveRight: () => void
    rotate: () => void
    softDrop: (down: boolean) => void
    hardDrop: () => void
    launch: () => void
    isReady: () => boolean
    onEngage?: () => void
    onGesture?: () => void
    enabled?: boolean
  },
): void {
  const moveLeftRef = useRef(options.moveLeft)
  const moveRightRef = useRef(options.moveRight)
  const rotateRef = useRef(options.rotate)
  const softDropRef = useRef(options.softDrop)
  const hardDropRef = useRef(options.hardDrop)
  const launchRef = useRef(options.launch)
  const isReadyRef = useRef(options.isReady)
  const engageRef = useRef(options.onEngage)
  const gestureRef = useRef(options.onGesture)
  const enabled = options.enabled !== false

  useEffect(() => {
    moveLeftRef.current = options.moveLeft
    moveRightRef.current = options.moveRight
    rotateRef.current = options.rotate
    softDropRef.current = options.softDrop
    hardDropRef.current = options.hardDrop
    launchRef.current = options.launch
    isReadyRef.current = options.isReady
    engageRef.current = options.onEngage
    gestureRef.current = options.onGesture
  }, [
    options.hardDrop,
    options.isReady,
    options.launch,
    options.moveLeft,
    options.moveRight,
    options.onEngage,
    options.onGesture,
    options.rotate,
    options.softDrop,
  ])

  useEffect(() => {
    if (!enabled) return
    const nodes = [canvasRef.current, padRef.current].filter(
      (node): node is HTMLElement => node !== null,
    )
    if (nodes.length === 0) return

    let pointerId: number | null = null
    let originX = 0
    let originY = 0
    let lastX = 0
    let startedAt = 0
    let axis: Axis | null = null
    let acc = 0
    let lastDir: -1 | 0 | 1 = 0
    let readyAtDown = false
    let soft = false
    let ended = false
    let moved = false
    let captureNode: HTMLElement | null = null

    const finishSoft = () => {
      if (!soft) return
      soft = false
      softDropRef.current(false)
    }

    const reset = () => {
      pointerId = null
      axis = null
      acc = 0
      lastDir = 0
      readyAtDown = false
      ended = false
      moved = false
      captureNode = null
    }

    const releaseCapture = (event: PointerEvent) => {
      if (captureNode?.hasPointerCapture(event.pointerId)) {
        captureNode.releasePointerCapture(event.pointerId)
      }
    }

    const applyHorizontal = (deltaX: number) => {
      const next = sign(deltaX)
      if (next !== 0 && lastDir !== 0 && next !== lastDir) {
        acc = 0
      }
      if (next !== 0) lastDir = next
      acc += deltaX
      while (acc >= COL_PX) {
        acc -= COL_PX
        moveRightRef.current()
        moved = true
      }
      while (acc <= -COL_PX) {
        acc += COL_PX
        moveLeftRef.current()
        moved = true
      }
    }

    const onDown = (event: PointerEvent) => {
      if (!event.isPrimary) return
      if (pointerId !== null) {
        finishSoft()
        reset()
      }
      const target = event.target
      if (target instanceof Element && target.closest('button, a')) return
      const node = event.currentTarget
      if (!(node instanceof HTMLElement)) return
      pointerId = event.pointerId
      originX = event.clientX
      originY = event.clientY
      lastX = event.clientX
      startedAt = event.timeStamp
      axis = null
      acc = 0
      lastDir = 0
      readyAtDown = isReadyRef.current()
      soft = false
      ended = false
      moved = false
      captureNode = node
      event.preventDefault()
      try {
        node.setPointerCapture(event.pointerId)
      } catch {
        // Untrusted or detached pointers can reject capture.
      }
      engageRef.current?.()
      if (readyAtDown) launchRef.current()
    }

    const onMove = (event: PointerEvent) => {
      if (!event.isPrimary || pointerId !== event.pointerId || ended) return
      event.preventDefault()
      const dx = event.clientX - originX
      const dy = event.clientY - originY
      const absX = Math.abs(dx)
      const absY = Math.abs(dy)

      if (axis === null) {
        if (absX < CLASSIFY_PX && absY < CLASSIFY_PX) return
        if (absX === absY) return
        axis = absX > absY ? 'horizontal' : 'vertical'
        if (axis === 'horizontal') {
          applyHorizontal(dx)
          lastX = event.clientX
          return
        }
      }

      if (axis === 'horizontal') {
        applyHorizontal(event.clientX - lastX)
        lastX = event.clientX
        return
      }

      if (dy <= 0) return

      if (!soft && dy >= SOFT_PX && dy > absX) {
        soft = true
        moved = true
        softDropRef.current(true)
      }

      const elapsed = event.timeStamp - startedAt
      if (soft && dy >= HARD_PX && elapsed > 0 && dy / elapsed > HARD_VEL) {
        ended = true
        finishSoft()
        hardDropRef.current()
        moved = true
        releaseCapture(event)
      }
    }

    const onUp = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return
      event.preventDefault()
      releaseCapture(event)
      if (!ended) {
        const dx = event.clientX - originX
        const dy = event.clientY - originY
        const duration = event.timeStamp - startedAt
        const tap = axis === null && Math.hypot(dx, dy) < TAP_PX && duration < TAP_MS
        finishSoft()
        if (tap && !readyAtDown) {
          rotateRef.current()
          moved = true
        }
      } else {
        finishSoft()
      }
      if (moved) gestureRef.current?.()
      reset()
    }

    const listenerOpts: AddEventListenerOptions = { passive: false }
    for (const node of nodes) {
      node.addEventListener('pointerdown', onDown, listenerOpts)
      node.addEventListener('pointermove', onMove, listenerOpts)
      node.addEventListener('pointerup', onUp, listenerOpts)
      node.addEventListener('pointercancel', onUp, listenerOpts)
    }

    return () => {
      finishSoft()
      for (const node of nodes) {
        node.removeEventListener('pointerdown', onDown)
        node.removeEventListener('pointermove', onMove)
        node.removeEventListener('pointerup', onUp)
        node.removeEventListener('pointercancel', onUp)
      }
    }
  }, [canvasRef, enabled, padRef])
}
