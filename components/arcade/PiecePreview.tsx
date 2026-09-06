import { isPieceFamily, previewCells } from '@/games/stack/pieces'

export function PiecePreview({
  label,
  family,
  compact = false,
}: {
  label: string
  family: number | null
  compact?: boolean
}) {
  const valid = family !== null && isPieceFamily(family)
  const cells = valid ? previewCells(family) : []
  const lit = new Set(cells.map(([col, row]) => `${col}-${row}`))

  return (
    <div className={compact ? 'arcade-piece-preview is-compact' : 'arcade-piece-preview'}>
      <p className="arcade-piece-preview-label">{label}</p>
      <div className="arcade-piece-grid" aria-hidden="true">
        {Array.from({ length: 16 }, (_, index) => {
          const col = index % 4
          const row = Math.floor(index / 4)
          const on = lit.has(`${col}-${row}`)
          return (
            <span
              key={index}
              className={on ? 'arcade-piece-cell is-on' : 'arcade-piece-cell'}
              data-family={on && valid ? family : undefined}
            />
          )
        })}
      </div>
    </div>
  )
}
