import type { Metadata } from 'next'

import { GameStage } from '@/components/arcade/GameStage'

export const metadata: Metadata = {
  title: { absolute: 'Breakout | Vizantir Arcade' },
}

export default function BreakoutPage() {
  return <GameStage game="breakout" />
}
