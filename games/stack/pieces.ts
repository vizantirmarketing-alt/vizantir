import { FAMILY, type Cell, type PieceFamily, type Rotation } from '@/games/stack/types'

export const FAMILY_COLOR: Record<PieceFamily, string> = {
  [FAMILY.BEAM]: '#22F0FF',
  [FAMILY.CUBE]: '#FFD447',
  [FAMILY.TEE]: '#9D4EDD',
  [FAMILY.ARCH_L]: '#FF2E88',
  [FAMILY.ARCH_R]: '#FF9E2C',
  [FAMILY.STEP_L]: '#32FF9C',
  [FAMILY.STEP_R]: '#FF5A5F',
}

const BEAM: readonly (readonly Cell[])[] = [
  [
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
  ],
  [
    [2, 0],
    [2, 1],
    [2, 2],
    [2, 3],
  ],
  [
    [0, 2],
    [1, 2],
    [2, 2],
    [3, 2],
  ],
  [
    [1, 0],
    [1, 1],
    [1, 2],
    [1, 3],
  ],
]

const CUBE: readonly (readonly Cell[])[] = [
  [
    [1, 0],
    [2, 0],
    [1, 1],
    [2, 1],
  ],
  [
    [1, 0],
    [2, 0],
    [1, 1],
    [2, 1],
  ],
  [
    [1, 0],
    [2, 0],
    [1, 1],
    [2, 1],
  ],
  [
    [1, 0],
    [2, 0],
    [1, 1],
    [2, 1],
  ],
]

const TEE: readonly (readonly Cell[])[] = [
  [
    [1, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  [
    [1, 0],
    [1, 1],
    [2, 1],
    [1, 2],
  ],
  [
    [0, 1],
    [1, 1],
    [2, 1],
    [1, 2],
  ],
  [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, 2],
  ],
]

const ARCH_L: readonly (readonly Cell[])[] = [
  [
    [0, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  [
    [1, 0],
    [2, 0],
    [1, 1],
    [1, 2],
  ],
  [
    [0, 1],
    [1, 1],
    [2, 1],
    [2, 2],
  ],
  [
    [1, 0],
    [1, 1],
    [0, 2],
    [1, 2],
  ],
]

const ARCH_R: readonly (readonly Cell[])[] = [
  [
    [2, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  [
    [1, 0],
    [1, 1],
    [1, 2],
    [2, 2],
  ],
  [
    [0, 1],
    [1, 1],
    [2, 1],
    [0, 2],
  ],
  [
    [0, 0],
    [1, 0],
    [1, 1],
    [1, 2],
  ],
]

const STEP_L: readonly (readonly Cell[])[] = [
  [
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 1],
  ],
  [
    [1, 0],
    [1, 1],
    [2, 1],
    [2, 2],
  ],
  [
    [1, 1],
    [2, 1],
    [0, 2],
    [1, 2],
  ],
  [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 2],
  ],
]

const STEP_R: readonly (readonly Cell[])[] = [
  [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1],
  ],
  [
    [2, 0],
    [1, 1],
    [2, 1],
    [1, 2],
  ],
  [
    [0, 1],
    [1, 1],
    [1, 2],
    [2, 2],
  ],
  [
    [1, 0],
    [0, 1],
    [1, 1],
    [0, 2],
  ],
]

const SHAPES: Record<PieceFamily, readonly (readonly Cell[])[]> = {
  [FAMILY.BEAM]: BEAM,
  [FAMILY.CUBE]: CUBE,
  [FAMILY.TEE]: TEE,
  [FAMILY.ARCH_L]: ARCH_L,
  [FAMILY.ARCH_R]: ARCH_R,
  [FAMILY.STEP_L]: STEP_L,
  [FAMILY.STEP_R]: STEP_R,
}

export const KICKS: readonly Cell[] = [
  [0, 0],
  [-1, 0],
  [1, 0],
  [-2, 0],
  [2, 0],
  [0, -1],
]

export const ALL_FAMILIES: readonly PieceFamily[] = [
  FAMILY.BEAM,
  FAMILY.CUBE,
  FAMILY.TEE,
  FAMILY.ARCH_L,
  FAMILY.ARCH_R,
  FAMILY.STEP_L,
  FAMILY.STEP_R,
]

export function isPieceFamily(value: number): value is PieceFamily {
  return value >= FAMILY.BEAM && value <= FAMILY.STEP_R
}

export function familyCells(family: PieceFamily, rotation: Rotation): readonly Cell[] {
  return SHAPES[family][rotation] ?? SHAPES[family][0] ?? []
}

export function placedCells(
  family: PieceFamily,
  rotation: Rotation,
  col: number,
  row: number,
): Cell[] {
  return familyCells(family, rotation).map(([dc, dr]) => [col + dc, row + dr] as const)
}

export function nextRotation(rotation: Rotation): Rotation {
  return ((rotation + 1) % 4) as Rotation
}

export function shuffleBag(): PieceFamily[] {
  const bag = [...ALL_FAMILIES]
  for (let i = bag.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const current = bag[i]
    const swap = bag[j]
    if (current === undefined || swap === undefined) continue
    bag[i] = swap
    bag[j] = current
  }
  return bag
}

export function previewCells(family: PieceFamily): Cell[] {
  const cells = familyCells(family, 0)
  let minC = 4
  let minR = 4
  let maxC = -1
  let maxR = -1
  for (const [c, r] of cells) {
    minC = Math.min(minC, c)
    minR = Math.min(minR, r)
    maxC = Math.max(maxC, c)
    maxR = Math.max(maxR, r)
  }
  const width = maxC - minC + 1
  const height = maxR - minR + 1
  const ox = Math.floor((4 - width) / 2) - minC
  const oy = Math.floor((4 - height) / 2) - minR
  return cells.map(([c, r]) => [c + ox, r + oy] as const)
}
