export interface PointerAxis {
  target: number | null
  isActive: boolean
  isLocked: boolean
  isTouch: boolean
  requestLock(): void
  releaseLock(): void
  destroy(): void
}

const TOUCH_GAIN = 1.25

function hasFinePointer(): boolean {
  return window.matchMedia('(pointer: fine)').matches
}

function isCoarsePointer(): boolean {
  return window.matchMedia('(pointer: coarse)').matches
}

function isTouchMode(event: PointerEvent): boolean {
  return event.pointerType === 'touch' || isCoarsePointer()
}

function requestPointerLockOn(element: HTMLElement): void {
  const request = element.requestPointerLock.bind(element) as (options?: {
    unadjustedMovement?: boolean
  }) => Promise<void> | void

  const fallback = () => {
    try {
      request()
    } catch {
      // Some browsers reject the no-argument form as well.
    }
  }

  try {
    const result = request({ unadjustedMovement: true })
    if (result && typeof result.then === 'function') {
      void result.catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'NotSupportedError') {
          fallback()
        }
      })
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotSupportedError') {
      fallback()
    }
  }
}

export function createPointerAxis(
  element: HTMLElement,
  options: {
    axis: 'x' | 'y'
    toLogical: (clientX: number, clientY: number) => { x: number; y: number }
    getScale: () => number
    getCurrent: () => number
    range: () => { min: number; max: number }
    sensitivity?: number
    onLockChange?: (locked: boolean) => void
  },
): PointerAxis {
  const sensitivity = options.sensitivity ?? 1.0

  const clampTarget = (value: number) => {
    const { min, max } = options.range()
    return Math.min(max, Math.max(min, value))
  }

  const clientOnAxis = (event: PointerEvent) => (options.axis === 'x' ? event.clientX : event.clientY)

  let touchStartFinger = 0
  let touchStartPaddle = 0
  let touchNotified = false

  const state: PointerAxis = {
    target: null,
    isActive: false,
    isLocked: false,
    isTouch: false,
    requestLock() {
      if (document.pointerLockElement !== null) return
      if (!hasFinePointer()) return
      requestPointerLockOn(element)
    },
    releaseLock() {
      if (document.pointerLockElement === element) {
        document.exitPointerLock()
      }
    },
    destroy() {
      if (document.pointerLockElement === element) {
        document.exitPointerLock()
      }
      element.removeEventListener('pointermove', onMove)
      element.removeEventListener('pointerdown', onDown)
      element.removeEventListener('pointerup', onUp)
      element.removeEventListener('pointercancel', onUp)
      element.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('pointerlockchange', onLockChange)
      document.removeEventListener('pointerlockerror', onLockError)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
    },
  }

  const setLocked = (locked: boolean) => {
    if (state.isLocked === locked) return
    state.isLocked = locked
    options.onLockChange?.(locked)
  }

  const applyAbsolute = (event: PointerEvent) => {
    const point = options.toLogical(event.clientX, event.clientY)
    const raw = options.axis === 'x' ? point.x : point.y
    state.target = clampTarget(raw)
  }

  const applyLockedMovement = (event: PointerEvent) => {
    const movement = options.axis === 'x' ? event.movementX : event.movementY
    const scale = options.getScale()
    if (scale <= 0) return
    const { min, max } = options.range()
    const current = state.target ?? (min + max) / 2
    state.target = clampTarget(current + (movement / scale) * sensitivity)
  }

  const applyTouch = (event: PointerEvent) => {
    const scale = options.getScale()
    if (scale <= 0) return
    const delta = ((clientOnAxis(event) - touchStartFinger) / scale) * TOUCH_GAIN
    state.target = clampTarget(touchStartPaddle + delta)
    if (!touchNotified && Math.abs(clientOnAxis(event) - touchStartFinger) > 2) {
      touchNotified = true
      element.dispatchEvent(new CustomEvent('arcade:paddle-drag', { bubbles: true }))
    }
  }

  const endTouch = () => {
    state.isTouch = false
    touchNotified = false
  }

  const onMove = (event: PointerEvent) => {
    if (!event.isPrimary) return
    if (state.isLocked) {
      applyLockedMovement(event)
      return
    }
    if (state.isTouch) {
      applyTouch(event)
      return
    }
    if (isTouchMode(event)) return
    if (state.isActive || event.buttons === 0) {
      applyAbsolute(event)
    }
  }

  const onDown = (event: PointerEvent) => {
    if (!event.isPrimary) return
    state.isActive = true
    if (state.isLocked) {
      element.setPointerCapture(event.pointerId)
      return
    }
    if (isTouchMode(event)) {
      state.isTouch = true
      touchStartFinger = clientOnAxis(event)
      touchStartPaddle = options.getCurrent()
      touchNotified = false
      state.target = clampTarget(touchStartPaddle)
      element.setPointerCapture(event.pointerId)
      return
    }
    applyAbsolute(event)
    element.setPointerCapture(event.pointerId)
  }

  const onUp = (event: PointerEvent) => {
    if (!event.isPrimary) return
    state.isActive = false
    endTouch()
    if (element.hasPointerCapture(event.pointerId)) {
      element.releasePointerCapture(event.pointerId)
    }
  }

  const onLeave = (event: PointerEvent) => {
    if (!event.isPrimary || state.isActive || state.isLocked) return
    state.target = null
  }

  const onLockChange = () => {
    setLocked(document.pointerLockElement === element)
  }

  const onLockError = () => {
    setLocked(document.pointerLockElement === element)
  }

  const onFullscreenChange = () => {
    if (state.isLocked && document.pointerLockElement !== element) {
      setLocked(false)
    }
  }

  element.addEventListener('pointermove', onMove)
  element.addEventListener('pointerdown', onDown)
  element.addEventListener('pointerup', onUp)
  element.addEventListener('pointercancel', onUp)
  element.addEventListener('pointerleave', onLeave)
  document.addEventListener('pointerlockchange', onLockChange)
  document.addEventListener('pointerlockerror', onLockError)
  document.addEventListener('fullscreenchange', onFullscreenChange)

  return state
}

export interface KeyboardInput {
  isDown(code: string): boolean
  onPress(code: string, cb: () => void): void
  destroy(): void
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

export function createKeyboard(keys: string[]): KeyboardInput {
  const owned = new Set(keys)
  const down = new Set<string>()
  const presses = new Map<string, Array<() => void>>()

  const onDown = (event: KeyboardEvent) => {
    if (!owned.has(event.code) || isTypingTarget(event.target)) return
    event.preventDefault()
    if (event.repeat) return
    down.add(event.code)
    const handlers = presses.get(event.code)
    if (handlers) {
      for (const handler of handlers) handler()
    }
  }

  const onUp = (event: KeyboardEvent) => {
    if (!owned.has(event.code)) return
    down.delete(event.code)
  }

  window.addEventListener('keydown', onDown)
  window.addEventListener('keyup', onUp)

  return {
    isDown(code) {
      return down.has(code)
    },
    onPress(code, cb) {
      const list = presses.get(code) ?? []
      list.push(cb)
      presses.set(code, list)
    },
    destroy() {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      down.clear()
      presses.clear()
    },
  }
}
