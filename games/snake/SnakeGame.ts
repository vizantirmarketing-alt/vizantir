import { applyCanvasFit, fitCanvas, type CanvasFit } from '@/lib/arcade/canvas'
import { createArcadeAudio } from '@/lib/arcade/audio'
import { createGameLoop } from '@/lib/arcade/gameLoop'
import { createKeyboard } from '@/lib/arcade/input'
import type { ArcadeGameHost, GameFactory, SnakeGame } from '@/lib/arcade/types'

import {
  BOARD_H,
  BOARD_W,
  BOARD_X,
  BOARD_Y,
  CELL,
  COLS,
  CREAM,
  DEATH_FADE,
  DEATH_FLASH,
  DESKTOP_FIT_H,
  FOOD_PULSE,
  LOGICAL_H,
  LOGICAL_W,
  MAGENTA,
  MINT,
  QUEUE_MAX,
  ROWS,
  START_INTERVAL,
  TURN_RATE_MS,
  colToX,
  foodPoints,
  nextInterval,
  rowToY,
  startCells,
} from '@/games/snake/config'
import {
  DIR_VEC,
  cellKey,
  isEdgeWrap,
  isOpposite,
  wrapCoord,
  type Cell,
  type Direction,
  type GamePhase,
} from '@/games/snake/types'

const KEYS = [
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'KeyP',
]

const KEY_DIR: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
}

function hexAlpha(color: string, alpha: number): string {
  const r = Number.parseInt(color.slice(1, 3), 16)
  const g = Number.parseInt(color.slice(3, 5), 16)
  const b = Number.parseInt(color.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t
}

function unwrapTo(from: Cell, to: Cell, step?: Cell): Cell {
  if (!isEdgeWrap(from, to)) return to
  if (step) return { col: from.col + step.col, row: from.row + step.row }
  return {
    col: Math.abs(from.col - to.col) > 1 ? from.col + (from.col < to.col ? -1 : 1) : to.col,
    row: Math.abs(from.row - to.row) > 1 ? from.row + (from.row < to.row ? -1 : 1) : to.row,
  }
}

export const createSnakeGame: GameFactory = (host: ArcadeGameHost): SnakeGame => {
  const canvas = host.canvas
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Snake canvas context unavailable')
  }

  const audio = createArcadeAudio(() => host.soundEnabled())
  const reduced = () => host.reducedMotion()

  let view: CanvasFit = { scale: 1, offsetX: 0, offsetY: 0, dpr: 1 }
  let phase: GamePhase = 'ready'
  let segments: Cell[] = startCells('right')
  let heading: Direction = 'right'
  let queue: Direction[] = []
  let food: Cell | null = null
  let score = 0
  let lastScore = -1
  let lastLength = -1
  let interval = START_INTERVAL
  let tickTimer = 0
  let prevHead: Cell = { ...segments[0] }
  let prevTail: Cell | null = null
  let deathTimer = 0
  let pulseTime = 0
  let lastTurnAt = 0
  let frozen = false
  let destroyed = false

  const keyboard = createKeyboard(KEYS)

  const unlock = () => audio.unlock()
  canvas.addEventListener('pointerdown', unlock)
  window.addEventListener('keydown', unlock)

  const emitScore = () => {
    if (score === lastScore) return
    lastScore = score
    host.onScore(score)
  }

  const emitLength = () => {
    const len = segments.length
    if (len === lastLength) return
    lastLength = len
    host.onLength?.(len)
  }

  const playTurn = () => {
    const now = performance.now()
    if (now - lastTurnAt < TURN_RATE_MS) return
    lastTurnAt = now
    audio.play('turn')
  }

  const occupied = (col: number, row: number, ignoreTail: boolean): boolean => {
    const last = segments.length - 1
    for (let i = 0; i < segments.length; i += 1) {
      if (ignoreTail && i === last) continue
      const cell = segments[i]
      if (cell.col === col && cell.row === row) return true
    }
    return false
  }

  const spawnFood = (): boolean => {
    const free: Cell[] = []
    const taken = new Set<number>()
    for (const cell of segments) {
      taken.add(cellKey(cell.col, cell.row))
    }
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        if (!taken.has(cellKey(col, row))) {
          free.push({ col, row })
        }
      }
    }
    if (free.length === 0) {
      food = null
      return false
    }
    food = free[Math.floor(Math.random() * free.length)] ?? null
    return food !== null
  }

  const finishGame = (complete = false) => {
    phase = 'gameOver'
    loop.stop()
    draw(0)
    host.onGameOver(score, complete ? { complete: true } : undefined)
  }

  const beginDeath = () => {
    if (phase !== 'playing') return
    phase = 'dying'
    deathTimer = 0
    audio.play('death')
  }

  const lastQueued = (): Direction => queue[queue.length - 1] ?? heading

  const queueTurn = (dir: Direction) => {
    if (dir === lastQueued()) return
    if (isOpposite(dir, lastQueued())) return
    if (queue.length >= QUEUE_MAX) return
    queue.push(dir)
    playTurn()
  }

  const placeReady = (dir: Direction) => {
    heading = dir
    queue = []
    segments = startCells(dir)
    prevHead = { ...segments[0] }
    prevTail = null
    tickTimer = 0
  }

  function launch(): void {
    if (destroyed || phase !== 'ready') return
    phase = 'playing'
    frozen = false
    tickTimer = 0
    audio.play('start')
    if (!loop.isRunning()) loop.start()
    else loop.resume()
  }

  const handleTurn = (dir: Direction) => {
    if (destroyed) return
    if (phase === 'dying' || phase === 'gameOver') return
    if (frozen && phase !== 'ready') return
    unlock()
    if (phase === 'ready') {
      placeReady(dir)
      emitLength()
      launch()
      return
    }
    queueTurn(dir)
  }

  const stepSnake = () => {
    if (queue.length > 0) {
      const next = queue.shift()
      if (next) heading = next
    }
    const head = segments[0]
    const vec = DIR_VEC[heading]
    const nextCol = wrapCoord(head.col + vec.col, COLS)
    const nextRow = wrapCoord(head.row + vec.row, ROWS)

    const eating = food !== null && food.col === nextCol && food.row === nextRow
    if (occupied(nextCol, nextRow, !eating)) {
      beginDeath()
      return
    }

    prevHead = { col: head.col, row: head.row }
    segments.unshift({ col: nextCol, row: nextRow })

    if (eating) {
      prevTail = null
      interval = nextInterval(interval)
      score += foodPoints(interval)
      emitScore()
      emitLength()
      audio.play('food')
      if (!spawnFood()) {
        finishGame(true)
      }
      return
    }

    prevTail = segments.pop() ?? null
  }

  const update = (dt: number) => {
    if (phase === 'gameOver') return

    if (phase === 'ready') {
      pulseTime += dt
      return
    }

    if (phase === 'dying') {
      deathTimer += dt
      if (deathTimer >= DEATH_FADE) {
        finishGame(false)
      }
      return
    }

    if (phase !== 'playing') return

    pulseTime += dt
    tickTimer += dt
    while (phase === 'playing' && tickTimer >= interval) {
      tickTimer -= interval
      stepSnake()
    }
  }

  const bodyAlpha = (index: number, fade: number): number => {
    if (segments.length <= 1) return 1 * fade
    const t = index / (segments.length - 1)
    return (1 - t * 0.55) * fade
  }

  const drawRounded = (x: number, y: number, size: number, radius: number) => {
    ctx.beginPath()
    ctx.roundRect(x, y, size, size, radius)
  }

  const draw = (alpha: number) => {
    void alpha
    if (destroyed) return

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    applyCanvasFit(ctx, view)
    ctx.beginPath()
    ctx.rect(BOARD_X, BOARD_Y, BOARD_W, BOARD_H)
    ctx.clip()

    ctx.fillStyle = 'rgba(9, 11, 26, 0.92)'
    ctx.fillRect(BOARD_X, BOARD_Y, BOARD_W, BOARD_H)

    ctx.strokeStyle = 'rgba(245, 241, 232, 0.06)'
    ctx.lineWidth = 1
    for (let col = 0; col <= COLS; col += 1) {
      const x = BOARD_X + col * CELL + 0.5
      ctx.beginPath()
      ctx.moveTo(x, BOARD_Y)
      ctx.lineTo(x, BOARD_Y + BOARD_H)
      ctx.stroke()
    }
    for (let row = 0; row <= ROWS; row += 1) {
      const y = BOARD_Y + row * CELL + 0.5
      ctx.beginPath()
      ctx.moveTo(BOARD_X, y)
      ctx.lineTo(BOARD_X + BOARD_W, y)
      ctx.stroke()
    }

    const dying = phase === 'dying'
    const fade = dying ? Math.max(0, 1 - deathTimer / DEATH_FADE) : 1
    const flashHead = dying && deathTimer < DEATH_FLASH
    const motion = !reduced()
    const slide = motion && phase === 'playing' && interval > 0 ? Math.min(1, tickTimer / interval) : 1

    if (food) {
      const cx = colToX(food.col) + CELL / 2
      const cy = rowToY(food.row) + CELL / 2
      const pulse = motion ? 0.5 + 0.5 * Math.sin((pulseTime * Math.PI * 2) / FOOD_PULSE) : 0.55
      const haloR = 5.5 + pulse * 3.2
      ctx.save()
      if (motion) {
        ctx.shadowColor = hexAlpha(MAGENTA, 0.55)
        ctx.shadowBlur = 8 + pulse * 6
      }
      ctx.strokeStyle = hexAlpha(MAGENTA, motion ? 0.22 + pulse * 0.28 : 0.35)
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.arc(cx, cy, haloR, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = MAGENTA
      ctx.beginPath()
      ctx.arc(cx, cy, 3.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    const inset = 1.5
    const size = CELL - inset * 2
    const radius = 3.5

    const paintCell = (col: number, row: number, fill: string, glow: boolean) => {
      const x = colToX(col) + inset
      const y = rowToY(row) + inset
      if (glow) {
        ctx.save()
        ctx.shadowColor = hexAlpha(MINT, 0.7)
        ctx.shadowBlur = 8
        ctx.fillStyle = fill
        drawRounded(x, y, size, radius)
        ctx.fill()
        ctx.restore()
        return
      }
      ctx.fillStyle = fill
      drawRounded(x, y, size, radius)
      ctx.fill()
    }

    const paintSegment = (from: Cell, to: Cell, t: number, fill: string, glow: boolean, step?: Cell) => {
      const wrapping = isEdgeWrap(from, to)
      const dest = wrapping ? unwrapTo(from, to, step) : to
      const col = lerp(from.col, dest.col, t)
      const row = lerp(from.row, dest.row, t)
      paintCell(col, row, fill, glow)
      if (!wrapping) return
      const stepCol = dest.col - from.col
      const stepRow = dest.row - from.row
      paintCell(col - stepCol * COLS, row - stepRow * ROWS, fill, glow)
    }

    for (let i = segments.length - 1; i >= 1; i -= 1) {
      const cell = segments[i]
      const from = i < segments.length - 1 ? segments[i + 1] : (prevTail ?? cell)
      const wrapping = isEdgeWrap(from, cell)
      paintSegment(from, cell, wrapping ? slide : 1, hexAlpha(MINT, bodyAlpha(i, fade)), false)
    }

    const head = segments[0]
    if (head) {
      paintSegment(
        prevHead,
        head,
        slide,
        flashHead ? CREAM : hexAlpha(MINT, fade),
        motion && !dying,
        DIR_VEC[heading],
      )
    }

    ctx.save()
    ctx.strokeStyle = hexAlpha(MINT, 0.35)
    ctx.lineWidth = 1.5
    ctx.strokeRect(BOARD_X + 0.5, BOARD_Y + 0.5, BOARD_W - 1, BOARD_H - 1)

    ctx.strokeStyle = hexAlpha(CREAM, 0.12)
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(BOARD_X + 0.5, BOARD_Y + 0.5)
    ctx.lineTo(BOARD_X + BOARD_W - 0.5, BOARD_Y + 0.5)
    ctx.moveTo(BOARD_X + BOARD_W - 0.5, BOARD_Y + 0.5)
    ctx.lineTo(BOARD_X + BOARD_W - 0.5, BOARD_Y + BOARD_H - 0.5)
    ctx.moveTo(BOARD_X + BOARD_W - 0.5, BOARD_Y + BOARD_H - 0.5)
    ctx.lineTo(BOARD_X + 0.5, BOARD_Y + BOARD_H - 0.5)
    ctx.moveTo(BOARD_X + 0.5, BOARD_Y + BOARD_H - 0.5)
    ctx.lineTo(BOARD_X + 0.5, BOARD_Y + 0.5)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()
    ctx.restore()
  }

  const loop = createGameLoop({ update, render: draw })

  const resetField = () => {
    heading = 'right'
    queue = []
    segments = startCells('right')
    prevHead = { ...segments[0] }
    prevTail = null
    score = 0
    lastScore = -1
    lastLength = -1
    interval = START_INTERVAL
    tickTimer = 0
    deathTimer = 0
    pulseTime = 0
    spawnFood()
    host.onScore(0)
    emitLength()
  }

  const enterReady = () => {
    phase = 'ready'
    host.onReady()
  }

  for (const [code, dir] of Object.entries(KEY_DIR)) {
    keyboard.onPress(code, () => handleTurn(dir))
  }
  keyboard.onPress('KeyP', () => {
    if (phase === 'dying' || phase === 'gameOver') return
    host.onPauseRequest?.()
  })

  const fit = (width: number, height: number) => {
    const mobile = window.matchMedia('(max-width: 767px)').matches
    const fitH = mobile ? LOGICAL_H : DESKTOP_FIT_H
    view = fitCanvas(canvas, width, height, LOGICAL_W, fitH, 2)
    if (!mobile) return
    const slack = height - LOGICAL_H * view.scale
    if (slack > 0) {
      view = { ...view, offsetY: slack }
    }
  }

  return {
    start() {
      if (destroyed) return
      frozen = false
      resetField()
      enterReady()
      audio.play('start')
      loop.start()
      draw(0)
    },
    pause() {
      if (phase === 'dying') return
      frozen = true
      loop.pause()
    },
    resume() {
      if (phase === 'gameOver') return
      frozen = false
      if (!loop.isRunning()) loop.start()
      else loop.resume()
    },
    restart() {
      if (destroyed) return
      frozen = false
      loop.stop()
      resetField()
      enterReady()
      loop.start()
      draw(0)
    },
    launch() {
      unlock()
      if (phase === 'ready') launch()
    },
    turnUp() {
      handleTurn('up')
    },
    turnDown() {
      handleTurn('down')
    },
    turnLeft() {
      handleTurn('left')
    },
    turnRight() {
      handleTurn('right')
    },
    resize(width, height) {
      fit(width, height)
      draw(0)
    },
    destroy() {
      destroyed = true
      loop.stop()
      keyboard.destroy()
      audio.destroy()
      canvas.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      segments = []
      queue = []
      food = null
    },
  }
}
