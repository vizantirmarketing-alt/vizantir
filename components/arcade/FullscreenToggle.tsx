'use client'

import { Maximize2, Minimize2 } from 'lucide-react'

import { useArcade } from '@/components/arcade/ArcadeProvider'

export function FullscreenToggle() {
  const { fullscreenSupported, isFullscreen, toggleFullscreen } = useArcade()

  if (!fullscreenSupported) return null

  return (
    <button
      type="button"
      className="arcade-icon-btn"
      aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      aria-pressed={isFullscreen}
      onClick={toggleFullscreen}
    >
      {isFullscreen ? (
        <Minimize2 size={18} aria-hidden="true" />
      ) : (
        <Maximize2 size={18} aria-hidden="true" />
      )}
    </button>
  )
}
