type SparklineProps = {
  points: number[]
  width?: number
  height?: number
}

function sparklinePath(
  points: readonly number[],
  width: number,
  height: number,
): string | null {
  if (points.length === 0) {
    return null
  }

  const padY = 2
  const usable = Math.max(1, height - padY * 2)
  let min = points[0]
  let max = points[0]
  if (min === undefined || max === undefined) {
    return null
  }

  for (const point of points) {
    if (point < min) min = point
    if (point > max) max = point
  }

  const range = max - min
  const lastIndex = Math.max(1, points.length - 1)

  const commands: string[] = []
  for (let index = 0; index < points.length; index += 1) {
    const value = points[index]
    if (value === undefined) {
      continue
    }
    const x = points.length === 1 ? width / 2 : (index / lastIndex) * width
    const y =
      range === 0
        ? height / 2
        : padY + (1 - (value - min) / range) * usable
    const command = commands.length === 0 ? 'M' : 'L'
    commands.push(`${command}${x.toFixed(2)} ${y.toFixed(2)}`)
  }

  if (commands.length === 0) {
    return null
  }

  if (commands.length === 1) {
    const y = (height / 2).toFixed(2)
    return `M0 ${y} L${width.toFixed(2)} ${y}`
  }

  return commands.join(' ')
}

export function Sparkline({
  points,
  width = 120,
  height = 36,
}: SparklineProps) {
  const d = sparklinePath(points, width, height)
  if (d === null) {
    return null
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden
      className="overflow-visible"
    >
      <path
        d={d}
        fill="none"
        className="stroke-cobalt-primary/40"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
