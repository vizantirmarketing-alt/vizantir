import { applyCanvasFit, clientToLogical, fitCanvas, type CanvasFit } from '@/lib/arcade/canvas'
import { createArcadeAudio } from '@/lib/arcade/audio'
import { createGameLoop } from '@/lib/arcade/gameLoop'
import { createKeyboard, createPointerAxis } from '@/lib/arcade/input'
import type { PongDifficulty } from '@/lib/arcade/storage'
import type { ArcadeGameHost, GameFactory } from '@/lib/arcade/types'

import {
  BALL_MAX_SPEED,
  BALL_MIN_VERTICAL,
  BALL_PADDLE_ANGLE,
  BALL_PADDLE_SPEED_GAIN,
  BALL_RADIUS,
  BALL_SERVE_SPEED,
  CENTER_X,
  CENTER_Y,
  CPU_PROFILES,
  CPU_Y,
  CREAM,
  CYAN,
  FIELD_BOTTOM,
  FIELD_H,
  FIELD_RIGHT,
  FIELD_W,
  FIELD_X,
  FIELD_Y,
  LOGICAL_H,
  LOGICAL_W,
  MAGENTA,
  MATCH_CAP,
  MATCH_MARGIN,
  MATCH_TARGET,
  PADDLE_FOLLOW_TAU,
  PADDLE_HEIGHT,
  PADDLE_KEYBOARD_SPEED,
  PADDLE_WIDTH,
  PLAYER_Y,
  PULSE_LIFE,
  SERVE_HOLD,
  TRAIL_MAX,
  TRAIL_MAX_REDUCED,
  YELLOW,
  type CpuProfile,
} from '@/games/pong/config'
import type { Ball, GamePhase, MatchPointSide, Paddle, PongSide, Pulse } from '@/games/pong/types'

const KEYS = [
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'KeyA',
  'KeyD',
  'KeyW',
  'KeyS',
  'Space',
  'KeyP',
]

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

function sideWins(score: number, other: number): boolean {
  if (score >= MATCH_CAP && score > other) return true
  return score >= MATCH_TARGET && score - other >= MATCH_MARGIN
}

function matchPointSide(player: number, cpu: number): MatchPointSide | null {
  const playerPoint = sideWins(player + 1, cpu)
  const cpuPoint = sideWins(cpu + 1, player)
  if (playerPoint && cpuPoint) return 'both'
  if (playerPoint) return 'player'
  if (cpuPoint) return 'cpu'
  return null
}

function paddleHalf(): number {
  return PADDLE_WIDTH / 2
}

function paddleMin(): number {
  return FIELD_X + paddleHalf()
}

function paddleMax(): number {
  return FIELD_RIGHT - paddleHalf()
}

function makePaddle(y: number): Paddle {
  return { x: CENTER_X, y, w: PADDLE_WIDTH, h: PADDLE_HEIGHT, vx: 0 }
}

function makeBall(): Ball {
  return { x: CENTER_X, y: CENTER_Y, vx: 0, vy: 0, speed: BALL_SERVE_SPEED, trail: [] }
}

export const createPongGame: GameFactory = (host: ArcadeGameHost) => {
  const canvas = host.canvas
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Pong canvas context unavailable')
  }

  const audio = createArcadeAudio(() => host.soundEnabled())
  const reduced = () => host.reducedMotion()

  let view: CanvasFit = { scale: 1, offsetX: 0, offsetY: 0, dpr: 1 }
  let phase: GamePhase = 'ready'
  let player = makePaddle(PLAYER_Y)
  let cpu = makePaddle(CPU_Y)
  let ball = makeBall()
  let playerScore = 0
  let cpuScore = 0
  let lastPlayer = -1
  let lastCpu = -1
  let lastMatch: MatchPointSide | null | undefined
  let lastRally = -1
  let rallyHits = 0
  let serveToward: PongSide = 'cpu'
  let holdTimer = 0
  let pulse: Pulse | null = null
  let matchDifficulty: PongDifficulty = 'normal'
  let cpuError = 0
  let reactionTimer = 0
  let frozen = false
  let destroyed = false
  let suppressLockMenu = false

  const pointerSurface = canvas.closest<HTMLElement>('[data-arcade-pointer]') ?? canvas
  const pointer = createPointerAxis(pointerSurface, {
    axis: 'x',
    toLogical: (clientX, clientY) => clientToLogical(clientX, clientY, canvas.getBoundingClientRect(), view),
    getScale: () => view.scale,
    getCurrent: () => player.x,
    range: () => ({ min: paddleMin(), max: paddleMax() }),
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
      if (phase === 'playing' || phase === 'holding') {
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
    if (pointer.target === null) pointer.target = player.x
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

  const liveDifficulty = (): PongDifficulty => host.difficulty?.() ?? 'normal'

  const activeProfile = (): CpuProfile => {
    const id = phase === 'playing' ? matchDifficulty : liveDifficulty()
    return CPU_PROFILES[id]
  }

  const emitScores = () => {
    if (playerScore !== lastPlayer) {
      lastPlayer = playerScore
      host.onScore(playerScore)
    }
    if (cpuScore !== lastCpu) {
      lastCpu = cpuScore
      host.onOpponentScore?.(cpuScore)
    }
    const nextMatch = matchPointSide(playerScore, cpuScore)
    if (nextMatch !== lastMatch) {
      lastMatch = nextMatch
      host.onMatchPoint?.(nextMatch)
    }
  }

  const emitRally = () => {
    if (rallyHits === lastRally) return
    lastRally = rallyHits
    host.onRally?.(rallyHits)
  }

  const placePulse = (x: number, y: number) => {
    pulse = { x, y, life: PULSE_LIFE }
  }

  const enforceVertical = () => {
    const min = ball.speed * BALL_MIN_VERTICAL
    if (Math.abs(ball.vy) >= min) return
    const sign = ball.vy < 0 ? -1 : 1
    ball.vy = min * sign
    const vxAbs = Math.sqrt(Math.max(ball.speed * ball.speed - ball.vy * ball.vy, 0))
    ball.vx = ball.vx < 0 ? -vxAbs : vxAbs
  }

  const setBallVelocity = (angle: number) => {
    ball.vx = Math.cos(angle) * ball.speed
    ball.vy = Math.sin(angle) * ball.speed
    enforceVertical()
  }

  const resetBall = () => {
    ball = makeBall()
  }

  const rollCpuError = (profile: CpuProfile) => {
    cpuError = (Math.random() * 2 - 1) * profile.error
  }

  const beginServeMotion = (toward: PongSide) => {
    matchDifficulty = liveDifficulty()
    const profile = CPU_PROFILES[matchDifficulty]
    rollCpuError(profile)
    reactionTimer = toward === 'cpu' ? profile.reaction : 0
    rallyHits = 0
    emitRally()
    ball.x = CENTER_X
    ball.y = CENTER_Y
    ball.speed = BALL_SERVE_SPEED
    const jitter = (Math.random() * 0.36 - 0.18) * (Math.PI / 2)
    const base = toward === 'player' ? Math.PI / 2 : -Math.PI / 2
    setBallVelocity(base + jitter)
    if (toward === 'player') ball.vy = Math.abs(ball.vy)
    else ball.vy = -Math.abs(ball.vy)
  }

  const predictCrossing = (targetY: number): number => {
    let x = ball.x
    let y = ball.y
    let vx = ball.vx
    const vy = ball.vy
    const left = FIELD_X + BALL_RADIUS
    const right = FIELD_RIGHT - BALL_RADIUS
    if (vy >= 0) return x

    for (let i = 0; i < 24; i += 1) {
      if (vy === 0) return x
      const timeToY = (targetY - y) / vy
      if (timeToY < 0) return x

      let timeToWall = Number.POSITIVE_INFINITY
      if (vx > 0) timeToWall = (right - x) / vx
      else if (vx < 0) timeToWall = (left - x) / vx

      if (timeToY <= timeToWall) {
        return clamp(x + vx * timeToY, left, right)
      }

      x += vx * timeToWall
      y += vy * timeToWall
      vx *= -1
    }
    return clamp(x, left, right)
  }

  const reflectPaddle = (paddle: Paddle, side: PongSide) => {
    const offset = clamp((ball.x - paddle.x) / (paddle.w / 2), -1, 1)
    const spread = (BALL_PADDLE_ANGLE * Math.PI) / 180
    ball.speed = Math.min(BALL_MAX_SPEED, ball.speed * BALL_PADDLE_SPEED_GAIN)
    if (side === 'player') {
      setBallVelocity(-Math.PI / 2 + offset * spread)
      ball.vy = -Math.abs(ball.vy)
      ball.y = paddle.y - BALL_RADIUS - 0.5
      reactionTimer = activeProfile().reaction
    } else {
      setBallVelocity(Math.PI / 2 - offset * spread)
      ball.vy = Math.abs(ball.vy)
      ball.y = paddle.y + paddle.h + BALL_RADIUS + 0.5
    }
    rallyHits += 1
    emitRally()
    placePulse(ball.x, ball.y)
    audio.play('paddle')
  }

  const finishMatch = (winner: PongSide) => {
    phase = 'gameOver'
    lastMatch = null
    host.onMatchPoint?.(null)
    loop.stop()
    draw(0)
    audio.play(winner === 'player' ? 'win' : 'gameOver')
    host.onGameOver(playerScore, {
      won: winner === 'player',
      player: playerScore,
      cpu: cpuScore,
    })
  }

  const scorePoint = (scorer: PongSide) => {
    if (scorer === 'player') playerScore += 1
    else cpuScore += 1
    emitScores()
    audio.play(scorer === 'player' ? 'point' : 'pointCpu')
    if (sideWins(playerScore, cpuScore)) {
      finishMatch('player')
      return
    }
    if (sideWins(cpuScore, playerScore)) {
      finishMatch('cpu')
      return
    }
    resetBall()
    serveToward = scorer === 'player' ? 'cpu' : 'player'
    holdTimer = SERVE_HOLD
    phase = 'holding'
    reactionTimer = 0
  }

  const keyboardDelta = (dt: number) => {
    const left =
      keyboard.isDown('ArrowLeft') ||
      keyboard.isDown('KeyA') ||
      keyboard.isDown('ArrowUp') ||
      keyboard.isDown('KeyW')
    const right =
      keyboard.isDown('ArrowRight') ||
      keyboard.isDown('KeyD') ||
      keyboard.isDown('ArrowDown') ||
      keyboard.isDown('KeyS')
    let delta = 0
    if (left) delta -= PADDLE_KEYBOARD_SPEED * dt
    if (right) delta += PADDLE_KEYBOARD_SPEED * dt
    return delta
  }

  const updatePlayer = (dt: number) => {
    const min = paddleMin()
    const max = paddleMax()
    const locked = pointer.isLocked
    const direct = locked || pointer.isTouch

    if (direct) {
      if (pointer.target === null) pointer.target = player.x
      pointer.target = clamp(pointer.target + keyboardDelta(dt), min, max)
      player.x = pointer.target
      player.vx = 0
      return
    }

    if (pointer.target !== null) {
      const desired = clamp(pointer.target, min, max)
      player.x += (desired - player.x) * (1 - Math.exp(-dt / PADDLE_FOLLOW_TAU))
      player.vx = 0
    } else {
      player.vx = 0
      player.x += keyboardDelta(dt)
    }
    player.x = clamp(player.x, min, max)
  }

  const updateCpu = (dt: number) => {
    const profile = activeProfile()
    const headingToward = ball.vy < 0
    const canTrack = phase !== 'playing' || headingToward || profile.trackAway

    if (!canTrack) return

    if (phase === 'playing' && headingToward && reactionTimer > 0) {
      reactionTimer = Math.max(0, reactionTimer - dt)
      return
    }

    let desired = CENTER_X
    if (phase === 'playing') {
      desired = headingToward ? predictCrossing(CPU_Y + PADDLE_HEIGHT) + cpuError : ball.x
    }

    desired = clamp(desired, paddleMin(), paddleMax())
    const dx = desired - cpu.x
    const max = profile.maxSpeed * dt
    cpu.x += clamp(dx, -max, max)
    cpu.x = clamp(cpu.x, paddleMin(), paddleMax())
  }

  const recordTrail = () => {
    const max = reduced() ? TRAIL_MAX_REDUCED : TRAIL_MAX
    ball.trail.push({ x: ball.x, y: ball.y })
    if (ball.trail.length > max) ball.trail.shift()
  }

  const integrateBall = (dt: number) => {
    let remaining = dt
    let hits = 0
    while (remaining > 0 && hits < 4) {
      const vx = ball.vx * remaining
      const vy = ball.vy * remaining
      let best: SweepHit | null = null
      let kind: 'wall' | 'player' | 'cpu' = 'wall'

      const left = sweepCircleAabb(ball.x, ball.y, vx, vy, BALL_RADIUS, FIELD_X - 80, FIELD_Y, 80, FIELD_H)
      if (isCloser(left, best)) {
        best = left
        kind = 'wall'
      }
      const right = sweepCircleAabb(ball.x, ball.y, vx, vy, BALL_RADIUS, FIELD_RIGHT, FIELD_Y, 80, FIELD_H)
      if (isCloser(right, best)) {
        best = right
        kind = 'wall'
      }

      const playerHit = sweepCircleAabb(
        ball.x,
        ball.y,
        vx,
        vy,
        BALL_RADIUS,
        player.x - player.w / 2,
        player.y,
        player.w,
        player.h,
      )
      if (ball.vy > 0 && isCloser(playerHit, best)) {
        best = playerHit
        kind = 'player'
      }

      const cpuHit = sweepCircleAabb(
        ball.x,
        ball.y,
        vx,
        vy,
        BALL_RADIUS,
        cpu.x - cpu.w / 2,
        cpu.y,
        cpu.w,
        cpu.h,
      )
      if (ball.vy < 0 && isCloser(cpuHit, best)) {
        best = cpuHit
        kind = 'cpu'
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

      if (kind === 'player') {
        reflectPaddle(player, 'player')
        break
      }
      if (kind === 'cpu') {
        reflectPaddle(cpu, 'cpu')
        break
      }

      if (best.nx !== 0) ball.vx *= -1
      else ball.vy *= -1
      enforceVertical()
      placePulse(ball.x, ball.y)
      audio.play('wall')
      hits += 1
    }

    recordTrail()

    if (ball.y - BALL_RADIUS > FIELD_BOTTOM) {
      scorePoint('cpu')
      return
    }
    if (ball.y + BALL_RADIUS < FIELD_Y) {
      scorePoint('player')
    }
  }

  const update = (dt: number) => {
    if (phase === 'gameOver') return

    if (pulse) {
      pulse.life -= dt
      if (pulse.life <= 0) pulse = null
    }

    updatePlayer(dt)
    updateCpu(dt)

    if (phase === 'ready') {
      emitScores()
      return
    }

    if (phase === 'holding') {
      holdTimer -= dt
      if (holdTimer <= 0) {
        phase = 'playing'
        beginServeMotion(serveToward)
      }
      return
    }

    if (phase !== 'playing') return
    integrateBall(dt)
  }

  const drawPaddle = (paddle: Paddle, accent: string, edge: 'top' | 'bottom') => {
    const x = paddle.x - paddle.w / 2
    ctx.save()
    if (!reduced()) {
      ctx.shadowColor = accent
      ctx.shadowBlur = 10
    }
    ctx.fillStyle = CREAM
    ctx.fillRect(x, paddle.y, paddle.w, paddle.h)
    ctx.restore()
    ctx.fillStyle = accent
    if (edge === 'top') ctx.fillRect(x, paddle.y, paddle.w, 2)
    else ctx.fillRect(x, paddle.y + paddle.h - 2, paddle.w, 2)
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
    ctx.fillRect(FIELD_X, FIELD_Y, FIELD_W, FIELD_H)

    const midY = CENTER_Y + 0.5
    ctx.save()
    ctx.strokeStyle = 'rgba(34, 240, 255, 0.5)'
    ctx.lineWidth = 1
    ctx.setLineDash([8, 8])
    ctx.beginPath()
    ctx.moveTo(FIELD_X + 8, midY)
    ctx.lineTo(FIELD_RIGHT - 8, midY)
    ctx.stroke()
    ctx.restore()

    if (pulse && pulse.life > 0) {
      const t = pulse.life / PULSE_LIFE
      const radius = 6 + (1 - t) * 18
      ctx.beginPath()
      ctx.strokeStyle = `rgba(34, 240, 255, ${0.45 * t})`
      ctx.lineWidth = 2
      ctx.arc(pulse.x, pulse.y, radius, 0, Math.PI * 2)
      ctx.stroke()
    }

    drawPaddle(cpu, MAGENTA, 'bottom')
    drawPaddle(player, YELLOW, 'top')

    for (let i = 0; i < ball.trail.length; i += 1) {
      const point = ball.trail[i]
      if (!point) continue
      ctx.globalAlpha = ((i + 1) / ball.trail.length) * 0.35
      ctx.fillStyle = CYAN
      ctx.beginPath()
      ctx.arc(point.x, point.y, BALL_RADIUS * 0.7, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    ctx.save()
    if (!reduced()) {
      ctx.shadowColor = CYAN
      ctx.shadowBlur = 10
    }
    ctx.fillStyle = '#F5F1E8'
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    ctx.restore()
  }

  const loop = createGameLoop({ update, render: draw })

  function launch(): void {
    if (destroyed || frozen || phase === 'gameOver' || phase === 'playing') return
    if (phase === 'ready' || phase === 'holding') {
      phase = 'playing'
      beginServeMotion(serveToward)
      audio.play('start')
      if (!loop.isRunning()) loop.start()
      else loop.resume()
    }
  }

  const resetMatch = () => {
    player = makePaddle(PLAYER_Y)
    cpu = makePaddle(CPU_Y)
    resetBall()
    playerScore = 0
    cpuScore = 0
    lastPlayer = -1
    lastCpu = -1
    lastMatch = undefined
    lastRally = -1
    rallyHits = 0
    serveToward = 'cpu'
    holdTimer = 0
    pulse = null
    matchDifficulty = liveDifficulty()
    cpuError = 0
    reactionTimer = 0
    phase = 'ready'
    host.onReady()
    emitScores()
    emitRally()
  }

  const fit = (width: number, height: number) => {
    view = fitCanvas(canvas, width, height, LOGICAL_W, LOGICAL_H, 2)
  }

  return {
    start() {
      if (destroyed) return
      frozen = false
      resetMatch()
      audio.play('start')
      loop.start()
      draw(0)
    },
    pause() {
      frozen = true
      if (pointer.isLocked) suppressLockMenu = true
      releasePointer()
      loop.pause()
    },
    resume() {
      if (phase === 'gameOver') return
      suppressLockMenu = false
      frozen = false
      if (!loop.isRunning()) loop.start()
      else loop.resume()
    },
    restart() {
      if (destroyed) return
      frozen = false
      loop.stop()
      resetMatch()
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
    },
  }
}
