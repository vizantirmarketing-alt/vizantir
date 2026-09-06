export const LOGICAL_W = 360
export const LOGICAL_H = 640

export const PADDLE_WIDTH = 64
export const PADDLE_WIDE = 96
export const PADDLE_HEIGHT = 10
export const PADDLE_Y = 596
export const PADDLE_KEYBOARD_SPEED = 520
export const PADDLE_FOLLOW_TAU = 0.12

export const BALL_RADIUS = 5
export const BALL_BASE_SPEED = 300
export const BALL_LEVEL_SPEED = [1, 1.08, 1.16] as const
export const BALL_MAX_SPEED = 520
export const BALL_MIN_VERTICAL = 0.28
export const BALL_PADDLE_SPEED_GAIN = 1.015

export const STARTING_LIVES = 3
export const MAX_BALLS = 5

export const BRICK_W = 32
export const BRICK_H = 14
export const BRICK_GAP = 3
export const BRICK_COLS = 10
export const BRICK_ORIGIN_Y = 72

export const GRID_WIDTH = BRICK_COLS * BRICK_W + (BRICK_COLS - 1) * BRICK_GAP
export const GRID_ORIGIN_X = (LOGICAL_W - GRID_WIDTH) / 2

export const POWER_FALL_SPEED = 140
export const POWER_W = 26
export const POWER_H = 10

export const WIDE_DURATION = 12
export const SLOW_DURATION = 8
export const SLOW_FACTOR = 0.7
export const SLOW_FLOOR = 200

export const MULTI_SPREAD_DEG = 18

export const SCORE_STANDARD = 100
export const SCORE_STRONG_CHIP = 50
export const SCORE_STRONG_BREAK = 150
export const SCORE_LOCKED = 0
export const SCORE_BONUS = 100
export const SCORE_LIFE_BONUS = 500

export const COMBO_STEP = 0.25
export const COMBO_MAX = 3
export const LEVEL_CLEAR_HOLD = 0.9

export const TRAIL_MAX = 8
export const TRAIL_MAX_REDUCED = 4
export const FRAGMENTS_PER_BRICK = 6
export const FRAGMENTS_PER_BRICK_REDUCED = 3
export const FRAGMENT_CAP = 120
export const FRAGMENT_CAP_REDUCED = 40

export const ROW_COLORS = ['#22F0FF', '#FF2E88', '#9D4EDD', '#FFD447', '#FF9E2C', '#32FF9C'] as const
export const LOCKED_FILL = '#291047'
export const LOCKED_STROKE = '#E8DDC7'

export function brickRect(col: number, row: number): { x: number; y: number; w: number; h: number } {
  return {
    x: GRID_ORIGIN_X + col * (BRICK_W + BRICK_GAP),
    y: BRICK_ORIGIN_Y + row * (BRICK_H + BRICK_GAP),
    w: BRICK_W,
    h: BRICK_H,
  }
}
