import type { Metadata } from 'next'

import { GameStage } from '@/components/arcade/GameStage'

export const metadata: Metadata = {
  title: { absolute: 'Breakout | Vizantir Arcade' },
}

export default function BreakoutPage() {
  return (
    <>
      <h1 className="arcade-sr-only">BREAKOUT</h1>
      <GameStage game="breakout" />
    </>
  )
}
