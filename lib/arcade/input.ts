export interface PointerAxis {
  target: number | null
  isActive: boolean
  destroy(): void
}

export function createPointerAxis(
  element: HTMLElement,
  options: {
    axis: 'x' | 'y'
    toLogical: (clientX: number, clientY: number) => { x: number; y: number }
  },
): PointerAxis {
  const state: PointerAxis = {
    target: null,
    isActive: false,
    destroy() {
      element.removeEventListener('pointermove', onMove)
      element.removeEventListener('pointerdown', onDown)
      element.removeEventListener('pointerup', onUp)
      element.removeEventListener('pointercancel', onUp)
      element.removeEventListener('pointerleave', onLeave)
    },
  }

  const read = (event: PointerEvent) => {
    const point = options.toLogical(event.clientX, event.clientY)
    state.target = options.axis === 'x' ? point.x : point.y
  }

  const onMove = (event: PointerEvent) => {
    if (!event.isPrimary) return
    if (state.isActive || event.buttons === 0) {
      read(event)
    }
  }

  const onDown = (event: PointerEvent) => {
    if (!event.isPrimary) return
    state.isActive = true
    read(event)
    element.setPointerCapture(event.pointerId)
  }

  const onUp = (event: PointerEvent) => {
    if (!event.isPrimary) return
    state.isActive = false
    if (element.hasPointerCapture(event.pointerId)) {
      element.releasePointerCapture(event.pointerId)
    }
  }

  const onLeave = (event: PointerEvent) => {
    if (!event.isPrimary || state.isActive) return
    state.target = null
  }

  element.addEventListener('pointermove', onMove)
  element.addEventListener('pointerdown', onDown)
  element.addEventListener('pointerup', onUp)
  element.addEventListener('pointercancel', onUp)
  element.addEventListener('pointerleave', onLeave)

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
