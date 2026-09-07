import type { Metadata } from 'next'

import { GameStage } from '@/components/arcade/GameStage'

export const metadata: Metadata = {
  title: { absolute: 'Swarm | Vizantir Arcade' },
}

export default function SwarmPage() {
  return <GameStage game="swarm" />
}
