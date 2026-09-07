export const LOGICAL_W = 360
export const LOGICAL_H = 640

export const FIELD_MARGIN = 20

export const SHIP_Y = 588
export const SHIP_HALF = 14
export const SHIP_HEIGHT = 16
export const SHIP_KEYBOARD_SPEED = 520
export const SHIP_FOLLOW_TAU = 0.12

export const STARTING_LIVES = 3

export const FIRE_INTERVAL = 0.15
export const BULLET_MAX = 6
export const BULLET_SPEED = 440
export const BULLET_RADIUS = 2.5
export const BULLET_TRAIL = 5

export const FORM_COLS = 6
export const FORM_ROWS = 4
export const FORM_COL_PITCH = 44
export const FORM_ROW_PITCH = 34
export const FORM_ORIGIN_Y = 96
export const FORM_STEP = 14
export const FORM_BASE_SPEED = 22
export const FORM_THIN_GAIN = 2.2
export const FORM_WAVE_GAIN = 0.08
export const FORM_WAVE_CAP = 1.6
export const FORM_MAX_DROP_ROWS = 3
export const FORM_TOTAL = FORM_COLS * FORM_ROWS
export const ALIEN_HALF = 10
export const BREACH_Y = 560

export const BOMB_SPEED = 170
export const BOMB_RADIUS = 2.5
export const BOMB_MAX = 3
export const BOMB_INTERVAL_START = 1.1
export const BOMB_INTERVAL_STEP = 0.08
export const BOMB_INTERVAL_FLOOR = 0.5

export const SHIELD_XS = [90, 180, 270] as const
export const SHIELD_Y = 500
export const SHIELD_COLS = 8
export const SHIELD_ROWS = 4
export const SHIELD_CELL = 6

export const CRAFT_Y = 60
export const CRAFT_SPEED = 120
export const CRAFT_MIN_WAIT = 18
export const CRAFT_MAX_WAIT = 30
export const CRAFT_POINTS = [50, 100, 150] as const
export const CRAFT_POPUP_LIFE = 0.7
export const CRAFT_HALF_W = 12
export const CRAFT_HALF_H = 5

export const WAVE_BONUS = 200
export const WAVE_CLEAR_HOLD = 1.2

export const DEATH_FRAGMENTS = 24
export const DEATH_SHAKE = 0.18
export const DEATH_SHAKE_UNITS = 3
export const DEATH_FLASH = 0.12
export const INVULN_TIME = 1.5
export const INVULN_BLINK_HZ = 2

export const ALIEN_FRAGMENTS = 6
export const ALIEN_FRAGMENTS_REDUCED = 3
export const FRAGMENT_CAP = 120
export const FRAGMENT_CAP_REDUCED = 40

export const CYAN = '#22F0FF'
export const ORANGE = '#FF9E2C'
export const MAGENTA = '#FF2E88'
export const PURPLE = '#9D4EDD'
export const MINT = '#32FF9C'
export const YELLOW = '#FFD447'
export const CREAM = '#E8DDC7'

export const TIER_POINTS = [10, 20, 30] as const
export const TIER_COLORS = [MINT, PURPLE, MAGENTA] as const

export function formationOriginX(): number {
  return (LOGICAL_W - (FORM_COLS - 1) * FORM_COL_PITCH) / 2
}

export function waveOriginY(wave: number): number {
  const drop = Math.min(Math.max(wave - 1, 0), FORM_MAX_DROP_ROWS)
  return FORM_ORIGIN_Y + drop * FORM_ROW_PITCH
}

export function formationSpeed(destroyed: number, wave: number): number {
  const thin = 1 + FORM_THIN_GAIN * (destroyed / FORM_TOTAL)
  const waveMul = Math.min(FORM_WAVE_CAP, 1 + FORM_WAVE_GAIN * (wave - 1))
  return FORM_BASE_SPEED * thin * waveMul
}

export function bombInterval(wave: number): number {
  return Math.max(BOMB_INTERVAL_FLOOR, BOMB_INTERVAL_START - BOMB_INTERVAL_STEP * (wave - 1))
}

export function craftWait(): number {
  return CRAFT_MIN_WAIT + Math.random() * (CRAFT_MAX_WAIT - CRAFT_MIN_WAIT)
}
