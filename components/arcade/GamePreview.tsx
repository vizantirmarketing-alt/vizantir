import type { GameId } from '@/lib/arcade/games'

function BreakoutPreview() {
  const rows = [
    { y: 10, fill: '#22F0FF' },
    { y: 22, fill: '#FF2E88' },
    { y: 34, fill: '#FFD447' },
  ]

  return (
    <svg viewBox="0 0 160 90" aria-hidden="true">
      {rows.map((row) =>
        [8, 28, 48, 68, 88, 108, 128].map((x) => (
          <rect key={`${row.fill}-${x}`} x={x} y={row.y} width="16" height="8" rx="2" fill={row.fill} opacity="0.88" />
        )),
      )}
      <rect x="56" y="78" width="36" height="4" rx="2" fill="#F5F1E8" />
      <g className="arcade-preview-ball">
        <circle cx="64" cy="62" r="4" fill="#22F0FF" opacity="0.18" />
        <circle cx="70" cy="58" r="3.2" fill="#22F0FF" opacity="0.38" />
        <circle cx="76" cy="54" r="3.4" fill="#22F0FF" />
      </g>
    </svg>
  )
}

function StackPreview() {
  const lit = new Set(['1-5', '2-4', '2-5', '3-5', '4-3', '4-4', '4-5', '5-5', '7-4', '7-5', '8-2', '8-3', '8-4', '8-5'])

  return (
    <svg viewBox="0 0 160 90" aria-hidden="true">
      {Array.from({ length: 6 }, (_, row) =>
        Array.from({ length: 10 }, (_, col) => {
          const key = `${col}-${row}`
          const pulse = key === '8-2'
          const on = lit.has(key)
          return (
            <rect
              key={key}
              className={pulse ? 'arcade-preview-pulse' : undefined}
              x={8 + col * 14.6}
              y={8 + row * 13}
              width="12"
              height="11"
              rx="1.5"
              fill={on ? (col > 6 ? '#9D4EDD' : '#FF2E88') : 'rgba(245,241,232,0.08)'}
            />
          )
        }),
      )}
    </svg>
  )
}

function SnakePreview() {
  const body = [
    [16, 58],
    [30, 58],
    [44, 58],
    [44, 44],
    [44, 30],
    [58, 30],
    [72, 30],
  ]

  return (
    <svg viewBox="0 0 160 90" aria-hidden="true">
      {body.map(([x, y], index) => (
        <rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width="12"
          height="12"
          rx="2"
          fill="#32FF9C"
          opacity={index === body.length - 1 ? 1 : 0.55 + index * 0.05}
        />
      ))}
      <rect className="arcade-preview-pulse" x="116" y="20" width="10" height="10" rx="2" fill="#F5F1E8" />
    </svg>
  )
}

function PongPreview() {
  return (
    <svg viewBox="0 0 160 90" aria-hidden="true">
      <rect x="10" y="28" width="5" height="28" rx="1.5" fill="#F5F1E8" />
      <rect x="145" y="36" width="5" height="28" rx="1.5" fill="#F5F1E8" />
      <line x1="80" y1="8" x2="80" y2="82" stroke="rgba(245,241,232,0.28)" strokeDasharray="3 5" />
      <circle className="arcade-preview-pong-ball" cx="42" cy="46" r="4" fill="#FFD447" />
    </svg>
  )
}

export function GamePreview({ game }: { game: GameId }) {
  if (game === 'breakout') return <BreakoutPreview />
  if (game === 'stack') return <StackPreview />
  if (game === 'snake') return <SnakePreview />
  return <PongPreview />
}
