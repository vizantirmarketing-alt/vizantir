import { applyCanvasFit, clientToLogical, fitCanvas, type CanvasFit } from '@/lib/arcade/canvas'
import { createArcadeAudio } from '@/lib/arcade/audio'
import { createGameLoop } from '@/lib/arcade/gameLoop'
import { createKeyboard, createPointerAxis } from '@/lib/arcade/input'
import type { ArcadeGame, ArcadeGameHost, GameFactory } from '@/lib/arcade/types'

import {
  BALL_BASE_SPEED,
  BALL_LEVEL_SPEED,
  BALL_MAX_SPEED,
  BALL_MIN_VERTICAL,
  BALL_PADDLE_SPEED_GAIN,
  BALL_RADIUS,
  COMBO_MAX,
  COMBO_STEP,
  FRAGMENTS_PER_BRICK,
  FRAGMENTS_PER_BRICK_REDUCED,
  FRAGMENT_CAP,
  FRAGMENT_CAP_REDUCED,
  LEVEL_CLEAR_HOLD,
  LOCKED_FILL,
  LOCKED_STROKE,
  LOGICAL_H,
  LOGICAL_W,
  MAX_BALLS,
  MULTI_SPREAD_DEG,
  PADDLE_FOLLOW_TAU,
  PADDLE_HEIGHT,
  PADDLE_KEYBOARD_SPEED,
  PADDLE_WIDE,
  PADDLE_WIDTH,
  PADDLE_Y,
  POWER_FALL_SPEED,
  POWER_H,
  POWER_W,
  SCORE_BONUS,
  SCORE_LIFE_BONUS,
  SCORE_STANDARD,
  SCORE_STRONG_BREAK,
  SCORE_STRONG_CHIP,
  SLOW_DURATION,
  SLOW_FACTOR,
  SLOW_FLOOR,
  STARTING_LIVES,
  TRAIL_MAX,
  TRAIL_MAX_REDUCED,
  WIDE_DURATION,
  brickRect,
} from '@/games/breakout/config'
import { LEVEL_COUNT, buildBricks, remainingDestructible } from '@/games/breakout/levels'
import type { Ball, Brick, GamePhase, Paddle, Particle, PowerItem, PowerKind } from '@/games/breakout/types'

const POWER_COLORS: Record<PowerKind, string> = {
  MULTI: '#22F0FF',
  WIDE: '#FF2E88',
  VOID: '#FFD447',
  SLOW: '#32FF9C',
}

const POWER_LABEL: Record<PowerKind, string> = {
  MULTI: 'MU',
  WIDE: 'WI',
  VOID: 'VO',
  SLOW: 'SL',
}

const KEYS = ['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space', 'KeyP']

interface SweepHit {
  t: number
  nx: number
  ny: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function isCloser(hit: SweepHit | null, current: SweepHit | null): hit is SweepHit {
  return hit !== null && (current === null || hit.t < current.t)
}

function sweepCircleAabb(
  x: number,
  y: number,
  vx: number,
  vy: number,
  r: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
): SweepHit | null {
  const minX = rx - r
  const minY = ry - r
  const maxX = rx + rw + r
  const maxY = ry + rh + r

  if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
    const left = x - minX
    const right = maxX - x
    const top = y - minY
    const bottom = maxY - y
    const nearest = Math.min(left, right, top, bottom)
    if (nearest === left) return { t: 0, nx: -1, ny: 0 }
    if (nearest === right) return { t: 0, nx: 1, ny: 0 }
    if (nearest === top) return { t: 0, nx: 0, ny: -1 }
    return { t: 0, nx: 0, ny: 1 }
  }

  let tEnter = 0
  let tExit = 1
  let nx = 0
  let ny = 0

  if (vx === 0) {
    if (x < minX || x > maxX) return null
  } else {
    const t1 = (minX - x) / vx
    const t2 = (maxX - x) / vx
    const tMin = Math.min(t1, t2)
    const tMax = Math.max(t1, t2)
    if (tMin > tEnter) {
      tEnter = tMin
      nx = t1 < t2 ? -1 : 1
      ny = 0
    }
    tExit = Math.min(tExit, tMax)
  }

  if (vy === 0) {
    if (y < minY || y > maxY) return null
  } else {
    const t1 = (minY - y) / vy
    const t2 = (maxY - y) / vy
    const tMin = Math.min(t1, t2)
    const tMax = Math.max(t1, t2)
    if (tMin > tEnter) {
      tEnter = tMin
      nx = 0
      ny = t1 < t2 ? -1 : 1
    }
    tExit = Math.min(tExit, tMax)
  }

  if (tEnter <= tExit && tEnter >= 0 && tEnter <= 1) {
    return { t: tEnter, nx, ny }
  }
  return null
}

function enforceVertical(ball: Ball): void {
  const min = ball.speed * BALL_MIN_VERTICAL
  if (Math.abs(ball.vy) >= min) return
  const sign = ball.vy < 0 ? -1 : 1
  ball.vy = min * sign
  const vxAbs = Math.sqrt(Math.max(ball.speed * ball.speed - ball.vy * ball.vy, 0))
  ball.vx = ball.vx < 0 ? -vxAbs : vxAbs
}

function setBallVelocity(ball: Ball, angle: number): void {
  ball.vx = Math.cos(angle) * ball.speed
  ball.vy = Math.sin(angle) * ball.speed
  enforceVertical(ball)
}

export const createBreakoutGame: GameFactory = (host: ArcadeGameHost): ArcadeGame => {
  const canvas = host.canvas
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Breakout canvas context unavailable')
  }
  const audio = createArcadeAudio(() => host.soundEnabled())
  const reduced = () => host.reducedMotion()

  let view: CanvasFit = { scale: 1, offsetX: 0, offsetY: 0, dpr: 1 }
  let phase: GamePhase = 'ready'
  let score = 0
  let lives = STARTING_LIVES
  let level = 1
  let combo = 1
  let bricks: Brick[] = []
  let balls: Ball[] = []
  let powers: PowerItem[] = []
  let particles: Particle[] = []
  let paddle: Paddle = { x: LOGICAL_W / 2, y: PADDLE_Y, w: PADDLE_WIDTH, h: PADDLE_HEIGHT, vx: 0 }
  let wideTimer = 0
  let slowTimer = 0
  let clearTimer = 0
  let glow = 0
  let flash = 0
  let shake = 0
  let flashGate = 0
  let destroyed = false
  let lastScore = 0
  let suppressLockMenu = false

  const paddleRange = () => {
    const half = paddle.w / 2
    return { min: half, max: LOGICAL_W - half }
  }

  const pointerSurface = canvas.closest<HTMLElement>('[data-arcade-pointer]') ?? canvas
  const pointer = createPointerAxis(pointerSurface, {
    axis: 'x',
    toLogical: (clientX, clientY) => clientToLogical(clientX, clientY, canvas.getBoundingClientRect(), view),
    getScale: () => view.scale,
    getCurrent: () => paddle.x,
    range: paddleRange,
    onLockChange: (locked) => {
      if (destroyed) return
      if (locked) {
        suppressLockMenu = false
        return
      }
      if (suppressLockMenu) {
        suppressLockMenu = false
        return
      }
      if (phase === 'playing') {
        host.onPointerLockChange?.(false)
      }
    },
  })

  const keyboard = createKeyboard(KEYS)
  keyboard.onPress('Space', () => launch())
  keyboard.onPress('KeyP', () => host.onPauseRequest?.())

  const unlock = () => audio.unlock()
  window.addEventListener('keydown', unlock)

  function lockPointer(): void {
    if (pointer.target === null) pointer.target = paddle.x
    pointer.requestLock()
  }

  function releasePointer(): void {
    pointer.releaseLock()
  }

  const onCanvasPointerDown = (event: PointerEvent) => {
    unlock()
    if (event.pointerType !== 'touch') lockPointer()
    launch()
  }
  canvas.addEventListener('pointerdown', onCanvasPointerDown)

  const emitScore = () => {
    if (score === lastScore) return
    lastScore = score
    host.onScore(score)
  }

  const resetPaddle = () => {
    paddle = { x: LOGICAL_W / 2, y: PADDLE_Y, w: PADDLE_WIDTH, h: PADDLE_HEIGHT, vx: 0 }
    wideTimer = 0
    slowTimer = 0
  }

  const ballOnPaddle = (): Ball => ({
    x: paddle.x,
    y: paddle.y - BALL_RADIUS - 0.5,
    vx: 0,
    vy: 0,
    speed: BALL_BASE_SPEED * (BALL_LEVEL_SPEED[level - 1] ?? 1),
    trail: [],
  })

  const enterReady = () => {
    phase = 'ready'
    balls = [ballOnPaddle()]
    powers = []
    combo = 1
    host.onReady()
  }

  const loadLevel = (nextLevel: number) => {
    level = nextLevel
    bricks = buildBricks(level - 1)
    resetPaddle()
    host.onLevel(level)
    enterReady()
  }

  const addScore = (amount: number) => {
    if (amount <= 0) return
    score += Math.round(amount * combo)
  }

  const bumpCombo = () => {
    combo = Math.min(COMBO_MAX, combo + COMBO_STEP)
  }

  const spawnFragments = (x: number, y: number, color: string) => {
    const count = reduced() ? FRAGMENTS_PER_BRICK_REDUCED : FRAGMENTS_PER_BRICK
    const cap = reduced() ? FRAGMENT_CAP_REDUCED : FRAGMENT_CAP
    for (let i = 0; i < count; i += 1) {
      if (particles.length >= cap) particles.shift()
      const angle = Math.random() * Math.PI * 2
      const speed = 40 + Math.random() * 120
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.6,
        color,
        size: 1.4 + Math.random() * 1.6,
      })
    }
  }

  const triggerFlash = () => {
    if (flashGate > 0) return
    flash = 0.09
    flashGate = 0.34
  }

  const triggerShake = () => {
    if (reduced()) return
    shake = 0.18
  }

  const destroyBrick = (brick: Brick, award: boolean) => {
    brick.alive = false
    brick.hp = 0
    const rect = brickRect(brick.col, brick.row)
    spawnFragments(rect.x + rect.w / 2, rect.y + rect.h / 2, brick.color)
    triggerFlash()
    if (!award) return
    if (brick.kind === 'bonus') {
      addScore(SCORE_BONUS)
      const kinds: PowerKind[] = ['MULTI', 'WIDE', 'VOID', 'SLOW']
      powers.push({
        kind: kinds[Math.floor(Math.random() * kinds.length)] ?? 'WIDE',
        x: rect.x + rect.w / 2,
        y: rect.y + rect.h / 2,
        col: brick.col,
        row: brick.row,
      })
    } else if (brick.kind === 'strong') {
      addScore(SCORE_STRONG_BREAK)
    } else {
      addScore(SCORE_STANDARD)
    }
  }

  const hitBrick = (brick: Brick) => {
    if (!brick.alive) return
    if (brick.kind === 'locked') {
      audio.play('locked')
      return
    }
    if (brick.kind === 'strong' && brick.hp > 1) {
      brick.hp -= 1
      addScore(SCORE_STRONG_CHIP)
      audio.play('brickStrong')
      bumpCombo()
      return
    }
    audio.play('brick')
    destroyBrick(brick, true)
    bumpCombo()
  }

  const applyVoid = (col: number, row: number) => {
    for (const brick of bricks) {
      if (!brick.alive || brick.kind === 'locked') continue
      if (Math.abs(brick.col - col) <= 1 && Math.abs(brick.row - row) <= 1) {
        destroyBrick(brick, true)
      }
    }
  }

  const collectPower = (item: PowerItem) => {
    audio.play('power')
    host.onPowerUp?.(item.kind)
    if (item.kind === 'WIDE') {
      wideTimer = WIDE_DURATION
      paddle.w = PADDLE_WIDE
    } else if (item.kind === 'SLOW') {
      slowTimer = SLOW_DURATION
    } else if (item.kind === 'VOID') {
      applyVoid(item.col, item.row)
    } else if (item.kind === 'MULTI') {
      const source = balls[0]
      if (!source) return
      const room = MAX_BALLS - balls.length
      const extras = Math.min(2, room)
      const spread = (MULTI_SPREAD_DEG * Math.PI) / 180
      const base = Math.atan2(source.vy, source.vx)
      for (let i = 0; i < extras; i += 1) {
        const angle = base + (i === 0 ? -spread : spread)
        balls.push({
          x: source.x,
          y: source.y,
          vx: Math.cos(angle) * source.speed,
          vy: Math.sin(angle) * source.speed,
          speed: source.speed,
          trail: [],
        })
      }
    }
  }

  const currentBallSpeed = (nominal: number) => {
    if (slowTimer > 0) return Math.max(SLOW_FLOOR, nominal * SLOW_FACTOR)
    return Math.min(BALL_MAX_SPEED, nominal)
  }

  const reflectPaddle = (ball: Ball) => {
    const offset = clamp((ball.x - paddle.x) / (paddle.w / 2), -1, 1)
    const angle = -Math.PI / 2 + offset * ((60 * Math.PI) / 180)
    ball.speed = Math.min(BALL_MAX_SPEED, ball.speed * BALL_PADDLE_SPEED_GAIN)
    const speed = currentBallSpeed(ball.speed)
    ball.speed = Math.max(ball.speed, speed)
    setBallVelocity(ball, angle)
    ball.vy = -Math.abs(ball.vy)
    ball.y = paddle.y - BALL_RADIUS - 0.5
    glow = 1
    combo = 1
    audio.play('paddle')
  }

  const serveBall = (ball: Ball) => {
    const jitter = (Math.random() * 0.3 - 0.15) * Math.PI
    ball.speed = currentBallSpeed(BALL_BASE_SPEED * (BALL_LEVEL_SPEED[level - 1] ?? 1))
    setBallVelocity(ball, -Math.PI / 2 + jitter)
    ball.vy = -Math.abs(ball.vy)
  }

  const finishLevel = () => {
    const bonus = SCORE_LIFE_BONUS * lives
    score += bonus
    emitScore()
    phase = 'levelClear'
    clearTimer = LEVEL_CLEAR_HOLD
    triggerShake()
    audio.play('levelClear')
    host.onLevelClear({ level, score, isFinal: level >= LEVEL_COUNT })
  }

  const loseBall = (index: number) => {
    balls.splice(index, 1)
    if (balls.length > 0) return
    combo = 1
    lives -= 1
    host.onLives(lives)
    audio.play('life')
    triggerShake()
    if (lives <= 0) {
      phase = 'gameOver'
      loop.stop()
      draw(0)
      audio.play('gameOver')
      host.onGameOver(score)
      return
    }
    enterReady()
  }

  const keyboardDelta = (dt: number) => {
    const left = keyboard.isDown('ArrowLeft') || keyboard.isDown('KeyA')
    const right = keyboard.isDown('ArrowRight') || keyboard.isDown('KeyD')
    let delta = 0
    if (left) delta -= PADDLE_KEYBOARD_SPEED * dt
    if (right) delta += PADDLE_KEYBOARD_SPEED * dt
    return delta
  }

  const updatePaddle = (dt: number) => {
    paddle.w = wideTimer > 0 ? PADDLE_WIDE : PADDLE_WIDTH
    const { min, max } = paddleRange()
    const locked = pointer.isLocked
    const direct = locked || pointer.isTouch

    if (direct) {
      if (pointer.target === null) pointer.target = paddle.x
      pointer.target = clamp(pointer.target + keyboardDelta(dt), min, max)
      paddle.x = pointer.target
      paddle.vx = 0
    } else if (pointer.target !== null) {
      const desired = clamp(pointer.target, min, max)
      paddle.x += (desired - paddle.x) * (1 - Math.exp(-dt / PADDLE_FOLLOW_TAU))
      paddle.vx = 0
      paddle.x = clamp(paddle.x, min, max)
    } else {
      paddle.vx = 0
      paddle.x = clamp(paddle.x + keyboardDelta(dt), min, max)
    }

    if (phase === 'ready' && balls[0]) {
      balls[0].x = paddle.x
      balls[0].y = paddle.y - BALL_RADIUS - 0.5
    }
  }

  const integrateBall = (ball: Ball, dt: number) => {
    const speed = currentBallSpeed(ball.speed)
    const current = Math.hypot(ball.vx, ball.vy) || 1
    ball.vx = (ball.vx / current) * speed
    ball.vy = (ball.vy / current) * speed

    let remaining = dt
    let hits = 0
    while (remaining > 0 && hits < 4) {
      const vx = ball.vx * remaining
      const vy = ball.vy * remaining
      let best: SweepHit | null = null
      let kind: 'wall' | 'paddle' | 'brick' = 'wall'
      let brickHit: Brick | null = null

      const left = sweepCircleAabb(ball.x, ball.y, vx, vy, BALL_RADIUS, -80, 0, 80, LOGICAL_H)
      if (isCloser(left, best)) {
        best = left
        kind = 'wall'
      }
      const right = sweepCircleAabb(ball.x, ball.y, vx, vy, BALL_RADIUS, LOGICAL_W, 0, 80, LOGICAL_H)
      if (isCloser(right, best)) {
        best = right
        kind = 'wall'
      }
      const top = sweepCircleAabb(ball.x, ball.y, vx, vy, BALL_RADIUS, 0, -80, LOGICAL_W, 80)
      if (isCloser(top, best)) {
        best = top
        kind = 'wall'
      }

      const paddleHit = sweepCircleAabb(
        ball.x,
        ball.y,
        vx,
        vy,
        BALL_RADIUS,
        paddle.x - paddle.w / 2,
        paddle.y,
        paddle.w,
        paddle.h,
      )
      if (ball.vy > 0 && isCloser(paddleHit, best)) {
        best = paddleHit
        kind = 'paddle'
      }

      let brickBest: SweepHit | null = null
      for (const brick of bricks) {
        if (!brick.alive) continue
        const rect = brickRect(brick.col, brick.row)
        const hit = sweepCircleAabb(ball.x, ball.y, vx, vy, BALL_RADIUS, rect.x, rect.y, rect.w, rect.h)
        if (isCloser(hit, brickBest)) {
          brickBest = hit
          brickHit = brick
        }
      }
      if (brickHit && isCloser(brickBest, best)) {
        best = brickBest
        kind = 'brick'
      }

      if (!best) {
        ball.x += vx
        ball.y += vy
        break
      }

      const travel = Math.max(best.t - 0.001, 0)
      ball.x += vx * travel
      ball.y += vy * travel
      remaining *= 1 - best.t

      if (kind === 'paddle') {
        reflectPaddle(ball)
        break
      }
      if (kind === 'brick' && brickHit) {
        if (best.nx !== 0) ball.vx *= -1
        else ball.vy *= -1
        enforceVertical(ball)
        hitBrick(brickHit)
        hits += 1
        break
      }
      if (best.nx !== 0) ball.vx *= -1
      else ball.vy *= -1
      enforceVertical(ball)
      hits += 1
    }

    const trailMax = reduced() ? TRAIL_MAX_REDUCED : TRAIL_MAX
    ball.trail.push({ x: ball.x, y: ball.y })
    if (ball.trail.length > trailMax) ball.trail.shift()
  }

  const update = (dt: number) => {
    if (phase === 'gameOver' || phase === 'complete') return

    flash = Math.max(0, flash - dt)
    flashGate = Math.max(0, flashGate - dt)
    glow = Math.max(0, glow - dt * 5)
    shake = Math.max(0, shake - dt)
    if (wideTimer > 0) wideTimer = Math.max(0, wideTimer - dt)
    if (slowTimer > 0) slowTimer = Math.max(0, slowTimer - dt)

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const particle = particles[i]
      if (!particle) continue
      particle.life -= dt
      particle.x += particle.vx * dt
      particle.y += particle.vy * dt
      particle.vy += 220 * dt
      if (particle.life <= 0) particles.splice(i, 1)
    }

    updatePaddle(dt)

    if (phase === 'levelClear') {
      clearTimer -= dt
      if (clearTimer <= 0) {
        if (level >= LEVEL_COUNT) {
          phase = 'complete'
          loop.stop()
          draw(0)
          return
        }
        loadLevel(level + 1)
      }
      emitScore()
      return
    }

    if (phase === 'ready') {
      emitScore()
      return
    }

    for (let i = balls.length - 1; i >= 0; i -= 1) {
      const ball = balls[i]
      if (!ball) continue
      integrateBall(ball, dt)
      if (ball.y - BALL_RADIUS > LOGICAL_H) {
        loseBall(i)
        if (phase !== 'playing') {
          emitScore()
          return
        }
      }
    }

    for (let i = powers.length - 1; i >= 0; i -= 1) {
      const item = powers[i]
      if (!item) continue
      item.y += POWER_FALL_SPEED * dt
      const overlaps =
        item.x + POWER_W / 2 > paddle.x - paddle.w / 2 &&
        item.x - POWER_W / 2 < paddle.x + paddle.w / 2 &&
        item.y + POWER_H / 2 > paddle.y &&
        item.y - POWER_H / 2 < paddle.y + paddle.h
      if (overlaps) {
        collectPower(item)
        powers.splice(i, 1)
        continue
      }
      if (item.y - POWER_H / 2 > LOGICAL_H) powers.splice(i, 1)
    }

    if (remainingDestructible(bricks) === 0 && phase === 'playing') {
      finishLevel()
    }
    emitScore()
  }

  const draw = (alpha: number) => {
    void alpha
    if (destroyed) return
    const shakeX = shake > 0 && !reduced() ? (Math.random() * 2 - 1) * 3 * (shake / 0.18) : 0
    const shakeY = shake > 0 && !reduced() ? (Math.random() * 2 - 1) * 3 * (shake / 0.18) : 0

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    applyCanvasFit(ctx, view, shakeX, shakeY)
    ctx.beginPath()
    ctx.rect(0, 0, LOGICAL_W, LOGICAL_H)
    ctx.clip()

    ctx.fillStyle = 'rgba(9, 11, 26, 0.92)'
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H)
    ctx.strokeStyle = 'rgba(245, 241, 232, 0.06)'
    ctx.lineWidth = 1
    for (let x = 0; x <= LOGICAL_W; x += 32) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, LOGICAL_H)
      ctx.stroke()
    }
    for (let y = 0; y <= LOGICAL_H; y += 32) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(LOGICAL_W, y)
      ctx.stroke()
    }

    ctx.save()
    ctx.shadowColor = 'rgba(34, 240, 255, 0.45)'
    ctx.shadowBlur = 8
    ctx.strokeStyle = '#22F0FF'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(1, 8)
    ctx.lineTo(1, LOGICAL_H - 8)
    ctx.moveTo(LOGICAL_W - 1, 8)
    ctx.lineTo(LOGICAL_W - 1, LOGICAL_H - 8)
    ctx.stroke()
    ctx.restore()

    for (const brick of bricks) {
      if (!brick.alive) continue
      const rect = brickRect(brick.col, brick.row)
      const fill = brick.kind === 'locked' ? LOCKED_FILL : brick.color
      ctx.fillStyle = fill
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)'
      ctx.fillRect(rect.x, rect.y, rect.w, 1)
      if (brick.kind === 'locked') {
        ctx.strokeStyle = LOCKED_STROKE
        ctx.lineWidth = 1
        ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1)
      }
      if (brick.kind === 'strong' && brick.hp > 1) {
        ctx.strokeStyle = 'rgba(245, 241, 232, 0.7)'
        ctx.lineWidth = 1
        ctx.strokeRect(rect.x + 4, rect.y + 3, rect.w - 8, rect.h - 6)
      }
    }

    for (const particle of particles) {
      ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife)
      ctx.fillStyle = particle.color
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size)
      ctx.globalAlpha = 1
    }

    const mono =
      getComputedStyle(document.documentElement).getPropertyValue('--arcade-mono').trim() ||
      getComputedStyle(document.documentElement).getPropertyValue('--font-analytir-mono').trim() ||
      'ui-monospace'

    for (const item of powers) {
      ctx.fillStyle = POWER_COLORS[item.kind]
      const px = item.x - POWER_W / 2
      const py = item.y - POWER_H / 2
      ctx.beginPath()
      ctx.moveTo(px + 4, py)
      ctx.arcTo(px + POWER_W, py, px + POWER_W, py + POWER_H, 4)
      ctx.arcTo(px + POWER_W, py + POWER_H, px, py + POWER_H, 4)
      ctx.arcTo(px, py + POWER_H, px, py, 4)
      ctx.arcTo(px, py, px + POWER_W, py, 4)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#090B1A'
      ctx.font = `700 7px ${mono}, ui-monospace, monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(POWER_LABEL[item.kind], item.x, item.y + 0.5)
    }

    ctx.save()
    ctx.shadowColor = `rgba(34, 240, 255, ${0.35 + glow * 0.45})`
    ctx.shadowBlur = 10 + glow * 12
    ctx.fillStyle = '#22F0FF'
    ctx.fillRect(paddle.x - paddle.w / 2, paddle.y, paddle.w, paddle.h)
    ctx.restore()

    for (const ball of balls) {
      for (let i = 0; i < ball.trail.length; i += 1) {
        const point = ball.trail[i]
        if (!point) continue
        ctx.globalAlpha = ((i + 1) / ball.trail.length) * 0.35
        ctx.fillStyle = '#22F0FF'
        ctx.beginPath()
        ctx.arc(point.x, point.y, BALL_RADIUS * 0.7, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      ctx.save()
      ctx.shadowColor = '#22F0FF'
      ctx.shadowBlur = 10
      ctx.fillStyle = '#F5F1E8'
      ctx.beginPath()
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    if (flash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.35 * (flash / 0.09)})`
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H)
    }
    ctx.restore()
  }

  const loop = createGameLoop({ update, render: draw })

  function launch(): void {
    if (destroyed || phase !== 'ready') return
    const ball = balls[0]
    if (!ball) return
    phase = 'playing'
    serveBall(ball)
    audio.play('start')
    if (!loop.isRunning()) loop.start()
    else loop.resume()
  }

  const fit = (width: number, height: number) => {
    view = fitCanvas(canvas, width, height, LOGICAL_W, LOGICAL_H, 2)
  }

  return {
    start() {
      if (destroyed) return
      score = 0
      lastScore = -1
      lives = STARTING_LIVES
      combo = 1
      particles = []
      host.onScore(0)
      host.onLives(lives)
      loadLevel(1)
      audio.play('start')
      loop.start()
      draw(0)
    },
    pause() {
      if (pointer.isLocked) suppressLockMenu = true
      releasePointer()
      loop.pause()
    },
    resume() {
      if (phase === 'gameOver' || phase === 'complete') return
      suppressLockMenu = false
      if (!loop.isRunning()) loop.start()
      else loop.resume()
    },
    restart() {
      if (destroyed) return
      loop.stop()
      score = 0
      lastScore = -1
      lives = STARTING_LIVES
      combo = 1
      particles = []
      powers = []
      host.onScore(0)
      host.onLives(lives)
      loadLevel(1)
      loop.start()
      draw(0)
    },
    launch,
    lockPointer,
    releasePointer,
    resize(width, height) {
      fit(width, height)
      draw(0)
    },
    destroy() {
      destroyed = true
      suppressLockMenu = true
      loop.stop()
      keyboard.destroy()
      pointer.destroy()
      audio.destroy()
      canvas.removeEventListener('pointerdown', onCanvasPointerDown)
      window.removeEventListener('keydown', unlock)
      bricks = []
      balls = []
      powers = []
      particles = []
    },
  }
}
