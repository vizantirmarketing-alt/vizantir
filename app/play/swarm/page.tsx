import type { Metadata } from 'next'

import { GameStage } from '@/components/arcade/GameStage'

export const metadata: Metadata = {
  title: { absolute: 'Swarm | Vizantir Arcade' },
}

export default function SwarmPage() {
  return (
    <>
      <h1 className="arcade-sr-only">SWARM</h1>
      <GameStage game="swarm" />
    </>
  )
}
