type SparklineProps = {
  points: number[]
  width?: number
  height?: number
}

type SparkPoint = {
  x: number
  y: number
}

function sparklineCoords(
  points: readonly number[],
  width: number,
  height: number,
): SparkPoint[] | null {
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
  const coords: SparkPoint[] = []

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
    coords.push({ x, y })
  }

  if (coords.length === 0) {
    return null
  }

  if (coords.length === 1) {
    const y = coords[0]?.y ?? height / 2
    return [
      { x: 0, y },
      { x: width, y },
    ]
  }

  return coords
}

function sparklineLinePath(coords: readonly SparkPoint[]): string {
  return coords
    .map((point, index) => {
      const command = index === 0 ? 'M' : 'L'
      return `${command}${point.x.toFixed(2)} ${point.y.toFixed(2)}`
    })
    .join(' ')
}

function sparklineAreaPath(
  coords: readonly SparkPoint[],
  width: number,
  height: number,
): string {
  const line = sparklineLinePath(coords)
  return `${line} L${width.toFixed(2)} ${height.toFixed(2)} L0 ${height.toFixed(2)} Z`
}

export function Sparkline({
  points,
  width = 120,
  height = 36,
}: SparklineProps) {
  const coords = sparklineCoords(points, width, height)
  if (coords === null) {
    return null
  }

  const line = sparklineLinePath(coords)
  const area = sparklineAreaPath(coords, width, height)

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
      className="overflow-visible"
    >
      <path d={area} className="fill-cobalt-primary/18" />
      <path
        d={line}
        className="fill-none stroke-cobalt-primary"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
