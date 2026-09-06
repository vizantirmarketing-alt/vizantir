export interface GameLoopOptions {
  update: (dtSeconds: number) => void
  render: (alpha: number) => void
  step?: number
  maxFrameDelta?: number
}

export interface GameLoop {
  start(): void
  stop(): void
  pause(): void
  resume(): void
  isRunning(): boolean
}

export function createGameLoop({
  update,
  render,
  step = 1 / 120,
  maxFrameDelta = 0.1,
}: GameLoopOptions): GameLoop {
  let handle = 0
  let running = false
  let paused = false
  let lastTime = 0
  let accumulator = 0

  const tick = (now: number) => {
    handle = window.requestAnimationFrame(tick)
    if (paused) {
      lastTime = now
      return
    }

    const delta = Math.min(Math.max((now - lastTime) / 1000, 0), maxFrameDelta)
    lastTime = now
    accumulator += delta

    while (accumulator >= step) {
      update(step)
      accumulator -= step
    }

    render(accumulator / step)
  }

  return {
    start() {
      if (running) return
      running = true
      paused = false
      lastTime = performance.now()
      accumulator = 0
      handle = window.requestAnimationFrame(tick)
    },
    stop() {
      running = false
      paused = false
      accumulator = 0
      if (handle !== 0) {
        window.cancelAnimationFrame(handle)
        handle = 0
      }
    },
    pause() {
      paused = true
    },
    resume() {
      if (!running) return
      paused = false
      lastTime = performance.now()
    },
    isRunning() {
      return running
    },
  }
}
