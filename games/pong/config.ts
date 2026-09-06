import type { PongDifficulty } from '@/lib/arcade/storage'

export const LOGICAL_W = 360
export const LOGICAL_H = 640

export const FIELD_X = 20
export const FIELD_Y = 40
export const FIELD_W = 320
export const FIELD_H = 560

export const PADDLE_WIDTH = 64
export const PADDLE_HEIGHT = 8
export const PLAYER_Y = 536
export const CPU_Y = 56
export const PADDLE_KEYBOARD_SPEED = 520
export const PADDLE_FOLLOW_TAU = 0.12

export const BALL_RADIUS = 5
export const BALL_SERVE_SPEED = 260
export const BALL_MAX_SPEED = 560
export const BALL_MIN_VERTICAL = 0.3
export const BALL_PADDLE_SPEED_GAIN = 1.04
export const BALL_PADDLE_ANGLE = 55

export const SERVE_HOLD = 0.7

export const MATCH_TARGET = 11
export const MATCH_MARGIN = 2
export const MATCH_CAP = 15

export const TRAIL_MAX = 6
export const PULSE_LIFE = 0.12

export const CREAM = '#E8DDC7'
export const YELLOW = '#FFD447'
export const MAGENTA = '#FF2E88'
export const CYAN = '#22F0FF'

export interface CpuProfile {
  reaction: number
  maxSpeed: number
  error: number
  trackAway: boolean
}

export const CPU_PROFILES: Record<PongDifficulty, CpuProfile> = {
  easy: { reaction: 0.22, maxSpeed: 220, error: 34, trackAway: false },
  normal: { reaction: 0.14, maxSpeed: 300, error: 20, trackAway: true },
  hard: { reaction: 0.07, maxSpeed: 380, error: 9, trackAway: true },
}

export const FIELD_RIGHT = FIELD_X + FIELD_W
export const FIELD_BOTTOM = FIELD_Y + FIELD_H
export const CENTER_X = FIELD_X + FIELD_W / 2
export const CENTER_Y = FIELD_Y + FIELD_H / 2
