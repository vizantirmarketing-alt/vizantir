export interface CanvasFit {
  scale: number
  offsetX: number
  offsetY: number
  dpr: number
  width: number
  height: number
}

export function fitCanvas(
  canvas: HTMLCanvasElement,
  cssWidth: number,
  cssHeight: number,
  logicalW: number,
  logicalH: number,
  maxDpr = 2,
): CanvasFit {
  const width = Math.max(1, cssWidth)
  const height = Math.max(1, cssHeight)
  const dpr = Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1, maxDpr)

  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  const scale = Math.min(width / logicalW, height / logicalH)
  const fittedWidth = logicalW * scale
  const fittedHeight = logicalH * scale
  const offsetX = (width - fittedWidth) / 2
  const offsetY = (height - fittedHeight) / 2

  return { scale, offsetX, offsetY, dpr, width: fittedWidth, height: fittedHeight }
}

export function applyOverlayFit(target: HTMLElement, fit: CanvasFit): void {
  target.style.setProperty('--arcade-overlay-x', `${fit.offsetX}px`)
  target.style.setProperty('--arcade-overlay-y', `${fit.offsetY}px`)
  target.style.setProperty('--arcade-overlay-w', `${fit.width}px`)
  target.style.setProperty('--arcade-overlay-h', `${fit.height}px`)
}

export function applyCanvasFit(
  ctx: CanvasRenderingContext2D,
  fit: CanvasFit,
  shakeX = 0,
  shakeY = 0,
): void {
  ctx.setTransform(
    fit.dpr * fit.scale,
    0,
    0,
    fit.dpr * fit.scale,
    fit.dpr * (fit.offsetX + shakeX),
    fit.dpr * (fit.offsetY + shakeY),
  )
}

export function clientToLogical(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  fit: CanvasFit,
): { x: number; y: number } {
  return {
    x: (clientX - rect.left - fit.offsetX) / fit.scale,
    y: (clientY - rect.top - fit.offsetY) / fit.scale,
  }
}
