import { ROW_COLORS, brickRect } from '@/games/breakout/config'
import type { Brick, BrickKind } from '@/games/breakout/types'

const LEVEL_MAPS = [
  [
    'ssssssssss',
    'ssssssssss',
    'SSSSSSSSSS',
    'ssssssssss',
    'ssssssssss',
    'ssBssssBss',
  ],
  [
    'sB......Bs',
    'SsS....SsS',
    '.SsS..SsS.',
    '..SsSsSs..',
    '...SSSS...',
    '....SS....',
  ],
  [
    'ssLssLssLs',
    'sSLS.LS.Ls',
    'ssLssLssLs',
    'sSLS.LS.Ls',
    'ssLssLssLs',
    'ssBssBssBs',
  ],
] as const

function kindFromCell(cell: string): BrickKind | null {
  if (cell === 's') return 'standard'
  if (cell === 'S') return 'strong'
  if (cell === 'L') return 'locked'
  if (cell === 'B') return 'bonus'
  return null
}

function hpFor(kind: BrickKind): number {
  if (kind === 'strong') return 2
  if (kind === 'locked') return 99
  return 1
}

export const LEVEL_COUNT = LEVEL_MAPS.length

export function buildBricks(levelIndex: number): Brick[] {
  const map = LEVEL_MAPS[levelIndex]
  if (!map) return []

  const bricks: Brick[] = []
  map.forEach((row, rowIndex) => {
    const color = ROW_COLORS[rowIndex % ROW_COLORS.length]
    for (let col = 0; col < row.length; col += 1) {
      const kind = kindFromCell(row[col] ?? '.')
      if (!kind) continue
      bricks.push({
        col,
        row: rowIndex,
        kind,
        hp: hpFor(kind),
        color,
        alive: true,
      })
    }
  })
  return bricks
}

export function remainingDestructible(bricks: Brick[]): number {
  return bricks.reduce((count, brick) => {
    if (brick.alive && brick.kind !== 'locked') return count + 1
    return count
  }, 0)
}

export { brickRect }
