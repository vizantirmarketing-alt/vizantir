import { applyCanvasFit, clientToLogical, fitCanvas, type CanvasFit } from '@/lib/arcade/canvas'
import { createArcadeAudio } from '@/lib/arcade/audio'
import { createGameLoop } from '@/lib/arcade/gameLoop'
import { createKeyboard, createPointerAxis } from '@/lib/arcade/input'
import type { ArcadeGame, ArcadeGameHost, GameFactory } from '@/lib/arcade/types'

import {
  ALIEN_FRAGMENTS,
  ALIEN_FRAGMENTS_REDUCED,
  ALIEN_HALF,
  BOMB_MAX,
  BOMB_RADIUS,
  BOMB_SPEED,
  BREACH_Y,
  BULLET_MAX,
  BULLET_RADIUS,
  BULLET_SPEED,
  BULLET_TRAIL,
  CREAM,
  CRAFT_HALF_H,
  CRAFT_HALF_W,
  CRAFT_POINTS,
  CRAFT_POPUP_LIFE,
  CRAFT_SPEED,
  CRAFT_Y,
  CYAN,
  DEATH_FLASH,
  DEATH_FRAGMENTS,
  DEATH_SHAKE,
  DEATH_SHAKE_UNITS,
  FIELD_MARGIN,
  FIRE_INTERVAL,
  FORM_COL_PITCH,
  FORM_COLS,
  FORM_ROW_PITCH,
  FORM_ROWS,
  FORM_STEP,
  FORM_TOTAL,
  FRAGMENT_CAP,
  FRAGMENT_CAP_REDUCED,
  INVULN_BLINK_HZ,
  INVULN_TIME,
  LOGICAL_H,
  LOGICAL_W,
  MINT,
  ORANGE,
  SHIELD_CELL,
  SHIELD_COLS,
  SHIELD_ROWS,
  SHIELD_XS,
  SHIELD_Y,
  SHIP_FOLLOW_TAU,
  SHIP_HALF,
  SHIP_HEIGHT,
  SHIP_KEYBOARD_SPEED,
  SHIP_Y,
  STARTING_LIVES,
  TIER_COLORS,
  TIER_POINTS,
  WAVE_BONUS,
  WAVE_CLEAR_HOLD,
  YELLOW,
  bombInterval,
  craftWait,
  formationOriginX,
  formationSpeed,
  waveOriginY,
} from '@/games/swarm/config'
import type {
  Alien,
  AlienTier,
  Craft,
  GamePhase,
  Particle,
  Projectile,
  ScorePopup,
  Shield,
  ShieldCell,
  Ship,
} from '@/games/swarm/types'

const KEYS = ['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space', 'KeyP']
const ALIEN_HIT = ['alienHit1', 'alienHit2', 'alienHit3'] as const

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function lerp(prev: number, next: number, alpha: number): number {
  return prev + (next - prev) * alpha
}

function circleRect(cx: number, cy: number, r: number, x: number, y: number, w: number, h: number): boolean {
  const nx = clamp(cx, x, x + w)
  const ny = clamp(cy, y, y + h)
  const dx = cx - nx
  const dy = cy - ny
  return dx * dx + dy * dy <= r * r
}

function tierForRow(row: number): AlienTier {
  if (row === 0) return 3
  if (row === 1) return 2
  return 1
}

export const createSwarmGame: GameFactory = (host: ArcadeGameHost): ArcadeGame => {
  const canvas = host.canvas
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Swarm canvas context unavailable')
  }

  const audio = createArcadeAudio(() => host.soundEnabled())
  const reduced = () => host.reducedMotion()

  let view: CanvasFit = { scale: 1, offsetX: 0, offsetY: 0, dpr: 1, width: 0, height: 0 }
  let phase: GamePhase = 'ready'
  let score = 0
  let lastScore = -1
  let lives = STARTING_LIVES
  let wave = 1
  let ship: Ship = { x: LOGICAL_W / 2, px: LOGICAL_W / 2, y: SHIP_Y }
  let aliens: Alien[] = []
  let bullets: Projectile[] = []
  let bombs: Projectile[] = []
  let shields: Shield[] = []
  let craft: Craft | null = null
  let particles: Particle[] = []
  let popups: ScorePopup[] = []
  let originX = formationOriginX()
  let originY = waveOriginY(1)
  let prevOriginX = originX
  let prevOriginY = originY
  let formDir = 1
  let fireTimer = 0
  let bombTimer = 0
  let craftTimer = craftWait()
  let clearTimer = 0
  let invuln = 0
  let flash = 0
  let shake = 0
  let animTime = 0
  let craftSinging = false
  let destroyed = false
  let suppressLockMenu = false

  const shipRange = () => ({ min: SHIP_HALF, max: LOGICAL_W - SHIP_HALF })

  const pointerSurface = canvas.closest<HTMLElement>('[data-arcade-pointer]') ?? canvas
  const pointer = createPointerAxis(pointerSurface, {
    axis: 'x',
    toLogical: (clientX, clientY) => clientToLogical(clientX, clientY, canvas.getBoundingClientRect(), view),
    getScale: () => view.scale,
    getCurrent: () => ship.x,
    range: shipRange,
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
      if (phase === 'playing' || phase === 'waveClear') {
        host.onPointerLockChange?.(false)
      }
    },
  })

  const keyboard = createKeyboard(KEYS)
  keyboard.onPress('Space', () => launch())
  keyboard.onPress('KeyP', () => {
    if (phase === 'gameOver') return
    host.onPauseRequest?.()
  })

  const unlock = () => audio.unlock()
  window.addEventListener('keydown', unlock)

  function lockPointer(): void {
    if (pointer.target === null) pointer.target = ship.x
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

  const addScore = (amount: number) => {
    if (amount <= 0) return
    score += amount
  }

  const aliveCount = () => aliens.reduce((sum, alien) => sum + (alien.alive ? 1 : 0), 0)

  const alienPos = (alien: Alien, ox: number, oy: number) => ({
    x: ox + alien.col * FORM_COL_PITCH,
    y: oy + alien.row * FORM_ROW_PITCH,
  })

  const spawnFormation = (nextWave: number) => {
    originX = formationOriginX()
    originY = waveOriginY(nextWave)
    prevOriginX = originX
    prevOriginY = originY
    formDir = 1
    aliens = []
    for (let row = 0; row < FORM_ROWS; row += 1) {
      const tier = tierForRow(row)
      for (let col = 0; col < FORM_COLS; col += 1) {
        aliens.push({
          col,
          row,
          tier,
          points: TIER_POINTS[tier - 1] ?? 10,
          color: TIER_COLORS[tier - 1] ?? MINT,
          alive: true,
        })
      }
    }
  }

  const spawnShields = () => {
    shields = SHIELD_XS.map((cx) => {
      const cells: ShieldCell[] = []
      const originCellX = cx - (SHIELD_COLS * SHIELD_CELL) / 2
      const originCellY = SHIELD_Y - (SHIELD_ROWS * SHIELD_CELL) / 2
      for (let row = 0; row < SHIELD_ROWS; row += 1) {
        for (let col = 0; col < SHIELD_COLS; col += 1) {
          if (row === 0 && (col === 0 || col === SHIELD_COLS - 1)) continue
          cells.push({
            col,
            row,
            x: originCellX + col * SHIELD_CELL,
            y: originCellY + row * SHIELD_CELL,
            alive: true,
          })
        }
      }
      return { cx, cells }
    })
  }

  const spawnFragments = (x: number, y: number, color: string, count: number) => {
    const cap = reduced() ? FRAGMENT_CAP_REDUCED : FRAGMENT_CAP
    for (let i = 0; i < count; i += 1) {
      if (particles.length >= cap) particles.shift()
      const angle = Math.random() * Math.PI * 2
      const speed = 40 + Math.random() * 140
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3 + Math.random() * 0.28,
        maxLife: 0.58,
        color,
        size: 1.3 + Math.random() * 1.7,
      })
    }
  }

  const stopCraftSong = () => {
    if (!craftSinging) return
    audio.stopLoop('craft')
    craftSinging = false
  }

  const syncCraftSong = () => {
    if (craft && host.soundEnabled()) {
      if (!craftSinging) {
        audio.startLoop('craft')
        craftSinging = true
      }
      return
    }
    stopCraftSong()
  }

  const clearCraft = () => {
    craft = null
    craftTimer = craftWait()
    stopCraftSong()
  }

  const enterReady = () => {
    phase = 'ready'
    fireTimer = 0
    bombTimer = bombInterval(wave)
    host.onReady()
  }

  const loadWave = (nextWave: number) => {
    wave = nextWave
    spawnFormation(wave)
    spawnShields()
    bullets = []
    bombs = []
    if (!craft) craftTimer = craftWait()
    fireTimer = 0
    bombTimer = bombInterval(wave)
    host.onLevel(wave)
  }

  const finishWave = () => {
    addScore(WAVE_BONUS * wave)
    emitScore()
    phase = 'waveClear'
    clearTimer = WAVE_CLEAR_HOLD
    audio.play('wave')
  }

  const endGame = (reason: 'breach' | 'lives') => {
    phase = 'gameOver'
    stopCraftSong()
    loop.stop()
    draw(0)
    audio.play(reason === 'breach' ? 'breach' : 'gameOver')
    host.onGameOver(score, { reason })
  }

  const loseLife = () => {
    lives -= 1
    host.onLives(lives)
    spawnFragments(ship.x, ship.y, CYAN, DEATH_FRAGMENTS)
    flash = DEATH_FLASH
    if (!reduced()) shake = DEATH_SHAKE
    bombs = []
    audio.play('shipLost')
    if (lives <= 0) {
      endGame('lives')
      return
    }
    invuln = INVULN_TIME
  }

  const hitShield = (proj: Projectile, dir: 1 | -1): boolean => {
    let best: ShieldCell | null = null
    let owner: Shield | null = null
    for (const shield of shields) {
      for (const cell of shield.cells) {
        if (!cell.alive) continue
        if (!circleRect(proj.x, proj.y, BULLET_RADIUS, cell.x, cell.y, SHIELD_CELL, SHIELD_CELL)) continue
        if (!best || (dir < 0 ? cell.y > best.y : cell.y < best.y)) {
          best = cell
          owner = shield
        }
      }
    }
    if (!best || !owner) return false
    best.alive = false
    const neighborRow = best.row + dir
    for (const cell of owner.cells) {
      if (cell.alive && cell.col === best.col && cell.row === neighborRow) {
        cell.alive = false
      }
    }
    audio.play('shieldHit')
    return true
  }

  const keyboardDelta = (dt: number) => {
    const left = keyboard.isDown('ArrowLeft') || keyboard.isDown('KeyA')
    const right = keyboard.isDown('ArrowRight') || keyboard.isDown('KeyD')
    let delta = 0
    if (left) delta -= SHIP_KEYBOARD_SPEED * dt
    if (right) delta += SHIP_KEYBOARD_SPEED * dt
    return delta
  }

  const updateShip = (dt: number) => {
    const { min, max } = shipRange()
    const locked = pointer.isLocked
    const direct = locked || pointer.isTouch

    if (direct) {
      if (pointer.target === null) pointer.target = ship.x
      pointer.target = clamp(pointer.target + keyboardDelta(dt), min, max)
      ship.x = pointer.target
    } else if (pointer.target !== null) {
      const desired = clamp(pointer.target, min, max)
      ship.x += (desired - ship.x) * (1 - Math.exp(-dt / SHIP_FOLLOW_TAU))
      ship.x = clamp(ship.x, min, max)
    } else {
      ship.x = clamp(ship.x + keyboardDelta(dt), min, max)
    }
  }

  const fire = () => {
    if (bullets.length >= BULLET_MAX) return
    const x = ship.x
    const y = ship.y - SHIP_HEIGHT * 0.55
    bullets.push({ x, y, px: x, py: y, vy: -BULLET_SPEED, trail: [] })
    audio.play('shot')
  }

  const dropBomb = () => {
    if (bombs.length >= BOMB_MAX) return
    const columns: number[] = []
    for (let col = 0; col < FORM_COLS; col += 1) {
      if (aliens.some((alien) => alien.alive && alien.col === col)) columns.push(col)
    }
    if (columns.length === 0) return
    const col = columns[Math.floor(Math.random() * columns.length)]
    if (col === undefined) return
    let lowest: Alien | null = null
    for (const alien of aliens) {
      if (!alien.alive || alien.col !== col) continue
      if (!lowest || alien.row > lowest.row) lowest = alien
    }
    if (!lowest) return
    const pos = alienPos(lowest, originX, originY)
    bombs.push({
      x: pos.x,
      y: pos.y + ALIEN_HALF,
      px: pos.x,
      py: pos.y + ALIEN_HALF,
      vy: BOMB_SPEED,
      trail: [],
    })
    audio.play('bomb')
  }

  const formationBounds = () => {
    let minX = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const alien of aliens) {
      if (!alien.alive) continue
      const pos = alienPos(alien, originX, originY)
      if (pos.x < minX) minX = pos.x
      if (pos.x > maxX) maxX = pos.x
      if (pos.y > maxY) maxY = pos.y
    }
    if (!Number.isFinite(minX)) {
      return { left: originX, right: originX, bottom: originY }
    }
    return {
      left: minX - ALIEN_HALF,
      right: maxX + ALIEN_HALF,
      bottom: maxY,
    }
  }

  const snapshot = () => {
    ship.px = ship.x
    prevOriginX = originX
    prevOriginY = originY
    for (const bullet of bullets) {
      bullet.px = bullet.x
      bullet.py = bullet.y
    }
    for (const bomb of bombs) {
      bomb.px = bomb.x
      bomb.py = bomb.y
    }
    if (craft) craft.px = craft.x
  }

  const rememberTrail = (proj: Projectile) => {
    proj.trail.push({ x: proj.x, y: proj.y })
    if (proj.trail.length > BULLET_TRAIL) proj.trail.shift()
  }

  const hitAlien = (bullet: Projectile): boolean => {
    for (const alien of aliens) {
      if (!alien.alive) continue
      const pos = alienPos(alien, originX, originY)
      const dx = bullet.x - pos.x
      const dy = bullet.y - pos.y
      if (dx * dx + dy * dy > ALIEN_HALF * ALIEN_HALF) continue
      alien.alive = false
      addScore(alien.points)
      spawnFragments(
        pos.x,
        pos.y,
        alien.color,
        reduced() ? ALIEN_FRAGMENTS_REDUCED : ALIEN_FRAGMENTS,
      )
      audio.play(ALIEN_HIT[alien.tier - 1] ?? 'alienHit1')
      return true
    }
    return false
  }

  const hitCraft = (bullet: Projectile): boolean => {
    if (!craft) return false
    if (
      Math.abs(bullet.x - craft.x) > CRAFT_HALF_W + BULLET_RADIUS ||
      Math.abs(bullet.y - craft.y) > CRAFT_HALF_H + BULLET_RADIUS
    ) {
      return false
    }
    addScore(craft.points)
    popups.push({
      x: craft.x,
      y: craft.y,
      text: `+${craft.points}`,
      life: CRAFT_POPUP_LIFE,
      maxLife: CRAFT_POPUP_LIFE,
    })
    spawnFragments(craft.x, craft.y, YELLOW, reduced() ? ALIEN_FRAGMENTS_REDUCED : ALIEN_FRAGMENTS)
    audio.play('craftHit')
    clearCraft()
    return true
  }

  const isOver = () => phase === 'gameOver'

  const updateProjectiles = (dt: number) => {
    for (let i = bullets.length - 1; i >= 0; i -= 1) {
      const bullet = bullets[i]
      if (!bullet) continue
      bullet.y += bullet.vy * dt
      rememberTrail(bullet)
      if (bullet.y + BULLET_RADIUS < FIELD_MARGIN) {
        bullets.splice(i, 1)
        continue
      }
      if (hitCraft(bullet) || hitAlien(bullet) || hitShield(bullet, -1)) {
        bullets.splice(i, 1)
      }
    }

    for (let i = bombs.length - 1; i >= 0; i -= 1) {
      const bomb = bombs[i]
      if (!bomb) continue
      bomb.y += bomb.vy * dt
      rememberTrail(bomb)
      if (bomb.y - BOMB_RADIUS > LOGICAL_H - FIELD_MARGIN) {
        bombs.splice(i, 1)
        continue
      }
      if (hitShield(bomb, 1)) {
        bombs.splice(i, 1)
        continue
      }
      if (invuln > 0) continue
      const shipTop = ship.y - SHIP_HEIGHT * 0.65
      const shipLeft = ship.x - SHIP_HALF
      if (circleRect(bomb.x, bomb.y, BOMB_RADIUS, shipLeft, shipTop, SHIP_HALF * 2, SHIP_HEIGHT)) {
        bombs.splice(i, 1)
        loseLife()
        if (phase === 'gameOver') return
      }
    }
  }

  const updateFormation = (dt: number) => {
    const live = aliveCount()
    if (live === 0) return
    originX += formDir * formationSpeed(FORM_TOTAL - live, wave) * dt
    const bounds = formationBounds()
    if (bounds.left <= FIELD_MARGIN) {
      originX += FIELD_MARGIN - bounds.left
      formDir = 1
      originY += FORM_STEP
    } else if (bounds.right >= LOGICAL_W - FIELD_MARGIN) {
      originX -= bounds.right - (LOGICAL_W - FIELD_MARGIN)
      formDir = -1
      originY += FORM_STEP
    }
    if (formationBounds().bottom >= BREACH_Y) {
      endGame('breach')
    }
  }

  const updateCraft = (dt: number) => {
    if (!host.soundEnabled()) stopCraftSong()
    if (craft) {
      craft.x += craft.vx * dt
      if (craft.x < -30 || craft.x > LOGICAL_W + 30) clearCraft()
      else syncCraftSong()
      return
    }
    craftTimer -= dt
    if (craftTimer > 0) return
    const fromLeft = Math.random() < 0.5
    const points = CRAFT_POINTS[Math.floor(Math.random() * CRAFT_POINTS.length)] ?? 50
    const x = fromLeft ? -20 : LOGICAL_W + 20
    craft = {
      x,
      px: x,
      y: CRAFT_Y,
      vx: fromLeft ? CRAFT_SPEED : -CRAFT_SPEED,
      points,
    }
    syncCraftSong()
  }

  const updateEffects = (dt: number) => {
    flash = Math.max(0, flash - dt)
    shake = Math.max(0, shake - dt)
    invuln = Math.max(0, invuln - dt)
    animTime += dt
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const particle = particles[i]
      if (!particle) continue
      particle.life -= dt
      particle.x += particle.vx * dt
      particle.y += particle.vy * dt
      particle.vy += 180 * dt
      if (particle.life <= 0) particles.splice(i, 1)
    }
    for (let i = popups.length - 1; i >= 0; i -= 1) {
      const popup = popups[i]
      if (!popup) continue
      popup.life -= dt
      if (popup.life <= 0) popups.splice(i, 1)
    }
  }

  const update = (dt: number) => {
    if (phase === 'gameOver') return
    snapshot()
    updateShip(dt)
    updateEffects(dt)

    if (phase === 'ready') {
      emitScore()
      return
    }

    if (phase === 'waveClear') {
      updateCraft(dt)
      clearTimer -= dt
      if (clearTimer <= 0) {
        loadWave(wave + 1)
        phase = 'playing'
      }
      emitScore()
      return
    }

    fireTimer -= dt
    if (fireTimer <= 0) {
      fire()
      fireTimer = Math.max(fireTimer, -FIRE_INTERVAL) + FIRE_INTERVAL
    }

    updateProjectiles(dt)
    if (isOver()) {
      emitScore()
      return
    }

    updateFormation(dt)
    if (isOver()) {
      emitScore()
      return
    }

    bombTimer -= dt
    if (bombTimer <= 0) {
      dropBomb()
      const interval = bombInterval(wave)
      bombTimer = Math.max(bombTimer, -interval) + interval
    }

    updateCraft(dt)

    if (aliveCount() === 0) {
      finishWave()
    }
    emitScore()
  }

  const pixelFont = () => {
    const styles = getComputedStyle(document.documentElement)
    return (
      styles.getPropertyValue('--arcade-pixel').trim() ||
      styles.getPropertyValue('--font-arcade-pixel').trim() ||
      'ui-monospace'
    )
  }

  const drawGlyph = (tier: AlienTier, color: string, frame: number) => {
    ctx.beginPath()
    if (tier === 3) {
      ctx.moveTo(0, -8)
      ctx.lineTo(7, 0)
      ctx.lineTo(0, 8)
      ctx.lineTo(-7, 0)
    } else if (tier === 2) {
      ctx.moveTo(-8, -5)
      ctx.lineTo(0, 3)
      ctx.lineTo(8, -5)
      ctx.lineTo(5, 1)
      ctx.lineTo(0, 8)
      ctx.lineTo(-5, 1)
    } else {
      for (let i = 0; i < 6; i += 1) {
        const angle = (Math.PI / 3) * i - Math.PI / 6
        const x = Math.cos(angle) * 8
        const y = Math.sin(angle) * 8
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
    }
    ctx.closePath()
    ctx.save()
    ctx.shadowColor = color
    ctx.shadowBlur = reduced() ? 4 : 8 + frame * 2
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.stroke()
    ctx.restore()
  }

  const drawProjectiles = (
    list: Projectile[],
    color: string,
    radius: number,
    alpha: number,
  ) => {
    for (const proj of list) {
      const x = lerp(proj.px, proj.x, alpha)
      const y = lerp(proj.py, proj.y, alpha)
      for (let i = 0; i < proj.trail.length; i += 1) {
        const point = proj.trail[i]
        if (!point) continue
        ctx.globalAlpha = ((i + 1) / proj.trail.length) * 0.35
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(point.x, point.y, radius * 0.7, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      ctx.save()
      ctx.shadowColor = color
      ctx.shadowBlur = 8
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  const draw = (alpha: number) => {
    if (destroyed) return
    const shakeX =
      shake > 0 && !reduced() ? (Math.random() * 2 - 1) * DEATH_SHAKE_UNITS * (shake / DEATH_SHAKE) : 0
    const shakeY =
      shake > 0 && !reduced() ? (Math.random() * 2 - 1) * DEATH_SHAKE_UNITS * (shake / DEATH_SHAKE) : 0

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    applyCanvasFit(ctx, view, shakeX, shakeY)
    ctx.beginPath()
    ctx.rect(0, 0, LOGICAL_W, LOGICAL_H)
    ctx.clip()

    ctx.fillStyle = 'rgba(9, 11, 26, 0.92)'
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H)

    ctx.fillStyle = 'rgba(245, 241, 232, 0.05)'
    for (let x = 0; x <= LOGICAL_W; x += 40) {
      for (let y = 0; y <= LOGICAL_H; y += 40) {
        ctx.beginPath()
        ctx.arc(x, y, 1.1, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    ctx.save()
    ctx.shadowColor = 'rgba(255, 158, 44, 0.4)'
    ctx.shadowBlur = 8
    ctx.strokeStyle = ORANGE
    ctx.lineWidth = 2
    ctx.strokeRect(FIELD_MARGIN + 0.5, FIELD_MARGIN + 0.5, LOGICAL_W - FIELD_MARGIN * 2 - 1, LOGICAL_H - FIELD_MARGIN * 2 - 1)
    ctx.restore()

    for (const shield of shields) {
      for (const cell of shield.cells) {
        if (!cell.alive) continue
        ctx.globalAlpha = 0.8
        ctx.fillStyle = CREAM
        ctx.fillRect(cell.x, cell.y, SHIELD_CELL - 0.4, SHIELD_CELL - 0.4)
        ctx.globalAlpha = 1
      }
    }

    const ox = lerp(prevOriginX, originX, alpha)
    const oy = lerp(prevOriginY, originY, alpha)
    const frame = reduced() ? 0 : Math.floor(animTime / 0.5) % 2
    for (const alien of aliens) {
      if (!alien.alive) continue
      const pos = alienPos(alien, ox, oy)
      ctx.save()
      ctx.translate(pos.x, pos.y)
      if (frame === 1 && !reduced()) {
        if (alien.tier === 2) ctx.rotate(0.12)
        else ctx.scale(1.08, 1.08)
      }
      drawGlyph(alien.tier, alien.color, frame)
      ctx.restore()
    }

    if (craft) {
      const cx = lerp(craft.px, craft.x, alpha)
      ctx.save()
      ctx.translate(cx, craft.y)
      ctx.shadowColor = YELLOW
      ctx.shadowBlur = 8
      ctx.fillStyle = YELLOW
      ctx.beginPath()
      ctx.moveTo(-CRAFT_HALF_W, 0)
      ctx.lineTo(-3, -CRAFT_HALF_H)
      ctx.lineTo(CRAFT_HALF_W, 0)
      ctx.lineTo(-3, CRAFT_HALF_H)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = ORANGE
      ctx.beginPath()
      ctx.arc(2, 0, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    drawProjectiles(bombs, ORANGE, BOMB_RADIUS, alpha)
    drawProjectiles(bullets, CYAN, BULLET_RADIUS, alpha)

    const hidden =
      invuln > 0 && Math.floor(invuln * INVULN_BLINK_HZ * 2) % 2 === 1
    if (!hidden) {
      const sx = lerp(ship.px, ship.x, alpha)
      ctx.save()
      ctx.translate(sx, ship.y)
      ctx.shadowColor = CYAN
      ctx.shadowBlur = 10
      ctx.fillStyle = CYAN
      ctx.beginPath()
      ctx.moveTo(0, -SHIP_HEIGHT * 0.65)
      ctx.lineTo(SHIP_HALF, SHIP_HEIGHT * 0.45)
      ctx.lineTo(-SHIP_HALF, SHIP_HEIGHT * 0.45)
      ctx.closePath()
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.fillStyle = ORANGE
      ctx.beginPath()
      ctx.arc(0, SHIP_HEIGHT * 0.28, 2.1, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    for (const particle of particles) {
      ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife)
      ctx.fillStyle = particle.color
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size)
      ctx.globalAlpha = 1
    }

    const mono = pixelFont()
    for (const popup of popups) {
      const t = popup.life / popup.maxLife
      ctx.globalAlpha = t
      ctx.fillStyle = YELLOW
      ctx.font = `700 10px ${mono}, ui-monospace, monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(popup.text, popup.x, popup.y - (1 - t) * 14)
      ctx.globalAlpha = 1
    }

    if (flash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.32 * (flash / DEATH_FLASH)})`
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H)
    }

    ctx.restore()
  }

  const loop = createGameLoop({ update, render: draw })

  function launch(): void {
    if (destroyed || phase !== 'ready') return
    phase = 'playing'
    fireTimer = 0
    bombTimer = bombInterval(wave)
    audio.play('start')
    if (!loop.isRunning()) loop.start()
    else loop.resume()
  }

  const resetRun = () => {
    score = 0
    lastScore = -1
    lives = STARTING_LIVES
    particles = []
    popups = []
    bullets = []
    bombs = []
    flash = 0
    shake = 0
    invuln = 0
    animTime = 0
    ship = { x: LOGICAL_W / 2, px: LOGICAL_W / 2, y: SHIP_Y }
    pointer.target = ship.x
    host.onScore(0)
    host.onLives(lives)
    loadWave(1)
    enterReady()
  }

  const fit = (width: number, height: number) => {
    view = fitCanvas(canvas, width, height, LOGICAL_W, LOGICAL_H, 2)
  }

  return {
    start() {
      if (destroyed) return
      resetRun()
      audio.play('start')
      loop.start()
      draw(0)
    },
    pause() {
      if (pointer.isLocked) suppressLockMenu = true
      releasePointer()
      stopCraftSong()
      loop.pause()
    },
    resume() {
      if (phase === 'gameOver') return
      suppressLockMenu = false
      if (!loop.isRunning()) loop.start()
      else loop.resume()
      syncCraftSong()
    },
    restart() {
      if (destroyed) return
      loop.stop()
      stopCraftSong()
      resetRun()
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
    getFit() {
      return view
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
      aliens = []
      bullets = []
      bombs = []
      particles = []
      popups = []
      craft = null
    },
  }
}
