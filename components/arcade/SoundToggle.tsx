'use client'

import { Volume2, VolumeX } from 'lucide-react'

import { useArcade } from '@/components/arcade/ArcadeProvider'

export function SoundToggle() {
  const { soundEnabled, toggleSound } = useArcade()

  return (
    <button
      type="button"
      className="arcade-icon-btn"
      aria-label={soundEnabled ? 'Sound on' : 'Sound off'}
      aria-pressed={soundEnabled}
      onClick={toggleSound}
    >
      {soundEnabled ? <Volume2 size={18} aria-hidden="true" /> : <VolumeX size={18} aria-hidden="true" />}
    </button>
  )
}
