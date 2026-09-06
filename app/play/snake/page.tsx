import type { Metadata } from 'next'

import { GameStage } from '@/components/arcade/GameStage'

export const metadata: Metadata = {
  title: { absolute: 'Snake | Vizantir Arcade' },
}

export default function SnakePage() {
  return <GameStage game="snake" />
}
