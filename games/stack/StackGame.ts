import { applyCanvasFit, fitCanvas, type CanvasFit } from '@/lib/arcade/canvas'
import { createArcadeAudio } from '@/lib/arcade/audio'
import { createGameLoop } from '@/lib/arcade/gameLoop'
import { createKeyboard } from '@/lib/arcade/input'
import type { ArcadeGameHost, GameFactory, StackGame } from '@/lib/arcade/types'

import {
  ARR,
  BOARD_H,
  BOARD_W,
  BOARD_X,
  BOARD_Y,
  CELL,
  CLEAR_FLASH,
  COLS,
  DAS,
  HARD_DROP_POINTS,
  HIDDEN_ROWS,
  LOCK_DELAY,
  LOCK_RESET_MAX,
  LOGICAL_H,
  LOGICAL_W,
  MOVE_TICK_MS,
  ROWS,
  SOFT_DROP_POINTS,
  SPAWN_COL,
  SPAWN_ROW,
  VISIBLE_ROWS,
  colToX,
  levelForLines,
  scoreForLines,
  secondsPerRow,
  softDropInterval,
  visibleRowToY,
} from '@/games/stack/config'
import { FAMILY_COLOR, KICKS, isPieceFamily, nextRotation, placedCells, shuffleBag } from '@/games/stack/pieces'
import { FAMILY, type ActivePiece, type GamePhase, type PieceFamily, type Rotation } from '@/games/stack/types'

const KEYS = [
  'ArrowLeft',
  'ArrowRight',
  'ArrowDown',
  'ArrowUp',
  'KeyX',
  'Space',
  'KeyC',
  'ShiftLeft',
  'KeyP',
]

function boardIndex(col: number, row: number): number {
  return row * COLS + col
}

function hexAlpha(color: string, alpha: number): string {
  const r = Number.parseInt(color.slice(1, 3), 16)
  const g = Number.parseInt(color.slice(3, 5), 16)
  const b = Number.parseInt(color.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export const createStackGame: GameFactory = (host: ArcadeGameHost): StackGame => {
  const canvas = host.canvas
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Stack canvas context unavailable')
  }

  const audio = createArcadeAudio(() => host.soundEnabled())
  const reduced = () => host.reducedMotion()

  let view: CanvasFit = { scale: 1, offsetX: 0, offsetY: 0, dpr: 1 }
  let phase: GamePhase = 'ready'
  let board = new Uint8Array(ROWS * COLS)
  let piece: ActivePiece | null = null
  let bag: PieceFamily[] = []
  let held: PieceFamily | null = null
  let canHold = true
  let score = 0
  let lines = 0
  let level = 1
  let lastScore = -1
  let lastLines = -1
  let lastLevel = -1
  let lastNext = -1
  let lastHold: PieceFamily | null | undefined
  let fallTimer = 0
  let lockTimer = 0
  let lockResets = 0
  let dasDir: -1 | 0 | 1 = 0
  let dasTimer = 0
  let arrTimer = 0
  let dasCharged = false
  let softHeld = false
  let mobileSoft = false
  let backToBackQuad = false
  let clearingRows: number[] = []
  let clearTimer = 0
  let lastMoveTick = 0
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

  const emitLines = () => {
    if (lines === lastLines) return
    lastLines = lines
    host.onLines?.(lines)
  }

  const emitLevel = () => {
    if (level === lastLevel) return
    lastLevel = level
    host.onLevel(level)
  }

  const peekNext = (): PieceFamily | null => {
    if (bag.length === 0) bag = shuffleBag()
    return bag[0] ?? null
  }

  const emitNext = () => {
    const next = peekNext()
    const id = next ?? 0
    if (id === lastNext) return
    lastNext = id
    if (next) host.onNext?.(next)
  }

  const emitHold = () => {
    if (held === lastHold) return
    lastHold = held
    host.onHold?.(held)
  }

  const playMove = () => {
    const now = performance.now()
    if (now - lastMoveTick < MOVE_TICK_MS) return
    lastMoveTick = now
    audio.play('move')
  }

  const cellsOf = (target: ActivePiece) =>
    placedCells(target.family, target.rotation, target.col, target.row)

  const occupied = (col: number, row: number): boolean => {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return true
    return board[boardIndex(col, row)] !== 0
  }

  const fits = (family: PieceFamily, rotation: Rotation, col: number, row: number): boolean => {
    for (const [c, r] of placedCells(family, rotation, col, row)) {
      if (occupied(c, r)) return false
    }
    return true
  }

  const pieceFits = (target: ActivePiece): boolean =>
    fits(target.family, target.rotation, target.col, target.row)

  const grounded = (target: ActivePiece): boolean =>
    !fits(target.family, target.rotation, target.col, target.row + 1)

  const ghostRow = (target: ActivePiece): number => {
    let row = target.row
    while (fits(target.family, target.rotation, target.col, row + 1)) {
      row += 1
    }
    return row
  }

  const takeFromBag = (): PieceFamily => {
    if (bag.length === 0) bag = shuffleBag()
    const next = bag.shift()
    if (bag.length === 0) bag = shuffleBag()
    if (!next) {
      bag = shuffleBag()
      return bag.shift() ?? FAMILY.BEAM
    }
    return next
  }

  const live = (): boolean => !destroyed && !frozen && phase === 'playing' && piece !== null

  const enterVisible = (target: ActivePiece) => {
    while (true) {
      const minRow = Math.min(...cellsOf(target).map(([, r]) => r))
      if (minRow >= HIDDEN_ROWS) break
      if (!fits(target.family, target.rotation, target.col, target.row + 1)) break
      target.row += 1
    }
  }

  const spawnFamily = (family: PieceFamily, fromHold: boolean): boolean => {
    const next: ActivePiece = {
      family,
      rotation: 0,
      col: SPAWN_COL,
      row: SPAWN_ROW,
    }
    if (!pieceFits(next)) {
      piece = null
      return false
    }
    enterVisible(next)
    piece = next
    fallTimer = 0
    lockTimer = 0
    lockResets = 0
    if (!fromHold) canHold = true
    emitNext()
    return true
  }

  const spawnNext = (): boolean => spawnFamily(takeFromBag(), false)

  const finishGame = () => {
    phase = 'gameOver'
    piece = null
    loop.stop()
    draw(0)
    audio.play('gameOver')
    host.onGameOver(score)
  }

  const resetLockOnShift = () => {
    if (!piece || !grounded(piece)) {
      lockTimer = 0
      return
    }
    if (lockResets >= LOCK_RESET_MAX) return
    lockTimer = 0
    lockResets += 1
  }

  const tryMove = (dc: number, dr: number, options?: { silent?: boolean; scoreSoft?: boolean }): boolean => {
    if (!piece || !live()) return false
    const nextCol = piece.col + dc
    const nextRow = piece.row + dr
    if (!fits(piece.family, piece.rotation, nextCol, nextRow)) return false
    piece.col = nextCol
    piece.row = nextRow
    if (dr > 0 && options?.scoreSoft) {
      score += SOFT_DROP_POINTS * dr
      emitScore()
    }
    if (dc !== 0 || dr < 0) resetLockOnShift()
    if (dc !== 0 && !options?.silent) playMove()
    return true
  }

  const rotatePiece = () => {
    if (!piece || !live()) return
    const rotation = nextRotation(piece.rotation)
    for (const [dc, dr] of KICKS) {
      const col = piece.col + dc
      const row = piece.row + dr
      if (fits(piece.family, rotation, col, row)) {
        piece.rotation = rotation
        piece.col = col
        piece.row = row
        resetLockOnShift()
        audio.play('rotate')
        return
      }
    }
  }

  const fullRows = (): number[] => {
    const rows: number[] = []
    for (let row = 0; row < ROWS; row += 1) {
      let filled = true
      for (let col = 0; col < COLS; col += 1) {
        if (board[boardIndex(col, row)] === 0) {
          filled = false
          break
        }
      }
      if (filled) rows.push(row)
    }
    return rows
  }

  const collapseRows = (rows: number[]) => {
    if (rows.length === 0) return
    const skip = new Set(rows)
    const next = new Uint8Array(ROWS * COLS)
    let dest = ROWS - 1
    for (let row = ROWS - 1; row >= 0; row -= 1) {
      if (skip.has(row)) continue
      next.set(board.subarray(row * COLS, row * COLS + COLS), dest * COLS)
      dest -= 1
    }
    board = next
  }

  const applyLineScore = (cleared: number) => {
    if (cleared <= 0) {
      return
    }
    const backToBack = cleared === 4 && backToBackQuad
    score += scoreForLines(cleared, level, backToBack)
    lines += cleared
    const nextLevel = levelForLines(lines)
    if (nextLevel > level) {
      level = nextLevel
      audio.play('levelUp')
      emitLevel()
    }
    backToBackQuad = cleared === 4
    emitScore()
    emitLines()
  }

  const afterLock = () => {
    const filled = fullRows()
    if (filled.length > 0) {
      phase = 'clearing'
      clearingRows = filled
      clearTimer = CLEAR_FLASH
      audio.play(filled.length === 4 ? 'quad' : 'lineClear')
      return
    }
    backToBackQuad = false
    if (!spawnNext()) finishGame()
  }

  const lockPiece = () => {
    if (!piece || phase !== 'playing') return
    for (const [col, row] of cellsOf(piece)) {
      if (col < 0 || col >= COLS || row < 0 || row >= ROWS) continue
      board[boardIndex(col, row)] = piece.family
    }
    piece = null
    audio.play('lock')
    afterLock()
  }

  const finishClear = () => {
    const cleared = clearingRows.length
    collapseRows(clearingRows)
    clearingRows = []
    clearTimer = 0
    applyLineScore(cleared)
    phase = 'playing'
    if (!spawnNext()) finishGame()
  }

  const holdPiece = () => {
    if (!piece || !live() || !canHold) return
    const current = piece.family
    canHold = false
    piece = null
    if (held === null) {
      held = current
      emitHold()
      audio.play('hold')
      if (!spawnNext()) finishGame()
      return
    }
    const swap = held
    held = current
    emitHold()
    audio.play('hold')
    if (!spawnFamily(swap, true)) finishGame()
  }

  const updateDas = (dt: number) => {
    const left = keyboard.isDown('ArrowLeft')
    const right = keyboard.isDown('ArrowRight')
    let dir: -1 | 0 | 1 = 0
    if (left && !right) dir = -1
    else if (right && !left) dir = 1

    if (dir === 0) {
      dasDir = 0
      dasTimer = 0
      arrTimer = 0
      dasCharged = false
      return
    }

    if (dir !== dasDir) {
      dasDir = dir
      dasTimer = 0
      arrTimer = 0
      dasCharged = false
      return
    }

    if (!dasCharged) {
      dasTimer += dt
      if (dasTimer >= DAS) {
        dasCharged = true
        arrTimer = 0
        tryMove(dir, 0)
      }
      return
    }

    arrTimer += dt
    while (arrTimer >= ARR) {
      arrTimer -= ARR
      tryMove(dir, 0)
    }
  }

  const update = (dt: number) => {
    if (phase === 'gameOver' || phase === 'ready') return

    if (phase === 'clearing') {
      clearTimer -= dt
      if (clearTimer <= 0) finishClear()
      return
    }

    if (phase !== 'playing' || !piece) return

    updateDas(dt)

    const soft = softHeld || mobileSoft || keyboard.isDown('ArrowDown')
    const interval = soft ? softDropInterval(level) : secondsPerRow(level)
    fallTimer += dt
    while (fallTimer >= interval) {
      fallTimer -= interval
      if (!tryMove(0, 1, { silent: true, scoreSoft: soft })) {
        fallTimer = 0
        break
      }
    }

    if (!piece) return
    if (grounded(piece)) {
      lockTimer += dt
      if (lockTimer >= LOCK_DELAY) lockPiece()
    } else {
      lockTimer = 0
    }
  }

  const drawCell = (
    col: number,
    row: number,
    color: string,
    mode: 'fill' | 'ghost' | 'flash',
  ) => {
    if (row < HIDDEN_ROWS || row >= ROWS || col < 0 || col >= COLS) return
    const x = colToX(col) + 1
    const y = visibleRowToY(row) + 1
    const size = CELL - 2

    if (mode === 'ghost') {
      ctx.strokeStyle = hexAlpha(color, 0.35)
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(x, y, size, size, 4)
      ctx.stroke()
      return
    }

    const fill = mode === 'flash' ? '#E8DDC7' : color
    ctx.save()
    if (!reduced() && mode === 'fill') {
      ctx.shadowColor = hexAlpha(fill, 0.45)
      ctx.shadowBlur = 6
    }
    ctx.fillStyle = fill
    ctx.beginPath()
    ctx.roundRect(x, y, size, size, 4)
    ctx.fill()
    ctx.restore()
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)'
    ctx.fillRect(x + 2, y + 1, size - 4, 1)
  }

  const draw = (alpha: number) => {
    void alpha
    if (destroyed) return

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    applyCanvasFit(ctx, view)
    ctx.beginPath()
    ctx.rect(0, 0, LOGICAL_W, LOGICAL_H)
    ctx.clip()

    ctx.fillStyle = 'rgba(9, 11, 26, 0.92)'
    ctx.fillRect(BOARD_X, BOARD_Y, BOARD_W, BOARD_H)

    ctx.strokeStyle = 'rgba(245, 241, 232, 0.08)'
    ctx.lineWidth = 1
    for (let col = 0; col <= COLS; col += 1) {
      const x = BOARD_X + col * CELL + 0.5
      ctx.beginPath()
      ctx.moveTo(x, BOARD_Y)
      ctx.lineTo(x, BOARD_Y + BOARD_H)
      ctx.stroke()
    }
    for (let row = 0; row <= VISIBLE_ROWS; row += 1) {
      const y = BOARD_Y + row * CELL + 0.5
      ctx.beginPath()
      ctx.moveTo(BOARD_X, y)
      ctx.lineTo(BOARD_X + BOARD_W, y)
      ctx.stroke()
    }

    const flashing = new Set(clearingRows)
    for (let row = HIDDEN_ROWS; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const id = board[boardIndex(col, row)]
        if (!id || !isPieceFamily(id)) continue
        drawCell(col, row, FAMILY_COLOR[id], flashing.has(row) ? 'flash' : 'fill')
      }
    }

    if (piece && phase !== 'clearing') {
      const color = FAMILY_COLOR[piece.family]
      const ghost = ghostRow(piece)
      if (ghost !== piece.row) {
        for (const [col, row] of placedCells(piece.family, piece.rotation, piece.col, ghost)) {
          drawCell(col, row, color, 'ghost')
        }
      }
      for (const [col, row] of cellsOf(piece)) {
        drawCell(col, row, color, 'fill')
      }
    }

    ctx.save()
    if (!reduced()) {
      ctx.shadowColor = 'rgba(34, 240, 255, 0.45)'
      ctx.shadowBlur = 8
    }
    ctx.strokeStyle = '#22F0FF'
    ctx.lineWidth = 2
    ctx.strokeRect(BOARD_X + 0.5, BOARD_Y + 0.5, BOARD_W - 1, BOARD_H - 1)
    ctx.restore()
    ctx.restore()
  }

  const loop = createGameLoop({ update, render: draw })

  const resetField = () => {
    board = new Uint8Array(ROWS * COLS)
    piece = null
    bag = shuffleBag()
    held = null
    canHold = true
    score = 0
    lines = 0
    level = 1
    lastScore = -1
    lastLines = -1
    lastLevel = -1
    lastNext = -1
    lastHold = undefined
    fallTimer = 0
    lockTimer = 0
    lockResets = 0
    dasDir = 0
    dasTimer = 0
    arrTimer = 0
    dasCharged = false
    softHeld = false
    mobileSoft = false
    backToBackQuad = false
    clearingRows = []
    clearTimer = 0
    host.onScore(0)
    host.onLines?.(0)
    host.onLevel(1)
    host.onHold?.(null)
    emitNext()
  }

  const enterReady = () => {
    phase = 'ready'
    piece = null
    host.onReady()
  }

  function launch(): void {
    if (destroyed || phase !== 'ready') return
    phase = 'playing'
    audio.play('start')
    if (!spawnNext()) {
      finishGame()
      return
    }
    if (!loop.isRunning()) loop.start()
    else loop.resume()
  }

  keyboard.onPress('ArrowLeft', () => {
    if (!live()) return
    tryMove(-1, 0)
    dasDir = -1
    dasTimer = 0
    dasCharged = false
  })
  keyboard.onPress('ArrowRight', () => {
    if (!live()) return
    tryMove(1, 0)
    dasDir = 1
    dasTimer = 0
    dasCharged = false
  })
  keyboard.onPress('ArrowUp', () => rotatePiece())
  keyboard.onPress('KeyX', () => rotatePiece())
  keyboard.onPress('Space', () => {
    unlock()
    if (phase === 'ready') {
      launch()
      return
    }
    hardDrop()
  })
  keyboard.onPress('KeyC', () => holdPiece())
  keyboard.onPress('ShiftLeft', () => holdPiece())
  keyboard.onPress('KeyP', () => host.onPauseRequest?.())

  const onPointerLaunch = () => {
    unlock()
    launch()
  }
  canvas.addEventListener('pointerdown', onPointerLaunch)

  const fit = (width: number, height: number) => {
    view = fitCanvas(canvas, width, height, LOGICAL_W, LOGICAL_H, 2)
  }

  function moveLeft(): void {
    unlock()
    if (phase === 'ready') launch()
    tryMove(-1, 0)
  }

  function moveRight(): void {
    unlock()
    if (phase === 'ready') launch()
    tryMove(1, 0)
  }

  function rotate(): void {
    unlock()
    if (phase === 'ready') launch()
    rotatePiece()
  }

  function softDrop(down: boolean): void {
    unlock()
    if (down && phase === 'ready') launch()
    mobileSoft = down
    if (!down) {
      fallTimer = Math.min(fallTimer, secondsPerRow(level))
    }
  }

  function hardDrop(): void {
    unlock()
    if (phase === 'ready') {
      launch()
      return
    }
    if (!piece || !live()) return
    let dropped = 0
    while (tryMove(0, 1, { silent: true })) {
      dropped += 1
    }
    if (dropped > 0) {
      score += dropped * HARD_DROP_POINTS
      emitScore()
    }
    lockPiece()
  }

  function hold(): void {
    unlock()
    if (phase === 'ready') {
      launch()
      return
    }
    holdPiece()
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
      frozen = true
      mobileSoft = false
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
    launch,
    moveLeft,
    moveRight,
    rotate,
    softDrop,
    hardDrop,
    hold,
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
      canvas.removeEventListener('pointerdown', onPointerLaunch)
      window.removeEventListener('keydown', unlock)
      board = new Uint8Array(0)
      piece = null
      bag = []
    },
  }
}
