import type { Metadata } from 'next'

import { GameStage } from '@/components/arcade/GameStage'

export const metadata: Metadata = {
  title: { absolute: 'Pong | Vizantir Arcade' },
}

export default function PongPage() {
  return <GameStage game="pong" />
}
